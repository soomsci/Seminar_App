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
- **QA-1·QA-2 수정 완료 (2026-07-24, `docs/STATUS.md` QA 리포트 참조)**:
  - **[QA-1]** `participant.js`의 `handleParticipants()`에서 서버 상태가 `red`가 아니게 되면(리셋·초록 전환 등) `commentInput.value`를 즉시 비우도록 수정(else 분기 추가). 기존엔 `red`일 때만 채우고 그 외엔 그대로 둬서, 리셋 후 새 회차에 빈 코멘트로 🔴을 눌러도 이전 회차 코멘트가 그대로 재전송됐음.
  - **[QA-2]** 총괄매니저 결정대로 **방안 (B)** 구현: `handleParticipants()`가 받은 참가자 맵에 내 `participantId`가 없으면 그 즉시(6초 타임아웃을 기다리지 않고) 구독을 해지하고 `restore-error` 화면을 띄우도록 변경. `onMeta`는 실모드에서 없는 세션에도 기본값으로 응답해 신뢰할 수 없으므로, `handleMeta`에서 하던 `restoreTimeoutTimer` 해제 로직은 제거하고 판정을 전적으로 `handleParticipants`로 옮겼다. db.js 계약(SPEC §5) 변경 없음.
  - **회귀 확인**: 정상 참가자(세션에 실제 존재하는 `participantId`)로 복귀하는 기존 흐름은 그대로 동작함을 별도로 검증(코멘트·상태 복원 포함).
  - **검증 방법**: (1) Chrome(claude-in-chrome, `?mock=1`)에서 실제 UI로 QA-1·QA-2 재현 절차를 그대로 수행해 수정 확인. (2) 브라우저 확장이 세션 도중 일시적으로 끊겼을 때는 대안으로 `public/js/participant.js`를 Node에 최소 DOM 셰임(가짜 `document`/`localStorage`/`navigator` 등)을 붙여 직접 구동하는 회귀 테스트 3종(QA-1, QA-2 무효 참가자, QA-2 정상 복귀 회귀)을 임시로 작성해 총 16개 단언 전부 통과 확인 — 테스트 스크립트는 스크래치패드에서 실행 후 폐기, 저장소에는 포함하지 않음.
  - 실제 브라우저 검증 중 로컬 스토리지에 남아있던 실 Firebase 세션(`XC4UX2`)의 오래된 참가자 데이터로 QA-2 수정이 실제로 즉시 발동하는 것도 우연히 확인됨(사전 정리 후 재검증).
- 요청:
  - **세션 D**: [QA-1], [QA-2] 수정 완료했습니다. 실 Firebase 모드에서 재현 절차 그대로 재검증 부탁드립니다.
  - 연결 상태 표시(SPEC §7 "작은 점")는 db.js에 Firebase `.info/connected` 구독을 노출하는 API가 없어 브라우저 `navigator.onLine`으로 대체했다. 실제 Firebase 연결 유실(온라인이지만 DB 연결 끊김)은 감지하지 못한다. 세션 A가 여유 있으면 `onConnectionState(cb)` 같은 API 추가를 검토해달라 — 필수는 아니고 개선 제안.

## 세션 C — 강사 대시보드

- 완료 (2026-07-24):
  - `public/host.html`, `public/js/host.js`, `public/css/host.css` — SPEC §3.2 흐름 전부 구현.
  - 세션 생성(`createSession`) → 코드 큰 글자 표시 + 참가자 접속 URL 텍스트 표시.
  - 참가자 원 격자(`onParticipants`) — 초록/빨강/회색, 원 안에 이름, 진행률 %(큰 숫자, `clamp()`로 화면 폭에 따라 확대).
  - 빨간 원 클릭/Enter → 코멘트 팝오버(이름+코멘트), 하단 코멘트 목록(최신순, `updatedAt` 기준 정렬).
  - "다음 단계 →"(`nextStep`) / "🔄 다시 확인"(`restartStep`) — 둘 다 `confirm()` 확인 거침.
  - `?mock=1`로 목 참가자 12명 격자 표시, 3초 상태 변화 실시간 반영, 두 버튼 동작 브라우저(Chrome, claude-in-chrome)로 직접 확인 완료.
