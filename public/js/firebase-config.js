// Firebase 웹 앱 설정 (세션 A 소유)
// Firebase 콘솔 > 프로젝트 설정 > 일반 > 내 앱(웹)에서 받은 값으로 아래를 교체한다.
// 주의: databaseURL은 콘솔 스니펫에 빠져 있을 수 있다 — Realtime Database 페이지
// 상단에 표시되는 URL을 그대로 넣을 것.
// 키를 채우기 전까지는 URL에 ?mock=1을 붙여 목 모드로 개발한다.

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
