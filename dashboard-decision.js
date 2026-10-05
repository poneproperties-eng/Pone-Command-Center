(function(){
  'use strict';

  const COLLECTIONS_API='https://eajtunubzthudvqciesa.supabase.co/functions/v1/spin-cycle-data';
  const money=v=>'$'+Number(v||0).toFixed(2);

  function actionKey(label){
    const x=String(label||'').toLowerCase();
    if(x.includes('test one new ad'))return 'test-one-new-ad';
    if(x.includes('create ads now'))return 'create-ads-now';
    if(x.includes('check campaign'))return 'check-campaign';
    if(x.includes('good for now'))return 'good-for-now';
    if(x.includes('on hold'))return 'on-hold';
    if(x.includes('check collections'))return 'check-collections';
    if(x.includes('check connections'))return 'check-connections';
    if(x.includes('reconnect google'))return 'reconnect-google';
    return 'review-plan';
  }

  function signalFor(label){
    const x=String(label||'').toLowerCase();
    if(x.includes('test one new ad')||x.includes('create ads now'))return 'ACTION NOW';
    if(x.includes('on hold'))return 'HOLD';
    if(x.includes('good for now'))return 'GOOD';
    if(x.includes('check')||x.includes('reconnect'))return 'ATTENTION';
    return 'REVIEW';
  }

  function ensureSignal(){
    const title=document.getElementById('decisionTitle');if(!title)return null;
    let s=document.getElementById('decisionSignal');
    if(!s){s=document.createElement('div');s.id='decisionSignal';s.style.cssText='display:inline-flex;align-items:center;border:1px solid #ffffff45;background:#ffffff18;color:#e0f2fe;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:950;letter-spacing:.08em;margin-bottom:8px';title.parentNode.insertBefore(s,title);}
    return s;
  }

  function metricClass(text){
    const x=String(text||'').toLowerCase();
    const numMatch=x.match(/([+-]?\d+(?:\.\d+)?)%/);
    const pct=numMatch?Number(numMatch[1]):null;
    if(x.includes('completed w&f trend')||x.includes('completed total revenue trend')){
      if(pct!==null&&pct>=10)return 'metricGood';
      if(pct!==null&&pct<=-15)return 'metricBad';
      return 'metricWatch';
    }
    if(x.includes('current partial w&f change'))return 'metricWatch';
    if(x.includes('completed comparable weeks')){
      const n=Number((x.match(/(\d+)$/)||[])[1]||0);
      return n>=2?'metricGood':'metricWatch';
    }
    if(x.includes('internal weekly history')){
      const n=Number((x.match(/history\s+(\d+)/)||[])[1]||0);
      return n>=2?'metricGood':'metricWatch';
    }
    if(x.includes('enabled campaign'))return 'metricGood';
    if(x.includes('google tracked actions')){
      const n=Number((x.match(/7d\s+([\d.]+)/)||[])[1]||0);
      return n>0?'metricGood':'metricBad';
    }
    if(x.includes('current partial w&f')||x.includes('prior recorded w&f'))return 'metricWatch';
    if(x.includes('spend pace'))return 'metricInfo';
    return 'metricInfo';
  }

  function setDecision(title,reason,reminder,metrics,href,label,passive){
    const t=document.getElementById('decisionTitle');
    const r=document.getElementById('decisionReason');
    const rm=document.getElementById('decisionReminder');
    const m=document.getElementById('decisionMetrics');
    const b=document.getElementById('decisionBtn');
    const s=ensureSignal();
    const key=actionKey(label);
    if(s)s.textContent='LIVE SIGNAL • '+signalFor(label);
    if(t){t.textContent=title;t.classList.remove('decisionLoading');}
    if(r)r.textContent=reason;
    if(rm)rm.textContent=reminder+'  This recommendation refreshes automatically from your live Dashboard data.';
    if(m){m.innerHTML='';(metrics||[]).forEach(text=>{const n=document.createElement('span');n.className='decisionMetric '+metricClass(text);n.textContent=text;m.appendChild(n);});}
    if(b){
      b.textContent=label||'GOOD FOR NOW';
      b.onclick=null;
      b.removeAttribute('aria-disabled');
      b.style.opacity='1';
      b.style.cursor='pointer';
      b.title='Open Growth & Marketing and follow this Dashboard recommendation';
      if(key==='reconnect-google')b.href=href||'/oauth/start';
      else b.href='/growth-marketing?recommended='+encodeURIComponent(key);
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
      const completedEnough=completed.length>=2;

      const metrics=['Today spend '+money(spendToday),'7-day ad spend '+money(spend7),'30-day ad spend '+money(spend30),'7-day clicks '+clicks7,'30-day clicks '+clicks30];
      if(wfNow!==null)metrics.push('current partial W&F '+money(wfNow));
      if(wfPrev!==null)metrics.push('prior recorded W&F '+money(wfPrev));
      if(wfChange!==null)metrics.push('current partial W&F change '+(wfChange>=0?'+':'')+wfChange.toFixed(0)+'%');
      if(spendTrend!==null)metrics.push('7-day spend pace '+(spendTrend>=0?'+':'')+spendTrend.toFixed(0)+'% vs 30-day pace');
      metrics.push('Google tracked actions 7d '+tracked7+' / 30d '+tracked30);
      if(enabled)metrics.push(enabled+' enabled campaign'+(enabled===1?'':'s'));
      if(weekly.ok)metrics.push('internal weekly history '+history.length+' week'+(history.length===1?'':'s'));
      metrics.push('completed comparable weeks '+completed.length);
      if(histWfChange!==null)metrics.push('completed W&F trend '+(histWfChange>=0?'+':'')+histWfChange.toFixed(0)+'%');
      if(histTotalChange!==null)metrics.push('completed total revenue trend '+(histTotalChange>=0?'+':'')+histTotalChange.toFixed(0)+'%');

      if(!cr.ok||!c.ok){
        setDecision('Collections data needs attention.','Your ad data is available, but actual collections are missing, so I cannot combine the full Dashboard into a reliable recommendation.','Fix collections data first. Competitor information should never trigger an ad change by itself.',metrics,'/','CHECK COLLECTIONS',true);
        return;
      }

      if(spend7<1){
        setDecision('There is no meaningful paid activity to evaluate yet.','Your own data says there is no active paid campaign gathering enough information right now.','Create a campaign, then leave it alone for about a week before making a major change unless something is clearly broken.',metrics,'/growth-marketing','CREATE ADS NOW',false);
        return;
      }

      if(!completedEnough){
        setDecision('Still gathering data — not enough completed-week information yet.','The current week is incomplete, so the app will not compare it against a full prior week and will not tell you to change ads from a partial-week drop.','On hold for now. Keep the current campaign running until there are at least two completed comparable weeks.',metrics,'/growth-marketing','ON HOLD — KEEP RUNNING',true);
        return;
      }

      if(spendToday>0&&(spend7<200||clicks7<30)){
        setDecision('The current ads are still gathering useful data.','Even with completed weekly history available, current paid activity is not yet strong enough to justify a new test.','Hold it steady and keep collecting data. Do not react to a partial current week.',metrics,'/growth-marketing','ON HOLD — KEEP RUNNING',true);
        return;
      }

      if(histWfChange!==null&&histWfChange>=10){
        setDecision('Completed weekly history shows Wash & Fold improving.','The decision is based on completed week versus completed week, not the unfinished current week.','Do not disturb a campaign that is helping the business. Keep it running and add another weekly result before changing it.',metrics,'/growth-marketing','GOOD FOR NOW',true);
        return;
      }

      const historyConfirmsWeakness=(histWfChange!==null&&histWfChange<=-15)||(histTotalChange!==null&&histTotalChange<=-15);
      if(spend7>=200&&histWfChange!==null&&histWfChange<=-15&&historyConfirmsWeakness){
        setDecision('Completed weekly data justifies one controlled ad test.','Two completed comparable weeks show materially weaker Wash & Fold results while paid activity remains meaningful. '+competitorPlan('convenience'),'Test one new ad only. Keep the current ad as the comparison and let the new variation run about a full week before judging it.',metrics,'/growth-marketing','TEST ONE NEW AD',false);
        return;
      }

      if(spend7>=200&&tracked7===0&&histWfChange!==null&&histWfChange<5){
        const historyNote=(histSpendChange!==null&&histSpendChange>=0&&historyConfirmsWeakness)?' Completed weekly history shows spend holding or rising while business results weaken.':'';
        setDecision('Completed data says the customer path needs a controlled test.','There is enough paid activity, Google shows no tracked actions, and completed-week Wash & Fold revenue is not improving.'+historyNote+' '+competitorPlan('ordering'),'Test one new ad with a stronger CTA/graphic and verify the destination page. Judge it only after another completed week.',metrics,'/growth-marketing','TEST ONE NEW AD',false);
        return;
      }

      if(spendToday===0&&spend7>0){
        setDecision('The campaign needs to be checked before you create anything new.','There was paid activity during the last 7 days, but no spend is showing today.','Check status, schedule and connections first. Do not create a duplicate campaign just because today is quiet.',metrics,'/growth-marketing','CHECK CAMPAIGN',false);
        return;
      }

      if((histWfChange!==null&&histWfChange>=-10)||(histTotalChange!==null&&histTotalChange>=-10)){
        setDecision('The completed-week business signal is stable.','Completed weekly history does not justify a major reset. The unfinished current week remains informational only.','Hold the campaign steady for another week. The next completed snapshot will be used in the next recommendation.',metrics,'/growth-marketing','GOOD FOR NOW',true);
        return;
      }

      setDecision('Still gathering data before changing anything.','Completed weekly history is not yet giving a strong enough signal for a new ad test. The current partial week is not used to force a decision.','On hold for now. Keep the current campaign running and let the app collect the next completed week.',metrics,'/growth-marketing','ON HOLD — KEEP RUNNING',true);
    }catch(e){
      setDecision('Live data could not be combined right now.','I could not read all of the data needed to make a reliable recommendation.',e.message||'Try again shortly.',['Live recommendation unavailable'],'/','CHECK CONNECTIONS',true);
    }
  }

  function start(){run();setInterval(run,60000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();