- 후속 수정 (2026-07-24, [QA-3]·[QA-4] 반영 — SPEC §3.2 갱신 대응):
  - **[QA-3] 조작 버튼 화면 밖 이탈** — `#monitor-screen`을 세로 flex(`height:100vh`)로 재구성. 상단바·진행률은 `flex-shrink:0`으로 고정 크기, `#participant-grid`만 `flex:1; min-height:0; overflow-y:auto`로 내부 스크롤되게 하고, 조작 버튼이 있는 `.bottom-bar`는 항상 뷰포트 하단에 남도록 함(리포트가 제안한 "sticky 고정"과 "원 크기 축소" 중, sticky의 효과를 flex 레이아웃으로 더 견고하게 구현 — 참가자 수와 무관하게 원 크기를 다시 계산할 필요가 없음).
  - **[QA-4] 강사 새로고침 시 세션 유실** — `localStorage`(`seminar-app:host`)에 세션코드 저장. 페이지 로드 시 저장된 코드가 있으면 세션 생성 화면을 건너뛰고 바로 모니터링 화면으로 복귀(`onMeta`/`onParticipants` 재구독). 복귀 기능의 필연적 대응으로 "세션 종료·새로 시작" 링크를 상단바에 추가(클릭 시 confirm → 구독 해지 + `localStorage` 삭제 + 세션 생성 화면으로), 그렇지 않으면 강사가 코드를 지울 방법이 없어 새 세션을 못 만드는 상황이 생김.
  - **재검증 방법**: claude-in-chrome 확장이 이번 실행에서 계정 불일치로 연결되지 않아(`OAuth token... different claude.ai account`), Chrome DevTools Protocol(`--remote-debugging-port`)에 Python 표준 라이브러리만으로 WebSocket 클라이언트를 직접 작성해 실제 Chrome을 구동하며 검증함(빌드 도구·npm 설치 없이, 테스트 스크립트는 scratchpad에만 존재하고 리포로 커밋하지 않음). 확인 내용:
    - QA-4: 세션 생성 → 새로고침 → 같은 코드로 모니터링 화면 즉시 복귀(콘솔 오류 0건). "세션 종료·새로 시작" 클릭 → confirm → 세션 생성 화면 복귀, `localStorage` 정상 삭제.
    - QA-3: 1280×800, 참가자 52명(SPEC §7 상한 50명 초과로 여유 있게 테스트) 상태에서 "다음 단계 →"/"🔄 다시 확인" 버튼의 `getBoundingClientRect().bottom`이 601.6px로 뷰포트(800px) 안에 위치, 페이지 자체 스크롤 없음(`scrollHeight === innerHeight === 800`) 확인. 이 조건에서 `nextStep()` 호출도 정상 동작(단계 증가, 52명 전원 리셋).
  - 목 모드의 알려진 제약(세션 A 문서화): 새로고침 시 메모리가 초기화되므로 목 모드에서는 복귀 후 참가자 데이터가 빈 상태(0%, 0/0)로 보임 — 코드 자체는 정확히 복원되고 오류도 없음. 실 Firebase 모드에서는 세션 데이터가 서버에 남아있으므로 복귀 시 그대로 채워진 상태로 보일 것(세션 D 통합 테스트에서 재확인 권장).
- 남은 것: 없음 (세션 C 완료).
- QR 코드: **v1은 코드+URL 텍스트만 표시**하기로 결정(SPEC §3.2 지침대로 — 의존성 없는 QR 자체 생성은 부담이 커서 보류). 필요하면 v2에서 로컬 QR 생성 추가 검토.
- 참가자 접속 URL은 `index.html`로 연결하되 `?code=` 자동입력은 넣지 않음 — 세션 B의 `index.html`이 아직 코드 자동입력 파라미터를 지원하는지 확정되지 않아, SPEC §3.1(코드 직접 입력)에 맞춰 코드는 화면에 별도로 크게 표시하고 URL은 접속 주소만 안내함. 세션 B가 `?code=` 쿼리 파라미터를 지원하게 되면 이 URL에 코드 파라미터를 추가하는 게 좋음(요청 아님, 참고용 공유).
- 요청: 없음

## 세션 D — QA/배포

