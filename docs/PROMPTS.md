# 세션별 시작 프롬프트

각 세션을 열고 `/model`로 권장 모델을 설정한 뒤, 해당 프롬프트를 통째로 붙여넣는다.
실행 순서: A 완료(최소한 목 모드) → B·C 병렬 → D.

---

## 세션 A — 기반/데이터 (권장 모델: Opus 4.8)

```
너는 이 프로젝트의 세션 A(기반/데이터 계층)야. CLAUDE.md → docs/SPEC.md → docs/TASKS.md의 "세션 A" 섹션 순으로 읽고 시작해.

작업 우선순위:
1. 최우선: public/js/db.js — SPEC §5의 API 계약(createSession, nextStep, restartStep, onParticipants, onMeta, joinSession, setStatus) 그대로 구현하되, **목 모드(?mock=1)를 먼저 완성**해. 목 모드가 되는 순간 세션 B·C가 병렬로 개발을 시작할 수 있어. 시그니처는 절대 바꾸지 마.
2. public/css/common.css — 색상 토큰(--c-green/--c-red/--c-gray), 기본 리셋, 공통 폰트.
3. Firebase 실연동: firebase-config.js 작성. Firebase 콘솔에서 내가 직접 해야 하는 일(프로젝트 생성, Realtime Database 활성화 등)은 코드로 때우려 하지 말고 나에게 단계별로 안내해줘.
4. database.rules.json 초안 — SPEC §7의 보안 요구(스키마 검증, sessions 루트 목록 조회 차단).

완료 기준: 브라우저에서 목 모드로 직접 열어 API가 전부 동작하는 걸 확인한 것. 끝나면 docs/STATUS.md의 세션 A 섹션을 갱신하고(특히 "목 모드 사용법"), 커밋 후 푸시해.
```

---

## 세션 B — 연수생 화면 (권장 모델: Sonnet 5)

```
너는 이 프로젝트의 세션 B(연수생 화면)야. CLAUDE.md → docs/SPEC.md → docs/TASKS.md의 "세션 B" 섹션 순으로 읽고 시작해. 먼저 docs/STATUS.md에서 세션 A가 남긴 목 모드 사용법을 확인해.

핵심 요구:
1. 소유 파일(index.html, js/participant.js, css/participant.css)만 수정해. Firebase를 직접 import하지 말고 js/db.js만 사용해.
2. **주 사용 기기는 스마트폰이야.** SPEC §7의 모바일 요구(320px, 44px 터치 타깃, 가상 키보드 대응, 백그라운드 복귀 동기화)를 전부 지켜. 🟢/🔴 버튼은 엄지로 안 보고도 누를 수 있을 만큼 크게.
3. 흐름: 세션코드+이름 입장 → localStorage 복귀 → 단계 표시(onMeta) → 상태 전송(setStatus) → 빨강 시 코멘트(200자) → 다음 단계/다시 확인 리셋 대응(알림+진동, SPEC §3.1).
4. 에러 문구는 한국어로 사용자에게 보여줘 (예: "세션코드를 찾을 수 없어요").

완료 기준: ?mock=1로 입장→버튼→코멘트→리셋 전 흐름을 브라우저에서 직접 확인하고, 개발자도구 모바일 뷰(320px)에서 깨짐 없는 것. 끝나면 docs/STATUS.md의 세션 B 섹션을 갱신하고 커밋 후 푸시해.
```

---

## 세션 C — 강사 대시보드 (권장 모델: Sonnet 5)

```
너는 이 프로젝트의 세션 C(강사 대시보드)야. CLAUDE.md → docs/SPEC.md → docs/TASKS.md의 "세션 C" 섹션 순으로 읽고 시작해. 먼저 docs/STATUS.md에서 세션 A가 남긴 목 모드 사용법을 확인해.

핵심 요구:
1. 소유 파일(host.html, js/host.js, css/host.css)만 수정해. Firebase를 직접 import하지 말고 js/db.js만 사용해.
2. **이 화면은 프로젝터에 띄운다.** 진행률 %는 교실 뒷자리에서도 읽히게 크게, 원 색(초록/빨강/회색)은 멀리서도 구분되게.
3. 흐름: 세션 생성(createSession) → 코드 크게 표시 + 참가자 URL QR(외부 API 금지, 자체 생성. 부담되면 v1은 코드+URL 텍스트만 두고 STATUS.md에 기록) → 원 격자(onParticipants) → 빨간 원 탭 시 코멘트 팝오버 + 하단 코멘트 목록(최신순) → "다음 단계 →"(nextStep)와 "🔄 다시 확인"(restartStep) 버튼, 둘 다 오조작 방지 confirm.
4. 정보는 늘리지 마 — 진행률 %와 원 색깔이 전부다 (SPEC §8).

완료 기준: ?mock=1로 목 참가자 12명이 격자에 뜨고 3초마다 상태가 변하는 것, 두 버튼 동작, 1280px에서 가독성 확인. 끝나면 docs/STATUS.md의 세션 C 섹션을 갱신하고 커밋 후 푸시해.
```

---

## 세션 D — QA/배포 (권장 모델: Opus 4.8)

```
너는 이 프로젝트의 세션 D(QA/배포)야. CLAUDE.md → docs/SPEC.md → docs/TASKS.md의 "세션 D" 섹션 순으로 읽고 시작해. docs/STATUS.md에서 B·C가 완료 상태인지 먼저 확인하고, 아니면 나에게 알리고 멈춰.

핵심 요구:
1. 통합 테스트: 실제 Firebase 연동 상태에서 강사 1 + 연수생 2 창으로 전 시나리오 검증 — 입장, 버튼→대시보드 1초 내 반영, 코멘트, 다음 단계 리셋, 다시 확인(round) 리셋, 새로고침 복귀, 잘못된 세션코드 에러. 연수생 화면은 모바일 뷰포트로도 확인해.
2. database.rules.json 검증: 다른 세션코드 데이터 조회 시도, 잘못된 status 값 쓰기 시도 등이 막히는지 확인.
3. 발견한 버그는 **직접 고치지 말고** docs/STATUS.md의 QA 리포트 섹션에 소유 세션(A/B/C) 앞으로 재현 절차와 함께 리포트해.
4. 버그가 정리되면 firebase.json을 작성하고 Firebase Hosting에 배포해. firebase login 등 인증이 필요한 명령은 나에게 요청해.

완료 기준: 전 시나리오 통과 + 배포된 실제 URL을 나에게 보고. docs/STATUS.md의 세션 D 섹션 갱신 후 커밋·푸시해.
```
