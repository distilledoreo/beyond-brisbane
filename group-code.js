'use strict';
(() => {
const options=[
{id:'fiji',title:'Fiji',sub:'The Tropical Finale',photo:'https://images.unsplash.com/photo-1730946450247-a09fa58fee94?auto=format&fit=crop&w=180&q=70'},
{id:'queenstown',title:'Queenstown & Auckland',sub:'Alpine Adventure',photo:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=180&q=70'},
{id:'bali',title:'Bali & Singapore',sub:'Tropical + Futuristic',photo:'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=180&q=70'},
{id:'cairns',title:'Cairns & Port Douglas',sub:'Natural Wonders',photo:'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=180&q=70'},
{id:'japan',title:'Tokyo & Hakone',sub:'Japan Experience',photo:'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=180&q=70'},
{id:'darwin',title:'Darwin, Kakadu & Singapore',sub:'Wilderness + City',photo:'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=180&q=70'},
{id:'vietnam',title:'Vietnam & Singapore',sub:'Cultural Adventure',photo:'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=180&q=70'},
{id:'melbourne',title:'Melbourne & Singapore',sub:'Coastal Contrast',photo:'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=180&q=70'}];
const tiers=['S','A','B','C','D'],$=id=>document.getElementById(id);
const storage='beyond-brisbane-name-voting-v2';
let client=null,memberIdentity=null,saved=null,draft={},poll=null;
function blank(){return Object.fromEntries(options.map(o=>[o.id,'']));}
function norm(obj){const r=blank();if(obj&&typeof obj==='object')for(const o of options)if(tiers.includes(obj[o.id]))r[o.id]=obj[o.id];return r;}
function view(id){['setupView','loginView','inviteView','votingView'].forEach(k=>{if($(k))$(k).hidden=k!==id});$('signout').hidden=id!=='votingView';}
function status(message,live=false){$('statusText').textContent=message;$('statusDot').classList.toggle('live',live);}
function notice(message='',kind=''){$('alert').textContent=message;$('alert').className='notice'+(kind?' '+kind:'');$('alert').hidden=!message;}
function changed(){return JSON.stringify(draft)!==JSON.stringify(saved);}
function complete(){return options.every(o=>tiers.includes(draft[o.id]));}
function move(id,t){if(!tiers.includes(t)&&t!=='')return;draft[id]=t;renderBallot();}
function renderBallot(){
 const board=$('tierBoard');board.replaceChildren();
 for(const t of [...tiers,'']){
  const row=document.createElement('div');row.className='tier-row';row.dataset.tier=t;
  const label=document.createElement('div');label.className='tier-grade '+(t?t.toLowerCase():'u');label.textContent=t||'NEW';row.append(label);
  const cards=document.createElement('div');cards.className='tier-cards';
  const matches=options.filter(o=>draft[o.id]===t);
  if(!matches.length){const hint=document.createElement('span');hint.className='empty-tier';hint.textContent=t?'Drop an itinerary here':'All options ranked';cards.append(hint);}
  for(const o of matches){
   const tile=document.createElement('div');tile.className='mini-trip';tile.draggable=true;
   tile.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',o.id);e.dataTransfer.effectAllowed='move';});
   const img=document.createElement('img');img.src=o.photo;img.alt='';img.loading='lazy';
   const words=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small');
   strong.textContent=o.title;small.textContent=o.sub;words.append(strong,small);
   const select=document.createElement('select');select.setAttribute('aria-label','Tier for '+o.title);
   for(const [value,text] of [['','—'],...tiers.map(x=>[x,x])]){const opt=document.createElement('option');opt.value=value;opt.textContent=text;select.append(opt);}
   select.value=draft[o.id];select.addEventListener('change',()=>move(o.id,select.value));tile.append(img,words,select);cards.append(tile);
  }
  row.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('text/plain')){e.preventDefault();row.classList.add('over');}});
  row.addEventListener('dragleave',()=>row.classList.remove('over'));
  row.addEventListener('drop',e=>{e.preventDefault();row.classList.remove('over');const id=e.dataTransfer.getData('text/plain');if(options.some(o=>o.id===id))move(id,t);});
  row.append(cards);board.append(row);
 }
 const count=options.filter(o=>tiers.includes(draft[o.id])).length;
 $('completionStatus').textContent=count+' of 8 ranked';
 $('saveVotes').disabled=!complete()||!changed();
 $('saveStatus').textContent=changed()?(complete()?'Unsaved changes':'Rank all eight to save'):'All changes saved';
}
function renderLeaderboard(rows){
 const root=$('leaderboard');root.replaceChildren();
 if(!rows?.length){root.textContent='Results temporarily unavailable. Please refresh the page.';return;}
 const n=Math.max(0,...rows.map(r=>Number(r.voter_count)||0));
 $('countline').textContent=n===1?'1 group member has saved a complete tier list.':n+' group members have saved complete tier lists.';
 if(!n){const p=document.createElement('p');p.className='no-data';p.textContent='No ballots saved yet. Be the first!';root.append(p);return;}
 rows.sort((a,b)=>(Number(b.total_points)/(Number(b.voter_count)||1))-(Number(a.total_points)/(Number(a.voter_count)||1))||options.findIndex(o=>o.id===a.route_id)-options.findIndex(o=>o.id===b.route_id));
 rows.forEach((r,i)=>{
  const o=options.find(x=>x.id===r.route_id);if(!o)return;
  const avg=Number(r.voter_count)?Number(r.total_points)/Number(r.voter_count):0;
  const outer=document.createElement('div');outer.className='result-row';
  const rank=document.createElement('div');rank.className='rankno';rank.textContent=String(i+1).padStart(2,'0');
  const content=document.createElement('div'),name=document.createElement('div');name.className='result-label';name.textContent=o.title;
  const meter=document.createElement('div');meter.className='meter';const fill=document.createElement('span');fill.style.width=(avg/5*100).toFixed(1)+'%';meter.append(fill);
  const detail=document.createElement('div');detail.className='result-detail';
  const subt=document.createElement('span');subt.textContent=o.sub;
  const dist=document.createElement('span');dist.textContent='S '+r.tier_s+' · A '+r.tier_a+' · B '+r.tier_b+' · C '+r.tier_c+' · D '+r.tier_d;
  detail.append(subt,dist);content.append(name,meter,detail);
  const score=document.createElement('div');score.className='result-value';score.textContent=avg.toFixed(2);
  outer.append(rank,content,score);root.append(outer);
 });
}
async function refreshLeaderboard(){
 if(!memberIdentity)return;
 try{const {data,error}=await client.rpc('bb_name_get_totals');if(error)throw error;renderLeaderboard(data);status('Group leaderboard · refreshes every 10 seconds',true);}
 catch(e){status('Leaderboard unavailable');notice('Could not refresh group results: '+e.message,'error');}
}
async function loadBallot(){
 const {data,error}=await client.rpc('bb_name_get_ballot',{p_first:memberIdentity.first,p_last:memberIdentity.last});if(error)throw error;
 saved=norm(data);draft=norm(data);renderBallot();
}
async function activate(first,last){
 first=first.trim().toUpperCase();last=last.trim().toUpperCase();
 if(first.length<2||last.length<2||first.length>70||last.length>70)throw new Error('Please enter your full first and last name.');
 const {data:allowed,error:membershipError}=await client.rpc('bb_name_allowed',{p_first:first,p_last:last});
 if(membershipError)throw membershipError;
 if(allowed!==true)throw new Error('Name not recognized. Please enter the exact first and last name registered by your trip organizer.');
 memberIdentity={first,last};
 localStorage.setItem(storage,JSON.stringify(memberIdentity));
 await loadBallot();
 view('votingView');
 $('identityText').textContent='Personal ballot · your name is never shown publicly';
 await refreshLeaderboard();
 if(poll)clearInterval(poll);
 poll=setInterval(refreshLeaderboard,10000);
 window.dispatchEvent(new CustomEvent('bb:member-ready',{detail:{first,last,client}}));
}
async function signin(e){
 e.preventDefault();
 const first=$('firstName').value.trim().toUpperCase(),last=$('lastName').value.trim().toUpperCase();
 if(!first||!last)return;
 const btn=$('loginButton');btn.disabled=true;notice('');
 try{
  await activate(first,last);
  $('firstName').value='';$('lastName').value='';
  notice('Signed in. Your preferences are saved under your name, and you can edit them at any time.','success');
 }catch(e){memberIdentity=null;localStorage.removeItem(storage);notice(e.message||'Could not sign in.','error');}
 finally{btn.disabled=false;}
}
async function save(){
 if(!memberIdentity||!complete())return;
 const btn=$('saveVotes');btn.disabled=true;$('saveStatus').textContent='Saving…';notice('');
 try{const {data,error}=await client.rpc('bb_name_save_ballot',{p_first:memberIdentity.first,p_last:memberIdentity.last,p_tiers:draft});if(error)throw error;if(data!==true)throw new Error('Your name was not recognized as an approved traveler.');
 saved=norm(draft);renderBallot();notice('Your vote is saved. You can edit it at any time.','success');await refreshLeaderboard();}
 catch(e){notice('Could not save your vote: '+e.message,'error');renderBallot();}
}
function signout(){
 if(poll)clearInterval(poll);poll=null;memberIdentity=null;localStorage.removeItem(storage);saved=null;draft=blank();view('loginView');
 window.dispatchEvent(new Event('bb:member-signed-out'));
 $('identityText').textContent='Names are never shown publicly or stored as plain text in the voting database.';
 status('Signed out');notice('Signed out. Your saved vote is still available using the same full name.','success');
}
async function init(){
 $('loginForm').addEventListener('submit',signin);
 for(const id of ['firstName','lastName']){
  const el=$(id);
  el.addEventListener('input',()=>{const before=el.selectionStart;el.value=el.value.toUpperCase();if(before!==null)el.setSelectionRange(before,before);});
 }
 $('saveVotes').addEventListener('click',save);
 $('refreshBoard').addEventListener('click',refreshLeaderboard);
 $('resetVotes').addEventListener('click',()=>{draft=blank();renderBallot();notice('Draft cleared; your last saved vote is unchanged.');});
 $('signout').addEventListener('click',signout);
 const cfg=window.BEYOND_BRISBANE_VOTING||{};
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(cfg.url||'')||!cfg.publishableKey||!window.supabase?.createClient){view('setupView');status('Connection not configured');return;}
 client=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 localStorage.removeItem('beyond-brisbane-private-member-code-v1');
 const existing=localStorage.getItem(storage);
 if(existing){
  try{
   const identity=JSON.parse(existing);
   if(identity&&typeof identity.first==='string'&&typeof identity.last==='string'){
    await activate(identity.first,identity.last);return;
   }
  }catch(e){}
  memberIdentity=null;localStorage.removeItem(storage);
 }
 view('loginView');status('Private voting is ready',true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();