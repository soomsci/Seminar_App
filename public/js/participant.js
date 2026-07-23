// 연수생 화면 로직 (세션 B 소유)
// Firebase는 직접 부르지 않고 db.js API만 사용한다.

import { joinSession, setStatus, onMeta, onParticipants } from './db.js';

const STORAGE_KEY = 'seminar-app:participant';
const RESTORE_TIMEOUT_MS = 6000;
const COMMENT_DEBOUNCE_MS = 600;
const TOAST_DURATION_MS = 3500;

const entryScreen = document.getElementById('entry-screen');
const mainScreen = document.getElementById('main-screen');
const restoreErrorScreen = document.getElementById('restore-error');
const entryForm = document.getElementById('entry-form');
const codeInput = document.getElementById('code-input');
const nameInput = document.getElementById('name-input');
const joinBtn = document.getElementById('join-btn');
const entryError = document.getElementById('entry-error');
const stepLabel = document.getElementById('step-label');
const connDot = document.getElementById('conn-dot');
const toast = document.getElementById('toast');
const btnGreen = document.getElementById('btn-green');
const btnRed = document.getElementById('btn-red');
const commentPanel = document.getElementById('comment-panel');
const commentInput = document.getElementById('comment-input');
const commentCount = document.getElementById('comment-count');
const retryBtn = document.getElementById('retry-btn');

let session = null; // { code, participantId, name }
let unsubMeta = null;
let unsubParticipants = null;
let lastMeta = null;
let myStatus = 'none';
let commentDebounceTimer = null;
let restoreTimeoutTimer = null;
let toastTimer = null;

function showScreen(el) {
  for (const s of [entryScreen, mainScreen, restoreErrorScreen]) s.hidden = s !== el;
}

function errMsg(err) {
  if (err?.message === 'SESSION_NOT_FOUND') return '세션코드를 찾을 수 없어요. 코드를 확인해주세요.';
  return '문제가 발생했어요. 잠시 후 다시 시도해주세요.';
}

function showEntryError(msg) {
  entryError.textContent = msg;
  entryError.hidden = false;
}

codeInput.addEventListener('input', () => {
  codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
});

entryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = codeInput.value.trim();
  if (code.length !== 6) {
    showEntryError('세션코드 6자리를 입력해주세요.');
    return;
  }
  entryError.hidden = true;
  joinBtn.disabled = true;
  try {
    const { participantId, name } = await joinSession(code, nameInput.value);
    session = { code, participantId, name };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    enterMain();
  } catch (err) {
    showEntryError(errMsg(err));
  } finally {
    joinBtn.disabled = false;
  }
});

function enterMain() {
  showScreen(mainScreen);
  subscribe();
}

function subscribe() {
  lastMeta = null;
  unsubMeta?.();
  unsubParticipants?.();
  unsubMeta = onMeta(session.code, handleMeta);
  unsubParticipants = onParticipants(session.code, handleParticipants);
}

function handleMeta(meta) {
  clearTimeout(restoreTimeoutTimer);
  if (lastMeta) {
    if (meta.step !== lastMeta.step) {
      showToast(`${meta.step}단계로 넘어갔어요.`);
    } else if (meta.round !== lastMeta.round) {
      showToast('강사가 다시 확인을 요청했어요. 여기까지 되면 버튼을 눌러주세요.', true);
    }
  }
  lastMeta = meta;
  stepLabel.textContent = `${meta.step}단계 진행 중`;
}

function handleParticipants(participants) {
  clearTimeout(restoreTimeoutTimer);
  const me = session && participants[session.participantId];
  if (!me) return;
  myStatus = me.status;
  updateStatusUI();
  if (me.status === 'red' && document.activeElement !== commentInput) {
    commentInput.value = me.comment || '';
    updateCommentCount();
  }
}

function updateStatusUI() {
  btnGreen.classList.toggle('is-selected', myStatus === 'green');
  btnRed.classList.toggle('is-selected', myStatus === 'red');
  commentPanel.hidden = myStatus !== 'red';
}

async function sendStatus(status, comment) {
  if (!session) return;
  myStatus = status;
  updateStatusUI();
  try {
    await setStatus(session.code, session.participantId, status, comment);
  } catch {
    showToast('전송에 실패했어요. 다시 눌러주세요.');
  }
}

btnGreen.addEventListener('click', () => sendStatus('green'));

btnRed.addEventListener('click', () => {
  sendStatus('red', commentInput.value);
  updateCommentCount();
  requestAnimationFrame(() => commentInput.focus({ preventScroll: true }));
});

commentInput.addEventListener('input', () => {
  updateCommentCount();
  clearTimeout(commentDebounceTimer);
  commentDebounceTimer = setTimeout(() => {
    if (myStatus === 'red') sendStatus('red', commentInput.value);
  }, COMMENT_DEBOUNCE_MS);
});

commentInput.addEventListener('blur', () => {
  clearTimeout(commentDebounceTimer);
  if (myStatus === 'red') sendStatus('red', commentInput.value);
});

commentInput.addEventListener('focus', () => {
  // 가상 키보드가 올라온 뒤 입력창이 가려지지 않도록 화면 중앙으로 스크롤
  setTimeout(() => commentInput.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
});

function updateCommentCount() {
  commentCount.textContent = `${commentInput.value.length}/200`;
}

function showToast(msg, vibrate = false) {
  toast.textContent = msg;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add('show'));
  if (vibrate && navigator.vibrate) navigator.vibrate(200);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    toast.hidden = true;
  }, TOAST_DURATION_MS);
}

// 연결 상태 점 — db.js가 연결 상태 API를 제공하지 않아 네트워크 도달성으로 대체(최선노력)
function updateConnDot() {
  connDot.classList.toggle('is-offline', !navigator.onLine);
}
window.addEventListener('online', updateConnDot);
window.addEventListener('offline', updateConnDot);
updateConnDot();

// 백그라운드/화면 꺼짐 복귀 시 최신 상태로 재동기화
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && session && !mainScreen.hidden) subscribe();
});
window.addEventListener('pageshow', (e) => {
  if (e.persisted && session && !mainScreen.hidden) subscribe();
});

retryBtn.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  session = null;
  codeInput.value = '';
  nameInput.value = '';
  showScreen(entryScreen);
  codeInput.focus();
});

(function init() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    showScreen(entryScreen);
    return;
  }
  try {
    const parsed = JSON.parse(saved);
    if (!parsed?.code || !parsed?.participantId) throw new Error('invalid');
    session = parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    showScreen(entryScreen);
    return;
  }
  showScreen(mainScreen);
  subscribe();
  restoreTimeoutTimer = setTimeout(() => showScreen(restoreErrorScreen), RESTORE_TIMEOUT_MS);
})();
