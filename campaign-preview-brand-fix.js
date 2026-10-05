(function(){
  'use strict';

  var LOGO='/icon-192.png';
  var timer=null;

  function loadImage(src){
    return new Promise(function(resolve,reject){
      var img=new Image();
      img.onload=function(){resolve(img);};
      img.onerror=reject;
      img.src=src;
    });
  }

  function roundedRect(ctx,x,y,w,h,r,fill){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
    ctx.fillStyle=fill;
    ctx.fill();
  }

  function visibleBounds(img){
    try{
      var c=document.createElement('canvas');
      c.width=img.naturalWidth||img.width;
      c.height=img.naturalHeight||img.height;
      var x=c.getContext('2d');
      x.drawImage(img,0,0,c.width,c.height);
      var d=x.getImageData(0,0,c.width,c.height).data;
      var minX=c.width,minY=c.height,maxX=-1,maxY=-1;
      for(var yy=0;yy<c.height;yy++){
        for(var xx=0;xx<c.width;xx++){
          var n=(yy*c.width+xx)*4;
          var a=d[n+3],r=d[n],g=d[n+1],b=d[n+2];
          if(a>20&&(r<245||g<245||b<245)){
            if(xx<minX)minX=xx;if(xx>maxX)maxX=xx;
            if(yy<minY)minY=yy;if(yy>maxY)maxY=yy;
          }
        }
      }
      if(maxX<minX||maxY<minY)return {x:0,y:0,w:c.width,h:c.height};
      var mx=Math.max(2,Math.round((maxX-minX)*.02));
      var my=Math.max(2,Math.round((maxY-minY)*.03));
      return {
        x:Math.max(0,minX-mx),
        y:Math.max(0,minY-my),
        w:Math.min(c.width,maxX-minX+mx*2),
        h:Math.min(c.height,maxY-minY+my*2)
      };
    }catch(e){
      return {x:0,y:0,w:img.naturalWidth||img.width,h:img.naturalHeight||img.height};
    }
  }

  function drawLogo(ctx,img,x,y,w,h){
    var b=visibleBounds(img);
    roundedRect(ctx,x,y,w,h,24,'#ffffff');
    var scale=Math.min((w*.94)/b.w,(h*.90)/b.h);
    var dw=b.w*scale,dh=b.h*scale;
    var dx=x+(w-dw)/2,dy=y+(h-dh)/2;
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    ctx.drawImage(img,b.x,b.y,b.w,b.h,dx,dy,dw,dh);
  }

  async function patchCanvas(canvas,logo){
    if(!canvas||!canvas.width||!canvas.height)return;
    var ctx=canvas.getContext('2d');
    var vertical=canvas.height>canvas.width;
    var pad=vertical?78:66;
    var logoW=vertical?260:230;
    var logoH=vertical?180:150;

    // Logo-only patch. Reviews, phone, address and all other ad content are rendered once by the base preview renderer.
    drawLogo(ctx,logo,pad,pad,logoW,logoH);
  }

  async function patchAll(){
    var panel=document.getElementById('spinVisualPanel');
    if(!panel)return;
    var canvases=[].slice.call(panel.querySelectorAll('canvas'));
    if(!canvases.length)return;
    try{
      var logo=await loadImage(LOGO);
      for(var i=0;i<canvases.length;i++)await patchCanvas(canvases[i],logo);
    }catch(e){
      console.error('Spin Cycle preview brand fix could not load logo',e);
    }
  }

  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(patchAll,220);
  }

  function start(){
    schedule();
    if(window.MutationObserver){
      new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
    }
    ['generate','regenerate'].forEach(function(id){
      var b=document.getElementById(id);
      if(b)b.addEventListener('click',function(){setTimeout(patchAll,500);});
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