- 완료 (2026-07-24):
  - **실 Firebase 통합 테스트** — 강사 1창 + 연수생 2창(localhost / 127.0.0.1로 localStorage 분리)으로 전 시나리오 검증. 아래 "QA 리포트" 참조.
  - **`database.rules.json` 검증** — 인증 없는 REST 호출 48건 전부 기대대로 동작(PASS 48 / FAIL 0).
  - **`firebase.json` 작성 + Firebase Hosting 배포 완료.**
  - **배포 URL: https://seminar-app-ms.web.app**
    - 연수생 화면 <https://seminar-app-ms.web.app/>
    - 강사 대시보드 <https://seminar-app-ms.web.app/host.html>
  - `.firebaserc` 추가(기본 프로젝트 `seminar-app-ms`) — 배포 설정 파일이라 세션 D가 소유. SPEC §6 파일 목록에 없던 파일이라 여기 기록해 둔다.
  - 배포본에서 스모크 테스트 재실행: 세션 생성 → 입장 → 🟢 → 대시보드 반영 160ms, 콘솔 오류 0건.
  - QA용으로 실 DB에 만든 테스트 세션·참가자 데이터는 전부 삭제 완료.
  - **Safari(WebKit) 교차 브라우저 검증 완료** — Chrome(강사) ↔ Safari(연수생) 조합으로 배포본 검증. 아래 QA 리포트 표 참조.
- 남은 것:
  - 아래 QA 리포트의 버그 2건은 소유 세션(B·A) 수정 대기.
  - 삼성 인터넷·웨일·모바일 인앱 브라우저는 이 기기에 없어 미검증. Chrome·Safari 두 엔진(Blink·WebKit)에서 동일 동작을 확인했고 Chromium 전용 API도 없어 위험은 낮다고 판단.
- 요청:
  - **세션 B**: 아래 [QA-1], [QA-2] 확인 부탁드립니다.
  - **세션 A**: [QA-2]의 근본 원인이 `db.js`의 `onMeta` 기본값이라 함께 봐주세요. [QA-5], [QA-6]은 기록용입니다.
  - **세션 C**: [QA-3], [QA-4] 수정 완료(2026-07-24, 아래 리포트 참조). 실 Firebase 모드에서의 새로고침 복귀 동작은 세션 D의 통합 재테스트에서 한 번 더 확인 부탁드립니다(세션 C는 목 모드로만 검증했고, 목 모드는 새로고침 시 메모리가 초기화되는 알려진 제약이 있어 "코드 복원은 되지만 참가자 데이터는 비어 보이는" 상태까지만 확인했습니다).

### QA 리포트 (세션 D 작성)

테스트 환경: macOS, Chrome(claude-in-chrome), 실 Firebase(`seminar-app-ms`, RTDB asia-southeast1), 목 모드 아님.

#### 통과한 시나리오

