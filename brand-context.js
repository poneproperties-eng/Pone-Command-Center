(function(){
  'use strict';

  var BRAND={
    name:'Spin Cycle Laundromat',
    phone:'614.570.9603',
    reviewProof:'Nearly 300 5-star reviews',
    reviewPosition:'Major local trust advantage',
    logo:'icon-192.png',
    washFoldUrl:'https://www.spincyclecolumbus.com/wash-and-fold/',
    pickupDeliveryUrl:'https://www.spincyclecolumbus.com/pickup-and-delivery/',
    freePickup:true
  };
  window.SPIN_CYCLE_BRAND=Object.freeze(BRAND);

  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
  function goal(){var g=document.getElementById('goal');return g?g.value:'both';}
  function destination(){return goal()==='pud'?BRAND.pickupDeliveryUrl:BRAND.washFoldUrl;}
  function serviceMessage(){
    if(goal()==='pud')return 'Free Pickup • Pickup & Delivery';
    if(goal()==='wdf')return 'Wash & Fold';
    return 'Wash & Fold + Free Pickup';
  }
  function appendOnce(el,text,key){
    if(!el||!text)return;
    var marker='spin-'+key;
    if(el.dataset&&el.dataset[marker])return;
    var current=(el.textContent||'').trim();
    if(current&&!current.includes(text))el.textContent=current+'\n\n'+text;
    else if(!current)el.textContent=text;
    if(el.dataset)el.dataset[marker]='1';
  }
  function addStyles(){
    if(document.getElementById('spinBrandContextStyle'))return;
    var s=document.createElement('style');s.id='spinBrandContextStyle';s.textContent='\
      .spinBrandProof{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px;padding:11px 13px;border:1px solid #93c5fd;background:#eff6ff;border-radius:13px;color:#0f3f66;font-weight:850}\
      .spinBrandProof img{width:38px;height:38px;object-fit:contain;background:#fff;border-radius:9px;padding:2px}\
      .spinBrandProof small{display:block;color:#64748b;font-weight:700;margin-top:2px}\
      .spinBrandAdStrip{display:flex;align-items:center;gap:9px;background:#ffffff18;border:1px solid #ffffff30;border-radius:12px;padding:9px 10px;margin-top:10px;font-size:12px;font-weight:850}\
      .spinBrandAdStrip img{width:30px;height:30px;border-radius:7px;background:#fff;padding:2px;object-fit:contain}\
      .spinDestination{margin-top:10px;padding:10px 12px;border-radius:11px;background:#f8fbff;border:1px solid #dbeafe;font-size:12px;color:#334155}\
      .spinDestination a{color:#075985;font-weight:900;word-break:break-all}\
    ';document.head.appendChild(s);
  }
  function installBrandCard(){
    if(document.getElementById('spinBrandProof'))return;
    var hero=document.querySelector('.hero');if(!hero)return;
    var card=document.createElement('div');card.id='spinBrandProof';card.className='spinBrandProof';
    card.innerHTML='<img src="'+BRAND.logo+'" alt="Spin Cycle"><div><b>'+BRAND.reviewProof+'</b> • '+BRAND.phone+'<small>Locked brand trust proof used by campaign recommendations and ad packages.</small></div>';
    hero.insertAdjacentElement('afterend',card);
  }
  function ensurePreviewStrip(){
    var preview=document.querySelector('.videoPreview');if(!preview)return;
    var strip=preview.querySelector('.spinBrandAdStrip');
    if(!strip){strip=document.createElement('div');strip.className='spinBrandAdStrip';preview.appendChild(strip);}
    strip.innerHTML='<img src="'+BRAND.logo+'" alt="Spin Cycle"><span>'+BRAND.reviewProof+' • '+BRAND.phone+' • '+serviceMessage()+'</span>';
  }
  function ensureDestination(){
    var pkg=document.getElementById('campaignPackage');if(!pkg)return;
    var box=document.getElementById('spinAdDestination');
    if(!box){box=document.createElement('div');box.id='spinAdDestination';box.className='spinDestination';pkg.insertBefore(box,pkg.firstChild);}
    box.innerHTML='<b>Ad destination:</b> <a href="'+destination()+'" target="_blank" rel="noopener">'+destination()+'</a><br><b>Brand proof:</b> '+BRAND.reviewProof+' • '+BRAND.phone+(goal()==='pud'?'<br><b>Pickup message:</b> Free Pickup':'');
  }
  function enhanceCopy(){
    var trust=BRAND.reviewProof+' • '+BRAND.phone;
    var service=goal()==='pud'?'Free Pickup available. ':'';
    var url=destination();
    ['metaCopy','organicMeta','tiktokCopy','organicTikTok','youtubeCopy','gbpCopy','landingCopy','landingPageCopy'].forEach(function(id){
      var el=document.getElementById(id);if(!el)return;
      appendOnce(el,service+trust+'\n'+url,id);
    });
    var cta=document.getElementById('previewCTA');
    if(cta&&!(cta.textContent||'').includes(BRAND.phone))cta.textContent=(cta.textContent||'').trim()+' • '+BRAND.phone;
  }
  function refresh(){addStyles();installBrandCard();ensurePreviewStrip();ensureDestination();enhanceCopy();}
  function hook(){
    var g=document.getElementById('goal');if(g)g.addEventListener('change',function(){setTimeout(refresh,0);});
    var gen=document.getElementById('generate');if(gen)gen.addEventListener('click',function(){setTimeout(refresh,50);});
    var regen=document.getElementById('regenerate');if(regen)regen.addEventListener('click',function(){setTimeout(refresh,50);});
    var pkg=document.getElementById('campaignPackage');
    if(pkg&&window.MutationObserver)new MutationObserver(function(){setTimeout(refresh,0);}).observe(pkg,{attributes:true,subtree:true,childList:true});
  }
  ready(function(){refresh();hook();});
})();
