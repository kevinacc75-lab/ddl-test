import {createRequire} from 'node:module';const require=createRequire(import.meta.url);const {chromium,devices}=require('/opt/npm-tools/node_modules/playwright');
const [url,outDir,opp='branded',seed='71001',first='0',mins='10']=process.argv.slice(2);
const browser=await chromium.launch();const ctx=await browser.newContext({...devices['Galaxy Tab S4 landscape']});const page=await ctx.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const found=[];let shots=0;
try{await page.goto(url);await page.waitForFunction(()=>document.querySelector('#start')&&!document.querySelector('#start').disabled,null,{timeout:90000});
 const before=await page.evaluate(()=>({badge:document.title+' | '+(document.querySelector('.build-badge,#build-badge,[data-build]')?.textContent||''),mode:document.querySelector('#mode')?.value,prefs:Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k).slice(0,300)]))}));
 await page.evaluate(([opp,seed,first])=>{const $=s=>document.querySelector(s);$('#deck-a').value='dtw';$('#deck-a').dispatchEvent(new Event('change'));$('#deck-b').value=opp;$('#deck-b').dispatchEvent(new Event('change'));$('#mode').value='watch';$('#mode').dispatchEvent(new Event('change'));if($('#game-seed'))$('#game-seed').value=seed;if($('#first'))$('#first').value=first;$('#start').click()},[opp,seed,first]);
 const end=Date.now()+Number(mins)*60000;
 while(Date.now()<end){await page.waitForTimeout(300);
  const s=await page.evaluate(()=>{const n=document.querySelector('.coin-scene');const log=document.querySelector('#coin-toss-log')?.textContent||'';const fin=/complete|wins|victory/i.test(document.querySelector('#decision-title')?.textContent||'');return {scene:!!n,visible:!!n&&n.getBoundingClientRect().width>0&&getComputedStyle(n).visibility!=='hidden',dialogOpen:!!document.querySelector('#summon-scene')?.open,kind:n?.dataset.kind,log,fin,turn:document.querySelector('#turn-label')?.textContent}});
  if(s.scene&&shots<4){await page.screenshot({path:`${outDir}/live-coin-${shots}.png`});shots++;found.push(s)}
  if(s.fin)break}
 const last=await page.evaluate(()=>({log:document.querySelector('#coin-toss-log')?.textContent||'',turn:document.querySelector('#turn-label')?.textContent,title:document.querySelector('#decision-title')?.textContent,preset:document.querySelector('#lab-pace')?.value,skip:document.querySelector('#lab-skip-cutins')?.checked,graphics:document.body.dataset.graphics,quiet:document.body.classList.contains('quiet-motion')}));
 await page.screenshot({path:`${outDir}/live-end.png`});
 console.log(JSON.stringify({before,found,last,errors:errors.slice(0,8)},null,1));
}finally{await browser.close()}