| # | 시나리오 | 결과 |
|---|---|---|
| 1 | 세션 생성(강사) → 코드·접속 URL 표시 | 통과 |
| 2 | 연수생 입장 (이름 입력) | 통과 |
| 3 | 연수생 입장 (이름 비움 → `참가자2` 자동 부여) | 통과 |
| 4 | 세션코드 소문자 입력 시 자동 대문자 변환 | 통과 (`pql2a7` → `PQL2A7`) |
| 5 | 6자리 미만 코드 → "세션코드 6자리를 입력해주세요." | 통과 |
| 6 | 존재하지 않는 코드 → "세션코드를 찾을 수 없어요. 코드를 확인해주세요." | 통과 (localStorage 미저장, 입장 화면 유지) |
| 7 | 🟢 버튼 → 강사 대시보드 반영 | 통과 — **162ms** (요구 1초 이내) |
| 8 | 🔴 버튼 → 강사 대시보드 반영 | 통과 — **155ms** |
| 9 | 코멘트 입력 → 강사 코멘트 목록 반영 | 통과 |
| 10 | 빨간 원 클릭 → 코멘트 팝오버 | 통과 |
| 11 | 진행률 % 계산 | 통과 (8/26 → 31%) |
| 12 | "🔄 다시 확인" — step 유지·round 증가·전원 회색 리셋 | 통과 |
| 13 | "다음 단계 →" — step 증가·round 1 복귀·전원 리셋 | 통과 |
| 14 | 두 버튼의 confirm 취소 시 아무 변화 없음 | 통과 (오조작 방지 확인) |
| 15 | `history` 스냅샷 보존 (SPEC §4 구조) | 통과 (`history/1/1`, `history/1/2` 생성 확인) |
| 16 | 연수생 리셋 안내 — "N단계로 넘어갔어요." 토스트 | 통과 |
| 17 | 연수생 재확인 안내 + 진동 | 통과 (`navigator.vibrate(200)` 호출, 단계 변경 시엔 미호출 — SPEC대로) |
| 18 | 새로고침 복귀 — 재입장 없이 상태 유지 | 통과 (🟢 유지, 🔴+코멘트도 복원) |
| 19 | 백그라운드 탭 상태에서 서버 변경 → 복귀 시 동기화 | 통과 (숨김 상태에서도 구독 유지, step 7·코멘트 반영) |
| 20 | 연수생 화면 320px 모바일 뷰포트 | 통과 (가로 스크롤 0, 오버플로 요소 0, 버튼 284×238px) |
| 21 | 강사 대시보드 1280×800 프로젝터 | 통과 (12열, 원 지름 84px, 진행률 128px, 세션코드 32px) |
| 22 | 배포본(HTTPS) 스모크 테스트 | 통과 (반영 160ms, 콘솔 오류 0) |
| 23 | 다중 브라우저 — Chromium 전용 API 정적 검사 | 통과 (아래 참조) |
| 24 | **Safari(WebKit)** 입장 + 자동 대문자(`br7uvq`→`BR7UVQ`) | 통과 |
| 25 | **Safari** 🟢 → Chrome 대시보드 반영 | 통과 — **173ms** |
| 26 | **Safari** 🔴 + 코멘트 → 강사 코멘트 목록 | 통과 |
| 27 | **Safari** 다시 확인 리셋 안내 토스트 | 통과 |
| 28 | **Safari** 새로고침 복귀 | 통과 |
| 29 | **Safari** 레이아웃 — 가로 스크롤·오버플로 | 통과 (0건) |
| 30 | **Safari** JS 런타임 오류 | 통과 (`window.onerror` 수집 0건) |
| 31 | **Safari** `navigator.vibrate` 미지원 시 조용히 생략 | 통과 (네이티브 `undefined`, 가드 덕분에 오류 없음 — SPEC §2 progressive enhancement 준수) |

`database.rules.json` 검증 48건: 루트/`sessions` 목록·shallow 조회 차단, 혼동문자(I/O/0/1) 포함 코드 차단, 형식 오류 코드 차단, 잘못된 `status`(blue/GREEN/숫자) 거부, 허용 외 필드 거부, `name` 빈값·31자 초과 거부, `comment` 201자 거부(200자는 허용), `step`/`round` 0·문자열 거부, `createdAt` 변조 거부, 세션 하위 임의 노드 거부, `history` 스키마 검증, `nextStep`식 멀티패스 update 허용 및 그 안에 잘못된 값이 하나라도 섞이면 전체 원자적 거부 — 전부 기대대로.

Chromium 전용 API 검사 결과: 없음. `navigator.vibrate`는 `&&`로 가드되어 미지원 브라우저에서 조용히 생략(SPEC §2 준수), `navigator.onLine`은 전 브라우저 지원, `-webkit-text-size-adjust`/`-webkit-font-smoothing`은 progressive enhancement.

---

#### [QA-1] (세션 B / 버그) 리셋 후에도 이전 회차 코멘트가 남아 자동 재전송된다

- **심각도**: 중 — 강사가 잘못된 정보를 보게 됨
- **재현 절차**
  1. 연수생이 🔴을 누르고 코멘트에 "3번 화면에서 오류가 떠요"를 입력한다(전송 확인).
  2. 강사가 "🔄 다시 확인"(또는 "다음 단계 →")을 누른다. → 연수생 상태가 회색으로 리셋되고 코멘트 패널이 숨겨진다.
  3. 연수생이 새 회차에서 🔴을 **다시 누른다**. 아무것도 입력하지 않는다.
  4. 강사 대시보드 코멘트 목록을 본다.
