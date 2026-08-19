// Checks public seat availability for one specific Ticketlink performance round
// and sends an ntfy.sh push notification only if OP석 or VIP석 has open seats.
//
// This only loads the site's public product page with a real browser (Playwright)
// and reads what's visibly rendered — no login, no reservation/purchase attempts,
// and no direct calls to the site's protected seat-data API endpoints.

const { chromium } = require('playwright');

const PRODUCT_URL = 'https://www.ticketlink.co.kr/product/64989';
const TARGET_DATE_LABEL = '2026년 10월 10일'; // used to match the calendar day's aria-label
const TARGET_ROUND = '19:00';
const NTFY_TOPIC = 'tlk-kozp2jhi45';

function seatStatusFor(bodyText, grade) {
  const idx = bodyText.indexOf(grade);
  if (idx === -1) return null;
  const after = bodyText.slice(idx + grade.length, idx + grade.length + 30);
  const line = after
    .split('\n')
    .map((s) => s.trim())
    .find((s) => s.length > 0);
  return line ?? null;
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
    await page.goto(PRODUCT_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('text=날짜 선택', { timeout: 20000 });

    const dateOption = page.locator(`[aria-label*="${TARGET_DATE_LABEL}"]`).first();
    await dateOption.click({ timeout: 10000 });

    const roundBtn = page.getByText(TARGET_ROUND, { exact: true }).first();
    await roundBtn.click({ timeout: 10000 });

    await page.waitForSelector('text=예매가능좌석', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const bodyText = await page.locator('body').innerText();

    const op = seatStatusFor(bodyText, 'OP석');
    const vip = seatStatusFor(bodyText, 'VIP석');

    console.log('OP석:', op, '| VIP석:', vip);

    const opAvailable = !!op && !op.includes('매진');
    const vipAvailable = !!vip && !vip.includes('매진');

    if (opAvailable || vipAvailable) {
      const message = `OP석: ${op ?? '확인불가'} / VIP석: ${vip ?? '확인불가'}`;
      await notify('드라큘라 10/10 19:00 OP/VIP 좌석 발생', message);
    } else {
      console.log('OP/VIP 모두 매진 상태 — 알림 없음');
    }
  } catch (err) {
    console.error('Check failed:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
