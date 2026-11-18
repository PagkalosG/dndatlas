// Atlas 2.0 browser integration smoke test. Playwright is installed only in the CI runner.
import assert from 'node:assert/strict';
import { chromium } from '/tmp/atlas-playwright/node_modules/playwright/index.mjs';

const browser=await chromium.launch({headless:true,channel:'chrome'});
const errors=[];
try {
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto('http://127.0.0.1:8787/',{waitUntil:'networkidle'});
  await page.locator('#primary-nav [data-action="navigate"][data-view="builder"]').click();
  const styles=await page.locator('.builder-page>.steps').evaluate(el=>getComputedStyle(el).position);
  const footer=await page.locator('.builder-page .builder-controls').evaluate(el=>getComputedStyle(el).position);
  assert.equal(styles,'sticky');
  assert.equal(footer,'fixed');
  await page.evaluate(()=>window.scrollTo({top:document.body.scrollHeight,behavior:'instant'}));
  const pos=await page.locator('.builder-page .builder-controls').boundingBox();
  assert.ok(pos && pos.y>=0 && pos.y+pos.height<=900,'footer stays inside viewport while scrolling');

  await page.locator('[data-action="expand-option"][data-kind="species"][data-id="human"]').click();
  await page.locator('[data-action="choose"][data-kind="species"][data-id="human"]').click();
  await page.locator('.builder-controls [data-action="next"]').click();
  await page.locator('[data-action="expand-option"][data-kind="classes"][data-id="fighter"]').click();
  await page.locator('[data-action="choose"][data-kind="classes"][data-id="fighter"]').click();
  await page.locator('.builder-controls [data-action="next"]').click();
  await page.locator('[data-action="expand-option"][data-kind="backgrounds"][data-id="soldier"]').click();
  await page.locator('[data-action="choose"][data-kind="backgrounds"][data-id="soldier"]').click();
  await page.locator('.builder-controls [data-action="save"]').click();
  await page.getByText('Draft saved on this device.').waitFor({timeout:15000});

  await page.reload({waitUntil:'networkidle'});
  await page.locator('#primary-nav [data-action="navigate"][data-view="sheet"]').click();
  await page.locator('.play-tabs [data-action="sheet-tab"][data-id="actions"]').click();
  assert.ok(await page.locator('.play-content-grid, .play-columns').count());
  await page.locator('.play-tabs [data-action="sheet-tab"][data-id="spells"]').click();
  await page.locator('#play-spell-form input[name="name"]').fill('Test cantrip note');
  await page.locator('#play-spell-form button[type="submit"], #play-spell-form button').last().click();
  await page.getByText('Test cantrip note').waitFor();
  await page.locator('.play-tabs [data-action="sheet-tab"][data-id="overview"]').click();
  await page.locator('[data-action="game-short-rest"]').first().click();
  await page.getByText(/Short Rest \(1\)/).first().waitFor();
  await page.locator('#primary-nav [data-action="navigate"][data-view="journal"]').click();
  await page.locator('#play-journal-form input[name="title"]').fill('Our first session');
  await page.locator('#play-journal-form textarea[name="body"]').fill('We found the lost sword.');
  await page.locator('#play-journal-form button[type="submit"], #play-journal-form button').last().click();
  await page.getByText('Our first session').waitFor();
  await page.waitForFunction(async ()=>{const snapshot=await window.ATLAS_V2_LOCAL.load();return snapshot?.gameplay?.journal?.some(entry=>entry.title==='Our first session');});
  await page.reload({waitUntil:'networkidle'});
  await page.locator('#primary-nav [data-action="navigate"][data-view="journal"]').click();
  await page.getByText('Our first session').waitFor();
  await page.locator('#primary-nav [data-action="navigate"][data-view="sheet"]').click();
  await page.locator('.play-tabs [data-action="sheet-tab"][data-id="spells"]').click();
  await page.getByText('Test cantrip note').waitFor();
  await page.locator('[data-role-mode="dm"]').click();
  assert.equal(await page.locator('[data-role-mode="dm"]').getAttribute('aria-pressed'),'true');

  // Mobile: horizontal stepper and fixed footer above bottom navigation.
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:1});
  const mp=await mobile.newPage();
  mp.on('pageerror',error=>errors.push(String(error)));
  await mp.goto('http://127.0.0.1:8787/',{waitUntil:'networkidle'});
  await mp.locator('[data-action="navigate"][data-view="builder"]').first().click();
  const sticky=await mp.locator('.builder-page>.steps').evaluate(el=>getComputedStyle(el).position);
  assert.equal(sticky,'sticky');
  const fixed=await mp.locator('.builder-page .builder-controls').evaluate(el=>({position:getComputedStyle(el).position,bottom:parseInt(getComputedStyle(el).bottom,10),rect:el.getBoundingClientRect().toJSON()}));
  assert.equal(fixed.position,'fixed');
  assert.ok(fixed.bottom>=70 && fixed.rect.right<=390 && fixed.rect.left>=0,'mobile footer clear of bottom nav');
  assert.deepEqual(errors,[], 'No browser JavaScript errors');
  console.log('PASS: sticky desktop/mobile controls; character flow; local saves; sheet tabs; spells, rests, journal; DM toggle');
} finally {
  await browser.close();
}
