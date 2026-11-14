/* DHL Image Studio - reusable, purely local image overlay geometry.
 * Each layer is stored in normalized output-image coordinates. Multiple layers
 * can reuse a single decoded image asset without copying pixel data.
 */
(function(global){
  'use strict';
  const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
  const ratio=asset=>{
    const image=asset?.image||asset;
    const w=image?.width||image?.naturalWidth||image?.displayWidth||1;
    const h=image?.height||image?.naturalHeight||image?.displayHeight||1;
    return h/Math.max(1,w);
  };
  const rect=(layer,asset,width,height)=>{
    const w=clamp(Number(layer.width)||.35,.04,1.8)*width;
    const h=w*ratio(asset);
    const x=clamp(Number(layer.x)??.5,-1,2)*width;
    const y=clamp(Number(layer.y)??.5,-1,2)*height;
    const angle=(Number(layer.rotation)||0)*Math.PI/180;
    return {x,y,w,h,angle};
  };
  function corners(layer,asset,width,height){
    const a=rect(layer,asset,width,height),cos=Math.cos(a.angle),sin=Math.sin(a.angle);
    return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sy])=>({
      x:a.x+sx*a.w/2*cos-sy*a.h/2*sin,
      y:a.y+sx*a.w/2*sin+sy*a.h/2*cos
    }));
  }
  function rotateHandle(layer,asset,width,height){
    const a=rect(layer,asset,width,height);
    const local={x:0,y:-a.h/2-Math.max(20,Math.min(width,height)*.048)};
    return {x:a.x+local.x*Math.cos(a.angle)-local.y*Math.sin(a.angle),
      y:a.y+local.x*Math.sin(a.angle)+local.y*Math.cos(a.angle)};
  }
  function pointInside(layer,asset,p,width,height){
    const a=rect(layer,asset,width,height),dx=p.x-a.x,dy=p.y-a.y;
    const lx=dx*Math.cos(a.angle)+dy*Math.sin(a.angle);
    const ly=-dx*Math.sin(a.angle)+dy*Math.cos(a.angle);
    return Math.abs(lx)<=a.w/2&&Math.abs(ly)<=a.h/2;
  }
  function hit(layers,assets,p,width,height,screenScale=1){
    const tolerance=14/Math.max(.2,screenScale);
    for(let i=layers.length-1;i>=0;i--){
      const layer=layers[i],asset=assets.get(layer.assetId);
      if(!asset||layer.hidden)continue;
      if(rotateHandle&&layer.id){
        const ro=rotateHandle(layer,asset,width,height);
        if(Math.hypot(p.x-ro.x,p.y-ro.y)<=tolerance*1.4)
          return {layer,mode:'rotate'};
      }
      for(const corner of corners(layer,asset,width,height))
        if(Math.hypot(p.x-corner.x,p.y-corner.y)<=tolerance*1.4)
          return {layer,mode:'resize'};
      if(pointInside(layer,asset,p,width,height))return {layer,mode:'move'};
    }
    return null;
  }
  function draw(ctx,width,height,layers,assets){
    for(const layer of layers){
      const asset=assets.get(layer.assetId);
      const img=asset?.image||asset;
      if(!img||layer.hidden)continue;
      const a=rect(layer,asset,width,height);
      ctx.save();
      try{
        ctx.globalAlpha=clamp(Number(layer.opacity)??1,0,1);
        ctx.translate(a.x,a.y);
        ctx.rotate(a.angle);
        ctx.imageSmoothingEnabled=true;
        ctx.imageSmoothingQuality='high';
        ctx.drawImage(img,-a.w/2,-a.h/2,a.w,a.h);
      }finally{ctx.restore();}
    }
  }
  function guides(ctx,width,height,layer,asset){
    ctx.clearRect(0,0,width,height);
    if(!layer||!asset)return;
    const cs=corners(layer,asset,width,height);
    const ro=rotateHandle(layer,asset,width,height);
    ctx.strokeStyle='#b586ff';ctx.lineWidth=Math.max(2,width*.0028);
    ctx.setLineDash?.([8,5]);ctx.beginPath();ctx.moveTo(cs[0].x,cs[0].y);
    for(const p of cs.slice(1))ctx.lineTo(p.x,p.y);
    ctx.closePath();ctx.stroke();ctx.setLineDash?.([]);
    const midpoint={x:(cs[0].x+cs[1].x)/2,y:(cs[0].y+cs[1].y)/2};
    ctx.beginPath();ctx.moveTo(midpoint.x,midpoint.y);ctx.lineTo(ro.x,ro.y);ctx.stroke();
    const rr=Math.max(7,Math.min(width,height)*.009);
    ctx.lineWidth=2;ctx.fillStyle='#ffffff';ctx.strokeStyle='#7c3aed';
    for(const p of [...cs,ro]){
      ctx.beginPath();ctx.arc(p.x,p.y,rr,0,Math.PI*2);ctx.fill();ctx.stroke();
    }
  }
  function make(assetId,id,asset,at={x:.5,y:.5}){
    const r=ratio(asset);
    const width=clamp(.42/Math.max(1,r),.16,.52);
    return {id,assetId,x:at.x,y:at.y,width,rotation:0,opacity:1,hidden:false};
  }
  function duplicate(layer,id,step=.035){
    return {...layer,id,x:clamp(layer.x+step,.025,.975),y:clamp(layer.y+step,.025,.975)};
  }
  global.DHLImageOverlay={draw,guides,rect,corners,hit,make,duplicate,clamp};
})(typeof window!=='undefined'?window:globalThis);