(function(){
  'use strict';
  var APPROVED='spin-cycle-approved-campaign-v1';

  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
  function getPkg(){try{return window.packageData||packageData||null;}catch(e){return null;}}
  function closeModal(){var m=document.getElementById('modal');if(m)m.classList.remove('show');}
  function facebookHelp(){alert('Facebook still needs its one-time Page authorization. Your campaign can be approved first, then Facebook can be connected before posting.');}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function visualReady(){return window.spinCycleVisualReady===true;}

  function loadScript(src,id,next){
    if(document.getElementById(id)){if(next)next();return;}
    var s=document.createElement('script');s.id=id;s.src=src;s.defer=true;s.onload=function(){if(next)next();};document.head.appendChild(s);
  }

  function addStyle(){
    if(document.getElementById('campaignGuideSafeStyle'))return;
    var s=document.createElement('style');s.id='campaignGuideSafeStyle';s.textContent='.approvalGuide{margin-top:14px;border:2px solid #bfdbfe;border-radius:16px;padding:14px;background:#f8fbff}.approvalSteps{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}.approvalStep{border:1px solid #dbeafe;border-radius:12px;background:#fff;padding:10px;font-size:12px;font-weight:800;color:#475569}.approvalStep strong{display:block;color:#075985;font-size:13px;margin-bottom:3px}.approvalActions{display:flex;gap:9px;flex-wrap:wrap;margin-top:14px}.approvalActions button,.approvalActions a{border:0;border-radius:11px;padding:11px 14px;font-weight:900;text-decoration:none;cursor:pointer}.approvalBack{background:#e2e8f0;color:#334155}.approvalApprove{background:#16a34a;color:#fff}.approvalApprove:disabled{background:#cbd5e1;color:#64748b;cursor:not-allowed}.approvalAdvertise{background:#075985;color:#fff}.approvalConnect{background:#fef3c7;color:#92400e}.approvalVisual{background:#e0f2fe;color:#075985}.platformAction{border:0;border-radius:999px;padding:7px 11px;font-size:11px;font-weight:950;cursor:pointer}.platformAction.google{background:#dcfce7;color:#166534}.platformAction.meta{background:#fef3c7;color:#92400e}.approvedBanner{background:#dcfce7;color:#166534;border-radius:12px;padding:11px 13px;font-weight:900;margin-top:12px}.previewRequired{background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;border-radius:12px;padding:11px 13px;font-weight:850;margin-top:12px}@media(max-width:720px){.approvalSteps{grid-template-columns:1fr 1fr}.approvalActions>*{flex:1;text-align:center}}';document.head.appendChild(s);
  }

  function approve(){
    var p=getPkg();if(!p)return;
    if(!visualReady()){
      alert('You cannot approve this campaign yet. Generate and review the visual ad previews first.');
      closeModal();
      setTimeout(function(){var panel=document.getElementById('spinVisualPanel');if(panel)panel.scrollIntoView({behavior:'smooth',block:'start'});},100);
      return;
    }
    localStorage.setItem(APPROVED,JSON.stringify({approved_at:new Date().toISOString(),campaign:p,visual_preview_confirmed:true}));render('approved');
  }

  function render(mode){
    var p=getPkg();if(!p)return;
    var body=document.getElementById('modalBody'),modal=document.getElementById('modal');if(!body||!modal)return;
    var approved=mode==='approved'||!!localStorage.getItem(APPROVED);var total=Number(p.dailyBudget||0)*Number(p.duration||0);var channels=[];
    if(p.channels&&p.channels.meta)channels.push(['Facebook + Instagram Ads','One-time Facebook Page authorization required','meta']);
    if(p.channels&&p.channels.google)channels.push(['Google Ads + YouTube','Google reporting is connected; verify publishing access before launch','google']);
    if(p.channels&&p.channels.orgMeta)channels.push(['Facebook + Instagram Organic','One-time Facebook Page authorization required','meta']);
    if(p.channels&&p.channels.orgTikTok)channels.push(['TikTok Organic','TikTok publishing connection is not wired yet','meta']);
    if(p.channels&&p.channels.orgYouTube)channels.push(['YouTube Shorts','YouTube publishing connection is not wired yet','meta']);
    if(p.channels&&p.channels.orgGBP)channels.push(['Google Business Profile','Verify or reconnect Google Business Profile access','google']);
    var html='';
    html+='<div class="card" style="margin-top:14px"><b>'+esc(p.hook)+'</b><div class="small" style="margin-top:5px">Offer: '+esc(p.offer)+' • Maximum paid budget: $'+Number(p.dailyBudget||0).toFixed(2)+'/day × '+Number(p.duration||0)+' days = $'+total.toFixed(2)+'</div></div>';
    html+='<div class="approvalGuide"><h3>Review the actual ad before approval</h3><div class="small">The visual graphics must be rendered and reviewed first. Approval is locked until the preview is ready.</div><div class="approvalSteps"><div class="approvalStep"><strong>1. See the Ad</strong>Review the actual graphic, logo, phone, offer and destination.</div><div class="approvalStep"><strong>2. Approve</strong>Approve only after the visual looks right.</div><div class="approvalStep"><strong>3. Connect</strong>Connect only the channels you want.</div><div class="approvalStep"><strong>4. Advertise</strong>Launch only after you confirm.</div></div>';
    if(approved)html+='<div class="approvedBanner">✓ CAMPAIGN APPROVED — the visual preview was confirmed. Nothing has been published yet.</div>';
    else if(!visualReady())html+='<div class="previewRequired">VISUAL PREVIEW REQUIRED — close this window and review the rendered graphics before approval.</div>';
    html+='</div><div class="platformList">';
    channels.forEach(function(x){html+='<div class="platformRow"><div><b>'+esc(x[0])+'</b><div class="small">'+esc(x[1])+'</div></div><button class="platformAction '+(x[2]==='google'?'google':'meta')+'" data-kind="'+x[2]+'">'+(x[2]==='google'?'VERIFY / RECONNECT':'CONNECT')+'</button></div>';});
    html+='</div><div class="approvalActions"><button class="approvalBack" id="guideBack">← Back to Campaign</button><button class="approvalVisual" id="guideVisual">View Visual Ads</button>';
    if(!approved)html+='<button class="approvalApprove" id="guideApprove" '+(visualReady()?'':'disabled')+'>✓ Approve This Ad Package</button>';
    html+='<a class="approvalConnect" href="/growth-marketing">Connections</a>';
    if(approved)html+='<button class="approvalAdvertise" id="guideAdvertise">Continue to Advertise →</button>';
    html+='</div><div class="notice '+(approved?'good':'warn')+'">'+(approved?'Your visual ad package is approved, but nothing has been published yet. You remain in control of the final launch.':'Nothing has been published. Review the actual graphics first, then approve.')+'</div>';
    body.innerHTML=html;
    [].slice.call(body.querySelectorAll('[data-kind="google"]')).forEach(function(b){b.onclick=function(){window.location.assign('/oauth/start');};});
    [].slice.call(body.querySelectorAll('[data-kind="meta"]')).forEach(function(b){b.onclick=facebookHelp;});
    var back=document.getElementById('guideBack');if(back)back.onclick=closeModal;
    var visual=document.getElementById('guideVisual');if(visual)visual.onclick=function(){closeModal();setTimeout(function(){var panel=document.getElementById('spinVisualPanel');if(panel)panel.scrollIntoView({behavior:'smooth',block:'start'});},80);};
    var a=document.getElementById('guideApprove');if(a&&!a.disabled)a.onclick=approve;
    var ad=document.getElementById('guideAdvertise');if(ad)ad.onclick=function(){alert('Campaign is approved. Choose a connected channel to launch. Nothing is published until you confirm the platform action.');};
    modal.classList.add('show');
  }

  ready(function(){
    addStyle();
    loadScript('/brand-context.js?v=3','spinBrandContextScript',function(){
      loadScript('/campaign-visual-preview.js?v=2','spinVisualPreviewScript',function(){
        loadScript('/campaign-preview-brand-fix.js?v=3','spinPreviewBrandFixScript');
      });
    });
    var preview=document.getElementById('preview'),advertise=document.getElementById('advertise');
    if(preview)preview.onclick=function(){render('preview');};
    if(advertise)advertise.onclick=function(){render(localStorage.getItem(APPROVED)?'approved':'preview');};
  });
})();