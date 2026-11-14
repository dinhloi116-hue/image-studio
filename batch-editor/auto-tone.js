/* DHL Image Studio local adaptive tone analysis.
 * Analyze each original/cropped photo, classify lighting and choose a restrained
 * correction. This is tone mapping, not recovery of clipped sensor information.
 */
(function(global){
'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function dimensions(img){return [img.width||img.naturalWidth||img.displayWidth,img.height||img.naturalHeight||img.displayHeight]}
function analyze(img,rect){
  const [sw,sh]=dimensions(img);if(!sw||!sh)throw Error('Không đọc được kích thước ảnh');
  const b=rect||{x:0,y:0,w:1,h:1};
  const srcW=Math.max(1,Math.round(b.w*sw)),srcH=Math.max(1,Math.round(b.h*sh));
  const scale=Math.min(1,320/Math.max(srcW,srcH));
  const w=Math.max(20,Math.round(srcW*scale)),h=Math.max(20,Math.round(srcH*scale));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  try{
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(img,b.x*sw,b.y*sh,srcW,srcH,0,0,w,h);
    const d=ctx.getImageData(0,0,w,h).data,hist=new Uint32Array(256);
    let total=0,nearlyWhite=0,whiteClipped=0,shadows=0;
    for(let i=0;i<d.length;i+=4){
      if(d[i+3]<80)continue;
      const r=d[i],g=d[i+1],b=d[i+2],y=Math.round(.2126*r+.7152*g+.0722*b);
      hist[y]++;total++;
      if(y>=233&&Math.min(r,g,b)>205)nearlyWhite++;
      if(y>=249&&Math.min(r,g,b)>232)whiteClipped++;
      if(y<45)shadows++;
    }
    if(!total)throw Error('Ảnh trống');
    const percentile=p=>{
      const target=total*p;let sum=0;
      for(let i=0;i<256;i++){sum+=hist[i];if(sum>=target)return i;}return 255;
    };
    const p10=percentile(.10),p50=percentile(.50),
      p85=percentile(.85),p95=percentile(.95),p99=percentile(.99);
    const brightFrac=nearlyWhite/total,clipFrac=whiteClipped/total,shadowFrac=shadows/total;
    const overbright=(p95>=240&&p50>135&&(brightFrac>.055||p85>224))||
      (p99>251&&brightFrac>.1);
    const dark=p50<85&&(p85<172||shadowFrac>.28);
    const scene=overbright?'overbright':dark?'dark':'balanced';
    return {scene,p10,p50,p85,p95,p99,brightFrac,clipFrac,shadowFrac};
  }finally{canvas.width=0;canvas.height=0;}
}
function adaptiveConfig(base,a){
  if(!base.autoTone)return {...base,
    highlightRecover:Number(base.toneHighlights)||0,
    shadowLift:Number(base.toneShadows)||0,
    clarity:Number(base.toneClarity)||0};
  const scene=a?.scene||'balanced';
  const bright=scene==='overbright',dark=scene==='dark';
  return {...base,
    // Override the old fixed 'vivid' controls. Otherwise a +EV
    // shop preset can re-burn an already overexposed white jersey.
    exposure:bright?-.01:dark?.11:0,
    brightness:bright?0:dark?4:1,
    contrast:bright?2:dark?5:5,
    vibrance:bright?5:dark?8:8,
    sharpness:bright?16:dark?17:18,
    highlightRecover:(Number(base.toneHighlights)||0)*(bright?1:dark?.24:.46),
    shadowLift:(Number(base.toneShadows)||0)*(dark?1:bright?.28:.54),
    clarity:Number(base.toneClarity)||0,
    lightScene:scene};
}
function label(a){
  if(!a)return 'Chưa phân tích';
  const n=Math.round(a.brightFrac*100);
  if(a.scene==='overbright')return 'Ảnh sáng gắt · vùng trắng rất sáng '+n+'% · đang nén highlight';
  if(a.scene==='dark')return 'Ảnh tối · nâng shadow vừa đủ, giữ màu vải';
  return 'Ánh sáng cân bằng · tăng rõ chi tiết, hạn chế cháy vùng trắng';
}
global.DHLAutoTone={analyze,adaptiveConfig,label};
})(typeof window!=='undefined'?window:globalThis);