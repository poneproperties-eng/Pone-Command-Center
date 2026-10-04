(function(){
  'use strict';

  var BRAND={
    name:'Spin Cycle Laundromat',
    phone:'614.570.9603',
    reviewProof:'Nearly 300 5-star reviews',
    logo:'/icon-512.png',
    washFoldUrl:'https://www.spincyclecolumbus.com/wash-and-fold/',
    pickupDeliveryUrl:'https://www.spincyclecolumbus.com/pickup-and-delivery/',
    freePickup:true
  };

  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
  function getPkg(){try{return window.packageData||packageData||null;}catch(e){return null;}}
  function goal(){var g=document.getElementById('goal');return g?g.value:'both';}
  function destination(){return goal()==='pud'?BRAND.pickupDeliveryUrl:BRAND.washFoldUrl;}
  function serviceName(){if(goal()==='pud')return 'PICKUP & DELIVERY';if(goal()==='wdf')return 'WASH & FOLD';return 'WASH & FOLD + PICKUP';}
  function serviceSub(){if(goal()==='pud')return 'FREE PICKUP • WE DO THE LAUNDRY FOR YOU';if(goal()==='wdf')return 'DROP IT OFF • WE WASH, DRY & FOLD';return 'DROP IT OFF — OR WE’LL COME GET IT';}

  function addStyle(){
    if(document.getElementById('spinVisualPreviewStyle'))return;
    var s=document.createElement('style');s.id='spinVisualPreviewStyle';s.textContent='\
      .spinVisualPanel{margin:14px 0;background:#fff;border:2px solid #93c5fd;border-radius:18px;padding:16px;box-shadow:0 10px 30px #0c4a6e14}\
      .spinVisualHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;margin-bottom:12px}\
      .spinVisualHead h3{margin:0;font-size:22px;color:#0f3f66}.spinVisualHead p{margin:4px 0 0;color:#64748b;font-size:13px}\
      .spinReady{background:#dcfce7;color:#166534;border-radius:999px;padding:8px 11px;font-size:11px;font-weight:950}.spinNotReady{background:#fef3c7;color:#92400e}\
      .spinPreviewGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.spinPreviewCard{border:1px solid #dbeafe;border-radius:14px;padding:10px;background:#f8fbff}.spinPreviewCard h4{margin:0 0 8px;color:#164e7a}\
      .spinCanvasWrap{background:#dbeafe;border-radius:11px;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:220px}.spinCanvasWrap canvas{display:block;width:100%;height:auto;max-height:520px;object-fit:contain}\
      .spinPreviewMeta{font-size:11px;color:#64748b;margin-top:7px;word-break:break-all}.spinPreviewActions{display:flex;gap:7px;margin-top:8px}.spinPreviewActions button{flex:1;border:0;border-radius:9px;padding:9px 10px;font-weight:900;cursor:pointer;background:#075985;color:#fff}.spinPreviewActions button.secondary{background:#e0f2fe;color:#075985}\
      .spinApprovalRule{margin-top:12px;padding:10px 12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:11px;color:#164e7a;font-size:12px;font-weight:800}\
      @media(max-width:1000px){.spinPreviewGrid{grid-template-columns:1fr 1fr}}@media(max-width:650px){.spinPreviewGrid{grid-template-columns:1fr}}\
    ';document.head.appendChild(s);
  }

  function roundedRect(ctx,x,y,w,h,r,fill){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();ctx.fillStyle=fill;ctx.fill();}
  function wrap(ctx,text,maxWidth){
    var words=String(text||'').split(/\s+/),lines=[],line='';
    words.forEach(function(word){var test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word;}else line=test;});
    if(line)lines.push(line);return lines;
  }
  function drawWrapped(ctx,text,x,y,maxWidth,lineHeight,maxLines){var lines=wrap(ctx,text,maxWidth).slice(0,maxLines||99);lines.forEach(function(line,i){ctx.fillText(line,x,y+i*lineHeight);});return y+lines.length*lineHeight;}
  function loadImage(src){return new Promise(function(resolve,reject){var i=new Image();i.onload=function(){resolve(i);};i.onerror=reject;i.src=src;});}

  function variantText(p,index){
    var main=(p&&p.hook)||'Get your time back.';
    if(index===0)return main;
    if(index===1)return goal()==='pud'?'Free Pickup. Fresh Laundry. More Time.':'Laundry Done Right. Without Losing Your Day.';
    if(index===2)return BRAND.reviewProof+'. Local Laundry You Can Trust.';
    if(index===3)return goal()==='pud'?'We Pick It Up. We Wash It. We Bring It Back.':'Drop It Off. Pick It Up Fresh & Folded.';
    if(index===4)return serviceName()+' MADE EASY';
    return goal()==='pud'?'FREE PICKUP — SCHEDULE TODAY':'LET US DO YOUR LAUNDRY';
  }

  async function renderCanvas(canvas,p,index,vertical){
    var w=1080,h=vertical?1920:1080;canvas.width=w;canvas.height=h;var ctx=canvas.getContext('2d');
    var grad=ctx.createLinearGradient(0,0,w,h);grad.addColorStop(0,'#082f49');grad.addColorStop(.55,'#0369a1');grad.addColorStop(1,'#06b6d4');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);

    // Decorative bubbles / washer-door shapes.
    ctx.globalAlpha=.14;ctx.fillStyle='#ffffff';
    [[.82,.15,.17],[.12,.78,.2],[.88,.82,.1],[.18,.18,.08]].forEach(function(b){ctx.beginPath();ctx.arc(w*b[0],h*b[1],w*b[2],0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;

    var pad=vertical?78:66;
    try{var logo=await loadImage(BRAND.logo);var size=vertical?180:150;roundedRect(ctx,pad,pad,size,size,26,'#ffffff');ctx.drawImage(logo,pad+10,pad+10,size-20,size-20);}catch(e){}

    ctx.fillStyle='#ffffff';ctx.font='900 '+(vertical?56:46)+'px system-ui,Segoe UI,Arial';ctx.fillText('SPIN CYCLE',vertical?290:250,pad+(vertical?82:70));
    ctx.font='800 '+(vertical?30:24)+'px system-ui,Segoe UI,Arial';ctx.fillStyle='#bae6fd';ctx.fillText(serviceName(),vertical?290:250,pad+(vertical?132:112));

    var headline=variantText(p,index);ctx.fillStyle='#ffffff';ctx.font='950 '+(vertical?92:72)+'px system-ui,Segoe UI,Arial';var headY=vertical?470:360;headY=drawWrapped(ctx,headline,pad,headY,w-pad*2,vertical?108:84,4);

    var offer=(p&&p.offer)||'';if(goal()==='pud'&&BRAND.freePickup&&!/free pickup/i.test(offer))offer='FREE PICKUP • '+offer;
    if(offer){roundedRect(ctx,pad,headY+28,w-pad*2,vertical?150:120,24,'#ffffff');ctx.fillStyle='#075985';ctx.font='950 '+(vertical?46:38)+'px system-ui,Segoe UI,Arial';drawWrapped(ctx,offer,pad+28,headY+(vertical?118:103),w-pad*2-56,vertical?54:46,2);headY+=vertical?210:165;}

    ctx.fillStyle='#e0f2fe';ctx.font='800 '+(vertical?40:31)+'px system-ui,Segoe UI,Arial';drawWrapped(ctx,serviceSub(),pad,headY+35,w-pad*2,vertical?52:42,3);

    var proofY=vertical?h-520:h-330;roundedRect(ctx,pad,proofY,w-pad*2,vertical?170:130,22,'rgba(255,255,255,.13)');ctx.fillStyle='#ffffff';ctx.font='900 '+(vertical?38:30)+'px system-ui,Segoe UI,Arial';ctx.fillText('★★★★★  '+BRAND.reviewProof,pad+26,proofY+(vertical?68:55));ctx.font='800 '+(vertical?34:27)+'px system-ui,Segoe UI,Arial';ctx.fillText(BRAND.phone,pad+26,proofY+(vertical?125:100));

    var cta=(p&&p.cta)|| (goal()==='pud'?'Schedule Free Pickup':'Order Wash & Fold');var ctaY=vertical?h-290:h-165;roundedRect(ctx,pad,ctaY,w-pad*2,vertical?120:96,22,'#ffffff');ctx.fillStyle='#075985';ctx.font='950 '+(vertical?42:34)+'px system-ui,Segoe UI,Arial';ctx.textAlign='center';ctx.fillText(String(cta).toUpperCase(),w/2,ctaY+(vertical?76:61));ctx.textAlign='left';
    ctx.fillStyle='#e0f2fe';ctx.font='700 '+(vertical?22:18)+'px system-ui,Segoe UI,Arial';ctx.textAlign='center';ctx.fillText(destination().replace('https://',''),w/2,h-(vertical?75:38));ctx.textAlign='left';
  }

  function downloadCanvas(canvas,name){var a=document.createElement('a');a.download=name+'.png';a.href=canvas.toDataURL('image/png');document.body.appendChild(a);a.click();a.remove();}
  function openCanvas(canvas){var w=window.open('','_blank');if(!w)return;w.document.write('<title>Spin Cycle Ad Preview</title><style>body{margin:0;background:#111;display:grid;place-items:center;min-height:100vh}img{max-width:100%;max-height:100vh}</style><img src="'+canvas.toDataURL('image/png')+'">');w.document.close();}

  async function render(){
    addStyle();var p=getPkg();var pkg=document.getElementById('campaignPackage');if(!pkg||!p)return false;
    var panel=document.getElementById('spinVisualPanel');
    if(!panel){panel=document.createElement('section');panel.id='spinVisualPanel';panel.className='spinVisualPanel';pkg.insertBefore(panel,pkg.firstChild);}
    window.spinCycleVisualReady=false;
    panel.innerHTML='<div class="spinVisualHead"><div><h3>Visual Ad Preview — Review Before Approval</h3><p>These are the actual branded graphics you are approving. Click any preview to inspect it larger or download the PNG.</p></div><span class="spinReady spinNotReady" id="spinVisualStatus">RENDERING PREVIEWS…</span></div><div class="spinPreviewGrid" id="spinPreviewGrid"></div><div class="spinApprovalRule">Approval stays locked until all visual previews finish rendering.</div>';
    var grid=document.getElementById('spinPreviewGrid');
    var specs=[['Main Ad',false],['Variation 1',false],['Variation 2',false],['Variation 3',false],['Square Version',false],['Vertical Version',true]];
    try{
      for(var i=0;i<specs.length;i++){
        var card=document.createElement('div');card.className='spinPreviewCard';card.innerHTML='<h4>'+specs[i][0]+'</h4><div class="spinCanvasWrap"></div><div class="spinPreviewMeta">Destination: '+destination()+'</div><div class="spinPreviewActions"><button type="button" class="spinOpen">View Larger</button><button type="button" class="secondary spinDownload">Download PNG</button></div>';
        var canvas=document.createElement('canvas');card.querySelector('.spinCanvasWrap').appendChild(canvas);grid.appendChild(card);await renderCanvas(canvas,p,i,specs[i][1]);
        (function(c,n){card.querySelector('.spinOpen').onclick=function(){openCanvas(c);};card.querySelector('.spinDownload').onclick=function(){downloadCanvas(c,'Spin-Cycle-'+n.replace(/\s+/g,'-'));};})(canvas,specs[i][0]);
      }
      window.spinCycleVisualReady=true;window.SpinCycleAdPreview={render:render,ready:function(){return !!window.spinCycleVisualReady;},open:function(){var el=document.getElementById('spinVisualPanel');if(el)el.scrollIntoView({behavior:'smooth',block:'start'});}};
      var st=document.getElementById('spinVisualStatus');if(st){st.textContent='PREVIEWS READY';st.className='spinReady';}
      return true;
    }catch(e){var st2=document.getElementById('spinVisualStatus');if(st2){st2.textContent='PREVIEW ERROR — REGENERATE';st2.className='spinReady spinNotReady';}window.spinCycleVisualReady=false;return false;}
  }

  function hook(){
    ['generate','regenerate'].forEach(function(id){var b=document.getElementById(id);if(b)b.addEventListener('click',function(){setTimeout(render,120);});});
    var g=document.getElementById('goal');if(g)g.addEventListener('change',function(){if(getPkg())setTimeout(render,50);});
    var pkg=document.getElementById('campaignPackage');if(pkg&&window.MutationObserver)new MutationObserver(function(){if(pkg.classList.contains('show')&&getPkg()&&!window.spinCycleVisualReady)setTimeout(render,80);}).observe(pkg,{attributes:true,attributeFilter:['class']});
  }

  ready(function(){addStyle();hook();if(getPkg())setTimeout(render,80);});
})();