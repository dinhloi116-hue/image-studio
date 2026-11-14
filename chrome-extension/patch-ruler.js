/* DHL Image Studio: ruler-aware square crop for patch product photos.
 * Detects green cutting mat, warm patch, vertical left ruler, horizontal bottom
 * ruler and a visually distinct full-width caption strip near the bottom.
 * Runs locally; conservative warnings on low confidence. No OCR or cloud model.
 */
(function(global){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const median=values=>{const v=values.slice().sort((a,b)=>a-b);return v[Math.floor(v.length/2)]||0};
function dims(img){return [img.width||img.naturalWidth||img.displayWidth,img.height||img.naturalHeight||img.displayHeight]}
function sample(img){
  const [w,h]=dims(img);
  if(!w||!h)throw Error('Ảnh không có kích thước hợp lệ');
  const scale=Math.min(1,660/Math.max(w,h));
  const sw=Math.max(32,Math.round(w*scale)),sh=Math.max(32,Math.round(h*scale));
  const canvas=document.createElement('canvas');
  canvas.width=sw;canvas.height=sh;
  try{
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx)throw Error('Trình duyệt không hỗ trợ đọc pixel để crop');
    ctx.drawImage(img,0,0,sw,sh);
    return {pix:ctx.getImageData(0,0,sw,sh).data,w:sw,h:sh,sourceW:w,sourceH:h};
  }finally{canvas.width=0;canvas.height=0;}
}
function color(im,x,y){
  const i=(clamp(Math.round(y),0,im.h-1)*im.w+clamp(Math.round(x),0,im.w-1))*4;
  return [im.pix[i],im.pix[i+1],im.pix[i+2]];
}
function distance(a,b){
  const x=a[0]-b[0],y=a[1]-b[1],z=a[2]-b[2];
  return Math.sqrt((x*x+y*y+z*z)/3);
}
function isMat(rgb){
  return rgb[1]>rgb[0]+43&&rgb[2]>rgb[0]+24&&rgb[1]>70;
}
function isRuler(rgb){
  const [r,g,b]=rgb;
  return r>25&&r<235&&Math.abs(r-g)<31&&Math.abs(g-b)<33&&Math.abs(r-b)<34;
}
function detectCaption(im){
  const w=im.w,h=im.h;
  const corners=[color(im,w*.025,h*.96),color(im,w*.965,h*.96),
    color(im,w*.025,h*.985),color(im,w*.965,h*.985)];
  const bg=[0,1,2].map(i=>median(corners.map(c=>c[i])));
  const compare=color(im,w*.96,h*.63);
  // A distinct light bottom stripe is required; never cut a plain mat.
  if(bg[0]<115||distance(bg,compare)<43)return {top:h,found:false};
  let top=h,miss=0,matched=0;
  for(let y=h-3;y>h*.68;y--){
    const left=color(im,w*.026,y),right=color(im,w*.965,y);
    const same=distance(left,bg)<38&&distance(right,bg)<38;
    if(same){top=y;matched++;miss=0;}
    else if(++miss>Math.max(4,Math.round(h*.008)))break;
  }
  if(matched<h*.055)return {top:h,found:false};
  return {top:clamp(top-1,0,h),found:true};
}
function detectLeftRuler(im,captionTop){
  const candidates=[],w=im.w,h=im.h;
  for(const yFrac of [.37,.53,.65,.73]){
    const y=Math.round(Math.min(captionTop-15,h*.86)*yFrac/.86);
    let found=-1,count=0;
    for(let x=2;x<Math.round(w*.35);x++){
      if(isMat(color(im,x,y))){count++;if(count>=5){found=x-4;break;}}
      else count=0;
    }
    if(found>Math.max(6,w*.045)&&found<w*.25 &&
      isRuler(color(im,Math.max(2,found*.42),y)))candidates.push(found);
  }
  if(candidates.length<2)return {found:false,right:0};
  return {found:true,right:median(candidates)};
}
function detectBottomRuler(im,captionTop,left){
  const w=im.w,h=im.h;
  let count=0;
  for(let y=Math.round(captionTop*.57);y<captionTop-3;y++){
    let valid=0,usable=0;
    for(let j=0;j<15;j++){
      const x=Math.round(Math.max(w*.36,left.right+w*.09)+(w*.965-Math.max(w*.36,left.right+w*.09))*(j/14));
      const rgb=color(im,x,y);
      usable++;
      if(isRuler(rgb))valid++;
    }
    if(valid>=usable*.73){count++;if(count>=5)return {found:true,top:y-4};}
    else count=0;
  }
  return {found:false,top:captionTop};
}
function detectSubject(im,topLimit,leftRight){
  const w=im.w,h=im.h,area=w*h;
  const mask=new Uint8Array(area),d=im.pix;
  const xmin=Math.round(Math.max(w*.065,leftRight+w*.018)), ymax=Math.round(topLimit);
  for(let y=Math.round(h*.07);y<ymax;y++){
    for(let x=xmin;x<w*.97;x++){
      const i=(y*w+x)*4,r=d[i],g=d[i+1],b=d[i+2];
      const warm=r>140&&g>78&&r>g*.75&&r>b+8;
      const cream=r>190&&g>162&&b>155&&r>=b+10;
      if(d[i+3]>90&&(warm||cream))mask[y*w+x]=1;
    }
  }
  // Dilate by 2 px to join embroidered outlines but not grid lines.
  const expanded=new Uint8Array(area);
  for(let y=2;y<h-2;y++){
    for(let x=2;x<w-2;x++){
      const i=y*w+x;
      if(!mask[i])continue;
      for(let yy=-2;yy<=2;yy++)for(let xx=-2;xx<=2;xx++)expanded[i+yy*w+xx]=1;
    }
  }
  const visited=new Uint8Array(area),stack=[],groups=[];
  for(let y=Math.round(h*.07);y<ymax;y++){
    for(let x=xmin;x<w*.97;x++){
      const start=y*w+x;
      if(!expanded[start]||visited[start])continue;
      visited[start]=1;stack.push(start);
      let count=0,x0=w,y0=h,x1=0,y1=0;
      while(stack.length){
        const i=stack.pop(),px=i%w,py=(i/w)|0;
        count++;x0=Math.min(x0,px);x1=Math.max(x1,px);
        y0=Math.min(y0,py);y1=Math.max(y1,py);
        for(const j of [px>0?i-1:-1,px<w-1?i+1:-1,py>0?i-w:-1,py<h-1?i+w:-1]){
          if(j>=0&&expanded[j]&&!visited[j]){visited[j]=1;stack.push(j);}
        }
      }
      const bw=x1-x0+1,bh=y1-y0+1;
      if(count>area*.002&&bw>w*.055&&bh>h*.075 &&
        bw<w*.84&&bh<h*.85)groups.push({count,x0,y0,x1,y1,bw,bh});
    }
  }
  groups.sort((a,b)=>b.count-a.count);
  return groups[0]||null;
}
function analyze(img,opts={}){
  const im=sample(img),w=im.w,h=im.h;
  const caption=opts.cropPatchRemoveCaption===false?{top:h,found:false}:detectCaption(im);
  const left=detectLeftRuler(im,caption.top),bottom=detectBottomRuler(im,caption.top,left);
  const subject=detectSubject(im,bottom.found?bottom.top-2:caption.top-3,left.right);
  const wantLeft=opts.cropPatchKeepLeft!==false,wantBottom=opts.cropPatchKeepBottom!==false;
  if(!subject){
    return {rect:{x:0,y:0,w:1,h:1,padAspect:1},
      confidence:0,needsReview:true,method:'patch-fallback',
      reason:'Chưa xác định được patch, giữ trọn ảnh để chỉnh tay',
      features:{caption:caption.found,left:left.found,bottom:bottom.found}};
  }
  const cx=(subject.x0+subject.x1)/2,cy=(subject.y0+subject.y1)/2;
  const keepLeft=left.found&&wantLeft,keepBottom=bottom.found&&wantBottom;
  // Calibrated against patch reference with a teal mat and two rulers:
  // patch ≈ 54% of square height; ruler visible ≈ 16% on left/bottom.
  let side=Math.max(subject.bh/(keepBottom?.54:.68),subject.bw/(keepLeft?.40:.65));
  if(keepLeft)side=Math.max(side,(cx-left.right)/.30);
  if(keepBottom)side=Math.max(side,(bottom.top-cy)/.34);
  const available=Math.min(w,caption.top-(caption.found?Math.max(2,h*.006):0));
  side=clamp(side,Math.max(subject.bw,subject.bh)*1.05,Math.max(1,available));
  let x=keepLeft?left.right-side*.16:cx-side/2;
  let y=keepBottom?bottom.top-side*.84:cy-side/2;
  const capBottom=caption.found?caption.top-Math.max(2,h*.008):h;
  x=clamp(x,0,w-side);y=clamp(y,0,Math.max(0,capBottom-side));
  // Avoid cutting the subject if strong ruler constraints compete.
  x=clamp(x,Math.max(0,subject.x1+3-side),Math.min(subject.x0-3,w-side));
  y=clamp(y,Math.max(0,subject.y1+3-side),Math.min(subject.y0-3,capBottom-side));
  const rect={x:x/w,y:y/h,w:side/w,h:side/h};
  const clipped=subject.x0<x+1||subject.x1>x+side-1||subject.y0<y+1||subject.y1>y+side-1;
  const missing=(wantLeft&&!left.found)||(wantBottom&&!bottom.found);
  const room=side>0?Math.min((cx-x)/side,(x+side-cx)/side,(cy-y)/side,(y+side-cy)/side):0;
  const needsReview=missing||clipped||room<.17;
  const confidence=clamp(.45+.20*(left.found?1:0)+.20*(bottom.found?1:0)+
    .10*(caption.found?1:0)-.3*(clipped?1:0),0,1);
  return {rect,confidence,needsReview,method:'patch-ruler',
    reason:needsReview?'Kiểm tra khung patch/thước':'Patch + thước: cắt vuông',
    features:{caption:caption.found,left:left.found,bottom:bottom.found},
    patch:{x:subject.x0/w,y:subject.y0/h,w:subject.bw/w,h:subject.bh/h}};
}
global.DHLPatchCrop={analyze};
})(typeof window!=='undefined'?window:globalThis);