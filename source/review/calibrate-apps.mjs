// Calibrate only screen backing colors. Camera, geometry, reference and UI stay fixed.
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '../..');
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'winbrain-palette-'));
const colors = ['29354d','2c3142','202839','253049','26334b','31394d','354056','3a4660','202332','353950','1c2940','242f41','2b374e','303c52','303749','252b39'];
const browser = await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});
try {
  const page = await browser.newPage({viewport:{width:1536,height:1024},deviceScaleFactor:1,reducedMotion:'reduce'});
  page.setDefaultTimeout(180000);
  await page.goto('http://127.0.0.1:8765/');
  await page.waitForFunction(() => window.winbrain && document.body.dataset.ready);
  await page.evaluate(() => {
    winbrain.setRenderingEnabled(false); winbrain.setPaused(true); winbrain.reset();
    const live = winbrain.renderer.domElement;
    const frozen = document.createElement('canvas');
    for (const attribute of live.attributes) frozen.setAttribute(attribute.name, attribute.value);
    frozen.width=live.width; frozen.height=live.height;
    live.replaceWith(frozen); window.reviewFrozen=frozen;
  });
  for (const color of colors) {
    await page.evaluate(color => {
      for (const id of ['app.chat','app.workbench','app.integrations']) {
        const backing=winbrain.registry.get(id).root.getObjectByName('smoke-backing');
        if (!backing) throw new Error('Missing named backing: '+id);
        backing.material.color.set('#'+color);
      }
      winbrain.renderOnce();
      reviewFrozen.getContext('2d').clearRect(0,0,reviewFrozen.width,reviewFrozen.height);
      reviewFrozen.getContext('2d').drawImage(winbrain.renderer.domElement,0,0);
    },color);
    await page.screenshot({path:path.join(temp,color+'.png'),timeout:180000,animations:'disabled'});
  }
} finally { await browser.close(); }
try {
  execFileSync('python3',[path.join(root,'source/review/calibrate-apps.py'),temp,JSON.stringify(colors)],{cwd:root,stdio:'inherit'});
  execFileSync('npm',['run','build'],{cwd:path.join(root,'source'),stdio:'inherit'});
} finally { await fs.rm(temp,{recursive:true,force:true}); }
