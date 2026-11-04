
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
const quotes=new Map();let connected=false,loading=false;
const ground=id=>window.BeyondGroundBudget?.forTrip?.(id)??null;
function price(id){const n=Number(quotes.get(id)?.fare_usd);return n>0&&Number.isFinite(n)?n:null;}
function total(id){const f=price(id),b=ground(id);return f!==null&&b?Math.round(f+b.nonAirfare):null;}
function range(id){
 const b=ground(id),f=price(id);if(!b||f===null)return null;
 // Scenario boundaries, NOT statistical confidence intervals. The airfare
 // is already a floor from independently priced legs, not a bookable package.
 return {lower:Math.round(f+b.nonAirfare*.85),
         upper:Math.round(f*1.4+b.nonAirfare*1.3)};
}
window.BeyondFares={price,total,range,ground};
function status(msg){if($('bbQuoteStatus'))$('bbQuoteStatus').textContent=msg;}
function info(id){
 const q=quotes.get(id);
 if(!connected)return'Pricing service not connected';
 if(!q||price(id)===null)return q?.status==='unavailable'?'No complete fare returned':q?.status==='error'?'Search temporarily unavailable':'Not priced yet';
 const stamp=q.checked_at?new Date(q.checked_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}):'';
 return (q.status==='available'?'Sum of lowest one-way fares':'Previous leg quotes may be stale')+(stamp?' · checked '+stamp:'');
}
function costRow(root,title,value,note=''){
 const item=document.createElement('div');item.className='bb-cost-row';
 const label=document.createElement('span');label.textContent=title;
 const amount=document.createElement('strong');amount.textContent=Number.isFinite(value)?money(Math.round(value)):'—';
 item.append(label,amount);
 if(note){const small=document.createElement('small');small.textContent=note;item.append(small);}
 root.append(item);
}
function lodgingDetails(root,stay){
 const item=document.createElement('div');item.className='bb-lodging-option';
 const title=document.createElement('strong');
 title.textContent=stay.place+' · '+stay.nights+' '+(stay.nights===1?'night':'nights');
 item.append(title);
 const mode=document.createElement('p');
 mode.className='bb-lodging-winner';
 mode.textContent=(stay.booked?'Booked · Brisbane hotel':
   stay.mode==='home'?'Six-person apartment or house':'Three shared hotel rooms')+
   ' · '+money(Math.round(stay.perPerson))+' per person';
 item.append(mode);
 const comparison=document.createElement('p');
 comparison.textContent=stay.booked?
   'A$'+stay.bookedAud.toLocaleString('en-US')+' booked for six · '+money(Math.round(stay.hotel))+
   ' USD at 1 AUD = '+stay.audUsd+' USD ('+stay.fxDate+')':
   'Three hotel rooms: '+money(Math.round(stay.hotel))+' for six'+
   (stay.home===null?' · Rental not included':' · Six-person rental: '+money(Math.round(stay.home)));
 item.append(comparison);
 const note=document.createElement('p');note.textContent=stay.note;item.append(note);
 const source=document.createElement('a');source.href=stay.source;source.target='_blank';
 source.rel='noopener noreferrer';
 if(stay.booked){source.href='https://calculatorlib.com/currency-converter/aud-to-usd/history';source.textContent='AUD to USD reference';}
 else source.textContent='Local cost reference';
 item.append(source);root.append(item);
}
function decorate(){
 const budgetApi=window.BeyondGroundBudget;
 document.querySelectorAll('.itinerary-card').forEach(card=>{
  const id=card.querySelector('[data-open]')?.dataset.open;if(!IDS.includes(id))return;
  let box=card.querySelector('.bb-fare-strip');
  if(!box){box=document.createElement('div');box.className='bb-fare-strip';card.querySelector('.card-meta')?.insertAdjacentElement('afterend',box);}
  if(!box)return;
  box.replaceChildren();
  const b=ground(id),f=price(id),full=total(id),span=range(id);
  const label=document.createElement('span');label.className='bb-fare-label';
  label.textContent='Estimated trip cost per person';
  const value=document.createElement('strong');value.className='bb-fare-price';
  value.textContent=full===null?'—':'≈'+money(Math.round(full/50)*50);
  const sub=document.createElement('small');sub.className='bb-fare-status';
  sub.textContent=full===null?'Waiting for flight quote · estimated ground costs: '+(b?money(Math.round(b.nonAirfare)):'—'):
    'Cached flight estimate '+money(f)+' + modeled ground costs '+money(Math.round(b.nonAirfare));
  box.append(label,value,sub);
  if(span){
   const band=document.createElement('span');band.className='bb-budget-range';
   band.textContent='Planning scenario (not a confidence interval): '+money(Math.round(span.lower/100)*100)+'–'+money(Math.round(span.upper/100)*100)+' per person';
   box.append(band);
  }
  const q=quotes.get(id),drop=Number(q?.drop_percent);
  if(q&&Number(q.previous_observations)>=3&&Number.isFinite(drop)&&drop>=10){
   const flag=document.createElement('span');flag.className='bb-deal';
   flag.textContent='↓ Airfare '+Math.round(drop)+'% vs earlier quotes';box.append(flag);
  }
  if(b){
   const details=document.createElement('details');details.className='bb-budget-breakdown';
   const summary=document.createElement('summary');
   summary.textContent='Cost breakdown and room-sharing options';
   details.append(summary);
   costRow(details,'Flights — lowest separate one-way fares',f??NaN,info(id));
   costRow(details,'Accommodations (shared six ways)',b.lodging);
   costRow(details,'Meals',b.food);
   costRow(details,'Local transport + transfers',b.local);
   costRow(details,'Excursions + attractions',b.activities);
   costRow(details,'Insurance + baggage + travel-day meals + entry',b.insurance+b.baggage+b.travelMeals+b.entry);
   costRow(details,'10% buffer on unbooked ground expenses',b.contingency);
   const lodgingTitle=document.createElement('h5');lodgingTitle.className='bb-lodging-heading';
   lodgingTitle.textContent='Accommodation by destination';
   details.append(lodgingTitle);
   b.stays.forEach(stay=>lodgingDetails(details,stay));
   const warning=document.createElement('p');warning.className='bb-budget-caveat';
   warning.textContent='Brisbane lodging is confirmed at A$10,700 for the group, converted at the November 4 reference rate. Other lodging costs are planning estimates, not live July 2027 quotes. Three hotel rooms assume two adults per room; a rental must legally accommodate six. The 12% hotel fee allowance applies only to unbooked stays.';
   details.append(warning);box.append(details);
  }
  if(Array.isArray(q?.legs)&&q.legs.length){
   const details=document.createElement('details');details.className='bb-leg-breakdown';
   const summary=document.createElement('summary');summary.textContent='Flight segments + dates (airfare estimate)';
   details.append(summary);
   for(const leg of q.legs){
    const row=document.createElement('div');row.className='bb-leg-item';
    const name=document.createElement('span');
    name.textContent=leg.origin+' → '+leg.destination+' · '+
      new Date(leg.date+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
    const val=document.createElement('strong');
    val.textContent=Number(leg.price_usd)>0?money(leg.price_usd):'—';
    row.append(name,val);details.append(row);
   }
   box.append(details);
  }
  const link=document.createElement('a');link.href='https://www.google.com/travel/flights?hl=en&gl=us&curr=USD';
  link.target='_blank';link.rel='noopener noreferrer';link.className='bb-google-link';
  link.textContent='Open Google Flights ↗';box.append(link);
 });
 const count=IDS.filter(id=>price(id)!==null).length;
 if($('bbPriceCount'))$('bbPriceCount').textContent=count+' of 8 itineraries have cached flight quotes + ground budgets';
 const summaries=$('bbBudgetLeaderboard');
 if(summaries&&budgetApi){
  const rows=IDS.map(id=>({id,total:total(id),ground:ground(id)?.nonAirfare})).sort((a,b)=>(a.total??Infinity)-(b.total??Infinity));
  summaries.replaceChildren();
  if(rows.every(x=>x.total===null)){
   const notice=document.createElement('p');notice.textContent='Flight quotes are loading. The non-flight estimates are available in each itinerary card.';
   summaries.append(notice);
  }else for(const row of rows){
   const item=document.createElement('div');item.className='bb-budget-rank';
   const name=document.createElement('span');
   name.textContent=ROUTES[row.id]?.slice(2).map(x=>x.split(' · ')[0]).join(' → ')||row.id;
   const price=document.createElement('strong');
   price.textContent=row.total!==null?'≈'+money(Math.round(row.total/50)*50):'Fare pending';
   item.append(name,price);summaries.append(item);
  }
 }
}

function update(rows){if(Array.isArray(rows))for(const q of rows)if(IDS.includes(q?.route_id))quotes.set(q.route_id,q);decorate();window.dispatchEvent(new Event('bb:prices-changed'));}
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
 $('bbRefresh')?.addEventListener('click',refresh);
 $('bbCopyRoutes')?.addEventListener('click',()=>{
  const lines=IDS.map(id=>id.toUpperCase()+'\n'+ROUTES[id].join('\n')).join('\n\n');
  navigator.clipboard?.writeText(lines).then(()=>status('Search legs copied to clipboard.')).catch(()=>status('Clipboard unavailable.'));
 });
 decorate();snapshot().then(()=>{if(connected)refresh();}).catch(()=>status('Fare service unavailable. All itinerary details remain accessible.'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();