(function(){
  'use strict';

  const COLLECTIONS_API='https://eajtunubzthudvqciesa.supabase.co/functions/v1/spin-cycle-data';
  const money=v=>'$'+Number(v||0).toFixed(2);

  function setDecision(title,reason,reminder,metrics,href,label){
    const t=document.getElementById('decisionTitle');
    const r=document.getElementById('decisionReason');
    const rm=document.getElementById('decisionReminder');
    const m=document.getElementById('decisionMetrics');
    const b=document.getElementById('decisionBtn');
    if(t){t.textContent=title;t.classList.remove('decisionLoading');}
    if(r)r.textContent=reason;
    if(rm)rm.textContent=reminder;
    if(m){m.innerHTML='';(metrics||[]).forEach(text=>{const s=document.createElement('span');s.className='decisionMetric';s.textContent=text;m.appendChild(s);});}
    if(b){b.href=href||'/growth-marketing';b.textContent=label||'OPEN ACTION PAGE →';}
  }

  function weekEnd(date){
    const x=new Date(date+'T12:00:00');
    x.setDate(x.getDate()+(6-x.getDay()+7)%7);
    return x.toISOString().slice(0,10);
  }

  function weeklyWf(collections){
    const weeks={};
    (collections||[]).forEach(raw=>{
      const date=raw.collection_date;if(!date)return;
      const end=weekEnd(date),type=raw.entry_type==='weekly'?'weekly':'daily';
      if(!weeks[end])weeks[end]={weekly:[],daily:[]};
      weeks[end][type].push(raw);
    });
    return Object.keys(weeks).sort().map(end=>{
      const src=weeks[end].weekly.length?weeks[end].weekly:weeks[end].daily;
      return {date:end,wf:src.reduce((sum,r)=>sum+Number(r.wash_fold||0),0)};
    }).filter(x=>Number.isFinite(x.wf));
  }

  async function run(){
    try{
      const [dr,hr,cr]=await Promise.all([
        fetch('/api/dashboard',{cache:'no-store'}),
        fetch('/api/system-health',{cache:'no-store'}),
        fetch(COLLECTIONS_API,{cache:'no-store'})
      ]);
      const d=await dr.json();
      const h=await hr.json();
      const c=await cr.json();
      const hc=h.checks||{};

      if(!hc.google?.ok||!hc.google_ads?.ok||!d?.periods){
        setDecision('RECONNECT GOOGLE FIRST','I cannot safely tell you whether to wait or change ads until the Google Ads data is live.','Reconnect Google first. Do not make a paid-ad decision from incomplete data.',[],'/oauth/start','RECONNECT GOOGLE →');
        return;
      }

      const p7=d.periods.last_7_days||{};
      const pt=d.periods.today||{};
      const all7=p7.all_campaigns||{};
      const allT=pt.all_campaigns||{};
      const spend7=Number(all7.spend||0);
      const spendToday=Number(allT.spend||0);
      const clicks7=Number(all7.clicks||0);
      const tracked7=Number(all7.conversions||0);
      const campaigns=Object.values(p7.campaigns||{});
      const enabled=campaigns.filter(x=>x.status==='ENABLED').length;
      const weeks=weeklyWf(c.collections||[]);
      const latest=weeks.length?weeks[weeks.length-1]:null;
      const previous=weeks.length>1?weeks[weeks.length-2]:null;
      const wfNow=latest?Number(latest.wf):null;
      const wfPrev=previous?Number(previous.wf):null;
      const wfChange=(wfPrev>0&&wfNow!==null)?((wfNow-wfPrev)/wfPrev*100):null;

      const metrics=['7-day ad spend '+money(spend7),'7-day clicks '+clicks7];
      if(wfNow!==null)metrics.push('latest W&F '+money(wfNow));
      if(wfPrev!==null)metrics.push('prior W&F '+money(wfPrev));
      if(wfChange!==null)metrics.push('W&F change '+(wfChange>=0?'+':'')+wfChange.toFixed(0)+'%');
      metrics.push('Google tracked actions '+tracked7);
      if(enabled)metrics.push(enabled+' enabled campaign'+(enabled===1?'':'s'));

      if(!cr.ok||!c.ok){
        setDecision('CHECK COLLECTIONS DATA','Your ads are connected, but I cannot read actual collections for a full business recommendation.','Fix collections storage first so this recommendation can compare advertising against real Wash & Fold revenue.',metrics,'/','STAY ON DASHBOARD');
        return;
      }

      if(spend7<1){
        setDecision('CREATE OR RESTART A CAMPAIGN','There is no meaningful paid activity in the last 7 days.','Go to Growth & Marketing, create the campaign, then come back here and let it run before changing it again.',metrics,'/growth-marketing','CREATE CAMPAIGN →');
        return;
      }

      if(spendToday>0&&(spend7<100||clicks7<20)){
        setDecision('WAIT — LET THE ADS GATHER DATA','The ads are active, but there is still limited recent data.','Give the campaign about 2–3 days unless there is an obvious problem. Then compare ad activity with actual Wash & Fold revenue.',metrics,'/','STAY ON DASHBOARD');
        return;
      }

      if(wfChange!==null&&wfChange>=10){
        setDecision('KEEP RUNNING — W&F REVENUE IS IMPROVING','Actual Wash & Fold collections improved while the ads have meaningful activity.','Do not replace a campaign that is helping the business. Keep it running and review again in a few days.',metrics,'/','KEEP WATCHING');
        return;
      }

      if(spend7>=150&&wfChange!==null&&wfChange<=-15){
        setDecision('TAKE ACTION — REVENUE IS MOVING THE WRONG WAY','There is meaningful recent ad spend, but actual Wash & Fold collections are down materially versus the prior recorded week.','Do not simply raise the budget. Go to Growth & Marketing and create a stronger graphic/message variation, then test it against the current campaign.',metrics,'/growth-marketing','CREATE BETTER ADS →');
        return;
      }

      if(spend7>=150&&tracked7===0&&(wfChange===null||wfChange<5)){
        setDecision('REVIEW & IMPROVE','There is enough ad spend to review the campaign, Google shows no tracked actions, and actual Wash & Fold revenue is not clearly improving.','Refresh the creative and verify the customer path. Keep the current campaign available as the comparison instead of changing everything at once.',metrics,'/growth-marketing','CREATE A VARIATION →');
        return;
      }

      if(spendToday===0&&spend7>0){
        setDecision('CHECK THE CAMPAIGN BEFORE CREATING A NEW ONE','There was spend during the last 7 days, but no spend is showing today.','Check campaign status and schedule first. Do not accidentally create a duplicate campaign.',metrics,'/growth-marketing','CHECK / TAKE ACTION →');
        return;
      }

      if(wfChange!==null&&wfChange>=-10){
        setDecision('KEEP RUNNING — WATCH THE BUSINESS RESULT','Actual Wash & Fold revenue is roughly stable while the campaign is active.','Keep watching for a few more days. If W&F revenue weakens while spend continues, then create a new variation.',metrics,'/','KEEP WATCHING');
        return;
      }

      setDecision('KEEP WATCHING','The campaign has recent activity, but the business data is not strong enough to justify a major change yet.','The next decision should be based on ad activity plus actual Wash & Fold collections, not Google conversions by themselves.',metrics,'/','STAY ON DASHBOARD');
    }catch(e){
      setDecision('CHECK CONNECTIONS','I could not read all of the live data needed to make a reliable recommendation.',e.message||'Try again shortly.',['Live recommendation unavailable'],'/','STAY ON DASHBOARD');
    }
  }

  function start(){run();setInterval(run,60000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
