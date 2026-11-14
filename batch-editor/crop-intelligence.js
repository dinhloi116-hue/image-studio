/* DHL batch crop preflight — conservative, local heuristic.
 * No cloud upload, external AI model or false claims of semantic segmentation.
 */
(function(global){
  'use strict';
  const crop=global.DHLCrop;
  if(!crop)throw new Error('Load crop-core.js before crop-intelligence.js');
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  function intersection(a,b){
    const x=Math.max(a.x,b.x),y=Math.max(a.y,b.y);
    const w=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-x);
    const h=Math.max(0,Math.min(a.y+a.h,b.y+b.h)-y);
    const i=w*h,u=a.w*a.h+b.w*b.h-i;
    return u?i/u:0;
  }
  function closeToEdge(rect){
    return Math.min(rect.x,rect.y,1-rect.x-rect.w,1-rect.y-rect.h)<.025;
  }
  function analyze(image,options={}){
    const size=[image.width||image.naturalWidth||image.displayWidth,
      image.height||image.naturalHeight||image.displayHeight];
    if(!size[0]||!size[1])throw Error('Ảnh không hợp lệ');
    const ratio=options.cropRatio||'1:1';
    if(options.cropMode==='center'){
      return {rect:crop.centered(image,options),confidence:1,needsReview:false,
        reason:'Căn giữa (theo yêu cầu)',method:'center'};
    }
    const sens=clamp(Number(options.cropSensitivity)||50,10,90);
    const values=[clamp(sens-17,10,90),sens,clamp(sens+17,10,90)];
    const candidates=values.map(v=>crop.autoBounds(image,v));
    const valid=candidates.filter(x=>x.confidence>0&&x.w<.975&&x.h<.975);
    if(!valid.length){
      return {rect:crop.centered(image,options),confidence:0,needsReview:true,
        reason:'Nền khó phân biệt với sản phẩm — dùng khung giữa an toàn',method:'fallback'};
    }
    // Stable regions across three sensitivity settings are more dependable
    // than any single threshold on textured fabrics or table backgrounds.
    const middle=valid.find(x=>x===candidates[1])||valid[0];
    const agreement=valid.length>1?valid.reduce((a,b)=>a+intersection(middle,b),0)/valid.length:.38;
    const normalizedArea=middle.w*middle.h;
    const density=clamp(middle.confidence/(normalizedArea+.0001),0,1);
    let confidence=clamp(.48*agreement+.29*density+.23*Math.min(1,valid.length/3),0,1);
    if(closeToEdge(middle))confidence*=.78;
    if(normalizedArea>.85||normalizedArea<.045)confidence*=.7;
    const needsReview=confidence<.62;
    const [sw,sh]=size;
    // A low-confidence image gets no aggressive crop. The customer can
    // inspect this image in the review gallery instead of losing fabric edges.
    const candidate=needsReview?
      crop.centered(image,options):
      crop.fitRect(middle,sw,sh,crop.ratios[ratio]||null,options.cropPadding||0);
    const target=crop.ratios[ratio];
    const rect=candidate;
    const contains=rect.x<=middle.x+.025&&rect.y<=middle.y+.025 &&
      rect.x+rect.w>=middle.x+middle.w-.025 &&
      rect.y+rect.h>=middle.y+middle.h-.025;
    const status=needsReview?'Cần xem lại':contains?'Cắt ổn':'Kiểm tra mép áo';
    return {rect,confidence:Math.round(confidence*100)/100,
      needsReview:needsReview||!contains,
      reason:status,method:needsReview?'fallback':'detected',
      detection:middle,agreement:Math.round(agreement*100)/100};
  }
  crop.analyze=analyze;
  crop.smartPlan=(image,opts)=>analyze(image,opts).rect;
})(typeof window!=='undefined'?window:globalThis);