- **기대**: 코멘트 없이 빨강 상태만 표시(또는 "(코멘트 없음)").
- **실제**: 이전 회차의 "3번 화면에서 오류가 떠요"가 새 회차 코멘트로 즉시 DB에 기록되어 강사 화면에 표시됨. 실 DB 확인: `참가자2|red|3번 화면에서 오류가 떠요`.
- **원인 추정**: `participant.js`의 `handleParticipants()`가 `me.status === 'red'`일 때만 textarea를 채우고, `none`으로 리셋될 때는 비우지 않는다(participant.js:109-112). 이후 `btn-red` 클릭 핸들러가 `sendStatus('red', commentInput.value)`로 남아 있던 값을 그대로 보낸다(participant.js:134-138).
- **비고**: Chrome·Safari 양쪽에서 동일하게 재현됨(브라우저 특정 문제 아님).
- **제안**: 상태가 `red`가 아니게 되면 `commentInput.value = ''` + `updateCommentCount()` 실행.

#### [QA-2] (세션 B, 세션 A / 버그) 사라진 세션으로 복귀하면 "연결할 수 없어요" 화면이 뜨지 않고 갇힌다

- **심각도**: 중 — 연수생이 스스로 빠져나올 수 없음
- **재현 절차**
  1. 연수생 화면 콘솔에서 `localStorage.setItem('seminar-app:participant', JSON.stringify({code:'ZZZZZ9', participantId:'-NoSuchParticipant', name:'유령'}))` 실행. (실제로는 강사가 세션 데이터를 지웠거나 오래된 코드가 남은 경우에 해당)
  2. 새로고침하고 6초 이상 기다린다.
  3. 🟢을 눌러본다.
- **기대**: 6초 후 "연결할 수 없어요 / 세션을 찾을 수 없어요. 다시 입장해주세요." 화면 + [다시 입장하기] 버튼.
- **실제**: **"1단계 진행 중" 메인 화면이 그대로 표시**된다(9초 후에도 동일). 🟢을 누르면 버튼은 선택된 것처럼 보이지만 "전송에 실패했어요. 다시 눌러주세요." 토스트만 반복되고, 다시 입장할 경로가 없다.
- **원인 추정**: `db.js` 실모드의 `onMeta`가 노드가 없어도 `{step:1, round:1}` 기본값으로 콜백한다(db.js:237-242). `participant.js`의 `handleMeta`는 콜백만 오면 `clearTimeout(restoreTimeoutTimer)`를 실행하므로(participant.js:91) 6초 가드가 절대 발동하지 않는다. 즉 `restore-error` 화면은 실모드에서 사실상 죽은 코드다. 목 모드에서는 없는 세션이면 콜백 자체가 오지 않아 정상 동작하므로 세션 B의 목 모드 검증에서는 드러나지 않았다.
- **제안**(둘 중 하나, 총괄매니저 판단 필요)
  - (A) 세션 A가 `onMeta` 콜백에 세션 존재 여부를 전달할 방법을 추가한다. → SPEC §5 계약 변경이라 승인 필요.
  - (B) 세션 B가 `onParticipants` 콜백에서 자기 `participantId`가 없으면 실패로 판정한다. → db.js 계약 변경 없이 해결 가능. 이쪽을 권장.

#### [QA-3] (세션 C / **수정 완료**, 2026-07-24) 참가자 50명이면 프로젝터에서 조작 버튼이 화면 밖으로 밀린다

- **상태**: 총괄매니저 승인, SPEC §3.2에 요구사항 추가됨(`134b991`) → 세션 C가 수정 완료.
- **심각도**: 하 (리포트 시점엔 명세 위반 아니었음, 운영 불편)
- **재현(수정 전)**: 1280×800 뷰포트에서 참가자 50명(SPEC §7 설계 상한)일 때 격자가 12열×5행이 되고, "다음 단계 →" 버튼의 top이 864px가 되어 화면(800px) 밖으로 나간다. 26명일 때는 top 668px로 문제없다.
- **영향**: 강사가 단계를 넘기려면 스크롤해야 하고, 스크롤하면 진행률 %가 화면에서 사라진다.
- **수정 내용**: `#monitor-screen`을 `height:100vh` 세로 flex로 재구성 — 상단바·진행률은 고정 크기, 원 격자(`#participant-grid`)만 `flex:1; overflow-y:auto`로 내부 스크롤, 조작 버튼이 있는 `.bottom-bar`는 항상 뷰포트 하단에 위치. 참가자 수에 따라 원 크기를 재계산할 필요가 없는 방식을 선택.
- **재검증 결과**(Chrome DevTools Protocol로 직접 구동, 세션 C): 1280×800·참가자 **52명**(상한보다 여유 있게 테스트) 조건에서 "다음 단계 →"/"🔄 다시 확인" 버튼의 `getBoundingClientRect().bottom` = 601.6px(< 800px), 페이지 자체 스크롤 없음(`document.documentElement.scrollHeight === window.innerHeight === 800`) 확인. 이 상태에서 `nextStep()` 정상 동작(단계 증가·52명 전원 리셋)도 함께 확인.

