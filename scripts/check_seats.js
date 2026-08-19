// Checks public seat-availability info on Naver Booking for one specific
// 뮤지컬 <드라큘라> performance round, and sends an ntfy.sh push notification
// only if OP석 or VIP석 has open seats.
//
// This only loads the public booking page with a real browser (Playwright)
// and reads what's visibly rendered — no login, no seat/cart selection,
// and no reservation/purchase attempts.

const { chromium } = require('playwright');

const BOOKING_URL =
  'https://booking.naver.com/booking/12/bizes/1659108/items/7698895?startDateTime=2026-10-10T00%3A00%3A00%2B09%3A00';
const ROUND_LABEL = '오후 7:00'; // 10월 10일 19:00 회차
const NTFY_TOPIC = 'tlk-kozp2jhi45';

function lineAfter(text, marker, maxLen = 40) {
  const idx = text.indexOf(marker);
  if (idx === -1) return null;
  const after = text.slice(idx + marker.length, idx + marker.length + maxLen);
  return (
    after
      .split('\n')
      .map((s) => s.trim())
      .find((s) => s.length > 0) ?? null
  );
}

function seatCount(line) {
  if (!line) return null;
  const m = line.match(/(\d+)\s*석/);
  return m ? parseInt(m[1], 10) : null;
}

async function notify(title, message) {
  const res = await fetch('https://ntfy.sh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic: NTFY_TOPIC, title, message }),
  });
  console.log('ntfy notify status:', res.status);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ locale: 'ko-KR' });

  try {
    await page.goto(BOOKING_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);

    const roundButton = page.getByText(ROUND_LABEL, { exact: false }).first();
    await roundButton.waitFor({ timeout: 10000 });

    const bodyBefore = await page.locator('body').innerText();
    const roundStatus = lineAfter(bodyBefore, ROUND_LABEL, 20);
    console.log('Round status:', roundStatus);

    if (!roundStatus || roundStatus.includes('마감')) {
      console.log('회차 전체 마감 상태 — 알림 없음.');
      return;
    }

    // Round has overall availability; open it to read the grade breakdown.
    await roundButton.click({ timeout: 10000 });
    await page.waitForTimeout(1500);

    const bodyAfter = await page.locator('body').innerText();
    const opLine = lineAfter(bodyAfter, 'OP석');
    const vipLine = lineAfter(bodyAfter, 'VIP석');
    const opCount = seatCount(opLine);
    const vipCount = seatCount(vipLine);

    console.log('OP석:', opLine, '(', opCount, ') | VIP석:', vipLine, '(', vipCount, ')');

    const opAvailable = (opCount ?? 0) > 0;
    const vipAvailable = (vipCount ?? 0) > 0;

    if (opAvailable || vipAvailable) {
      const message = `OP석: ${opLine ?? '확인불가'} / VIP석: ${vipLine ?? '확인불가'}`;
      await notify('드라큘라 10/10 19:00 OP/VIP 좌석 발생 (네이버예약)', message);
    } else {
      console.log('OP/VIP 모두 0석 — 알림 없음.');
    }
  } catch (err) {
    console.error('Check failed:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
