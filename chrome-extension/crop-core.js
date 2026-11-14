/* DHL Image Studio — batch crop engine.
 * Coordinate system is normalized [0,1] in the ORIGINAL image.
 * No user images leave the device; no image dependencies.
 */
(function(global){
  'use strict';
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const ratios={'original':null,'1:1':1,'4:5':4/5,'3:4':3/4,'9:16':9/16,'16:9':16/9,'3:2':3/2,'2:3':2/3};
  const median=xs=>{xs.sort((a,b)=>a-b);return xs[Math.floor(xs.length/2)]};
  const dims=img=>[img.width||img.naturalWidth||img.displayWidth,img.height||img.naturalHeight||img.displayHeight];
  function fitRect(base,sw,sh,ratio,pad){
    const p=clamp(Number(pad)||0,0,30)/100;
    const left=clamp(base.x-base.w*p,0,1),top=clamp(base.y-base.h*p,0,1);
    const right=clamp(base.x+base.w*(1+p),0,1),bottom=clamp(base.y+base.h*(1+p),0,1);
    let w=right-left,h=bottom-top,cx=(left+right)/2,cy=(top+bottom)/2;
    if(ratio){
      const wanted=ratio*sh/sw;
      // Expand to contain the subject; only trim subject when impossible
      // to fit the aspect ratio inside original image.
      w=Math.max(w,h*wanted);h=w/wanted;
      if(h>1){h=1;w=h*wanted;}
      if(w>1){w=1;h=w/wanted;}
    }
    w=clamp(w,.04,1);h=clamp(h,.04,1);
    return {x:clamp(cx-w/2,0,1-w),y:clamp(cy-h/2,0,1-h),w,h};
  }
  function autoBounds(image,sensitivity){
    const [sw,sh]=dims(image);
    if(!sw||!sh)throw Error('Ảnh không có kích thước phù hợp');
    const scale=Math.min(1,240/Math.max(sw,sh));
    const w=Math.max(24,Math.round(sw*scale)),h=Math.max(24,Math.round(sh*scale));
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx)return {x:0,y:0,w:1,h:1,confidence:0};
    ctx.drawImage(image,0,0,w,h);
    const pixels=ctx.getImageData(0,0,w,h).data;
    canvas.width=0;canvas.height=0;
    const channels=[[],[],[]];
    // Median border colors make the detector robust against texture,
    // watermark text and small background highlights.
    const push=(x,y)=>{
      const i=(y*w+x)*4;
      if(pixels[i+3]<80)return;
      for(let z=0;z<3;z++)channels[z].push(pixels[i+z]);
    };
    for(let x=0;x<w;x+=Math.max(1,Math.floor(w/40))){push(x,0);push(x,h-1);push(x,Math.min(h-1,2));push(x,Math.max(0,h-3));}
    for(let y=0;y<h;y+=Math.max(1,Math.floor(h/40))){push(0,y);push(w-1,y);push(Math.min(w-1,2),y);push(Math.max(0,w-3),y);}
    if(channels[0].length<8)return {x:0,y:0,w:1,h:1,confidence:0};
    const bg=channels.map(median), n=w*h;
    const sens=clamp(Number(sensitivity)||50,0,100);
    const threshold=clamp(88-.65*sens,22,88);
    const mask=new Uint8Array(n);
    let total=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const k=y*w+x,i=k*4;
      const dr=pixels[i]-bg[0],dg=pixels[i+1]-bg[1],db=pixels[i+2]-bg[2];
      const distance=Math.sqrt((dr*dr+dg*dg+db*db)/3);
      // Ignore a small border margin to avoid a dark tabletop edge.
      if(x<w*.035||x>w*.965||y<h*.035||y>h*.965)continue;
      if(pixels[i+3]<70)continue;
      if(distance>=threshold){mask[k]=1;total++;}
    }
    if(total<n*.012||total>n*.82)return {x:0,y:0,w:1,h:1,confidence:0};
    // Connected foreground regions. Discard speckle noise; weigh center.
    const visited=new Uint8Array(n),components=[],stack=[];
    for(let i=0;i<n;i++){
      if(!mask[i]||visited[i])continue;
      visited[i]=1;stack.push(i);
      let area=0,minX=w,minY=h,maxX=0,maxY=0,sumX=0,sumY=0;
      while(stack.length){
        const k=stack.pop(),x=k%w,y=(k/w)|0;
        area++;sumX+=x;sumY+=y;
        if(x<minX)minX=x;if(x>maxX)maxX=x;
        if(y<minY)minY=y;if(y>maxY)maxY=y;
        for(const v of [x>0?k-1:-1,x<w-1?k+1:-1,y>0?k-w:-1,y<h-1?k+w:-1]){
          if(v>=0&&mask[v]&&!visited[v]){visited[v]=1;stack.push(v);}
        }
      }
      if(area>=Math.max(15,n*.003))components.push({area,minX,maxX,minY,maxY,cx:sumX/area,cy:sumY/area});
    }
    if(!components.length)return {x:0,y:0,w:1,h:1,confidence:0};
    components.sort((a,b)=>b.area-a.area);
    const primary=components[0];
    if(primary.area<n*.012)return {x:0,y:0,w:1,h:1,confidence:0};
    let x0=primary.minX,y0=primary.minY,x1=primary.maxX,y1=primary.maxY;
    for(const c of components.slice(1)){
      const closeX=c.maxX>x0-w*.07&&c.minX<x1+w*.07;
      const closeY=c.maxY>y0-h*.07&&c.minY<y1+h*.07;
      if(c.area>primary.area*.07&&closeX&&closeY){
        x0=Math.min(x0,c.minX);x1=Math.max(x1,c.maxX);
        y0=Math.min(y0,c.minY);y1=Math.max(y1,c.maxY);
      }
    }
    // Do not apply an aggressive crop when confidence is weak.
    const bw=(x1-x0+1)/w,bh=(y1-y0+1)/h;
    if(bw<.17||bh<.17||bw>.97||bh>.97)return {x:0,y:0,w:1,h:1,confidence:0};
    return {x:x0/w,y:y0/h,w:bw,h:bh,confidence:primary.area/n};
  }
  function plan(image,{cropRatio='1:1',cropPadding=7,cropSensitivity=50}={}){
    const [sw,sh]=dims(image);
    const bounds=autoBounds(image,cropSensitivity);
    return fitRect(bounds,sw,sh,ratios[cropRatio]||null,cropPadding);
  }
  function centered(image,{cropRatio='1:1'}={}){
    const [sw,sh]=dims(image),ratio=ratios[cropRatio];
    return fitRect({x:0,y:0,w:1,h:1},sw,sh,ratio,0);
  }
  function conform(rect,sw,sh,ratioString){
    const aspect=ratios[ratioString],r={...rect};
    if(!aspect)return fitRect(r,sw,sh,null,0);
    const want=aspect*sh/sw, cx=r.x+r.w/2,cy=r.y+r.h/2;
    let w=Math.min(1,Math.max(.08,r.w)),h=w/want;
    if(h>1){h=1;w=h*want;}
    return {x:clamp(cx-w/2,0,1-w),y:clamp(cy-h/2,0,1-h),w,h};
  }
  function move(rect,dx,dy){
    return {...rect,x:clamp(rect.x+dx,0,1-rect.w),y:clamp(rect.y+dy,0,1-rect.h)};
  }
  function zoom(rect,factor,sw,sh,ratio,anchor='center'){
    const newW=clamp(rect.w*factor,.09,1);
    const cx=rect.x+rect.w/2,cy=rect.y+rect.h/2;
    return conform({x:cx-newW/2,y:cy-(rect.h*factor)/2,w:newW,h:rect.h*factor},sw,sh,ratio);
  }
  global.DHLCrop={ratios,plan,centered,fitRect,conform,move,zoom,autoBounds};
})(typeof window!=='undefined'?window:globalThis);