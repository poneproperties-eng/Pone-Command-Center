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
  function drawCenteredLines(ctx,lines,x,y,lineH){ctx.textAlign='center';for(var i=0;i<lines.length;i++)ctx.fillText(lines[i],x,y+i*lineH);}

  function visibleBounds(img){try{var c=document.createElement('canvas');c.width=img.naturalWidth||img.width;c.height=img.naturalHeight||img.height;var x=c.getContext('2d');x.drawImage(img,0,0,c.width,c.height);var d=x.getImageData(0,0,c.width,c.height).data,minX=c.width,minY=c.height,maxX=-1,maxY=-1;for(var yy=0;yy<c.height;yy++)for(var xx=0;xx<c.width;xx++){var n=(yy*c.width+xx)*4,a=d[n+3],r=d[n],g=d[n+1],b=d[n+2];if(a>20&&(r<248||g<248||b<248)){if(xx<minX)minX=xx;if(xx>maxX)maxX=xx;if(yy<minY)minY=yy;if(yy>maxY)maxY=yy;}}if(maxX<minX||maxY<minY)return{x:0,y:0,w:c.width,h:c.height};var px=Math.max(2,Math.round((maxX-minX)*.02)),py=Math.max(2,Math.round((maxY-minY)*.03));return{x:Math.max(0,minX-px),y:Math.max(0,minY-py),w:Math.min(c.width,maxX-minX+px*2),h:Math.min(c.height,maxY-minY+py*2)};}catch(e){return{x:0,y:0,w:img.width,h:img.height};}}
  function drawLogo(ctx,img,x,y,w,h){var b=visibleBounds(img),scale=Math.min(w/b.w,h/b.h),dw=b.w*scale,dh=b.h*scale;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(img,b.x,b.y,b.w,b.h,x+(w-dw)/2,y+(h-dh)/2,dw,dh);}
  function drawBubble(ctx,x,y,r){var g=ctx.createRadialGradient(x-r*.35,y-r*.35,r*.08,x,y,r);g.addColorStop(0,'rgba(255,255,255,.96)');g.addColorStop(.36,'rgba(98,190,255,.30)');g.addColorStop(.72,'rgba(0,129,255,.11)');g.addColorStop(1,'rgba(255,255,255,.01)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.lineWidth=Math.max(2,r*.05);ctx.strokeStyle='rgba(63,169,245,.26)';ctx.stroke();}
  function drawTowels(ctx,x,y,w,h){var colors=['#ffffff','#b8f0ff','#68dcf9','#269ee9','#1158c6'];var ph=h/5;for(var i=0;i<5;i++)rounded(ctx,x+(i%2)*6,y+i*ph*.78,w-(i%2)*12,ph*.92,15,colors[i],'rgba(0,76,180,.13)',2);}
  function drawBag(ctx,x,y,w,h){var g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#0b46c6');g.addColorStop(1,'#082d84');rounded(ctx,x,y+24,w,h-24,28,g,'#1bd1ff',4);ctx.strokeStyle='#0b4bb6';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x+26,y+34);ctx.quadraticCurveTo(x+w/2,y-10,x+w-26,y+34);ctx.stroke();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='900 '+Math.round(w*.16)+'px system-ui,Segoe UI,Arial';ctx.fillText('SPIN',x+w/2,y+h*.56);ctx.font='800 '+Math.round(w*.095)+'px system-ui,Segoe UI,Arial';ctx.fillText('CYCLE',x+w/2,y+h*.68);}
  function drawPin(ctx,x,y,r){ctx.fillStyle='#0878ff';ctx.beginPath();ctx.arc(x,y-r*.18,r*.60,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(x-r*.32,y+r*.08);ctx.lineTo(x,y+r*.72);ctx.lineTo(x+r*.32,y+r*.08);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y-r*.18,r*.20,0,Math.PI*2);ctx.fill();}
  function drawPhone(ctx,x,y,r){ctx.fillStyle='#0878ff';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=r*.16;ctx.lineCap='round';ctx.beginPath();ctx.arc(x,y,r*.46,.75,2.4);ctx.stroke();ctx.lineCap='butt';}

  async function drawAd(canvas,p,index,vertical,logo){
    var w=1080,h=vertical?1920:1080;canvas.width=w;canvas.height=h;var ctx=canvas.getContext('2d');
    var bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#ffffff');bg.addColorStop(.66,'#fbfeff');bg.addColorStop(1,'#e5f7ff');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    drawBubble(ctx,w*.075,vertical?150:90,vertical?72:55);drawBubble(ctx,w*.92,vertical?135:82,vertical?92:68);

    var z=vertical?{
      logo:[160,50,760,240],banner:[85,320,910,390],serviceY:785,subY:845,
      offer:[210,965,660,105],towels:[95,1125,260,210],bag:[785,1115,205,220],
      cta:[170,1380,740,130],trustY:1570,bar:[65,1635,950,145],urlY:1860
    }:{
      logo:[185,34,710,175],banner:[70,215,940,290],serviceY:575,subY:622,
      offer:[190,650,700,72],towels:[65,755,175,95],bag:[840,750,150,100],
      cta:[250,885,580,78],trustY:980,bar:[42,1000,996,60],urlY:1072
    };

    if(logo)drawLogo(ctx,logo,z.logo[0],z.logo[1],z.logo[2],z.logo[3]);

    var headline=variantText(p,index).toUpperCase(),bx=z.banner[0],by=z.banner[1],bw=z.banner[2],bh=z.banner[3];
    var band=ctx.createLinearGradient(bx,by,bx+bw,by+bh);band.addColorStop(0,'#063fbe');band.addColorStop(.52,'#0a69df');band.addColorStop(1,'#24a8e9');rounded(ctx,bx,by,bw,bh,48,band,'#19c9ff',8);
    ctx.fillStyle='#fff';var hf=fitLines(ctx,headline,bw-100,vertical?4:3,vertical?104:76,vertical?50:40,950);ctx.font='950 '+hf.size+'px system-ui,Segoe UI,Arial';var hl=hf.size*1.05,hh=(hf.lines.length-1)*hl;drawCenteredLines(ctx,hf.lines,w/2,by+bh/2-hh/2+hf.size*.34,hl);

    ctx.fillStyle='#073baa';ctx.textAlign='center';ctx.font='950 '+(vertical?60:44)+'px system-ui,Segoe UI,Arial';ctx.fillText(serviceTitle(),w/2,z.serviceY);
    ctx.fillStyle='#16358c';var sf=fitLines(ctx,serviceSub(),vertical?790:770,2,vertical?31:24,vertical?24:18,800);ctx.font='800 '+sf.size+'px system-ui,Segoe UI,Arial';drawCenteredLines(ctx,sf.lines,w/2,z.subY,sf.size*1.22);

    var ox=z.offer[0],oy=z.offer[1],ow=z.offer[2],oh=z.offer[3],offer=offerText(p);rounded(ctx,ox,oy,ow,oh,30,'#eefaff','#10bff3',4);ctx.fillStyle='#0749b4';var of=fitLines(ctx,offer,ow-54,2,vertical?30:23,vertical?21:16,900);ctx.font='900 '+of.size+'px system-ui,Segoe UI,Arial';var ol=of.size*1.12,ot=(of.lines.length-1)*ol;drawCenteredLines(ctx,of.lines,w/2,oy+oh/2-ot/2+of.size*.34,ol);

    drawTowels(ctx,z.towels[0],z.towels[1],z.towels[2],z.towels[3]);
    drawBag(ctx,z.bag[0],z.bag[1],z.bag[2],z.bag[3]);

    var cx=z.cta[0],cy=z.cta[1],cw=z.cta[2],ch=z.cta[3],cg=ctx.createLinearGradient(cx,cy,cx+cw,cy+ch);cg.addColorStop(0,'#38d1f5');cg.addColorStop(1,'#078ce8');rounded(ctx,cx,cy,cw,ch,38,cg,'#74e7ff',5);ctx.fillStyle='#fff';var cf=fitLines(ctx,String(ctaText(p)),cw-70,2,vertical?48:34,vertical?33:25,950);ctx.font='950 '+cf.size+'px system-ui,Segoe UI,Arial';var cl=cf.size*1.08,ct=(cf.lines.length-1)*cl;drawCenteredLines(ctx,cf.lines,w/2,cy+ch/2-ct/2+cf.size*.34,cl);

    ctx.fillStyle='#083eab';ctx.textAlign='center';ctx.font='900 '+(vertical?30:20)+'px system-ui,Segoe UI,Arial';ctx.fillText('★★★★★  '+REVIEWS,w/2,z.trustY);

    var barX=z.bar[0],barY=z.bar[1],barW=z.bar[2],barH=z.bar[3];rounded(ctx,barX,barY,barW,barH,30,'rgba(255,255,255,.98)','rgba(4,112,227,.18)',3);ctx.textAlign='left';var mid=barX+barW*.58;
    drawPin(ctx,barX+(vertical?62:38),barY+barH/2,vertical?32:19);ctx.fillStyle='#10339b';ctx.font='900 '+(vertical?29:17)+'px system-ui,Segoe UI,Arial';ctx.fillText(ADDRESS,barX+(vertical?112:70),barY+barH*.61);
    ctx.strokeStyle='#47a9ee';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(mid,barY+12);ctx.lineTo(mid,barY+barH-12);ctx.stroke();
    drawPhone(ctx,mid+(vertical?62:38),barY+barH/2,vertical?32:19);ctx.fillStyle='#10339b';ctx.font='950 '+(vertical?36:22)+'px system-ui,Segoe UI,Arial';ctx.fillText(PHONE,mid+(vertical?112:70),barY+barH*.62);

    ctx.textAlign='center';ctx.fillStyle='#3154a0';ctx.font='800 '+(vertical?19:12)+'px system-ui,Segoe UI,Arial';ctx.fillText(destination().replace('https://',''),w/2,z.urlY);ctx.textAlign='left';
  }

  async function apply(){if(applying||window.spinCycleVisualReady!==true)return;var p=pkg(),panel=document.getElementById('spinVisualPanel');if(!p||!panel)return;var canvases=[].slice.call(panel.querySelectorAll('canvas'));if(!canvases.length)return;applying=true;try{var logo=await loadImage(LOGO);for(var i=0;i<canvases.length;i++)await drawAd(canvases[i],p,i,canvases[i].height>canvases[i].width,logo);}catch(e){console.error('Spin Cycle master ad style failed',e);}finally{applying=false;}}
  function schedule(delay){clearTimeout(timer);timer=setTimeout(function(){apply();},delay==null?320:delay);}
  function start(){schedule(500);if(window.MutationObserver)new MutationObserver(function(){schedule(450);}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});['generate','regenerate'].forEach(function(id){var b=document.getElementById(id);if(b)b.addEventListener('click',function(){schedule(900);setTimeout(function(){schedule(0);},1700);});});setInterval(function(){if(window.spinCycleVisualReady===true)apply();},1600);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();