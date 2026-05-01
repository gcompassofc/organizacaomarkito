import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('pageerror', err => {
    console.log('Page error: ', err);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('Console error:', msg.text());
  });
  await page.goto('https://markito.gcompass.com.br/', { waitUntil: 'networkidle0' });
  const rootHtml = await page.$eval('#root', el => el.innerHTML);
  console.log('Root HTML length:', rootHtml.length);
  await browser.close();
})();
