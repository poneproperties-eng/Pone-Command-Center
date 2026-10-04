(function(){
  'use strict';

  const COLLECTIONS_API='https://eajtunubzthudvqciesa.supabase.co/functions/v1/spin-cycle-data';
  const money=v=>'$'+Number(v||0).toFixed(2);

  function setDecision(title,reason,reminder,metrics,href,label,passive){
    const t=document.getElementById('decisionTitle');
    const r=document.getElementById('decisionReason');
    const rm=document.getElementById('decisionReminder');
    const m=document.getElementById('decisionMetrics');
    const b=document.getElementById('decisionBtn');
    if(t){t.textContent=title;t.classList.remove('decisionLoading');}
    if(r)r.textContent=reason;
    if(rm)rm.textContent=reminder;
    if(m){m.innerHTML='';(metrics||[]).forEach(text=>{const s=document.createElement('span');s.className='decisionMetric';s.textContent=text;m.appendChild(s);});}
    if(b){
      b.textContent=label||'GOOD FOR NOW';
      b.href=href||'/';
      b.onclick=null;
      b.removeAttribute('aria-disabled');
      b.style.opacity='1';
      b.style.cursor='pointer';
      if(passive){
        b.href='#';
        b.setAttribute('aria-disabled','true');
        b.style.opacity='.92';
        b.style.cursor='default';
        b.onclick=function(e){e.preventDefault();};
      }
    }
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

  function percentChange(now,prev){return prev>0?((now-prev)/prev*100):null;}

  function competitorPlan(kind){
    if(kind==='convenience')return 'Competitor reference: HappyNest is strong on convenience, recurring pickup and communication. If you test a new ad, beat that with clearer Spin Cycle convenience, Free Pickup messaging and stronger local branding.';
    if(kind==='trust')return 'Competitor reference: Splash is strong on local trust, reviews and turnaround promises. If you test a new ad, strengthen proof, turnaround clarity and local credibility.';
    if(kind==='ordering')return 'Competitor reference: Laundromax is strong on simple ordering and pickup/delivery positioning. If you test a new ad, simplify the CTA and make the next step unmistakable.';
    return 'Competitor information is reference only. Your own business data determines whether action is needed.';
  }

  async function run(){
    try{
      const [dr,hr,cr,wr]=await Promise.all([
        fetch('/api/dashboard',{cache:'no-store'}),
        fetch('/api/system-health',{cache:'no-store'}),
        fetch(COLLECTIONS_API,{cache:'no-store'}),
        fetch('/api/marketing-weekly',{cache:'no-store'})
      ]);
      const d=await dr.json();
      const h=await hr.json();
      const c=await cr.json();
      const weekly=await wr.json().catch(()=>({ok:false,history:[]}));
      const hc=h.checks||{};

      if(!hc.google?.ok||!hc.google_ads?.ok||!d?.periods){
        setDecision('Google data is not complete yet.','I cannot safely combine your Dashboard data until Google Ads is live.','Reconnect first. Do not make a paid-ad change from incomplete data.',[],'/oauth/start','RECONNECT GOOGLE',false);
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

      const history=Array.isArray(weekly.history)?weekly.history:[];
      const currentWeekEnd=weekly.current?.week_end||null;
      const completed=history.filter(x=>!currentWeekEnd||x.week_end!==currentWeekEnd);
      const histLatest=completed.length?completed[completed.length-1]:null;
      const histPrev=completed.length>1?completed[completed.length-2]:null;
      const histWfChange=(histLatest&&histPrev)?percentChange(Number(histLatest.wash_fold||0),Number(histPrev.wash_fold||0)):null;
      const histTotalChange=(histLatest&&histPrev)?percentChange(Number(histLatest.total_collections||0),Number(histPrev.total_collections||0)):null;
      const histSpendChange=(histLatest&&histPrev)?percentChange(Number(histLatest.ad_spend_7d||0),Number(histPrev.ad_spend_7d||0)):null;

      const metrics=['Today spend '+money(spendToday),'7-day ad spend '+money(spend7),'30-day ad spend '+money(spend30),'7-day clicks '+clicks7,'30-day clicks '+clicks30];
      if(wfNow!==null)metrics.push('latest W&F '+money(wfNow));
      if(wfPrev!==null)metrics.push('prior W&F '+money(wfPrev));
      if(wfChange!==null)metrics.push('W&F change '+(wfChange>=0?'+':'')+wfChange.toFixed(0)+'%');
      if(spendTrend!==null)metrics.push('7-day spend pace '+(spendTrend>=0?'+':'')+spendTrend.toFixed(0)+'% vs 30-day pace');
      metrics.push('Google tracked actions 7d '+tracked7+' / 30d '+tracked30);
      if(enabled)metrics.push(enabled+' enabled campaign'+(enabled===1?'':'s'));
      if(weekly.ok)metrics.push('internal weekly history '+history.length+' week'+(history.length===1?'':'s'));
      if(histWfChange!==null)metrics.push('stored W&F trend '+(histWfChange>=0?'+':'')+histWfChange.toFixed(0)+'%');
      if(histTotalChange!==null)metrics.push('stored total revenue trend '+(histTotalChange>=0?'+':'')+histTotalChange.toFixed(0)+'%');

      if(!cr.ok||!c.ok){
        setDecision('Collections data needs attention.','Your ad data is available, but actual collections are missing, so I cannot combine the full Dashboard into a reliable recommendation.','Fix collections data first. Competitor information should never trigger an ad change by itself.',metrics,'/','CHECK COLLECTIONS',true);
        return;
      }

      if(spend7<1){
        setDecision('There is no meaningful paid activity to evaluate yet.','Your own data says there is no active paid campaign gathering enough information right now.','Create a campaign, then leave it alone for about a week before making a major change unless something is clearly broken.',metrics,'/growth-marketing','CREATE ADS NOW',false);
        return;
      }

      if(spendToday>0&&(spend7<200||clicks7<30)){
        setDecision('The current ads are still gathering useful data.','Today, 7-day, 30-day and revenue data do not justify changing the campaign yet.','Hold it steady until you have about a full week of meaningful activity. The app is saving the weekly result internally for future comparisons.',metrics,'/','ON HOLD — KEEP RUNNING',true);
        return;
      }

      if(histWfChange!==null&&histWfChange>=10){
        setDecision('Your stored weekly history shows Wash & Fold improving.','The app has retained prior weekly results and the completed-week W&F trend is improving.','Do not disturb a campaign that is helping the business. Keep it running and add another weekly result before changing it.',metrics,'/','GOOD FOR NOW',true);
        return;
      }

      if(wfChange!==null&&wfChange>=10){
        setDecision('Your actual Wash & Fold result is improving.','Revenue improved versus the prior recorded week while paid activity remains meaningful.','Do not disturb a campaign that is helping the business. Review again after another week; this week is being saved internally.',metrics,'/','GOOD FOR NOW',true);
        return;
      }

      const historyConfirmsWeakness=(histWfChange!==null&&histWfChange<=-10)||(histTotalChange!==null&&histTotalChange<=-10);
      if(spend7>=200&&wfChange!==null&&wfChange<=-15){
        const historyNote=historyConfirmsWeakness?' Internal weekly history also shows weakening results.':' The app will compare this test with the stored weekly history.';
        setDecision('One controlled ad test is justified.','You have about a week of meaningful ad activity and actual W&F collections are down materially.'+historyNote+' '+competitorPlan('convenience'),'Test one new ad only. Keep the current ad as the comparison and let the new variation run about a week before judging it.',metrics,'/growth-marketing','TEST ONE NEW AD',false);
        return;
      }

      if(spend7>=200&&tracked7===0&&(wfChange===null||wfChange<5)){
        const historyNote=(histSpendChange!==null&&histSpendChange>=0&&historyConfirmsWeakness)?' Stored weekly history shows spend holding or rising while business results weaken.':'';
        setDecision('Test one stronger message and customer path.','There is enough 7-day spend to review, Google shows no tracked actions, and actual W&F revenue is not clearly improving.'+historyNote+' '+competitorPlan('ordering'),'Test one new ad with a stronger CTA/graphic, verify the destination page, and let it run about a week.',metrics,'/growth-marketing','TEST ONE NEW AD',false);
        return;
      }

      if(spendToday===0&&spend7>0){
        setDecision('The campaign needs to be checked before you create anything new.','There was paid activity during the last 7 days, but no spend is showing today.','Check status, schedule and connections first. Do not create a duplicate campaign just because today is quiet.',metrics,'/growth-marketing','CHECK CAMPAIGN',false);
        return;
      }

      if((histWfChange!==null&&histWfChange>=-10)||(wfChange!==null&&wfChange>=-10)){
        setDecision('The combined business signal is stable.','Current data plus the app’s stored weekly history do not justify a major reset.','Hold the campaign steady for another week. The next weekly snapshot will be added automatically and used in the next recommendation.',metrics,'/','GOOD FOR NOW',true);
        return;
      }

      setDecision('The combined data does not justify a change yet.','Today, 7-day, 30-day, collections and stored weekly history are not giving a strong enough signal for a new test.','Keep the current campaign running. The app will continue building weekly history and use it to guide the next decision.',metrics,'/','ON HOLD — KEEP RUNNING',true);
    }catch(e){
      setDecision('Live data could not be combined right now.','I could not read all of the data needed to make a reliable recommendation.',e.message||'Try again shortly.',['Live recommendation unavailable'],'/','CHECK CONNECTIONS',true);
    }
  }

  function start(){run();setInterval(run,60000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();