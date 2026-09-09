#!/usr/bin/env node
/**
 * End-to-end check of the caret: that it shows on arrival (including after
 * the web font swaps in), follows typing, survives resizes and tab switches,
 * and hides when keystrokes would go nowhere. Runs the Vite dev server
 * itself and drives it with headless Chromium.
 *
 *   npm run test:caret
 *
 * Needs Chromium once: `npx playwright install chromium`. Set KK_URL to
 * point at an already running server instead.
 */
const { spawn } = require('node:child_process');
const path = require('node:path');
const { chromium, devices } = require('playwright');

const PORT = 5199;
const URL = process.env.KK_URL || `http://localhost:${PORT}/`;
let fails = 0;
const ok = (cond, name, extra = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  (' + extra + ')' : ''}`); if (!cond) fails++; };

const state = (p) => p.evaluate(() => {
  const c = document.querySelector('[data-caret]');
  const cs = c && getComputedStyle(c);
  return {
    opacity: cs ? cs.opacity : null,
    anim: cs ? cs.animationName : null,
    transform: c ? c.style.transform : null,
    focused: document.activeElement?.classList.contains('kk-input') ?? false,
    hasInput: !!document.querySelector('.kk-input'),
  };
});
const passageText = (p) => p.evaluate(() => document.querySelector('.kk-passage').textContent.replace(/ /g, ' '));
const settle = (p, ms = 350) => p.waitForTimeout(ms);

async function startServer() {
  if (process.env.KK_URL) return null;
  // The binary directly, not through npx, so kill() reaches the real server.
  const vite = path.join(__dirname, '..', 'node_modules', '.bin', 'vite');
  const server = spawn(vite, ['--port', String(PORT), '--strictPort'], { stdio: ['ignore', 'pipe', 'ignore'] });
  await new Promise((resolve, reject) => {
    server.stdout.on('data', (d) => { if (String(d).includes('Local:')) resolve(); });
    server.on('exit', (code) => reject(new Error(`vite exited with ${code}`)));
  });
  return server;
}

(async () => {
  const server = await startServer();
  const b = await chromium.launch();

  /* ── Desktop ────────────────────────────────────────────────── */
  {
    const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } });
    const p = await ctx.newPage();
    // Hold the web font back so it swaps in well after mount and focus.
    await p.route(/fonts\.(googleapis|gstatic)\.com/, async (route) => { await new Promise((r) => setTimeout(r, 1500)); route.continue(); });
    await p.goto(URL);
    await settle(p, 500);
    let s = await state(p);
    ok(s.focused && s.opacity === '1' && s.anim === 'kk-blink', 'arrival: input focused, caret visible and blinking (fonts still loading)', JSON.stringify(s));

    await p.evaluate(() => document.fonts.ready);
    await settle(p, 800);
    s = await state(p);
    ok(s.opacity === '1' && s.anim === 'kk-blink', 'arrival: caret still visible after the web font swaps in', JSON.stringify(s));

    await p.setViewportSize({ width: 1000, height: 700 });
    await settle(p);
    s = await state(p);
    ok(s.opacity === '1', 'resize before typing keeps the caret visible', s.opacity);

    const t0 = s.transform;
    await p.keyboard.type('abc');
    await settle(p);
    s = await state(p);
    ok(s.opacity === '1' && s.transform !== t0, 'typing moves the caret and keeps it visible');

    await p.setViewportSize({ width: 1100, height: 700 });
    await settle(p);
    s = await state(p);
    ok(s.opacity === '1', 'resize mid-run keeps the caret visible');

    // Switch tab
    await p.getByRole('tab', { name: 'Presence' }).click();
    await settle(p);
    s = await state(p);
    ok(s.focused && s.opacity === '1' && s.anim === 'kk-blink', 'tab switch: input focused, caret visible on new passage', JSON.stringify(s));
    const firstCharTransform = s.transform;

    // Re-click the active tab
    await p.getByRole('tab', { name: 'Presence' }).click();
    await settle(p);
    s = await state(p);
    ok(s.focused && s.opacity === '1', 're-clicking the active tab keeps focus and caret', JSON.stringify(s));

    await p.getByRole('tab', { name: 'Perspective' }).click();
    await settle(p);
    s = await state(p);
    ok(s.focused && s.opacity === '1', 'switch to Perspective: focused and visible');

    // Try another
    await p.getByRole('button', { name: 'Try another' }).click();
    await settle(p);
    s = await state(p);
    ok(s.focused && s.opacity === '1', 'Try another: focused and visible');

    // Blur via Tab key mid-run: caret should hide, then come back on stage click
    await p.keyboard.type('xy');
    await p.keyboard.press('Tab');
    await settle(p);
    s = await state(p);
    ok(!s.focused && s.opacity === '0', 'blur mid-run hides the caret', JSON.stringify(s));
    await p.locator('.kk-stage').click({ position: { x: 500, y: 600 } });
    await settle(p);
    s = await state(p);
    ok(s.focused && s.opacity === '1', 'stage click restores focus and caret');

    // Start over
    await p.getByRole('button', { name: 'Start over' }).click();
    await settle(p);
    s = await state(p);
    ok(s.focused && s.opacity === '1' && s.transform === (await state(p)).transform, 'Start over: focused, caret visible');

    // About opens: caret hides; closing brings it back
    await p.getByRole('button', { name: 'Why type this?' }).click();
    await settle(p);
    s = await state(p);
    ok(s.opacity === '0', 'About open: caret hidden', JSON.stringify(s));
    await p.keyboard.press('Escape');
    await settle(p);
    s = await state(p);
    if (!s.focused) { await p.locator('.dialog-backdrop').click({ position: { x: 5, y: 5 } }).catch(() => {}); await settle(p); s = await state(p); }
    ok(s.focused && s.opacity === '1', 'About closed: focus and caret back', JSON.stringify(s));

    // Custom: composing has no passage input; saving shows the caret
    await p.getByRole('tab', { name: /own/i }).click();
    await settle(p);
    s = await state(p);
    ok(!s.hasInput, 'Your own while composing: no passage input');
    await p.locator('textarea, .input').first().fill('a short custom line');
    await p.getByRole('button', { name: 'Type it' }).click();
    await settle(p);
    s = await state(p);
    ok(s.focused && s.opacity === '1', 'custom saved: focused and caret visible', JSON.stringify(s));

    // Complete a passage
    await p.getByRole('tab', { name: 'Kindness' }).click();
    await settle(p);
    const text = await passageText(p);
    await p.keyboard.type(text.slice(3), { delay: 1 }); // 'abc' already typed on this run
    await settle(p, 600);
    s = await state(p);
    ok(s.opacity === '0' && !s.focused, 'finished passage: caret hidden, input blurred', JSON.stringify(s));
    await ctx.close();
  }

  /* ── Phone ──────────────────────────────────────────────────── */
  {
    const ctx = await b.newContext({ ...devices['iPhone 13'] });
    const p = await ctx.newPage();
    await p.goto(URL);
    await settle(p, 600);
    let s = await state(p);
    ok(!s.focused && s.opacity === '0', 'phone arrival: no focus, caret hidden', JSON.stringify(s));
    await p.getByRole('tab', { name: 'Presence' }).tap();
    await settle(p);
    s = await state(p);
    ok(s.focused && s.opacity === '1', 'phone tab tap: focused and caret visible', JSON.stringify(s));
    await p.locator('.kk-stage').tap({ position: { x: 200, y: 420 } });
    await settle(p);
    s = await state(p);
    ok(s.focused && s.opacity === '1', 'phone stage tap keeps caret');
    await ctx.close();
  }

  await b.close();
  server?.kill();
  console.log(fails ? `\n${fails} failing` : '\nall passing');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
