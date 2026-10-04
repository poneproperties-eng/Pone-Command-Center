const COLLECTIONS_API='https://eajtunubzthudvqciesa.supabase.co/functions/v1/spin-cycle-data';
const HISTORY_KEY='spin-cycle-marketing-weekly-history-v1';
const TIMEZONE='America/New_York';

function localDate(){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const get=t=>parts.find(p=>p.type===t)?.value||'';
  return get('year')+'-'+get('month')+'-'+get('day');
}

function weekEnd(date){
  const x=new Date(date+'T12:00:00Z');
  x.setUTCDate(x.getUTCDate()+(6-x.getUTCDay()+7)%7);
  return x.toISOString().slice(0,10);
}

async function readJson(response){
  const text=await response.text();
  if(!text)return {};
  try{return JSON.parse(text);}catch{return {};}
}

async function coreJson(core,path,request,env,ctx){
  const url=new URL(request.url);url.pathname=path;url.search='';
  const response=await core.fetch(new Request(url.toString(),{method:'GET',headers:{accept:'application/json'}}),env,ctx);
  return {ok:response.ok,data:await readJson(response)};
}

function weeklyCollections(rows,currentWeekEnd){
  const totals={self_service:0,wash_fold:0,other:0,total:0};
  (rows||[]).forEach(row=>{
    if(!row.collection_date)return;
    if(weekEnd(row.collection_date)!==currentWeekEnd)return;
    const ss=Number(row.self_service||0),wf=Number(row.wash_fold||0),other=Number(row.vending_other||row.vending||row.other||0);
    totals.self_service+=ss;totals.wash_fold+=wf;totals.other+=other;totals.total+=ss+wf+other;
  });
  Object.keys(totals).forEach(k=>totals[k]=Math.round((totals[k]+Number.EPSILON)*100)/100);
  return totals;
}

export async function weeklyMarketing(core,request,env,ctx){
  if(!env.GOOGLE_TOKENS){
    return new Response(JSON.stringify({ok:false,error:'Weekly history storage is unavailable.'}),{status:503,headers:{'content-type':'application/json','cache-control':'no-store'}});
  }

  try{
    const [dash,collectionsResponse]=await Promise.all([
      coreJson(core,'/api/dashboard',request,env,ctx),
      fetch(COLLECTIONS_API,{headers:{accept:'application/json'}})
    ]);
    const collections=await readJson(collectionsResponse);
    const today=localDate();
    const end=weekEnd(today);
    const p7=dash.data?.periods?.last_7_days||{};
    const p30=dash.data?.periods?.last_30_days||{};
    const all7=p7.all_campaigns||{};
    const all30=p30.all_campaigns||{};
    const campaigns=Object.values(p7.campaigns||{});
    const revenue=weeklyCollections(collections.collections||[],end);

    const snapshot={
      week_end:end,
      updated_at:new Date().toISOString(),
      ad_spend_7d:Number(all7.spend||0),
      clicks_7d:Number(all7.clicks||0),
      tracked_actions_7d:Number(all7.conversions||0),
      ad_spend_30d:Number(all30.spend||0),
      clicks_30d:Number(all30.clicks||0),
      tracked_actions_30d:Number(all30.conversions||0),
      enabled_campaigns:campaigns.filter(c=>c.status==='ENABLED').length,
      self_service:revenue.self_service,
      wash_fold:revenue.wash_fold,
      other:revenue.other,
      total_collections:revenue.total
    };

    let history=await env.GOOGLE_TOKENS.get(HISTORY_KEY,{type:'json'}).catch(()=>null);
    if(!Array.isArray(history))history=[];
    const existing=history.findIndex(x=>x.week_end===end);
    if(existing>=0)history[existing]=snapshot;else history.push(snapshot);
    history=history.sort((a,b)=>String(a.week_end).localeCompare(String(b.week_end))).slice(-26);
    await env.GOOGLE_TOKENS.put(HISTORY_KEY,JSON.stringify(history));

    return new Response(JSON.stringify({ok:true,current:snapshot,history},null,2),{status:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
  }catch(error){
    return new Response(JSON.stringify({ok:false,error:error?.message||String(error)}),{status:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
  }
}
