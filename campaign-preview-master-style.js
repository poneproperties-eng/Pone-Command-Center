(function(){
  'use strict';

  var LOGO='/icon-192.png';
  var PHONE='614.570.9603';
  var ADDRESS='60 Rosehill Rd, Reynoldsburg, OH 43068';
  var REVIEWS='Nearly 300 5-star reviews';
  var timer=null;
  var applying=false;

  function pkg(){try{return window.packageData||packageData||null;}catch(e){return null;}}
  function goal(){var el=document.getElementById('goal');return el?el.value:'both';}
  function destination(){return goal()==='pud'?'https://www.spincyclecolumbus.com/pickup-and-delivery/':'https://www.spincyclecolumbus.com/wash-and-fold/';}
  function serviceTitle(){return goal()==='pud'?'PICKUP & DELIVERY':'WASH • DRY • FOLD';}
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

  function rounded(ctx,x,y,w,h,r,fill,stroke,sw){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.lineWidth=sw||2;ctx.strokeStyle=stroke;ctx.stroke();}}
  function loadImage(src){return new Promise(function(resolve,reject){var i=new Image();i.onload=function(){resolve(i);};i.onerror=reject;i.src=src;});}
  function wrap(ctx,text,maxWidth){var words=String(text||'').split(/\s+/),lines=[],line='';for(var i=0;i<words.length;i++){var t=line?line+' '+words[i]:words[i];if(line&&ctx.measureText(t).width>maxWidth){lines.push(line);line=words[i];}else line=t;}if(line)lines.push(line);return lines;}
  function fitLines(ctx,text,maxWidth,maxLines,maxSize,minSize,weight){for(var s=maxSize;s>=minSize;s-=2){ctx.font=(weight||900)+' '+s+'px system-ui,Segoe UI,Arial';var lines=wrap(ctx,text,maxWidth);if(lines.length<=maxLines)return {size:s,lines:lines};}ctx.font=(weight||900)+' '+minSize+'px system-ui,Segoe UI,Arial';return {size:minSize,lines:wrap(ctx,text,maxWidth).slice(0,maxLines)};}
  function drawCenteredLines(ctx,lines,x,y,lineH){for(var i=0;i<lines.length;i++)ctx.fillText(lines[i],x,y+i*lineH);}

  function drawBubble(ctx,x,y,r){var g=ctx.createRadialGradient(x-r*.35,y-r*.35,r*.08,x,y,r);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.35,'rgba(98,190,255,.32)');g.addColorStop(.72,'rgba(0,129,255,.12)');g.addColorStop(1,'rgba(255,255,255,.01)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.lineWidth=Math.max(2,r*.05);ctx.strokeStyle='rgba(63,169,245,.28)';ctx.stroke();}
  function drawTowels(ctx,x,y,w,h){var colors=['#ffffff','#aeeeff','#55d1f5','#198ee6','#0b58c7'];var ph=h/5;for(var i=0;i<5;i++){rounded(ctx,x+(i%2)*6,y+i*ph*.78,w-(i%2)*12,ph*.92,15,colors[i],'rgba(0,76,180,.14)',2);}}
  function drawBag(ctx,x,y,w,h){var g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#0b46c6');g.addColorStop(1,'#082d84');rounded(ctx,x,y+24,w,h-24,28,g,'#1bd1ff',4);ctx.strokeStyle='#0b4bb6';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x+26,y+34);ctx.quadraticCurveTo(x+w/2,y-10,x+w-26,y+34);ctx.stroke();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='900 '+Math.round(w*.16)+'px system-ui,Segoe UI,Arial';ctx.fillText('SPIN',x+w/2,y+h*.56);ctx.font='800 '+Math.round(w*.095)+'px system-ui,Segoe UI,Arial';ctx.fillText('CYCLE',x+w/2,y+h*.68);ctx.textAlign='left';}
  function drawPin(ctx,x,y,r){ctx.fillStyle='#0878ff';ctx.beginPath();ctx.arc(x,y-r*.18,r*.60,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(x-r*.32,y+r*.08);ctx.lineTo(x,y+r*.72);ctx.lineTo(x+r*.32,y+r*.08);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y-r*.18,r*.20,0,Math.PI*2);ctx.fill();}
  function drawPhone(ctx,x,y,r){ctx.fillStyle='#0878ff';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=r*.16;ctx.lineCap='round';ctx.beginPath();ctx.arc(x,y,r*.46,.75,2.4);ctx.stroke();ctx.lineCap='butt';}

  async function drawAd(canvas,p,index,vertical,logo){
    var w=1080,h=vertical?1920:1080;canvas.width=w;canvas.height=h;var ctx=canvas.getContext('2d');
    var bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#ffffff');bg.addColorStop(.62,'#fbfeff');bg.addColorStop(1,'#e5f7ff');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    drawBubble(ctx,w*.075,h*.095,vertical?66:54);drawBubble(ctx,w*.915,h*.085,vertical?84:64);

    var topY=vertical?74:46,logoW=vertical?670:620,logoH=vertical?210:170;
    if(logo){var scale=Math.min(logoW/logo.width,logoH/logo.height);var dw=logo.width*scale,dh=logo.height*scale;ctx.drawImage(logo,(w-dw)/2,topY+(logoH-dh)/2,dw,dh);}

    var headline=variantText(p,index).toUpperCase();
    var bannerX=vertical?88:72,bannerY=vertical?330:220,bannerW=w-bannerX*2,bannerH=vertical?400:300;
    var band=ctx.createLinearGradient(bannerX,bannerY,bannerX+bannerW,bannerY+bannerH);band.addColorStop(0,'#063fbe');band.addColorStop(.52,'#0a69df');band.addColorStop(1,'#24a8e9');rounded(ctx,bannerX,bannerY,bannerW,bannerH,48,band,'#19c9ff',8);
    ctx.textAlign='center';ctx.fillStyle='#fff';var fit=fitLines(ctx,headline,bannerW-100,vertical?4:3,vertical?104:76,vertical?52:40,950);ctx.font='950 '+fit.size+'px system-ui,Segoe UI,Arial';var lineH=fit.size*1.05,totalH=(fit.lines.length-1)*lineH;drawCenteredLines(ctx,fit.lines,w/2,bannerY+bannerH/2-totalH/2+fit.size*.34,lineH);

    var serviceY=vertical?790:565;ctx.fillStyle='#073baa';ctx.font='950 '+(vertical?62:45)+'px system-ui,Segoe UI,Arial';ctx.fillText(serviceTitle(),w/2,serviceY);
    ctx.font='800 '+(vertical?32:25)+'px system-ui,Segoe UI,Arial';ctx.fillStyle='#16358c';var sub=fitLines(ctx,serviceSub(),vertical?800:760,2,vertical?32:25,vertical?25:19,800);drawCenteredLines(ctx,sub.lines,w/2,serviceY+(vertical?62:47),(vertical?42:32));

    if(vertical){drawTowels(ctx,90,1010,270,310);drawBag(ctx,765,1000,225,325);}else{drawTowels(ctx,48,690,220,220);drawBag(ctx,820,682,180,238);}

    var offer=offerText(p);var offerW=vertical?560:520,offerH=vertical?105:78,offerX=(w-offerW)/2,offerY=vertical?1030:705;
    rounded(ctx,offerX,offerY,offerW,offerH,32,'#eefaff','#10bff3',4);ctx.fillStyle='#0749b4';var of=fitLines(ctx,offer,offerW-48,2,vertical?31:24,vertical?22:17,900);ctx.font='900 '+of.size+'px system-ui,Segoe UI,Arial';drawCenteredLines(ctx,of.lines,w/2,offerY+offerH/2-(of.lines.length-1)*(of.size*1.12)/2+of.size*.34,of.size*1.12);

    var ctaW=vertical?720:650,ctaH=vertical?138:98,ctaX=(w-ctaW)/2,ctaY=vertical?1375:830;var cg=ctx.createLinearGradient(ctaX,ctaY,ctaX+ctaW,ctaY+ctaH);cg.addColorStop(0,'#38d1f5');cg.addColorStop(1,'#078ce8');rounded(ctx,ctaX,ctaY,ctaW,ctaH,40,cg,'#74e7ff',5);ctx.fillStyle='#fff';var ct=fitLines(ctx,String(ctaText(p)),ctaW-70,2,vertical?48:36,vertical?34:27,950);ctx.font='950 '+ct.size+'px system-ui,Segoe UI,Arial';drawCenteredLines(ctx,ct.lines,w/2,ctaY+ctaH/2-(ct.lines.length-1)*(ct.size*1.08)/2+ct.size*.34,ct.size*1.08);

    var trustY=vertical?1550:944;ctx.fillStyle='#083eab';ctx.font='900 '+(vertical?30:22)+'px system-ui,Segoe UI,Arial';ctx.fillText('★★★★★  '+REVIEWS,w/2,trustY);

    var barX=vertical?62:42,barY=vertical?1640:975,barW=w-barX*2,barH=vertical?150:78;rounded(ctx,barX,barY,barW,barH,34,'rgba(255,255,255,.97)','rgba(4,112,227,.18)',3);
    ctx.textAlign='left';var mid=barX+barW*.58;
    drawPin(ctx,barX+(vertical?62:42),barY+barH/2,vertical?32:23);ctx.fillStyle='#10339b';ctx.font='900 '+(vertical?29:19)+'px system-ui,Segoe UI,Arial';ctx.fillText(ADDRESS,barX+(vertical?112:78),barY+barH*.60);
    ctx.strokeStyle='#47a9ee';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(mid,barY+18);ctx.lineTo(mid,barY+barH-18);ctx.stroke();
    drawPhone(ctx,mid+(vertical?62:42),barY+barH/2,vertical?32:23);ctx.fillStyle='#10339b';ctx.font='950 '+(vertical?36:24)+'px system-ui,Segoe UI,Arial';ctx.fillText(PHONE,mid+(vertical?112:78),barY+barH*.61);

    ctx.textAlign='center';ctx.fillStyle='#3154a0';ctx.font='800 '+(vertical?19:13)+'px system-ui,Segoe UI,Arial';ctx.fillText(destination().replace('https://',''),w/2,vertical?1855:1068);ctx.textAlign='left';
  }

  async function apply(){
    if(applying||window.spinCycleVisualReady!==true)return;
    var p=pkg(),panel=document.getElementById('spinVisualPanel');if(!p||!panel)return;
    var canvases=[].slice.call(panel.querySelectorAll('canvas'));if(!canvases.length)return;
    applying=true;
    try{
      var logo=await loadImage(LOGO);
      for(var i=0;i<canvases.length;i++)await drawAd(canvases[i],p,i,canvases[i].height>canvases[i].width,logo);
    }catch(e){console.error('Spin Cycle master ad style failed',e);}finally{applying=false;}
  }

  function schedule(delay){clearTimeout(timer);timer=setTimeout(function(){apply();},delay==null?320:delay);}
  function start(){
    schedule(500);
    if(window.MutationObserver)new MutationObserver(function(){schedule(450);}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    ['generate','regenerate'].forEach(function(id){var b=document.getElementById(id);if(b)b.addEventListener('click',function(){schedule(900);setTimeout(function(){schedule(0);},1700);});});
    setInterval(function(){if(window.spinCycleVisualReady===true)apply();},1600);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
