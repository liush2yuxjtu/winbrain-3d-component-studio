// Optional tooling. The delivered HTML itself does not need Playwright.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const url=process.argv[2]||'http://127.0.0.1:8765/';
 const destination=path.resolve(process.argv[3]||'visual-diff/check.png');
 const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1536,height:1024},deviceScaleFactor:1,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.waitForFunction(()=>window.winbrain&&document.body.dataset.ready,null,{timeout:120000});
  await page.evaluate(()=>{winbrain.setRenderingEnabled(false);winbrain.setPaused(true);winbrain.reset();winbrain.renderOnce();});
  await fs.mkdir(path.dirname(destination),{recursive:true});await page.screenshot({path:destination});
  const stats=await page.evaluate(()=>({view:winbrain.view,stats:winbrain.stats()}));
  await fs.writeFile(destination.replace(/\.png$/i,'.json'),JSON.stringify({url,viewport:[1536,1024],deviceScaleFactor:1,errors,...stats},null,2));
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(destination);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
