# 역할 분담 (TASKS)

> 총괄매니저: 사용자 + 매니저 세션. 명세 변경 승인, 통합 검토, 충돌 조정 담당.
> 각 작업 세션은 시작하자마자 `CLAUDE.md` → `docs/SPEC.md` → 이 문서의 자기 섹션 순으로 읽는다.

## 진행 순서 (의존 관계)

```
세션 A (기반/데이터)
   └─ db.js 목 모드 완성 시점부터 ─┬─ 세션 B (연수생 화면)   ← 병렬 가능
                                  └─ 세션 C (강사 대시보드) ← 병렬 가능
세션 D (QA/배포) — B·C 완료 후 통합 테스트 및 배포
```

- A가 **목 모드 포함 db.js**를 가장 먼저 완성하는 것이 핵심. 그 순간부터 B·C는 실제 Firebase 없이 병렬 개발 가능.
- B와 C는 서로의 파일을 건드릴 일이 없도록 파일 소유권(SPEC §6)이 분리되어 있다.

---

## 세션 A — 기반 / 데이터 계층

**소유 파일**: `public/js/firebase-config.js`, `public/js/db.js`, `public/css/common.css`, `database.rules.json`

할 일:
1. Firebase 프로젝트 생성 안내(콘솔 작업은 사용자에게 단계별 안내) 및 `firebase-config.js` 작성
2. `db.js` 구현 — SPEC §5의 API 계약 그대로. **목 모드(`?mock=1`)를 먼저 구현해 B·C 차단을 풀 것**
   - 목 모드: 메모리 동작 + 가짜 참가자 12명(초록7/빨강3/회색2), 3초마다 무작위 상태 변화 1건(실시간 갱신 확인용)
3. `common.css` — CSS 변수(색상 토큰 `--c-green/--c-red/--c-gray`, 폰트, 기본 리셋)
4. `database.rules.json` 초안 — 스키마 검증, `sessions` 루트 목록 조회 차단(SPEC §7)
5. 완료 시 STATUS.md에 "목 모드 사용법"과 "Firebase 연동 상태"를 기록

## 세션 B — 연수생 화면

**소유 파일**: `public/index.html`, `public/js/participant.js`, `public/css/participant.css`

할 일:
1. 입장 화면: 세션코드(6자리, 자동 대문자) + 이름(선택) → `joinSession()`
2. localStorage 복귀 처리 (SPEC §3.1)
3. 메인 화면: 현재 단계 표시(`onStep`), 🟢/🔴 큰 버튼(`setStatus`), 빨강 시 코멘트 입력(200자)
4. 단계 리셋 시 내 상태 회색 전환 + 짧은 알림
5. 320px 모바일 기준 확인, 목 모드로 전 흐름 검증

## 세션 C — 강사 대시보드

**소유 파일**: `public/host.html`, `public/js/host.js`, `public/css/host.css`

할 일:
1. 세션 생성: `createSession()` → 코드 크게 표시 + QR코드(외부 API 금지 — 의존성 없는 로컬 QR 생성 코드를 host.js에 자체 포함, 부담되면 v1은 코드+URL 텍스트만 표시하고 STATUS.md에 기록)
2. 진행률 큰 숫자 + 참가자 원 격자(`onParticipants`) — 초록/빨강/회색, 원 안에 이름
3. 빨간 원 클릭 → 코멘트 팝오버, 하단 코멘트 목록(최신순)
4. "다음 단계 →" 버튼(`nextStep`)
5. 프로젝터(1280px+) 가독성 확인, 목 모드로 검증

## 세션 D — QA / 배포

**소유 파일**: `firebase.json`, `docs/STATUS.md`의 QA 리포트 섹션

할 일 (B·C 완료 후):
1. 통합 테스트: 실제 Firebase로 강사 1 + 연수생 2 창을 띄워 전 시나리오 검증
   - 입장 → 버튼 → 대시보드 반영(1초 내) → 코멘트 → 다음 단계 리셋 → 새로고침 복귀 → 잘못된 코드 에러
2. `database.rules.json` 검증(다른 세션코드 데이터 접근 시도 등)
3. Firebase Hosting 배포(`firebase.json` 작성, `firebase deploy` — 로그인은 사용자에게 요청)
4. 발견한 버그는 고치지 말고 STATUS.md에 소유 세션 앞으로 리포트

---

## 각 세션 시작 프롬프트 (사용자가 복사해서 사용)

> 너는 이 프로젝트의 **세션 [A/B/C/D]**야. `CLAUDE.md`와 `docs/SPEC.md`를 읽고, `docs/TASKS.md`의 세션 [A/B/C/D] 섹션에 할당된 작업을 수행해. 완료하면 `docs/STATUS.md`의 네 섹션을 갱신해.
