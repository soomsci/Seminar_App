// 데이터 계층 — SPEC §5 인터페이스 계약 구현 (세션 A 소유)
// B·C 세션은 Firebase를 직접 부르지 않고 반드시 이 모듈만 import 한다.
// URL에 ?mock=1 이 붙으면 Firebase 없이 메모리 목 모드로 동작한다.

const IS_MOCK = new URLSearchParams(globalThis.location?.search ?? '').get('mock') === '1';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동 문자 I/O/0/1 제외
const CODE_RE = /^[A-HJ-NP-Z2-9]{6}$/;
const STATUSES = ['green', 'red', 'none'];

function genCode() {
  let code = '';
  for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

function normCode(code) {
  return String(code ?? '').trim().toUpperCase();
}

function assertStatus(status) {
  if (!STATUSES.includes(status)) throw new Error('INVALID_STATUS');
}

/* ---------------- 목 모드 ---------------- */

function createMockImpl() {
  const sessions = new Map(); // code -> { meta, participants, history }
  const subs = { participants: new Map(), meta: new Map() }; // code -> Set<cb>

  // 초록7 / 빨강3 / 회색2
  const FAKE = [
    ['김서연', 'green', ''],
    ['이준호', 'green', ''],
    ['박민지', 'green', ''],
    ['최우진', 'green', ''],
    ['정하늘', 'green', ''],
    ['강도윤', 'green', ''],
    ['조은별', 'green', ''],
    ['윤시우', 'red', '설치 화면에서 멈췄어요'],
    ['임아라', 'red', '로그인이 안 돼요'],
    ['한지훈', 'red', '3번부터 못 따라갔어요'],
    ['오세아', 'none', ''],
    ['신보라', 'none', ''],
  ];
  const RED_COMMENTS = ['여기서 막혔어요', '오류 메시지가 떠요', '제 화면은 달라요', ''];

  function notify(kind, code) {
    const set = subs[kind].get(code);
    const s = sessions.get(code);
    if (!set || !s) return;
    for (const cb of set) {
      if (kind === 'participants') cb(structuredClone(s.participants));
      else cb({ step: s.meta.step, round: s.meta.round });
    }
  }

  function seed(code) {
    const now = Date.now();
    const participants = {};
    FAKE.forEach(([name, status, comment], i) => {
      participants[`mock${String(i + 1).padStart(2, '0')}`] = {
        name, status, comment, joinedAt: now, updatedAt: now,
      };
    });
    sessions.set(code, { meta: { createdAt: now, step: 1, round: 1 }, participants, history: {} });
    // 3초마다 가짜 참가자 1명의 상태를 무작위 변경 — 실시간 갱신 확인용
    setInterval(() => {
      const s = sessions.get(code);
      const ids = Object.keys(s.participants).filter((id) => id.startsWith('mock'));
      const p = s.participants[ids[Math.floor(Math.random() * ids.length)]];
      const next = STATUSES.filter((v) => v !== p.status)[Math.floor(Math.random() * 2)];
      p.status = next;
      p.comment = next === 'red' ? RED_COMMENTS[Math.floor(Math.random() * RED_COMMENTS.length)] : '';
      p.updatedAt = Date.now();
      notify('participants', code);
    }, 3000);
  }

  function getSession(code) {
    const s = sessions.get(code);
    if (!s) throw new Error('SESSION_NOT_FOUND');
    return s;
  }

  function snapshotAndReset(s) {
    const snap = {};
    for (const [id, p] of Object.entries(s.participants)) {
      snap[id] = { name: p.name, status: p.status, comment: p.comment || '' };
    }
    (s.history[s.meta.step] ??= {})[s.meta.round] = snap;
    const now = Date.now();
    for (const p of Object.values(s.participants)) {
      p.status = 'none';
      p.comment = '';
      p.updatedAt = now;
    }
  }

  function subscribe(kind, code, cb) {
    let set = subs[kind].get(code);
    if (!set) subs[kind].set(code, (set = new Set()));
    set.add(cb);
    const s = sessions.get(code);
    // Firebase onValue처럼 구독 즉시 현재 값을 1회 전달
    if (s) {
      if (kind === 'participants') cb(structuredClone(s.participants));
      else cb({ step: s.meta.step, round: s.meta.round });
    }
    return () => set.delete(cb);
  }

  seed('ABC234'); // 목 모드 기본 세션 — B·C는 이 코드로 바로 입장 가능

  return {
    async createSession() {
      let code;
      do { code = genCode(); } while (sessions.has(code));
      seed(code);
      return code;
    },

    async nextStep(code) {
      const s = getSession(code);
      snapshotAndReset(s);
      s.meta.step += 1;
      s.meta.round = 1;
      notify('participants', code);
      notify('meta', code);
      return s.meta.step;
    },

    async restartStep(code) {
      const s = getSession(code);
      snapshotAndReset(s);
      s.meta.round += 1;
      notify('participants', code);
      notify('meta', code);
      return s.meta.round;
    },

    onParticipants(code, cb) {
      return subscribe('participants', code, cb);
    },

    onMeta(code, cb) {
      return subscribe('meta', code, cb);
    },

    async joinSession(code, name) {
      const s = getSession(code);
      const finalName =
        (name ?? '').trim().slice(0, 30) || `참가자${Object.keys(s.participants).length + 1}`;
      const participantId = `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      const now = Date.now();
      s.participants[participantId] = {
        name: finalName, status: 'none', comment: '', joinedAt: now, updatedAt: now,
      };
      notify('participants', code);
      return { participantId, name: finalName };
    },

    async setStatus(code, participantId, status, comment) {
      assertStatus(status);
      const s = getSession(code);
      // 목 모드는 새로고침 시 메모리가 초기화되므로, localStorage 복귀 흐름이
      // 모르는 participantId로 들어와도 에러 없이 새로 만들어 준다
      const p = (s.participants[participantId] ??= { name: '참가자', joinedAt: Date.now() });
      p.status = status;
      p.comment = status === 'red' ? (comment ?? '').slice(0, 200) : '';
      p.updatedAt = Date.now();
      notify('participants', code);
    },
  };
}

/* ---------------- Firebase 실모드 ---------------- */

async function createFirebaseImpl() {
  const { firebaseConfig } = await import('./firebase-config.js');
  if (!firebaseConfig?.apiKey || firebaseConfig.apiKey.startsWith('YOUR_')) {
    throw new Error(
      'firebase-config.js가 아직 설정되지 않았어요. 목 모드(?mock=1)로 열거나 Firebase 키를 채워주세요.',
    );
  }
  const [{ initializeApp }, sdk] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js'),
  ]);
  const { getDatabase, ref, get, set, update, push, onValue, serverTimestamp } = sdk;
  const db = getDatabase(initializeApp(firebaseConfig));
  const sref = (code, path = '') => ref(db, `sessions/${code}${path ? '/' + path : ''}`);

  // "다음 단계"(isNext=true)와 "다시 확인"(false) 공통 처리:
  // history 스냅샷 + 전원 리셋 + meta 갱신을 한 번의 멀티패스 update로 수행
  async function advance(code, isNext) {
    if (!CODE_RE.test(code)) throw new Error('SESSION_NOT_FOUND');
    const snap = await get(sref(code));
    if (!snap.exists()) throw new Error('SESSION_NOT_FOUND');
    const s = snap.val();
    const step = s.meta?.step ?? 1;
    const round = s.meta?.round ?? 1;
    const updates = {};
    for (const [id, p] of Object.entries(s.participants ?? {})) {
      updates[`history/${step}/${round}/${id}`] = {
        name: p.name ?? '', status: p.status ?? 'none', comment: p.comment ?? '',
      };
      updates[`participants/${id}/status`] = 'none';
      updates[`participants/${id}/comment`] = '';
      updates[`participants/${id}/updatedAt`] = serverTimestamp();
    }
    updates['meta/step'] = isNext ? step + 1 : step;
    updates['meta/round'] = isNext ? 1 : round + 1;
    await update(sref(code), updates);
    return isNext ? step + 1 : round + 1;
  }

  return {
    async createSession() {
      for (let i = 0; i < 20; i++) {
        const code = genCode();
        const metaRef = sref(code, 'meta');
        if ((await get(metaRef)).exists()) continue; // 코드 충돌 시 재시도
        await set(metaRef, { createdAt: serverTimestamp(), step: 1, round: 1 });
        return code;
      }
      throw new Error('CODE_CREATE_FAILED');
    },

    nextStep: (code) => advance(code, true),
    restartStep: (code) => advance(code, false),

    onParticipants(code, cb) {
      return onValue(sref(code, 'participants'), (snap) => cb(snap.val() ?? {}));
    },

    onMeta(code, cb) {
      return onValue(sref(code, 'meta'), (snap) => {
        const m = snap.val() ?? {};
        cb({ step: m.step ?? 1, round: m.round ?? 1 });
      });
    },

    async joinSession(code, name) {
      if (!CODE_RE.test(code)) throw new Error('SESSION_NOT_FOUND');
      const metaSnap = await get(sref(code, 'meta'));
      if (!metaSnap.exists()) throw new Error('SESSION_NOT_FOUND');
      let finalName = (name ?? '').trim().slice(0, 30);
      if (!finalName) {
        const pSnap = await get(sref(code, 'participants'));
        finalName = `참가자${(pSnap.exists() ? Object.keys(pSnap.val()).length : 0) + 1}`;
      }
      const pRef = push(sref(code, 'participants'));
      await set(pRef, {
        name: finalName, status: 'none', comment: '',
        joinedAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      return { participantId: pRef.key, name: finalName };
    },

    async setStatus(code, participantId, status, comment) {
      assertStatus(status);
      await update(sref(code, `participants/${participantId}`), {
        status,
        comment: status === 'red' ? (comment ?? '').slice(0, 200) : '',
        updatedAt: serverTimestamp(),
      });
    },
  };
}

/* ---------------- 공개 API (SPEC §5 계약 — 시그니처 변경 금지) ---------------- */

const impl = IS_MOCK ? createMockImpl() : await createFirebaseImpl();

export const createSession = () => impl.createSession();
export const nextStep = (code) => impl.nextStep(normCode(code));
export const restartStep = (code) => impl.restartStep(normCode(code));
export const onParticipants = (code, cb) => impl.onParticipants(normCode(code), cb);
export const onMeta = (code, cb) => impl.onMeta(normCode(code), cb);
export const joinSession = (code, name) => impl.joinSession(normCode(code), name);
export const setStatus = (code, participantId, status, comment) =>
  impl.setStatus(normCode(code), participantId, status, comment);