#### [QA-4] (세션 C / **수정 완료**, 2026-07-24) 강사가 새로고침하면 진행 중이던 세션으로 돌아갈 수 없다

- **상태**: 총괄매니저 승인, SPEC §3.2에 요구사항 추가됨(`134b991`) → 세션 C가 수정 완료.
- **심각도**: 하 (리포트 시점 SPEC §3.2에 재입장 요구가 없어 명세 위반은 아니었음)
- **재현(수정 전)**: 강사 대시보드에서 세션 생성 후 새로고침 → "새 세션 시작" 화면으로 돌아가며, 기존 코드로 다시 들어갈 방법이 없다. 새 세션을 만들면 이미 입장한 연수생들과 코드가 어긋난다.
- **영향**: 프로젝터 노트북이 절전에 들어가거나 탭이 새로고침되면 진행 중인 연수를 이어갈 수 없다.
- **수정 내용**: 연수생 화면과 동일하게 `localStorage`(`seminar-app:host`)에 세션코드를 저장하고, 페이지 로드 시 저장된 코드가 있으면 세션 생성 화면을 건너뛰고 바로 모니터링 화면(`onMeta`/`onParticipants` 재구독)으로 복귀. 복귀 기능만 있으면 강사가 새 세션을 시작할 방법이 없어지므로, 상단바에 "세션 종료·새로 시작" 링크(confirm 후 구독 해지 + localStorage 삭제)를 추가.
- **재검증 결과**(Chrome DevTools Protocol로 직접 구동, 세션 C): 세션 생성 → 새로고침 → 같은 코드로 모니터링 화면 즉시 복귀, 콘솔 오류 0건. "세션 종료·새로 시작" → confirm → 세션 생성 화면 복귀 및 `localStorage` 삭제 확인. 다만 목 모드는 새로고침 시 메모리가 초기화되는 알려진 제약(세션 A 문서화)이 있어, 복귀 후 참가자 데이터는 빈 상태(0%, 0/0)로 보였다 — 코드 자체는 정확히 복원되고 오류는 없었음. 실 Firebase 모드에서는 세션 데이터가 서버에 남아 있으므로 참가자 데이터도 그대로 복원될 것으로 예상 — **세션 D의 통합 테스트에서 실 Firebase 모드로 한 번 더 확인 요청**.

#### [QA-5] (세션 A / 기록용) 코드를 아는 제3자가 세션을 통째로 삭제할 수 있다

- SPEC §7이 "인증 없음(공개 쓰기)"를 명시하므로 **설계상 수용된 위험**이며 수정 요청이 아니다. 규칙 검증 중 확인된 사실만 기록한다.
- 확인 내용: 세션코드를 아는 상태에서 `DELETE /sessions/{CODE}.json`, `DELETE /sessions/{CODE}/participants/{id}.json`이 모두 허용된다. 다른 참가자의 상태를 덮어쓰는 것도 가능하다.
- 반면 코드를 모르면 아무것도 할 수 없음은 확인됨(루트·`sessions` 조회 및 shallow 열거 전부 차단). 6자리 혼동문자 제외 코드의 경우의 수는 32^6 ≈ 10억.
- 연수 현장 특성상 실질 위험은 낮다고 판단. 인증 도입은 v2 논의 사항.

#### [QA-6] (세션 A / 기록용) 목 모드의 `structuredClone`은 Safari 15.4+ 필요

- `db.js`의 `structuredClone` 사용은 **목 모드 경로에만** 있어(db.js:53,107) 실제 연수생·강사 사용에는 영향이 없다.
- Safari 15.0~15.3에서는 `?mock=1` 개발 모드가 동작하지 않을 수 있다는 점만 기록한다. 수정 불필요.
