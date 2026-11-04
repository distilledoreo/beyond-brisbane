'use strict';
(() => {
  // Member-only, read-only view of group proposals on the main itinerary page.
  // Never embed group names or submitted itineraries in GitHub's public source.
  const $=id=>document.getElementById(id);
  const URL='https://forjvxdumfenuardlyci.supabase.co/rest/v1/rpc/';
  const KEY='sb_publishable_NW3IlBA3FaNVDchM03pGLg_Ah2x4G7h';
  const STORAGE='beyond-brisbane-name-voting-v2';
  let identity=null;
  let busy=false;
  const headers={'apikey':KEY,'Content-Type':'application/json','Accept':'application/json'};
  const moneyDate=iso=>{
    if(!/^\d{4}-\d{2}-\d{2}$/.test(iso||''))return '';
    const [y,m,d]=iso.split('-').map(Number);
    const dt=new Date(Date.UTC(y,m-1,d,12));
    return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(dt);
  };
  const range=(a,b)=>a===b?moneyDate(a):moneyDate(a)+'–'+moneyDate(b);
  function status(text,error=false){
    const el=$('communityStatus');
    if(el){el.textContent=text;el.className='community-status'+(error?' community-error':'');}
  }
  async function rpc(name,args){
    const res=await fetch(URL+name,{method:'POST',headers,body:JSON.stringify(args),cache:'no-store'});
    if(!res.ok)throw Error('Service returned HTTP '+res.status);
    return await res.json();
  }
  function empty(root,message){
    root.replaceChildren();
    const card=document.createElement('div');card.className='community-empty';
    const p=document.createElement('p');p.textContent=message;card.append(p);
    root.append(card);
  }
  function dateLine(parent,date,label,fixed=false){
    const row=document.createElement('div');row.className='community-stop'+(fixed?' community-fixed':'');
    const dateEl=document.createElement('span');dateEl.className='community-date';dateEl.textContent=date;
    const dot=document.createElement('span');dot.className='community-dot';dot.setAttribute('aria-hidden','true');
    const text=document.createElement('strong');text.textContent=label;
    row.append(dateEl,dot,text);parent.append(row);
  }
  function render(ideas){
    const root=$('communityCards');if(!root)return;
    root.replaceChildren();
    const valid=Array.isArray(ideas)?ideas.filter(item=>
      item&&Array.isArray(item.segments)&&item.segments.length>0&&item.segments.length<=9
    ):[];
    $('communityCount').textContent=valid.length+' '+(valid.length===1?'GROUP IDEA':'GROUP IDEAS');
    if(!valid.length){
      empty(root,'No group itineraries submitted yet. Add an idea using the calendar builder.');
      return;
    }
    valid.forEach((idea,index)=>{
      const card=document.createElement('article');card.className='community-card';
      const head=document.createElement('div');head.className='community-card-head';
      const counter=document.createElement('span');counter.className='community-card-label';
      counter.textContent='GROUP SUGGESTION '+String(index+1).padStart(2,'0');
      const date=document.createElement('span');date.className='community-submitted';
      const submitted=new Date(idea.created_at);
      date.textContent=Number.isNaN(submitted.valueOf())?'Proposed by the group':
        'Submitted '+new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(submitted);
      head.append(counter,date);card.append(head);
      const title=document.createElement('h3');
      title.textContent=idea.segments.map(s=>String(s.destination||'').trim()).filter(Boolean).join(' + ')||'Custom itinerary';
      card.append(title);
      const route=document.createElement('p');route.className='community-route';
      route.textContent='Brisbane → Sydney → '+idea.segments.map(s=>s.destination||'').filter(Boolean).join(' → ');
      card.append(route);
      const timeline=document.createElement('div');timeline.className='community-timeline';
      timeline.setAttribute('aria-label','Proposed itinerary dates');
      dateLine(timeline,'JUN 27 – JUL 5','Brisbane · fixed',true);
      dateLine(timeline,'JUL 6–9','Sydney · fixed',true);
      for(const segment of idea.segments){
        if(!segment||!segment.start||!segment.end||!segment.destination)continue;
        dateLine(timeline,range(segment.start,segment.end),String(segment.destination));
      }
      card.append(timeline);
      const footer=document.createElement('div');footer.className='community-card-bottom';
      const note=document.createElement('span');note.textContent='Proposed · not yet a main itinerary';
      const link=document.createElement('a');link.href='group.html#suggestions';link.textContent='VIEW IN GROUP PLANNER →';
      footer.append(note,link);card.append(footer);
      root.append(card);
    });
  }
  async function authorize(first,last){
    if(busy)return;
    first=first.trim().toUpperCase();last=last.trim().toUpperCase();
    if(first.length<2||last.length<2){status('Enter both your first and last name.',true);return;}
    busy=true;
    if($('communityLoginButton'))$('communityLoginButton').disabled=true;
    status('Loading group suggestions…');
    try{
      const allowed=await rpc('bb_name_allowed',{p_first:first,p_last:last});
      if(allowed!==true)throw Error('That name is not registered with the six-member group.');
      const ideas=await rpc('bb_list_itinerary_suggestions',{p_first:first,p_last:last});
      identity={first,last};
      try{localStorage.setItem(STORAGE,JSON.stringify(identity));}catch{}
      $('communityGate').hidden=true;
      $('communityMemberTools').hidden=false;
      $('communityCards').hidden=false;
      render(ideas);
      status('');
    }catch(err){
      identity=null;
      $('communityGate').hidden=false;
      $('communityMemberTools').hidden=true;
      $('communityCards').hidden=true;
      status(err.message||'Unable to load suggestions. Try again.',true);
    }finally{
      busy=false;
      if($('communityLoginButton'))$('communityLoginButton').disabled=false;
    }
  }
  async function refresh(){
    if(!identity)return;
    try{
      const {first,last}=identity;
      const allowed=await rpc('bb_name_allowed',{p_first:first,p_last:last});
      if(allowed!==true){forget();status('This name is no longer registered with the group.',true);return;}
      const ideas=await rpc('bb_list_itinerary_suggestions',{p_first:first,p_last:last});
      render(ideas);status('');
    }catch{status('Could not refresh ideas. Please try again.',true);}
  }
  function forget(){
    identity=null;
    try{localStorage.removeItem(STORAGE);}catch{}
    $('communityGate').hidden=false;
    $('communityMemberTools').hidden=true;
    $('communityCards').hidden=true;
    $('communityLoginForm').reset();
    $('communityCards').replaceChildren();
    $('communityCount').textContent='PRIVATE GROUP IDEAS';
  }
  function init(){
    if(!$('communityItineraries'))return;
    $('communityLoginForm').addEventListener('submit',event=>{
      event.preventDefault();
      authorize($('communityFirstName').value,$('communityLastName').value);
    });
    for(const id of ['communityFirstName','communityLastName']){
      const input=$(id);
      input.addEventListener('input',()=>{
        const pos=input.selectionStart;
        input.value=input.value.toUpperCase();
        if(pos!==null)input.setSelectionRange(pos,pos);
      });
    }
    $('communityRefresh').addEventListener('click',refresh);
    $('communityChangeMember').addEventListener('click',()=>{forget();status('');});
    let saved=null;
    try{saved=JSON.parse(localStorage.getItem(STORAGE)||'null');}catch{}
    if(saved&&typeof saved.first==='string'&&typeof saved.last==='string'){
      authorize(saved.first,saved.last);
    }else{
      $('communityGate').hidden=false;
      $('communityMemberTools').hidden=true;
      $('communityCards').hidden=true;
      status('');
    }
    window.addEventListener('storage',event=>{
      if(event.key===STORAGE){
        let next=null;try{next=JSON.parse(event.newValue||'null');}catch{}
        if(next?.first&&next?.last)authorize(next.first,next.last);
        else forget();
      }
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
