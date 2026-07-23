# 연수 실습 진행도 파악 앱 — 명세서 (SPEC)

> 버전 1.0 · 2026-07-23 · 작성: 총괄매니저 세션
> 이 문서가 단일 진실 공급원(Single Source of Truth)이다. 명세 변경은 총괄매니저 세션을 통해서만 한다.

## 1. 개요

교사 연수에서 강사가 실습을 안내할 때, 연수생 각자의 진행 상황을 실시간으로 파악하기 위한 웹앱.

- **연수생**: 작은 창 하나. "여기까지 완료(🟢)" / "막혔어요(🔴)" 버튼을 누른다. 막혔을 땐 코멘트를 남길 수 있다.
- **강사**: 대시보드에서 색깔 원들의 격자와 진행률(%)만 본다. 정보는 최소한으로.
- 접속은 **세션코드** 입력만으로. 로그인·설치 없음.
- 갱신은 실시간(Firebase 구독 방식, 폴링 불필요).

## 2. 기술 스택 (확정)

| 항목 | 선택 | 비고 |
|---|---|---|
| 프론트엔드 | 순수 HTML / CSS / JavaScript (ES Modules) | 빌드 도구 없음. 프레임워크 없음. |
| DB | Firebase **Realtime Database** | 실시간 구독(`onValue`) 사용 |
| Firebase SDK | v10+ modular SDK, CDN import | `https://www.gstatic.com/firebasejs/...` |
| 호스팅 | Firebase Hosting | 배포는 세션 D 담당 |
| 대상 브라우저 | 2021년 이후 모든 모던 브라우저 — Chrome/Edge/Safari/Firefox/삼성 인터넷/웨일, 모바일·인앱 브라우저 포함 | 특정 브라우저 전용 API 금지. 진동 등 미지원 기능은 조용히 생략(progressive enhancement). 연수생 화면은 모바일 우선 |

## 3. 화면 명세

### 3.1 연수생 화면 (`public/index.html`)

**입장 단계**
1. 세션코드 입력(6자리, 자동 대문자 변환) + 이름(선택, 비우면 "참가자N" 자동 부여)
2. 입장하면 localStorage에 `{code, participantId, name}` 저장 → 새로고침해도 재입장 없이 복귀

**실습 단계 (메인)**
- 상단: 현재 단계 표시 — "3단계 진행 중" (강사가 단계를 넘기면 실시간 반영)
- 중앙: 큰 버튼 2개 (모바일에서 엄지로 누르기 좋게)
  - 🟢 **여기까지 완료** — 상태를 `green`으로 전송
  - 🔴 **막혔어요** — 상태를 `red`로 전송 + 코멘트 입력창 슬라이드 표시(선택 입력, 200자 제한)
- 현재 내 상태가 버튼에 시각적으로 표시됨(선택된 버튼 강조). 언제든 다시 눌러 변경 가능.
- 강사가 단계를 넘기면: 내 상태가 자동으로 `none`(회색)으로 리셋되고 "N단계 진행 중"으로 갱신. 짧은 알림 표시.
- 강사가 **다시 확인**을 요청하면(단계 동일, round 증가): 상태가 회색으로 리셋되고 "N단계 — 강사가 다시 확인을 요청했어요. 여기까지 되면 버튼을 눌러주세요" 안내 + 지원 기기에서 짧은 진동(`navigator.vibrate`).

### 3.2 강사 대시보드 (`public/host.html`)

**세션 생성 단계**
1. "새 세션 시작" 버튼 → 6자리 코드 자동 생성 (혼동 문자 I/O/0/1 제외)
2. 코드 크게 표시 + 참가자 접속용 URL의 QR코드 표시 (QR은 외부 API 말고 로컬 생성 — 세션 C 참고사항)

**모니터링 단계 (메인)**
- 상단: **진행률 큰 숫자** — `완료(green) 인원 / 응답대상 인원` % (프로젝터로 띄워도 보이는 크기)
- 중앙: 참가자 원(circle) 격자
  - 🟢 초록 = 완료 · 🔴 빨강 = 막힘 · ⚪ 회색 = 아직 무응답
  - 원 안에 이름(또는 번호) 작게 표시
  - 빨간 원 클릭 → 코멘트 팝오버 표시
- 하단: 빨간 상태의 코멘트 목록 (이름 + 코멘트, 최신순) — 강사가 훑기 좋게
- 조작 버튼 2개:
  - **"다음 단계 →"** — `step` 증가, `round`를 1로 초기화, 전 참가자 상태 리셋. 직전 상태는 `history`에 보존.
  - **"🔄 다시 확인"** — `step` 유지, `round` 증가, 전 참가자 상태 리셋. 같은 단계를 재실연한 뒤 시그널을 다시 수합할 때 사용. 직전 상태는 `history`에 보존.
  - 두 버튼 모두 실수 방지를 위해 확인 한 번(더블탭 또는 confirm) 거칠 것.
