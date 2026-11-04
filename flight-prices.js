
/* Beyond Brisbane public fare display: no API credentials here. */
(()=>{
'use strict';
const ENDPOINT='https://forjvxdumfenuardlyci.supabase.co/functions/v1/trip-fares';
const APIKEY='sb_publishable_NW3IlBA3FaNVDchM03pGLg_Ah2x4G7h'; // Public, restricted browser key; not a secret.
const IDS=['fiji','queenstown','bali','cairns','japan','darwin','vietnam','melbourne'];
const ROUTES={
 fiji:['NYC → BNE · Jun 25','BNE → SYD · Jul 6','SYD → NAN · Jul 10','NAN → NYC · Jul 17'],
 queenstown:['NYC → BNE · Jun 25','BNE → SYD · Jul 6','SYD → ZQN · Jul 10','ZQN → AKL · Jul 15','AKL → NYC · Jul 17'],
 bali:['NYC → BNE · Jun 25','BNE → SYD · Jul 6','SYD → DPS · Jul 10','DPS → SIN · Jul 15','SIN → NYC · Jul 17'],
 cairns:['NYC → BNE · Jun 25','BNE → SYD · Jul 6','SYD → CNS · Jul 10','CNS → NYC · Jul 17'],
 japan:['NYC → BNE · Jun 25','BNE → SYD · Jul 6','SYD → TYO · Jul 10','TYO → NYC · Jul 17'],
 darwin:['NYC → BNE · Jun 25','BNE → SYD · Jul 6','SYD → DRW · Jul 10','DRW → SIN · Jul 15','SIN → NYC · Jul 17'],
 vietnam:['NYC → BNE · Jun 25','BNE → SYD · Jul 6','SYD → SGN · Jul 10','SGN → SIN · Jul 15','SIN → NYC · Jul 17'],
 melbourne:['NYC → BNE · Jun 25','BNE → SYD · Jul 6','SYD → MEL · Jul 10','MEL → SIN · Jul 15','SIN → NYC · Jul 17']
};
const $=id=>document.getElementById(id);
const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);
const quotes=new Map();let connected=false,loading=false,landBudget=null;
const STORAGE='beyond-brisbane-land-budget';
try{const n=Number(localStorage.getItem(STORAGE));if(localStorage.getItem(STORAGE)!==null&&Number.isFinite(n)&&n>=0&&n<=100000)landBudget=n;}catch{}
function price(id){const n=Number(quotes.get(id)?.fare_usd);return n>0&&Number.isFinite(n)?n:null;}
function total(id){const n=price(id);return n!==null&&landBudget!==null?n+landBudget:null;}
window.BeyondFares={price,total};
function status(msg){if($('bbQuoteStatus'))$('bbQuoteStatus').textContent=msg;}
function info(id){
 const q=quotes.get(id);
 if(!connected)return'Pricing service not connected';
 if(!q||price(id)===null)return q?.status==='unavailable'?'No complete fare returned':q?.status==='error'?'Search temporarily unavailable':'Not priced yet';
 const stamp=q.checked_at?new Date(q.checked_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'';
 return (q.status==='available'?'Sum of lowest one-way fares':'Previous leg quotes may be stale')+(stamp?' · checked '+stamp:'');
}
function decorate(){
 document.querySelectorAll('.itinerary-card').forEach(card=>{
  const id=card.querySelector('[data-open]')?.dataset.open;if(!IDS.includes(id))return;
  let box=card.querySelector('.bb-fare-strip');
  if(!box){box=document.createElement('div');box.className='bb-fare-strip';card.querySelector('.card-meta')?.insertAdjacentElement('afterend',box);}
  if(!box)return;
  box.replaceChildren();
  const label=document.createElement('span');label.className='bb-fare-label';label.textContent='SUM OF ONE-WAY FLIGHTS / ADULT';
  const value=document.createElement('strong');value.className='bb-fare-price';value.textContent=price(id)===null?'—':money(price(id));
  const sub=document.createElement('small');sub.className='bb-fare-status';sub.textContent=info(id);
  box.append(label,value,sub);
  const q=quotes.get(id),drop=Number(q?.drop_percent);
  if(q&&Number(q.previous_observations)>=3&&Number.isFinite(drop)&&drop>=10){
   const flag=document.createElement('span');flag.className='bb-deal';flag.textContent='↓ '+Math.round(drop)+'% vs earlier quotes';box.append(flag);
  }
  const t=total(id);
  if(t!==null){const totalLabel=document.createElement('span');totalLabel.className='bb-total-estimate';totalLabel.textContent='Airfare + your land-budget estimate: '+money(t)+' / person';box.append(totalLabel);}
  if(Array.isArray(q?.legs)&&q.legs.length){
    const details=document.createElement('details');details.className='bb-leg-breakdown';
    const summary=document.createElement('summary');summary.textContent='See flight leg prices and dates';
    details.append(summary);
    for(const leg of q.legs){
      const row=document.createElement('div');row.className='bb-leg-item';
      const name=document.createElement('span');name.textContent=leg.origin+' → '+leg.destination+' · '+new Date(leg.date+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
      const val=document.createElement('strong');val.textContent=Number(leg.price_usd)>0?money(leg.price_usd):'—';
      row.append(name,val);details.append(row);
    }
    box.append(details);
  }
  const link=document.createElement('a');link.href='https://www.google.com/travel/flights?hl=en&gl=us&curr=USD';link.target='_blank';link.rel='noopener noreferrer';link.className='bb-google-link';link.textContent='Open Google Flights ↗';box.append(link);
 });
 const count=IDS.filter(id=>price(id)!==null).length;
 if($('bbPriceCount'))$('bbPriceCount').textContent=count+' of 8 itineraries have indicative quotes';
}
function update(rows){if(Array.isArray(rows))for(const q of rows)if(IDS.includes(q?.route_id))quotes.set(q.route_id,q);decorate();}
async function snapshot(){
 const res=await fetch(ENDPOINT,{cache:'no-store',headers:{'apikey':APIKEY}});
 if(!res.ok)throw Error('Pricing service unavailable');
 const data=await res.json();connected=data.connected===true;update(data.quotes);
 status(connected?'Provider connected · shared one-way flight legs cached for three days.':'Google Flights pricing is not connected yet. No prices are being fabricated.');
 return data;
}
function due(q){return !q||!q.next_refresh_at||!Number.isFinite(Date.parse(q.next_refresh_at))||Date.parse(q.next_refresh_at)<=Date.now();}
async function refresh(){
 if(loading)return;if(!connected){status('A free flight-data provider API key is needed to show actual fares.');return;}
 const ids=IDS.filter(id=>due(quotes.get(id)));
 if(!ids.length){status('Airfare legs already checked recently. Next provider search after their three-day cache expires.');return;}
 loading=true;if($('bbRefresh'))$('bbRefresh').disabled=true;
 let index=0,finished=0;
 async function worker(){
  while(index<ids.length){
   const id=ids[index++];
   try{
    const res=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','apikey':APIKEY},body:JSON.stringify({route_id:id})});
    if(res.ok){const data=await res.json();if(data.quote)update([data.quote]);}
   }catch{}
   finished++;status('Checking flight options: '+finished+' / '+ids.length);
  }
 }
 await Promise.all([worker(),worker()]);
 loading=false;if($('bbRefresh'))$('bbRefresh').disabled=false;
 try{await snapshot();}catch{}
 status('Flight-leg estimates updated. Verify arrival dates, baggage, connections and combined-ticket options before booking.');
 window.dispatchEvent(new Event('bb:prices-changed'));
}
function init(){
 if(!$('fareHub'))return;
 window.addEventListener('bb:cards-rendered',decorate);
 const input=$('bbLandBudget');
 if(landBudget!==null&&input)input.value=String(landBudget);
 input?.addEventListener('change',()=>{
  const n=input.value.trim()===''?null:Number(input.value);
  landBudget=n!==null&&Number.isFinite(n)&&n>=0&&n<=100000?n:null;
  try{if(landBudget===null)localStorage.removeItem(STORAGE);else localStorage.setItem(STORAGE,String(landBudget));}catch{}
  decorate();window.dispatchEvent(new Event('bb:prices-changed'));
 });
 $('bbRefresh')?.addEventListener('click',refresh);
 $('bbCopyRoutes')?.addEventListener('click',()=>{
  const lines=IDS.map(id=>id.toUpperCase()+'\n'+ROUTES[id].join('\n')).join('\n\n');
  navigator.clipboard?.writeText(lines).then(()=>status('Search legs copied to clipboard.')).catch(()=>status('Clipboard unavailable.'));
 });
 decorate();snapshot().then(()=>{if(connected)refresh();}).catch(()=>status('Fare service unavailable. All itinerary details remain accessible.'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();