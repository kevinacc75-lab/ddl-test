const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const [url,file,scenario,preset]=process.argv.slice(2);
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1366,height:900}});
if(preset)await ctx.addInitScript(pr=>{try{localStorage.setItem('doctrine-lab-media-v2',JSON.stringify({preset:pr,modePaces:{watch:pr,play:pr}}))}catch{}},preset);
const p=await ctx.newPage();const logs=[];p.on('console',m=>{if(m.type()==='error'||/destructure/.test(m.text()))logs.push(m.text().slice(0,300))});p.on('pageerror',e=>logs.push('PAGEERR '+e.message));
const ready=()=>p.waitForFunction(()=>document.querySelector('#start')&&!document.querySelector('#start').disabled,null,{timeout:180000});
await p.goto(url);await ready();
if(scenario==='afterDuel'){await p.evaluate(()=>{const $=s=>document.querySelector(s);$('#deck-a').value='branded';$('#deck-a').dispatchEvent(new Event('change'));$('#deck-b').value='sky';$('#deck-b').dispatchEvent(new Event('change'));$('#game-seed').value='71040';$('#start').click()});await p.waitForTimeout(15000);await p.evaluate(()=>document.querySelector('#new').click());await ready()}
const notices=[];await p.exposeFunction('nt',t=>notices.push(t));await p.evaluate(()=>{const n=document.querySelector('#notice');new MutationObserver(()=>{if(!n.hidden)window.nt(n.textContent)}).observe(n,{subtree:true,childList:true,characterData:true,attributes:true})});
const input=await p.evaluateHandle(()=>[...document.querySelectorAll('input[type=file]')].find(i=>i.accept==='.json'));await input.asElement().setInputFiles(file);
await p.waitForTimeout(12000);const s=await p.evaluate(()=>({turn:document.querySelector('#turn-label')?.textContent,banner:(document.querySelector('#match-study')?.textContent||'').slice(-40),title:document.querySelector('#decision-title')?.textContent}));
console.log(JSON.stringify({scenario,preset,notices:[...new Set(notices)],s,logs:logs.filter(l=>!/animate/.test(l))}));await b.close()})();