- 통계는 이 이상 넣지 않는다. (요구사항: "너무 많은 정보보다는 원 색깔과 %")

## 4. 데이터 구조 (Realtime Database)

```
sessions/
  {CODE}/                      # 예: "ABC234"
    meta/
      createdAt: <timestamp>
      step: 1                  # 현재 단계 번호
      round: 1                 # 현재 단계의 수합 회차 ("다시 확인"마다 +1)
    participants/
      {participantId}/         # push key
        name: "김교사"
        status: "green" | "red" | "none"
        comment: ""            # red일 때만 의미 있음
        updatedAt: <timestamp>
        joinedAt: <timestamp>
    history/
      {step}/
        {round}/               # "다음 단계"·"다시 확인" 직전의 participants 스냅샷
          {participantId}: { name, status, comment }
```

## 5. 공통 데이터 계층 API (`public/js/db.js`) — **인터페이스 계약**

세션 B(연수생)와 C(강사)는 Firebase를 직접 호출하지 않고 **반드시 이 모듈만** 사용한다.
세션 A가 구현하며, 시그니처 변경은 총괄매니저 승인 필요.

```js
// 강사용
createSession(): Promise<string>                       // 세션코드 반환
nextStep(code): Promise<number>                        // history 저장 + 전원 리셋 + step+1, round=1. 새 step 반환
restartStep(code): Promise<number>                     // history 저장 + 전원 리셋 + round+1 (step 유지). 새 round 반환
onParticipants(code, cb): Unsubscribe                  // cb({participantId: {...}, ...})
onMeta(code, cb): Unsubscribe                          // cb({step, round}) — 단계·회차 변화 구독

// 연수생용
joinSession(code, name): Promise<{participantId, name}> // 코드 없으면 throw Error("SESSION_NOT_FOUND")
setStatus(code, participantId, status, comment?): Promise<void>
```

- 모든 함수는 ES Module로 named export.
- `db.js`는 시작 시 URL 파라미터 `?mock=1`이면 **목(mock) 모드**로 동작: Firebase 없이 메모리 + 가짜 참가자 12명(초록7/빨강3/회색2)으로 동일 API 제공. → B·C가 A 완료 전에도 개발/테스트 가능.

## 6. 파일 구조 및 소유권

```
Seminar_App/
  CLAUDE.md              # 공통 지침서 (전 세션 공통)
  docs/
    SPEC.md              # 이 문서
    TASKS.md             # 역할 분담
    STATUS.md            # 세션별 진행 상황 보고판
  public/
    index.html           # 연수생 화면        [세션 B]
    host.html            # 강사 대시보드      [세션 C]
    css/
      common.css         # 공통 스타일        [세션 A]
      participant.css    #                   [세션 B]
      host.css           #                   [세션 C]
    js/
      firebase-config.js # Firebase 키       [세션 A]
      db.js              # 데이터 계층        [세션 A]
      participant.js     #                   [세션 B]
      host.js            #                   [세션 C]
  firebase.json          # 호스팅 설정        [세션 D]
  database.rules.json    # DB 보안 규칙       [세션 A 초안 → D 검증]
```

## 7. 비기능 요구사항

- 참가자 규모: 세션당 최대 50명 기준으로 설계
- **연수생 화면은 스마트폰이 주 사용 기기다** (모바일 우선):
  - 320px 폭에서도 깨지지 않을 것, `viewport` 메타 태그 필수
  - 터치 타깃(버튼)은 최소 44×44px, 🟢/🔴 메인 버튼은 화면 절반 수준으로 크게
  - hover에 의존하는 UI 금지 (모든 상호작용은 탭으로)
  - 코멘트 입력 시 가상 키보드가 올라와도 입력창이 가려지지 않을 것
  - 화면이 꺼졌다 켜지거나 백그라운드에서 복귀해도 상태·단계가 올바르게 동기화될 것
- 강사 대시보드는 프로젝터(1280px+)에서 뒷자리에서도 원 색이 보일 것
- 네트워크 끊김 시: Firebase SDK 재연결에 맡기되, 연결 상태 표시(작은 점) 정도만
- 보안: 인증 없음(공개 쓰기)이지만 rules로 스키마 검증 + 코드 모르면 목록 조회 불가하게 (`sessions` 루트에 `.read: false`)

## 8. 명시적으로 안 하는 것 (Out of Scope)

- 로그인/계정, 연수생 신원 검증
- 채팅, 사진 업로드, 상세 통계·차트
- 세션 데이터 영구 보관/내보내기 (v2에서 고려)
- IE/구형 브라우저 지원
