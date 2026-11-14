/* DHL Image Studio — independent caption/text overlay for batch photos.
 * Executes entirely in the browser, after the regular watermark.
 */
(function(global){
  'use strict';
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const FONTS={
    sans:'Arial, "Noto Sans", sans-serif',
    system:'system-ui, sans-serif',
    serif:'Georgia, "Times New Roman", serif',
    mono:'"DejaVu Sans Mono", monospace'
  };
  function expand(template,file,index,total){
    const name=(file?.name||'').replace(/\.[^.]+$/,'');
    return String(template||'').replace(/\{filename\}/gi,name)
      .replace(/\{index\}/gi,String(index+1).padStart(2,'0'))
      .replace(/\{total\}/gi,String(total));
  }
  function wrap(ctx,text,maxWidth){
    const out=[];
    for(const line of String(text).split(/\r?\n/).slice(0,6)){
      if(!line.trim()){out.push('');continue;}
      let current='';
      for(const word of line.trim().split(/\s+/)){
        if(ctx.measureText(word).width>maxWidth){
          if(current){out.push(current);current='';}
          let part='';
          for(const char of Array.from(word)){
            if(part && ctx.measureText(part+char).width>maxWidth){out.push(part);part=char;}
            else part+=char;
          }
          current=part;continue;
        }
        const test=current?current+' '+word:word;
        if(current&&ctx.measureText(test).width>maxWidth){out.push(current);current=word;}
        else current=test;
      }
      out.push(current);
      if(out.length>12)return out.slice(0,12);
    }
    return out.slice(0,12);
  }
  function position(p,w,h,bw,bh,margin,px,py){
    if(p==='custom'){
      const x=clamp(px/100*w,bw/2+margin,w-bw/2-margin),
            y=clamp(py/100*h,bh/2+margin,h-bh/2-margin);
      return {x,y};
    }
    const parts=String(p||'bottom-center').split('-');
    const vertical=parts[0],horizontal=parts[1]||'center';
    return {
      x:horizontal==='left'?margin+bw/2:horizontal==='right'?w-margin-bw/2:w/2,
      y:vertical==='top'?margin+bh/2:vertical==='middle'?h/2:h-margin-bh/2
    };
  }
  function draw(ctx,w,h,c,file,index,total){
    if(!c.textEnabled||!String(c.textContent||'').trim())return;
    const text=expand(c.textContent,file,index,total);
    if(!text.trim())return;
    ctx.save();
    try{
      const fontSize=clamp(Math.min(w,h)*clamp(Number(c.textSize)||4,1,15)/100,10,Math.min(w,h)*.17);
      const weight=c.textBold?'700':'400';
      ctx.font=weight+' '+Math.round(fontSize)+'px '+(FONTS[c.textFont]||FONTS.system);
      ctx.textBaseline='middle';ctx.textAlign='center';
      const margin=clamp(Math.min(w,h)*clamp(Number(c.textMargin)||5,0,20)/100,0,Math.min(w,h)*.2);
      const maxWidth=Math.max(30,w-2*margin-8);
      const lines=wrap(ctx,text,maxWidth);
      const lineHeight=Math.round(fontSize*1.26);
      const tw=Math.min(maxWidth,Math.max(1,...lines.map(line=>ctx.measureText(line).width)));
      const padding=fontSize*.46;
      const bw=tw+2*padding,bh=lines.length*lineHeight+2*padding;
      const {x,y}=position(c.textPosition,w,h,bw,bh,margin,Number(c.textX)||50,Number(c.textY)||50);
      const opacity=clamp(Number(c.textOpacity)||100,1,100)/100;
      ctx.globalAlpha=opacity;
      if(c.textBackground!=='none'){
        ctx.fillStyle=c.textBackground==='dark'?'rgba(0,0,0,.65)':'rgba(255,255,255,.8)';
        const rx=x-bw/2,ry=y-bh/2,r=Math.min(bw,bh)*.12;
        ctx.beginPath();
        if(typeof ctx.roundRect==='function')ctx.roundRect(rx,ry,bw,bh,r);
        else ctx.rect(rx,ry,bw,bh);
        ctx.fill();
      }
      const outline=clamp(Number(c.textOutline)||0,0,5);
      ctx.strokeStyle=c.textOutlineColor||'#000000';
      ctx.lineWidth=fontSize*outline/20;
      ctx.lineJoin='round';
      ctx.fillStyle=c.textColor||'#ffffff';
      for(let i=0;i<lines.length;i++){
        const ly=y+(i-(lines.length-1)/2)*lineHeight;
        if(outline>0&&ctx.lineWidth>0)ctx.strokeText(lines[i],x,ly,maxWidth);
        ctx.fillText(lines[i],x,ly,maxWidth);
      }
    }finally{ctx.restore();}
  }
  global.DHLText={draw,expand,wrap,position};
})(typeof window!=='undefined'?window:globalThis);