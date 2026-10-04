const HOME='https://www.spincyclecolumbus.com/';
const FAQ='https://www.spincyclecolumbus.com/about-us/frequently-asked-questions/';
const PRICING='https://www.spincyclecolumbus.com/about-us/pricing/';

function textOnly(html=''){
  return html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/\s+/g,' ').trim();
}
function contains(t,arr){const s=t.toLowerCase();return arr.some(x=>s.includes(x.toLowerCase()));}
function snippet(t,needle){const i=t.toLowerCase().indexOf(needle.toLowerCase());if(i<0)return '';return t.slice(Math.max(0,i-90),Math.min(t.length,i+needle.length+180));}
async function load(url){
  const r=await fetch(url,{headers:{'user-agent':'SpinCycleGrowthAudit/1.0'},cf:{cacheTtl:60,cacheEverything:true}});
  if(!r.ok)throw new Error(`${url} returned HTTP ${r.status}`);
  const html=await r.text();
  return {url,html,text:textOnly(html)};
}
export async function onRequestGet(){
  try{
    const [home,faq,pricing]=await Promise.all([load(HOME),load(FAQ),load(PRICING)]);
    const all=[home.text,faq.text,pricing.text].join(' ');
    const issues=[],passes=[];
    const stale=['not officially have pickup and delivery running yet','pickup and delivery in the near future','coming soon pickup and delivery'];
    for(const page of [home,faq,pricing]){
      for(const phrase of stale){if(page.text.toLowerCase().includes(phrase)){issues.push({severity:'critical',area:'Website consistency',page:page.url,message:'Pickup & Delivery is live, but stale wording says it is not live.',evidence:snippet(page.text,phrase)});break;}}
    }
    const checks=[
      {name:'Wash & Fold next-day price',ok:contains(all,['$ 1.65 /lb','$1.65 /lb','$1.65/lb']),message:'Expected $1.65/lb next-day Wash & Fold pricing is visible.'},
      {name:'Wash & Fold same-day price',ok:contains(all,['$ 2.00 /lb','$2.00 /lb','$2.00/lb']),message:'Expected $2.00/lb same-day Wash & Fold pricing is visible.'},
      {name:'Pickup & Delivery price',ok:contains(all,['$ 2.25 /lb','$2.25 /lb','$2.25/lb']),message:'Expected $2.25/lb Pickup & Delivery pricing is visible.'},
      {name:'Pickup booking CTA',ok:contains(all,['schedule a pickup','schedule laundry pickup']),message:'Pickup scheduling CTA is visible.'},
      {name:'Recurring service',ok:contains(all,['weekly or bi-weekly','recurring weekly','recurring or as-needed','recurring']),message:'Recurring service is explained.'},
      {name:'Commercial laundry',ok:contains(all,['commercial laundry']),message:'Commercial laundry service is visible.'},
      {name:'Service area',ok:contains(all,['reynoldsburg','pickerington','blacklick','gahanna']),message:'Core service areas are represented.'}
    ];
    for(const c of checks){if(c.ok)passes.push(c);else issues.push({severity:'warning',area:'Conversion readiness',message:`Missing or unclear: ${c.name}.`,evidence:c.message});}
    let score=100;for(const i of issues)score-=i.severity==='critical'?25:10;score=Math.max(0,score);
    return new Response(JSON.stringify({ok:true,score,generated_at:new Date().toISOString(),service_status:'LIVE',expected:{wash_fold_next_day:1.65,wash_fold_same_day:2.00,pickup_delivery:2.25},issues,passes,pages:[HOME,FAQ,PRICING]},null,2),{headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
  }catch(e){
    return new Response(JSON.stringify({ok:false,error:e.message},null,2),{status:502,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
  }
}
