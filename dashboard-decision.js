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

  function competitorPlan(kind){
    if(kind==='convenience')return 'Competitor context: HappyNest is strongest on convenience, recurring pickup and communication. If action is justified, beat that with clearer Spin Cycle convenience, Free Pickup messaging and stronger local branding.';
    if(kind==='trust')return 'Competitor context: Splash is strongest on local trust, reviews and turnaround promises. If action is justified, strengthen proof, turnaround clarity and local credibility.';
    if(kind==='ordering')return 'Competitor context: Laundromax is strongest on simple ordering, tracking and pickup/delivery positioning. If action is justified, simplify the CTA and make the next step unmistakable.';
    return 'Competitor context is being used only to shape the recommendation after your own business data says a change is justified.';
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
        setDecision('RECONNECT GOOGLE FIRST','I cannot safely combine your Dashboard data until Google Ads is live.','Reconnect first. Do not make a paid-ad change from incomplete data.',[],'/oauth/start','RECONNECT GOOGLE →');
        return;
      }

      const pt=d.periods.today||{};
      const p7=d.periods.last_7_days||{};
      const p30=d.periods.last_30_days||{};
      const allT=pt.all_campaigns||{};
      const all7=p7.all_campaigns||{};
      const all30=p30.all_campaigns||{};
      const spendToday=Number(allT.spend||0);
      const spend7=Number(all7.spend||0);
      const spend30=Number(all30.spend||0);
      const clicks7=Number(all7.clicks||0);
      const clicks30=Number(all30.clicks||0);
      const tracked7=Number(all7.conversions||0);
      const tracked30=Number(all30.conversions||0);
      const campaigns=Object.values(p7.campaigns||{});
      const enabled=campaigns.filter(x=>x.status==='ENABLED').length;

      const weeks=weeklyWf(c.collections||[]);
      const latest=weeks.length?weeks[weeks.length-1]:null;
      const previous=weeks.length>1?weeks[weeks.length-2]:null;
      const wfNow=latest?Number(latest.wf):null;
      const wfPrev=previous?Number(previous.wf):null;
      const wfChange=(wfPrev>0&&wfNow!==null)?((wfNow-wfPrev)/wfPrev*100):null;

      const avg7=spend7/7;
      const avg30=spend30/30;
      const spendTrend=avg30>0?((avg7-avg30)/avg30*100):null;

      const metrics=['Today spend '+money(spendToday),'7-day ad spend '+money(spend7),'30-day ad spend '+money(spend30),'7-day clicks '+clicks7,'30-day clicks '+clicks30];
      if(wfNow!==null)metrics.push('latest W&F '+money(wfNow));
      if(wfPrev!==null)metrics.push('prior W&F '+money(wfPrev));
      if(wfChange!==null)metrics.push('W&F change '+(wfChange>=0?'+':'')+wfChange.toFixed(0)+'%');
      if(spendTrend!==null)metrics.push('7-day spend pace '+(spendTrend>=0?'+':'')+spendTrend.toFixed(0)+'% vs 30-day pace');
      metrics.push('Google tracked actions 7d '+tracked7+' / 30d '+tracked30);
      if(enabled)metrics.push(enabled+' enabled campaign'+(enabled===1?'':'s'));

      if(!cr.ok||!c.ok){
        setDecision('CHECK COLLECTIONS DATA','Your ad data is available, but actual collections are missing, so I cannot combine the full Dashboard into a reliable action plan.','Fix collections data first. Competitor information should never trigger an ad change by itself.',metrics,'/','STAY ON DASHBOARD');
        return;
      }

      if(spend7<1){
        setDecision('CREATE OR RESTART A CAMPAIGN','There is no meaningful paid activity in the last 7 days, so there is nothing to evaluate against your revenue yet.','Create the campaign, then let it run for about a week before making a major creative or budget change unless something is clearly broken.',metrics,'/growth-marketing','CREATE CAMPAIGN →');
        return;
      }

      if(spendToday>0&&(spend7<200||clicks7<30)){
        setDecision('WAIT — COMPLETE ABOUT A WEEK OF DATA','Ads are active, but there is not enough 7-day activity yet for a reliable change decision. I am also checking the 30-day baseline and actual W&F collections.','Do not react to Competitor Watch yet. Let the current campaign gather about a full week of useful data, then come back here for one combined action plan.',metrics,'/','KEEP RUNNING');
        return;
      }

      if(wfChange!==null&&wfChange>=10){
        setDecision('KEEP RUNNING — BUSINESS RESULT IS IMPROVING','Actual Wash & Fold collections improved versus the prior recorded week while paid activity remains meaningful.','Do not change a campaign that is helping revenue. Keep it stable for another week and use competitor ideas only as future test concepts.',metrics,'/','KEEP WATCHING');
        return;
      }

      if(spend7>=200&&wfChange!==null&&wfChange<=-15){
        setDecision('ACTION PLAN — TEST A STRONGER CREATIVE','You now have about a week of meaningful ad activity and actual Wash & Fold collections are down materially versus the prior recorded week. '+competitorPlan('convenience'),'Create one controlled variation, not a wholesale reset. Keep the current campaign as the comparison and test the new creative for the next week.',metrics,'/growth-marketing','CREATE ONE TEST →');
        return;
      }

      if(spend7>=200&&tracked7===0&&(wfChange===null||wfChange<5)){
        setDecision('ACTION PLAN — IMPROVE THE MESSAGE AND CUSTOMER PATH','You have enough 7-day spend to review the campaign, Google shows no tracked actions, and W&F revenue is not clearly improving. '+competitorPlan('ordering'),'Use one stronger CTA/graphic variation, verify the destination page, and let the test run about a week before judging it.',metrics,'/growth-marketing','CREATE ONE VARIATION →');
        return;
      }

      if(spendToday===0&&spend7>0){
        setDecision('CHECK THE CAMPAIGN BEFORE CHANGING ANYTHING','There was paid activity during the last 7 days, but no spend is showing today.','Check status, schedule and connections first. Do not create a duplicate campaign just because today is quiet.',metrics,'/growth-marketing','CHECK CAMPAIGN →');
        return;
      }

      if(wfChange!==null&&wfChange>=-10){
        setDecision('KEEP RUNNING — NO CHANGE YET','Actual Wash & Fold revenue is roughly stable and the campaign has a full week of useful activity. The 30-day baseline does not justify a major reset.','Hold the campaign steady for another week. Competitor Watch remains reference material until your own numbers give a clear reason to test something new.',metrics,'/','KEEP WATCHING');
        return;
      }

      setDecision('KEEP WATCHING — WAIT FOR A CLEAR SIGNAL','The Dashboard has 7-day and 30-day ad activity plus actual collections, but the combined business signal is not strong enough to justify a major change yet.','Stay with the current campaign and review again after roughly another week. Competitor ideas are used only when your own performance says action is needed.',metrics,'/','STAY ON DASHBOARD');
    }catch(e){
      setDecision('CHECK CONNECTIONS','I could not read all of the live data needed to combine the Dashboard into a reliable action plan.',e.message||'Try again shortly.',['Live recommendation unavailable'],'/','STAY ON DASHBOARD');
    }
  }

  function start(){run();setInterval(run,60000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();