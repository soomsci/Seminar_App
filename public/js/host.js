// 강사 대시보드 로직 (세션 C 소유)
// Firebase는 직접 부르지 않고 js/db.js 만 사용한다 (SPEC §5).

import { createSession, nextStep, restartStep, onParticipants, onMeta } from './db.js';

const $ = (id) => document.getElementById(id);

const setupScreen = $('setup-screen');
const monitorScreen = $('monitor-screen');
const createBtn = $('create-session-btn');
const setupError = $('setup-error');

const sessionCodeEl = $('session-code');
const joinUrlEl = $('join-url');
const stepValueEl = $('step-value');
const progressPercentEl = $('progress-percent');
const progressCountEl = $('progress-count');
const gridEl = $('participant-grid');
const commentListEl = $('comment-list');
const nextStepBtn = $('next-step-btn');
const restartStepBtn = $('restart-step-btn');

const popover = $('popover');
const popoverName = $('popover-name');
const popoverComment = $('popover-comment');
const popoverClose = $('popover-close');

let currentCode = null;
let currentParticipants = {};

function buildJoinUrl(code) {
  const mock = new URLSearchParams(location.search).get('mock') === '1';
  const url = new URL('index.html', location.href);
  if (mock) url.searchParams.set('mock', '1');
  return url.toString();
}

function renderStep(meta) {
  stepValueEl.textContent = `${meta.step}단계 · ${meta.round}회차`;
}

function renderProgress(participants) {
  const ids = Object.keys(participants);
  const total = ids.length;
  const greenCount = ids.filter((id) => participants[id].status === 'green').length;
  const pct = total === 0 ? 0 : Math.round((greenCount / total) * 100);
  progressPercentEl.textContent = `${pct}%`;
  progressCountEl.textContent = `${greenCount} / ${total}`;
}

function renderGrid(participants) {
  const ids = Object.keys(participants).sort(
    (a, b) => (participants[a].joinedAt ?? 0) - (participants[b].joinedAt ?? 0),
  );

  gridEl.innerHTML = '';
  for (const id of ids) {
    const p = participants[id];
    const circle = document.createElement('div');
    circle.className = `circle circle--${p.status}`;
    circle.textContent = p.name;
    circle.title = p.name;

    if (p.status === 'red') {
      circle.setAttribute('role', 'button');
      circle.setAttribute('tabindex', '0');
      circle.addEventListener('click', (e) => openPopover(e.currentTarget, p));
      circle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPopover(e.currentTarget, p);
        }
      });
    }

    gridEl.appendChild(circle);
  }
}

function renderComments(participants) {
  const redEntries = Object.values(participants)
    .filter((p) => p.status === 'red')
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

  commentListEl.innerHTML = '';
  if (redEntries.length === 0) {
    const li = document.createElement('li');
    li.className = 'comment-empty';
    li.textContent = '막힌 참가자가 없어요';
    commentListEl.appendChild(li);
    return;
  }

  for (const p of redEntries) {
    const li = document.createElement('li');
    li.className = 'comment-item';
    const nameEl = document.createElement('span');
    nameEl.className = 'comment-item-name';
    nameEl.textContent = p.name;
    const textEl = document.createElement('span');
    textEl.className = 'comment-item-text';
    textEl.textContent = p.comment || '(코멘트 없음)';
    li.append(nameEl, textEl);
    commentListEl.appendChild(li);
  }
}

function openPopover(circleEl, participant) {
  popoverName.textContent = participant.name;
  popoverComment.textContent = participant.comment || '(코멘트 없음)';
  popover.hidden = false;

  const rect = circleEl.getBoundingClientRect();
  const top = rect.bottom + window.scrollY + 8;
  let left = rect.left + window.scrollX;
  const maxLeft = window.scrollX + document.documentElement.clientWidth - popover.offsetWidth - 12;
  left = Math.min(left, Math.max(maxLeft, 12));
  popover.style.top = `${top}px`;
  popover.style.left = `${left}px`;
}

function closePopover() {
  popover.hidden = true;
}

popoverClose.addEventListener('click', closePopover);
document.addEventListener('click', (e) => {
  if (!popover.hidden && !popover.contains(e.target) && !e.target.classList.contains('circle--red')) {
    closePopover();
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePopover();
});

function onParticipantsUpdate(participants) {
  currentParticipants = participants;
  renderProgress(participants);
  renderGrid(participants);
  renderComments(participants);
  if (!popover.hidden) {
    // 팝오버가 열려 있는 참가자의 상태가 바뀌면(다음 단계 등) 닫는다
    const stillRed = Object.values(participants).some(
      (p) => p.status === 'red' && p.name === popoverName.textContent,
    );
    if (!stillRed) closePopover();
  }
}

async function startSession(code) {
  currentCode = code;
  sessionCodeEl.textContent = code;
  joinUrlEl.textContent = buildJoinUrl(code);
  setupScreen.hidden = true;
  monitorScreen.hidden = false;

  onMeta(code, renderStep);
  onParticipants(code, onParticipantsUpdate);
}

createBtn.addEventListener('click', async () => {
  setupError.hidden = true;
  createBtn.disabled = true;
  try {
    const code = await createSession();
    await startSession(code);
  } catch (err) {
    setupError.textContent = err?.message || '세션을 만들지 못했어요. 다시 시도해주세요.';
    setupError.hidden = false;
  } finally {
    createBtn.disabled = false;
  }
});

nextStepBtn.addEventListener('click', async () => {
  if (!currentCode) return;
  const ok = confirm('다음 단계로 넘어갈까요? 전 참가자 상태가 초기화됩니다.');
  if (!ok) return;
  nextStepBtn.disabled = true;
  try {
    await nextStep(currentCode);
  } catch (err) {
    alert(err?.message || '다음 단계로 넘어가지 못했어요.');
  } finally {
    nextStepBtn.disabled = false;
  }
});

restartStepBtn.addEventListener('click', async () => {
  if (!currentCode) return;
  const ok = confirm('같은 단계를 다시 확인할까요? 전 참가자 상태가 초기화됩니다.');
  if (!ok) return;
  restartStepBtn.disabled = true;
  try {
    await restartStep(currentCode);
  } catch (err) {
    alert(err?.message || '다시 확인을 시작하지 못했어요.');
  } finally {
    restartStepBtn.disabled = false;
  }
});
