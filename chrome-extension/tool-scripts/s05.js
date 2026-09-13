/* ===== R16.3 tight crop quick tool ===== */
async function tightCropItemR163(item,{silent=false}={}){
  if(!item) return {changed:false,reason:'missing'};
  try{
    const src=item.processedUrl||item.origUrl;
    const img=await loadImage(src);
    const c=createCanvas(img.naturalWidth,img.naturalHeight);
    c.getContext('2d').drawImage(img,0,0);
    const b=getAlphaBounds(c);
    if(!b) return {changed:false,reason:'empty'};
    const s=settings();
    const out=cropAlpha(c,s.paddingXPx,s.paddingYPx);
    if(out.width===c.width && out.height===c.height){
      if(!silent) setStatus('Ảnh chưa có khoảng trong suốt để crop sát: '+item.name+' • Nếu ảnh còn nền, hãy Xử lý nền trước.');
      return {changed:false,reason:'opaque'};
    }
    const blob=await canvasToBlob(out,'image/png');
    if(!blob) throw new Error('Không tạo được PNG sau crop.');
    if(item.processedUrl) try{URL.revokeObjectURL(item.processedUrl)}catch(e){}
    item.processedBlob=blob;
    item.processedUrl=URL.createObjectURL(blob);
    item.processedW=out.width; item.processedH=out.height; item.processError='';
    return {changed:true,w:out.width,h:out.height};
  }catch(e){
    item.processError='Crop sát: '+String(e?.message||e);
    if(!silent) setStatus('Lỗi crop sát: '+item.name);
    return {changed:false,reason:'error',error:e};
  }
}
async function tightCropSelectedR163(){
  if(typeof batchRunning!=='undefined' && batchRunning){ alert('Đang xử lý ảnh. Hãy Dừng hoặc chờ batch hiện tại xong.'); return; }
  const list=state.items.filter(x=>x.selected);
  if(!list.length){ alert('Chưa chọn ảnh nào để crop sát.'); return; }
  const btn=document.getElementById('tightCropAllBtn');
  if(btn){btn.classList.add('busy');btn.textContent='Đang crop...';}
  let changed=0,skipped=0;
  try{
    for(let i=0;i<list.length;i++){
      setStatus(`Crop sát ${i+1}/${list.length}: ${list[i].name}`);
      const r=await tightCropItemR163(list[i],{silent:true});
      if(r.changed) changed++; else skipped++;
    }
    render(); updateCounts();
    setStatus(`Crop sát xong: ${changed} ảnh • bỏ qua ${skipped} ảnh không có mép trong suốt. • Lề hiện tại: ${settings().paddingXPx}px/${settings().paddingYPx}px`);
  }finally{
    if(btn){btn.classList.remove('busy');btn.textContent='✂ Crop sát';}
  }
}
const tightCropAllBtnR163=document.getElementById('tightCropAllBtn');
if(tightCropAllBtnR163) tightCropAllBtnR163.addEventListener('click',tightCropSelectedR163);
const galleryR163=document.getElementById('gallery');
if(galleryR163) galleryR163.addEventListener('click',async e=>{
  const btn=e.target.closest('.tight-crop-one'); if(!btn) return;
  const card=btn.closest('.card'); if(!card) return;
  const item=state.items.find(x=>String(x.id)===String(card.dataset.id)); if(!item) return;
  btn.classList.add('busy'); const old=btn.textContent; btn.textContent='Đang crop...';
  const r=await tightCropItemR163(item);
  if(r.changed){ render(); updateCounts(); setStatus(`Đã crop sát: ${item.name} → ${r.w}×${r.h}px`); }
  else { btn.classList.remove('busy'); btn.textContent=old; }
});
