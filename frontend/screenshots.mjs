import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1440, height: 900 } });

const pages = [
  { url: 'http://localhost:3001', path: '01-dashboard.png' },
  { url: 'http://localhost:3001/tasks', path: '02-tasks.png' },
  { url: 'http://localhost:3001/logs', path: '03-activity.png' },
  { url: 'http://localhost:3001/settings', path: '04-settings.png' },
];

for (const page of pages) {
  const p = await browser.newPage();
  await p.goto(page.url, { waitUntil: 'networkidle0', timeout: 30000 });
  await p.screenshot({ path: `/Users/vinaysharma/elizclaw/frontend/screenshots/${page.path}`, fullPage: true });
  console.log(`Captured ${page.path}`);
  await p.close();
}

await browser.close();
