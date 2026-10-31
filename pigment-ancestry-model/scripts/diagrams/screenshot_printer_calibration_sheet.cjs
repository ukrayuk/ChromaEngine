const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 900, height: 1300 } });
  await page.goto('file://' + __dirname + '/printer_calibration_sheet.html');
  await page.waitForTimeout(200);
  await page.screenshot({ path: __dirname + '/printer_calibration_sheet.png', fullPage: true });
  await browser.close();
})();
