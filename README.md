# tkl-dracula

뮤지컬 <드라큘라> 2026.10.10(토) 19:00 회차의 OP석/VIP석 예매 가능 여부를
5분마다 확인해서, 좌석이 생기면 [ntfy.sh](https://ntfy.sh) 푸시 알림을 보내는 GitHub Actions 워크플로우입니다.

- 로그인 없이 볼 수 있는 공개 상품 페이지(`https://www.ticketlink.co.kr/product/64989`)만 확인합니다.
- 실제 브라우저(Playwright + Chromium)로 페이지를 열어 화면에 보이는 좌석 현황 텍스트만 읽습니다.
  예매/취소/로그인 등 어떤 동작도 수행하지 않습니다.
- OP석 또는 VIP석 중 하나라도 "매진"이 아니면 ntfy 토픽 `tlk-kozp2jhi45` 로 알림을 보냅니다.
- R석/S석/A석 상태는 무시합니다.
- 둘 다 매진이면 아무 알림도 보내지 않습니다 (스팸 방지).

## 알림 받기

휴대폰에 [ntfy 앱](https://ntfy.sh)을 설치하고 토픽 `tlk-kozp2jhi45` 를 구독하거나,
브라우저에서 `https://ntfy.sh/tlk-kozp2jhi45` 를 열어 알림을 허용해두세요.

## 수동 실행

GitHub 저장소의 Actions 탭 → "Ticketlink Dracula Seat Check" → "Run workflow" 로 바로 테스트할 수 있습니다.

## 종료 시점

공연일(2026.10.10) 이후에는 실행 시작 시 워크플로우가 스스로를 비활성화(disable)합니다.
그 전까지는 5분마다 계속 실행됩니다.
