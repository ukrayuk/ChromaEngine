const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 820, height: 740 } });
  await page.goto('file://' + __dirname + '/olive_dechroma.html');
  await page.waitForTimeout(300);
  const el = await page.$('svg');
  await el.screenshot({ path: 'exports/olive_dechroma.png' });
  await browser.close();
})();
