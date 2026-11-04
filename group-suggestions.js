'use strict';
(() => {
  // This page's existing group sign-in provides the member session. No names
  // or member roster are hardcoded here; membership is also checked by the DB.
  const $ = id => document.getElementById(id);
  const MONTHS = [{year:2027,month:5,title:'JUNE 2027'},{year:2027,month:6,title:'JULY 2027'}];
  const DAYS = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
  const FIRST = '2027-07-10', LAST = '2027-07-18';
  let session = null, start = null, end = null, segments = [], proposals = [], working = false;

  function dateLabel(iso) {
    const parts=iso.split('-').map(Number);
    return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'})
      .format(new Date(Date.UTC(parts[0],parts[1]-1,parts[2],12)));
  }
  function rangeLabel(a,b) {
    return a===b ? dateLabel(a) : dateLabel(a)+' – '+dateLabel(b);
  }
  function kind(day) {
    if(day<'2027-06-25'||day>'2027-07-19')return 'outside';
    if(day<='2027-06-26')return 'travel';
    if(day<='2027-07-05')return 'brisbane';
    if(day<='2027-07-09')return 'sydney';
    if(day<='2027-07-18')return 'open';
    return 'return';
  }
  function reserved(day) {
    return segments.find(s=>day>=s.start&&day<=s.end);
  }
  function banner(message,mode='') {
    const el=$('ssStatus');
    if(!el)return;
    el.textContent=message;el.className='ss-status'+(mode?' ss-'+mode:'');
  }
  function button(text,cls) {
    const el=document.createElement('button');
    el.type='button';el.textContent=text;
    el.className=cls;return el;
  }
  function paintMonths() {
    const root=$('ssMonths');if(!root)return;root.replaceChildren();
    MONTHS.forEach(m=>{
      const section=document.createElement('section');section.className='ss-month';
      const title=document.createElement('h4');title.textContent=m.title;section.append(title);
      const grid=document.createElement('div');grid.className='ss-days';grid.setAttribute('role','group');grid.setAttribute('aria-label',m.title);
      DAYS.forEach(name=>{
        const header=document.createElement('span');header.className='ss-weekday';header.textContent=name;grid.append(header);
      });
      const first=new Date(Date.UTC(m.year,m.month,1));
      const dayCount=new Date(Date.UTC(m.year,m.month+1,0)).getUTCDate();
      const offset=(first.getUTCDay()+6)%7;
      for(let blank=0;blank<offset;blank++){
        const empty=document.createElement('div');empty.className='ss-empty';grid.append(empty);
      }
      for(let d=1;d<=dayCount;d++){
        const iso=m.year+'-'+String(m.month+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
        const group=kind(iso), added=reserved(iso);
        const cell=button(String(d),'ss-day ss-'+group);
        cell.dataset.day=iso;cell.disabled=group!=='open'||Boolean(added);
        const active=start!==null&&iso===start;
        const selected=start!==null&&end!==null&&iso>=start&&iso<=end;
        if(active)cell.classList.add('ss-start');
        if(selected)cell.classList.add('ss-selected');
        if(added)cell.classList.add('ss-added');
        const label=document.createElement('span');label.className='ss-day-no';label.textContent=String(d);
        const note=document.createElement('span');note.className='ss-day-label';
        const statusName={outside:'Outside trip',travel:'International travel',brisbane:'Brisbane — fixed',sydney:'Sydney — fixed',open:'Available',return:'Return / arrival'}[group];
        note.textContent=added?'ADDED':group==='brisbane'?'BRISBANE':group==='sydney'?'SYDNEY':group==='travel'?'TRAVEL':group==='return'?'RETURN':'';
        cell.setAttribute('aria-label',dateLabel(iso)+', '+(added?'Already added: '+added.destination:statusName)+(active?', selection start':'')+(selected?', selected':''));
        if(group==='open'&&!added)cell.setAttribute('aria-pressed',String(active||selected));
        cell.append(label,note);grid.append(cell);
      }
      const count=offset+dayCount;
      for(let x=count;x%7!==0;x++){
        const empty=document.createElement('div');empty.className='ss-empty';grid.append(empty);
      }
      section.append(grid);root.append(section);
    });
    const label=$('ssSelection');
    if(label){
      label.textContent=start===null?'Choose a date in July to start your first stop.'
        :end===null?'Starting '+dateLabel(start)+' — select the final date (or select the same date again).'
        :'Selected '+rangeLabel(start,end)+'. Enter a destination and add it to your itinerary.';
    }
  }
  function chooseDate(day) {
    if(kind(day)!=='open'||reserved(day))return;
    if(start===null||end!==null){start=day;end=null;banner('');paintMonths();return;}
    const first=day<start?day:start,last=day>start?day:start;
    const overlaps=segments.some(x=>x.start<=last&&x.end>=first);
    if(overlaps){banner('That range overlaps a destination already added. Choose dates that are still free.','error');return;}
    start=first;end=last;banner('');paintMonths();
  }
  function renderDraft() {
    const root=$('ssStops');if(!root)return;root.replaceChildren();
    if(!segments.length){
      const empty=document.createElement('p');empty.className='ss-quiet';empty.textContent='No destinations added yet. Select dates above to start.';
      root.append(empty);
    }
    segments.forEach((segment,i)=>{
      const line=document.createElement('div');line.className='ss-stop';
      const details=document.createElement('div');details.className='ss-stop-text';
      const loc=document.createElement('strong');loc.textContent=segment.destination;
      const when=document.createElement('small');when.textContent=rangeLabel(segment.start,segment.end);
      details.append(loc,when);
      const remove=button('REMOVE','ss-remove');remove.dataset.remove=String(i);
      remove.setAttribute('aria-label','Remove '+segment.destination+' for '+rangeLabel(segment.start,segment.end));
      line.append(details,remove);root.append(line);
    });
    const submit=$('ssSubmit');if(submit)submit.disabled=!session||working||segments.length===0;
    const count=$('ssDraftCount');if(count)count.textContent=segments.length+' '+(segments.length===1?'stop':'stops')+' added';
    paintMonths();
  }
  function addStop() {
    if(!session)return banner('Sign in first to suggest a trip.','error');
    if(start===null||end===null)return banner('Select a start date and an end date on the calendar first.','error');
    if(segments.length>=9)return banner('The nine available days are already fully allocated.','error');
    const input=$('ssDestination'),dest=input?.value.trim().replace(/\s+/g,' ');
    if(!dest||dest.length<2||dest.length>100)return banner('Enter a destination between 2 and 100 characters.','error');
    if(/[\x00-\x1F\x7F]/.test(dest))return banner('Remove control characters from the destination.','error');
    segments.push({start,end,destination:dest});
    segments.sort((a,b)=>a.start.localeCompare(b.start));
    start=null;end=null;input.value='';banner('Added '+dest+'. Select another date range, or submit your itinerary.','success');
    renderDraft();input.focus();
  }
  async function reload() {
    if(!session)return;
    const here=session;
    const root=$('ssIdeas');
    if(root){root.replaceChildren();const p=document.createElement('p');p.className='ss-quiet';p.textContent='Loading proposed itineraries…';root.append(p);}
    try{
      const {data,error}=await here.client.rpc('bb_list_itinerary_suggestions',{p_first:here.first,p_last:here.last});
      if(error)throw error;
      if(session!==here)return;
      proposals=Array.isArray(data)?data:[];
      showIdeas();
    }catch(e){
      if(session!==here)return;
      if(root){root.replaceChildren();const p=document.createElement('p');p.className='ss-quiet';p.textContent='Could not load group suggestions. Please try refreshing.';root.append(p);}
    }
  }
  function showIdeas() {
    const root=$('ssIdeas');if(!root)return;root.replaceChildren();
    $('ssIdeaCount').textContent=proposals.length+' '+(proposals.length===1?'suggestion':'suggestions');
    if(!proposals.length){
      const empty=document.createElement('p');empty.className='ss-quiet';
      empty.textContent='No itineraries submitted yet. Your idea can be the first.';
      root.append(empty);return;
    }
    proposals.forEach((idea,i)=>{
      const all=Array.isArray(idea.segments)?idea.segments:[];
      const details=document.createElement('details');details.className='ss-idea';
      const summary=document.createElement('summary');summary.className='ss-idea-header';
      const txt=document.createElement('div');txt.className='ss-idea-heading';
      const line=document.createElement('strong');line.textContent=['Brisbane','Sydney',...all.map(x=>x.destination)].join(' → ');
      const small=document.createElement('small');small.textContent=all.length+' '+(all.length===1?'stop':'stops')+' · submitted '+new Date(idea.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'});
      txt.append(line,small);
      summary.append(txt);
      if(idea.mine){const mine=document.createElement('span');mine.className='ss-mine';mine.textContent='YOUR IDEA';summary.append(mine);}
      details.append(summary);
      const stops=document.createElement('div');stops.className='ss-idea-body';
      [['Jun 27 – Jul 5','Brisbane (fixed)'],['Jul 6 – Jul 9','Sydney (fixed)']].forEach(fixed=>{
        const row=document.createElement('div');row.className='ss-idea-leg ss-fixed-leg';
        const date=document.createElement('span');date.textContent=fixed[0];
        const place=document.createElement('strong');place.textContent=fixed[1];
        row.append(date,place);stops.append(row);
      });
      all.forEach(item=>{
        const row=document.createElement('div');row.className='ss-idea-leg';
        const date=document.createElement('span');date.textContent=rangeLabel(item.start,item.end);
        const place=document.createElement('strong');place.textContent=item.destination;
        row.append(date,place);stops.append(row);
      });
      if(idea.mine){
        const remove=button('WITHDRAW MY SUGGESTION','ss-remove ss-withdraw');remove.dataset.withdraw=idea.id;stops.append(remove);
      }
      details.append(stops);root.append(details);
    });
  }
  async function submit() {
    if(!session||working||!segments.length)return;
    if(!confirm('Submit this itinerary idea for the group to review?'))return;
    const here=session;working=true;renderDraft();banner('Submitting your itinerary…');
    try{
      const {data,error}=await here.client.rpc('bb_submit_itinerary_suggestion',{
        p_first:here.first,p_last:here.last,p_segments:segments
      });
      if(error)throw error;
      if(!data)throw Error('Unable to submit. Check your date ranges or suggestion limit.');
      if(session!==here)return;
      segments=[];start=null;end=null;renderDraft();
      banner('Submitted! Everyone in the group can now view your itinerary idea.','success');
      await reload();
    }catch(e){if(session===here)banner('Submission failed: '+(e.message||'Please try again.'),'error');}
    finally{working=false;renderDraft();}
  }
  async function withdraw(id) {
    if(!session||working)return;
    if(!confirm('Withdraw your submitted itinerary? This cannot be undone.'))return;
    working=true;const here=session;
    try{
      const {data,error}=await here.client.rpc('bb_delete_itinerary_suggestion',{
        p_first:here.first,p_last:here.last,p_id:id
      });
      if(error)throw error;
      if(data!==true)throw Error('Only your own submissions can be withdrawn.');
      if(session===here){banner('Suggestion withdrawn.','success');await reload();}
    }catch(e){if(session===here)banner('Could not withdraw suggestion: '+(e.message||'Try again.'),'error');}
    finally{working=false;}
  }
  function init() {
    if(!$('ssMonths'))return;
    $('ssMonths').addEventListener('click',e=>{
      const cell=e.target.closest('button[data-day]');if(cell&&!cell.disabled)chooseDate(cell.dataset.day);
    });
    $('ssAdd').addEventListener('click',addStop);
    $('ssStops').addEventListener('click',e=>{
      const b=e.target.closest('button[data-remove]');if(!b||working)return;
      const idx=Number(b.dataset.remove);if(!Number.isInteger(idx)||idx<0||idx>=segments.length)return;
      segments.splice(idx,1);start=null;end=null;banner('Destination removed from your draft.');renderDraft();
    });
    $('ssSubmit').addEventListener('click',submit);
    $('ssIdeas').addEventListener('click',e=>{
      const b=e.target.closest('button[data-withdraw]');
      if(b){e.preventDefault();withdraw(b.dataset.withdraw);}
    });
    $('ssRefresh').addEventListener('click',reload);
    $('ssDestination').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addStop();}});
    window.addEventListener('bb:member-ready',e=>{
      const detail=e.detail;
      if(!detail?.client||!detail.first||!detail.last)return;
      session={client:detail.client,first:detail.first,last:detail.last};
      segments=[];start=null;end=null;renderDraft();reload();
      banner('Select dates after Sydney to build your itinerary.');
    });
    window.addEventListener('bb:member-signed-out',()=>{
      session=null;segments=[];start=null;end=null;proposals=[];
      $('ssDestination').value='';$('ssIdeas').replaceChildren();renderDraft();banner('');
    });
    renderDraft();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
