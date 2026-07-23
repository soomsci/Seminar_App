# 진행 상황 보고판 (STATUS)

각 세션은 작업 후 자기 섹션만 갱신한다. 형식: 완료 / 남은 것 / 요청·공유 사항.
다른 세션에 대한 요청은 상대 섹션이 아니라 **자기 섹션의 "요청" 항목**에 쓴다.

## 총괄매니저

- 완료: SPEC.md, TASKS.md, CLAUDE.md 작성 (2026-07-23). GitHub 저장소 초기 푸시. 세션 A(`baba39a`,`3c24806`)·C(`36d4dbb`)·B(`137d934`) 검수 통과 (2026-07-24) — 계약 준수(db.js만 사용, Firebase 직접 호출 없음), confirm·모바일 요구 확인.
- 남은 것: 세션 D 통합 테스트·배포 검토
- 결정 사항:
  - B의 `onConnectionState` API 추가 제안 → **v1 보류.** `navigator.onLine` 최선노력으로 충분하며, D의 실 Firebase 통합 테스트에서 문제 확인 시 재검토.
  - C의 `?code=` URL 자동입장 제안 → **v1 범위 밖, v1.1 후보로 기록.** (B 구현에 현재 없음)
  - QR코드 → C 결정대로 v1은 코드+URL 텍스트 표시. v2 검토.
- 요청: 없음

## 세션 A — 기반/데이터

- 완료 (2026-07-24):
  - `public/js/db.js` — SPEC §5 API 7종 전부 구현(목 모드 + Firebase 실모드). 목 모드에서 전 API 자동 테스트 12건 통과.
  - `public/css/common.css` — 색상 토큰(`--c-green/--c-red/--c-gray` 및 배경·텍스트·테두리 토큰), 기본 리셋, 한국어 폰트 스택, `:focus-visible` 스타일.
  - `public/js/firebase-config.js` — 자리표시자 상태. 실제 키는 Firebase 콘솔 작업(사용자) 후 기입.
  - `database.rules.json` 초안 — `sessions` 루트 목록 조회 차단, 세션코드 형식(혼동문자 제외 6자리) 검증, meta/participants/history 스키마 검증, 코멘트 200자·이름 30자 제한.
- 남은 것: 없음 (세션 A 완료).
- **목 모드 사용법 (B·C 세션 필독)**:
  - URL에 `?mock=1`을 붙이면 Firebase·키 없이 동작. 예: `http://localhost:8000/public/index.html?mock=1`
  - 기본 세션코드 **`ABC234`** 가 미리 만들어져 있고 가짜 참가자 12명(초록7/빨강3/회색2)이 들어 있다. 3초마다 1명씩 상태가 무작위로 바뀐다(실시간 갱신 확인용).
  - `createSession()`으로 새 세션을 만들어도 가짜 12명이 채워진다(C 대시보드 확인용).
  - `joinSession`은 없는 코드면 `Error("SESSION_NOT_FOUND")`를 던진다 — 에러 UI 테스트는 `ABC234` 외 아무 코드로.
  - `onParticipants`/`onMeta`는 구독 즉시 현재 값을 1회 콜백한다(Firebase `onValue`와 동일). 반환값은 구독 해지 함수.
  - 세션코드는 소문자로 넘겨도 자동 대문자 처리된다. `setStatus`의 코멘트는 200자에서 잘리고, `green`/`none` 전송 시 코멘트는 자동으로 비워진다.
  - 목 모드는 메모리 동작이라 새로고침하면 초기화된다. 다만 localStorage 복귀 흐름 테스트를 위해 모르는 `participantId`로 `setStatus`가 와도 에러 없이 참가자를 새로 만든다.
- Firebase 연동 상태: **연동 완료** (2026-07-24). 프로젝트 `seminar-app-ms`, RTDB asia-southeast1, 보안 규칙 게시됨. 실제 DB에 대해 REST로 검증 완료: 루트 목록 조회 차단, 세션 생성/읽기, 참가자 쓰기, setStatus식 부분 업데이트, nextStep식 멀티패스 업데이트(history 스냅샷+전원 리셋+meta 갱신) 모두 통과. 잘못된 status·허용 외 필드·잘못된 코드 형식은 규칙이 거부함. `?mock=1` 없이 열면 실모드로 동작한다.
- 요청: 없음

## 세션 B — 연수생 화면

