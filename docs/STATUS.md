# 진행 상황 보고판 (STATUS)

각 세션은 작업 후 자기 섹션만 갱신한다. 형식: 완료 / 남은 것 / 요청·공유 사항.
다른 세션에 대한 요청은 상대 섹션이 아니라 **자기 섹션의 "요청" 항목**에 쓴다.

## 총괄매니저

- 완료: SPEC.md, TASKS.md, CLAUDE.md 작성 (2026-07-23). GitHub 저장소 초기 푸시.
- 남은 것: 세션 A~D 산출물 통합 검토
- 요청: 없음

## 세션 A — 기반/데이터

- 완료 (2026-07-24):
  - `public/js/db.js` — SPEC §5 API 7종 전부 구현(목 모드 + Firebase 실모드). 목 모드에서 전 API 자동 테스트 12건 통과.
  - `public/css/common.css` — 색상 토큰(`--c-green/--c-red/--c-gray` 및 배경·텍스트·테두리 토큰), 기본 리셋, 한국어 폰트 스택, `:focus-visible` 스타일.
  - `public/js/firebase-config.js` — 자리표시자 상태. 실제 키는 Firebase 콘솔 작업(사용자) 후 기입.
  - `database.rules.json` 초안 — `sessions` 루트 목록 조회 차단, 세션코드 형식(혼동문자 제외 6자리) 검증, meta/participants/history 스키마 검증, 코멘트 200자·이름 30자 제한.
- 남은 것: Firebase 콘솔 프로젝트 생성(사용자 작업) → `firebase-config.js` 키 기입 → 실모드 동작 확인.
- **목 모드 사용법 (B·C 세션 필독)**:
  - URL에 `?mock=1`을 붙이면 Firebase·키 없이 동작. 예: `http://localhost:8000/public/index.html?mock=1`
  - 기본 세션코드 **`ABC234`** 가 미리 만들어져 있고 가짜 참가자 12명(초록7/빨강3/회색2)이 들어 있다. 3초마다 1명씩 상태가 무작위로 바뀐다(실시간 갱신 확인용).
  - `createSession()`으로 새 세션을 만들어도 가짜 12명이 채워진다(C 대시보드 확인용).
  - `joinSession`은 없는 코드면 `Error("SESSION_NOT_FOUND")`를 던진다 — 에러 UI 테스트는 `ABC234` 외 아무 코드로.
  - `onParticipants`/`onMeta`는 구독 즉시 현재 값을 1회 콜백한다(Firebase `onValue`와 동일). 반환값은 구독 해지 함수.
  - 세션코드는 소문자로 넘겨도 자동 대문자 처리된다. `setStatus`의 코멘트는 200자에서 잘리고, `green`/`none` 전송 시 코멘트는 자동으로 비워진다.
  - 목 모드는 메모리 동작이라 새로고침하면 초기화된다. 다만 localStorage 복귀 흐름 테스트를 위해 모르는 `participantId`로 `setStatus`가 와도 에러 없이 참가자를 새로 만든다.
- Firebase 연동 상태: **미연동** (콘솔 프로젝트 생성 대기). 코드는 준비 완료 — `firebase-config.js` 키만 채우면 실모드로 동작. 키가 비어 있는 상태에서 `?mock=1` 없이 열면 한국어 안내 에러를 던진다.
- 요청: 없음

## 세션 B — 연수생 화면

- 완료: (아직 시작 안 함)
- 남은 것: TASKS.md 세션 B 전체
- 요청: 없음

## 세션 C — 강사 대시보드

- 완료: (아직 시작 안 함)
- 남은 것: TASKS.md 세션 C 전체
- 요청: 없음

## 세션 D — QA/배포

- 완료: (아직 시작 안 함)
- 남은 것: TASKS.md 세션 D 전체 (B·C 완료 후 착수)
- 요청: 없음
