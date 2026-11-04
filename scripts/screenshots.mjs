// Captures README screenshots and the template thumbnail with headless Chrome (CDP).
// Usage: start `npm run dev`, then `node scripts/screenshots.mjs [url] [chromePath]`.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const url = process.argv[2] ?? 'http://localhost:5173/';
const chromePath = process.argv[3] ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const root = fileURLToPath(new URL('..', import.meta.url));
const port = 9333;

const chrome = spawn(chromePath, [
  '--headless=new', `--remote-debugging-port=${port}`, '--hide-scrollbars',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'er-shot-'))}`, 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i += 1) {
  await sleep(200);
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    target = list.find((t) => t.type === 'page');
  } catch { /* chrome still starting */ }
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
});
const send = (method, params = {}) => new Promise((resolve) => {
  id += 1; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) =>
  (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;

async function shot(file, width, height, { fullPage = false, script } = {}) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  await send('Page.navigate', { url });
  await sleep(2500);
  if (script) { await evaluate(script); await sleep(2500); }
  const overflow = await evaluate('document.documentElement.scrollWidth - innerWidth');
  let clip;
  if (fullPage) {
    const h = await evaluate('document.documentElement.scrollHeight');
    clip = { x: 0, y: 0, width, height: h, scale: 1 };
  }
  const res = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: fullPage, ...(clip && { clip }) });
  writeFileSync(join(root, file), Buffer.from(res.result.data, 'base64'));
  console.log(`${file}  ${width}px  horizontal overflow: ${overflow}px`);
}

// Hides the demo toolbar so screenshots show the template only.
const hideDemo = "document.querySelector('#root > div.relative')?.remove();";
const fillAndSubmit = `${hideDemo}
const setv=(s,v)=>{const el=document.querySelector(s);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));};
document.querySelector('input[name=er-ticket]:not(:disabled)').click();
document.querySelector('input[name=er-session]').click();
setv('#er-fullname','Nguyễn Văn A');setv('#er-email','nguyenvana@example.com');setv('#er-phone','0912345678');
document.querySelector('#er-terms').click();
setTimeout(()=>document.querySelector('button[type=submit]').click(),100);`;

mkdirSync(join(root, 'docs'), { recursive: true });
await shot('docs/screenshot-1440.png', 1440, 900, { fullPage: true, script: hideDemo });
await shot('docs/screenshot-360.png', 360, 800, { fullPage: true, script: hideDemo });
await shot('docs/confirmation-360.png', 360, 800, { fullPage: true, script: fillAndSubmit });
await shot('src/template-internet-day/thumbnail.png', 1600, 900, { script: hideDemo });

ws.close();
chrome.kill();