- 완료 (2026-07-24):
  - `public/index.html`, `public/js/participant.js`, `public/css/participant.css` 구현. db.js API(joinSession/setStatus/onMeta/onParticipants)만 사용, Firebase 직접 호출 없음.
  - 입장 화면(코드 자동 대문자·6자리 검증 + 이름 선택) → `joinSession()` → localStorage(`seminar-app:participant`) 저장 → 새로고침 시 재입장 없이 복귀.
  - 메인 화면: `onMeta`로 "N단계 진행 중" 표시, 🟢/🔴 큰 버튼(`setStatus`), 빨강 선택 시 코멘트 패널 슬라이드(200자, 카운터, 600ms 디바운스 전송 + blur 시 즉시 전송).
  - 리셋 대응: `onMeta` 변화 감지해 step 증가 시 "N단계로 넘어갔어요" 토스트, round만 증가(다시 확인) 시 안내 문구 토스트 + `navigator.vibrate` 진동. 실제 상태 리셋 자체는 `onParticipants` 구독이 서버 값(`status:none`)을 받아 반영.
  - localStorage 복원 실패 대비: 6초 내 `onMeta`/`onParticipants` 응답이 없으면 "세션을 찾을 수 없어요" 화면 + 다시 입장하기 버튼.
  - 백그라운드 복귀 시(`visibilitychange`, `pageshow`) 구독 재생성으로 재동기화.
  - 네트워크 연결 점: db.js가 연결 상태 API를 제공하지 않아 `navigator.onLine`/online·offline 이벤트로 대체 구현(최선노력, 실제 Firebase 연결 상태와는 다를 수 있음).
  - 확인 완료: `?mock=1`(세션 ABC234)로 입장→🟢/🔴→코멘트→다시 확인 토스트/진동 호출→다음 단계 토스트→새로고침 복귀→잘못된 코드/짧은 코드 에러 문구까지 브라우저(Chrome, claude-in-chrome)로 직접 확인. 320px 뷰(iframe으로 실측)에서 버튼·코멘트 패널 깨짐 없음, 코멘트 복원도 정상.
  - 버그 수정: `participant.css`에서 `#entry-screen`/`#main-screen`에 준 `display:flex`가 CSS 캐스케이드 우선순위(오서 스타일이 UA `[hidden]{display:none}`을 이김) 때문에 `hidden` 속성을 무시하고 두 화면이 동시에 보이는 문제가 있었음. `:not([hidden])`으로 스코프를 좁혀 해결.
- 남은 것: 없음 (세션 B 완료). 실제 Firebase 모드(비 mock)에서의 재확인은 세션 D의 통합 테스트에서 커버됨.
- 요청:
  - 연결 상태 표시(SPEC §7 "작은 점")는 db.js에 Firebase `.info/connected` 구독을 노출하는 API가 없어 브라우저 `navigator.onLine`으로 대체했다. 실제 Firebase 연결 유실(온라인이지만 DB 연결 끊김)은 감지하지 못한다. 세션 A가 여유 있으면 `onConnectionState(cb)` 같은 API 추가를 검토해달라 — 필수는 아니고 개선 제안.

## 세션 C — 강사 대시보드

- 완료 (2026-07-24):
  - `public/host.html`, `public/js/host.js`, `public/css/host.css` — SPEC §3.2 흐름 전부 구현.
  - 세션 생성(`createSession`) → 코드 큰 글자 표시 + 참가자 접속 URL 텍스트 표시.
  - 참가자 원 격자(`onParticipants`) — 초록/빨강/회색, 원 안에 이름, 진행률 %(큰 숫자, `clamp()`로 화면 폭에 따라 확대).
  - 빨간 원 클릭/Enter → 코멘트 팝오버(이름+코멘트), 하단 코멘트 목록(최신순, `updatedAt` 기준 정렬).
  - "다음 단계 →"(`nextStep`) / "🔄 다시 확인"(`restartStep`) — 둘 다 `confirm()` 확인 거침.
  - `?mock=1`로 목 참가자 12명 격자 표시, 3초 상태 변화 실시간 반영, 두 버튼 동작 브라우저(Chrome, claude-in-chrome)로 직접 확인 완료.
- 남은 것: 없음 (세션 C 완료).
- QR 코드: **v1은 코드+URL 텍스트만 표시**하기로 결정(SPEC §3.2 지침대로 — 의존성 없는 QR 자체 생성은 부담이 커서 보류). 필요하면 v2에서 로컬 QR 생성 추가 검토.
- 참가자 접속 URL은 `index.html`로 연결하되 `?code=` 자동입력은 넣지 않음 — 세션 B의 `index.html`이 아직 코드 자동입력 파라미터를 지원하는지 확정되지 않아, SPEC §3.1(코드 직접 입력)에 맞춰 코드는 화면에 별도로 크게 표시하고 URL은 접속 주소만 안내함. 세션 B가 `?code=` 쿼리 파라미터를 지원하게 되면 이 URL에 코드 파라미터를 추가하는 게 좋음(요청 아님, 참고용 공유).
- 요청: 없음

## 세션 D — QA/배포

- 완료: (아직 시작 안 함)
- 남은 것: TASKS.md 세션 D 전체 (B·C 완료 후 착수)
- 요청: 없음
