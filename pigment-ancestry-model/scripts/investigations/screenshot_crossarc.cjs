const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 950, height: 1000 } });
  await page.goto('file://' + __dirname + '/crossarc_demo.html');
  await page.waitForTimeout(300);
  const el = await page.$('svg');
  await el.screenshot({ path: 'exports/crossarc_demo.png' });
  await browser.close();
})();
