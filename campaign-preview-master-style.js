(function(){
  'use strict';

  var LOGO='/icon-192.png';
  var PHONE='614.570.9603';
  var ADDRESS='60 Rosehill Rd, Reynoldsburg, OH 43068';
  var REVIEWS='Nearly 300 5-star reviews';
  var timer=null;

  function pkg(){try{return window.packageData||packageData||null;}catch(e){return null;}}
  function goal(){var el=document.getElementById('goal');return el?el.value:'both';}
  function destination(){return goal()==='pud'?'https://www.spincyclecolumbus.com/pickup-and-delivery/':'https://www.spincyclecolumbus.com/wash-and-fold/';}
  function serviceTitle(){if(goal()==='pud')return 'PICKUP & DELIVERY';if(goal()==='wdf')return 'WASH • DRY • FOLD';return 'WASH • DRY • FOLD';}
  function serviceSub(){if(goal()==='pud')return 'Fast, convenient laundry service from Spin Cycle Laundromat.';if(goal()==='wdf')return 'Drop it off. We wash, dry and fold it for you.';return 'Drop it off — or schedule pickup and let us do the laundry.';}

  function variantText(p,index){
    if(index===0)return (p&&p.hook)||'Buy Back Hours of Your Week';
    if(index===1)return goal()==='pud'?'Free Pickup. Fresh Laundry. More Time.':'Laundry Done Right. Without Losing Your Day.';
    if(index===2)return 'Nearly 300 5-Star Reviews. Reynoldsburg Trusts Spin Cycle.';
    if(index===3)return goal()==='pud'?'We Pick It Up. We Wash It. We Bring It Back.':'Drop It Off. Pick It Up Fresh & Folded.';
    if(index===4)return goal()==='pud'?'FREE PICKUP & DELIVERY':'WASH & FOLD MADE EASY';
    return goal()==='pud'?'FREE PICKUP & DELIVERY':'LET US DO YOUR LAUNDRY';
  }

  function ctaText(p){return (p&&p.cta)||(goal()==='pud'?'Schedule Pickup Today':'Drop Off Today');}
  function offerText(p){var x=(p&&p.offer)||'';return x||REVIEWS;}

  function rounded(ctx,x,y,w,h,r,fill,stroke,sw){
    ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
    if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.lineWidth=sw||2;ctx.strokeStyle=stroke;ctx.stroke();}
  }

  function loadImage(src){return new Promise(function(resolve,reject){var i=new Image();i.onload=function(){resolve(i);};i.onerror=reject;i.src=src;});}
  function wrap(ctx,text,maxWidth){var words=String(text||'').split(/\s+/),lines=[],line='';for(var i=0;i<words.length;i++){var t=line?line+' '+words[i]:words[i];if(line&&ctx.measureText(t).width>maxWidth){lines.push(line);line=words[i];}else line=t;}if(line)lines.push(line);return lines;}
  function fitLines(ctx,text,maxWidth,maxLines,maxSize,minSize,weight){for(var s=maxSize;s>=minSize;s-=2){ctx.font=(weight||900)+' '+s+'px system-ui,Segoe UI,Arial';var lines=wrap(ctx,text,maxWidth);if(lines.length<=maxLines)return {size:s,lines:lines};}ctx.font=(weight||900)+' '+minSize+'px system-ui,Segoe UI,Arial';return {size:minSize,lines:wrap(ctx,text,maxWidth).slice(0,maxLines)};}
  function drawCenteredLines(ctx,lines,x,y,lineH){for(var i=0;i<lines.length;i++)ctx.fillText(lines[i],x,y+i*lineH);}

  function drawBubble(ctx,x,y,r){var g=ctx.createRadialGradient(x-r*.35,y-r*.35,r*.08,x,y,r);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.35,'rgba(98,190,255,.35)');g.addColorStop(.7,'rgba(0,129,255,.16)');g.addColorStop(1,'rgba(255,255,255,.02)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.lineWidth=Math.max(2,r*.06);ctx.strokeStyle='rgba(63,169,245,.35)';ctx.stroke();}

  function drawTowels(ctx,x,y,w,h){
    var colors=['#ffffff','#87e8ff','#19b7ee','#0a67d8','#ffffff'];var piece=h/5;
    for(var i=0;i<5;i++){var yy=y+i*piece*.78;rounded(ctx,x+(i%2)*8,yy,w-(i%2)*12,piece*.95,18,colors[i],'rgba(0,76,180,.18)',2);ctx.globalAlpha=.12;ctx.fillStyle='#0756ba';for(var j=0;j<5;j++)ctx.fillRect(x+18+j*22,yy+12,10,piece*.65);ctx.globalAlpha=1;}
  }

  function drawBag(ctx,x,y,w,h){
    var g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#0b3fb8');g.addColorStop(1,'#083184');rounded(ctx,x,y+28,w,h-28,32,g,'#14c9ff',5);ctx.strokeStyle='#0f4eb9';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(x+28,y+38);ctx.quadraticCurveTo(x+w/2,y-14,x+w-28,y+38);ctx.stroke();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='900 '+Math.round(w*.17)+'px system-ui,Segoe UI,Arial';ctx.fillText('SPIN',x+w/2,y+h*.56);ctx.font='800 '+Math.round(w*.10)+'px system-ui,Segoe UI,Arial';ctx.fillText('CYCLE',x+w/2,y+h*.68);ctx.textAlign='left';
  }

  function drawPin(ctx,x,y,r){ctx.fillStyle='#0878ff';ctx.beginPath();ctx.arc(x,y-r*.2,r*.62,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(x-r*.34,y+r*.1);ctx.lineTo(x,y+r*.75);ctx.lineTo(x+r*.34,y+r*.1);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y-r*.2,r*.22,0,Math.PI*2);ctx.fill();}
  function drawPhone(ctx,x,y,r){ctx.fillStyle='#0878ff';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=r*.18;ctx.lineCap='round';ctx.beginPath();ctx.arc(x,y,r*.48,.75,2.4);ctx.stroke();ctx.lineCap='butt';}

  async function drawAd(canvas,p,index,vertical,logo){
    var w=1080,h=vertical?1920:1080;canvas.width=w;canvas.height=h;var ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,w,h);
    var bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#ffffff');bg.addColorStop(.58,'#f8fdff');bg.addColorStop(1,'#dff5ff');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    ctx.fillStyle='rgba(255,255,255,.86)';ctx.fillRect(0,0,w,h);
    drawBubble(ctx,w*.08,h*.10,vertical?70:55);drawBubble(ctx,w*.91,h*.08,vertical?90:66);drawBubble(ctx,w*.14,h*.27,vertical?40:30);

    var topY=vertical?70:48,logoW=vertical?620:570,logoH=vertical?190:150;
    if(logo){var scale=Math.min(logoW/logo.width,logoH/logo.height);var dw=logo.width*scale,dh=logo.height*scale;ctx.drawImage(logo,(w-dw)/2,topY+(logoH-dh)/2,dw,dh);}

    var headline=variantText(p,index).toUpperCase();
    var bannerY=vertical?330:235,bannerH=vertical?430:310,bannerX=vertical?80:72,bannerW=w-bannerX*2;
    var band=ctx.createLinearGradient(bannerX,bannerY,bannerX+bannerW,bannerY+bannerH);band.addColorStop(0,'#063dbb');band.addColorStop(.52,'#0a67df');band.addColorStop(1,'#049de8');rounded(ctx,bannerX,bannerY,bannerW,bannerH,48,band,'#14c9ff',8);
    ctx.textAlign='center';ctx.fillStyle='#fff';var fit=fitLines(ctx,headline,bannerW-90,vertical?4:3,vertical?105:78,vertical?54:42,950);ctx.font='950 '+fit.size+'px system-ui,Segoe UI,Arial';var lineH=fit.size*1.04;var totalH=(fit.lines.length-1)*lineH;drawCenteredLines(ctx,fit.lines,w/2,bannerY+bannerH/2-totalH/2+fit.size*.34,lineH);

    ctx.fillStyle='#063dbb';ctx.font='950 '+(vertical?62:46)+'px system-ui,Segoe UI,Arial';ctx.fillText(serviceTitle(),w/2,vertical?845:600);
    ctx.font='800 '+(vertical?35:27)+'px system-ui,Segoe UI,Arial';ctx.fillStyle='#16358c';var sub=fitLines(ctx,serviceSub(),vertical?760:700,2,vertical?35:27,vertical?27:21,800);drawCenteredLines(ctx,sub.lines,w/2,vertical?905:648,(vertical?44:34));

    drawTowels(ctx,vertical?80:45,vertical?1030:700,vertical?300:255,vertical?330:250);
    drawBag(ctx,vertical?760:800,vertical?1020:695,vertical?250:215,vertical?350:275);

    var offer=offerText(p);var offerY=vertical?1110:720;rounded(ctx,w*.29,offerY,w*.42,vertical?88:70,35,'#e8f8ff','#11bff4',4);ctx.fillStyle='#0749b4';ctx.font='900 '+(vertical?30:24)+'px system-ui,Segoe UI,Arial';var of=fitLines(ctx,offer,w*.37,2,vertical?30:24,vertical?23:18,900);drawCenteredLines(ctx,of.lines,w/2,offerY+(vertical?52:43),(vertical?34:28));

    var ctaY=vertical?1325:840,ctaW=vertical?720:620,ctaH=vertical?150:110;var ctaX=(w-ctaW)/2;var cg=ctx.createLinearGradient(ctaX,ctaY,ctaX+ctaW,ctaY+ctaH);cg.addColorStop(0,'#2fd2f7');cg.addColorStop(1,'#0489ef');rounded(ctx,ctaX,ctaY,ctaW,ctaH,42,cg,'#6cecff',5);ctx.fillStyle='#fff';ctx.font='950 '+(vertical?48:37)+'px system-ui,Segoe UI,Arial';var ct=fitLines(ctx,String(ctaText(p)),ctaW-80,2,vertical?48:37,vertical?34:28,950);drawCenteredLines(ctx,ct.lines,w/2,ctaY+(vertical?86:65),(vertical?54:42));

    var trustY=vertical?1510:952,trustH=vertical?95:58;ctx.fillStyle='#083eab';ctx.font='900 '+(vertical?31:23)+'px system-ui,Segoe UI,Arial';ctx.fillText('★★★★★  '+REVIEWS,w/2,trustY+trustH*.62);

    var barY=vertical?1645:1008,barH=vertical?185:72;rounded(ctx,vertical?55:35,barY,w-(vertical?110:70),barH,36,'rgba(255,255,255,.96)','rgba(4,112,227,.16)',3);
    ctx.textAlign='left';drawPin(ctx,vertical?120:85,barY+barH/2,vertical?40:27);ctx.fillStyle='#10339b';ctx.font='900 '+(vertical?32:21)+'px system-ui,Segoe UI,Arial';ctx.fillText(ADDRESS,vertical?178:125,barY+barH*.60);
    drawPhone(ctx,vertical?720:690,barY+barH/2,vertical?40:27);ctx.font='950 '+(vertical?42:28)+'px system-ui,Segoe UI,Arial';ctx.fillText(PHONE,vertical?780:735,barY+barH*.62);

    ctx.textAlign='center';ctx.fillStyle='#3154a0';ctx.font='800 '+(vertical?20:14)+'px system-ui,Segoe UI,Arial';ctx.fillText(destination().replace('https://',''),w/2,vertical?1870:1070);ctx.textAlign='left';
  }

  async function apply(){
    if(window.spinCycleVisualReady!==true)return;
    var p=pkg(),panel=document.getElementById('spinVisualPanel');if(!p||!panel)return;
    var canvases=[].slice.call(panel.querySelectorAll('canvas'));if(!canvases.length)return;
    var signature=[goal(),p.hook,p.offer,p.cta,canvases.length].join('|');
    try{
      var logo=await loadImage(LOGO);
      for(var i=0;i<canvases.length;i++){
        if(canvases[i].dataset.masterStyle===signature+'|'+i)continue;
        await drawAd(canvases[i],p,i,canvases[i].height>canvases[i].width,logo);
        canvases[i].dataset.masterStyle=signature+'|'+i;
      }
    }catch(e){console.error('Spin Cycle master ad style failed',e);}
  }

  function schedule(){clearTimeout(timer);timer=setTimeout(function(){apply();},260);}
  function start(){
    schedule();
    if(window.MutationObserver)new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    ['generate','regenerate'].forEach(function(id){var b=document.getElementById(id);if(b)b.addEventListener('click',function(){setTimeout(schedule,650);});});
    setInterval(function(){if(window.spinCycleVisualReady===true)schedule();},1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
