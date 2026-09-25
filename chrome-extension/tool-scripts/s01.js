const state = { items: [] };

const CONFIG={feedbackZalo:'0963.898.871',feedbackApiUrl:'PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE'};
const LANGS={
vi:{choose:'+ Chọn ảnh',quick:'Xử lý nhanh',all:'Xử lý tất cả',zip:'Tải hàng loạt',ready:'Sẵn sàng.'},
en:{choose:'+ Choose images',quick:'Quick process',all:'Process all',zip:'Batch download',ready:'Ready.'},
zh:{choose:'+ 选择图片',quick:'快速处理',all:'全部处理',zip:'批量下载',ready:'Ready.'},
ja:{choose:'+ 画像を選択',quick:'クイック処理',all:'すべて処理',zip:'一括保存',ready:'Ready.'},
ko:{choose:'+ 이미지 선택',quick:'빠른 처리',all:'전체 처리',zip:'일괄 다운로드',ready:'Ready.'},
th:{choose:'+ เลือกรูป',quick:'ประมวลผลเร็ว',all:'ประมวลผลทั้งหมด',zip:'ดาวน์โหลดหลายไฟล์',ready:'Ready.'},
id:{choose:'+ Pilih gambar',quick:'Proses cepat',all:'Proses semua',zip:'Unduh massal',ready:'Ready.'},
es:{choose:'+ Elegir imágenes',quick:'Proceso rápido',all:'Procesar todo',zip:'Descarga masiva',ready:'Ready.'},
fr:{choose:'+ Choisir images',quick:'Traitement rapide',all:'Tout traiter',zip:'Téléchargement groupé',ready:'Ready.'}
}
function storageGet(k,d=null){try{const v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}}
function storageSet(k,v){try{localStorage.setItem(k,v);return true}catch(e){return false}}
function storageRemove(k){try{localStorage.removeItem(k);return true}catch(e){return false}}
function getLang(){return storageGet('pip_lang','vi')||'vi'}
function tr(k,vars={}){let s=(LANGS[getLang()]||LANGS.vi)[k]||LANGS.vi[k]||k;for(const [a,b] of Object.entries(vars))s=s.replace(`{${a}}`,b);return s}
/* ===== Bản không đăng nhập / không giới hạn ===== */
function consumeUse(){ return true; }
function applyLang(){const l=getLang();const map={pickBtn:'choose',quickAllBtn:'quick',processAllBtn:'all',downloadAllBtn:'zip',statusText:'ready'};for(const [id,k] of Object.entries(map)){const n=document.getElementById(id);if(n)n.textContent=tr(k)}const sel=document.getElementById('langSelect');if(sel)sel.value=l}

const el = {
  pickBtn: document.getElementById('pickBtn'), fileInput: document.getElementById('fileInput'), processAllBtn: document.getElementById('processAllBtn'), processSelectedBtn: document.getElementById('processSelectedBtn'), downloadAllBtn: document.getElementById('downloadAllBtn'), clearBtn: document.getElementById('clearBtn'), gallery: document.getElementById('gallery'), dropzone: document.getElementById('dropzone'), dropPickBtn: document.getElementById('dropPickBtn'), countAll: document.getElementById('countAll'), countProcessed: document.getElementById('countProcessed'), statusText: document.getElementById('statusText'), optRemoveBg: document.getElementById('optRemoveBg'), removeMode: document.getElementById('removeMode'), bgThreshold: document.getElementById('bgThreshold'), bgThresholdVal: document.getElementById('bgThresholdVal'), scanKeep: document.getElementById('scanKeep'), optDefringe: document.getElementById('optDefringe'), defringePx: document.getElementById('defringePx'), trimAlphaPx: document.getElementById('trimAlphaPx'), optCrop: document.getElementById('optCrop'), paddingXPx: document.getElementById('paddingXPx'), paddingYPx: document.getElementById('paddingYPx'), paddingPx: document.getElementById('paddingPx'), cropPadXQuick: document.getElementById('cropPadXQuick'), cropPadYQuick: document.getElementById('cropPadYQuick'), cropPadLive: document.getElementById('cropPadLive'), optSharpen: document.getElementById('optSharpen'), sharpenStrength: document.getElementById('sharpenStrength'), sharpenStrengthVal: document.getElementById('sharpenStrengthVal'), copyFirstColorsBtn: document.getElementById('copyFirstColorsBtn'), resetSettingsBtn: document.getElementById('resetSettingsBtn'), quickAllBtn: document.getElementById('quickAllBtn'), openFeedbackBtn: document.getElementById('openFeedbackBtn'), feedbackType: document.getElementById('feedbackType'), feedbackLevel: document.getElementById('feedbackLevel'), feedbackText: document.getElementById('feedbackText'), openGmailFeedbackBtn: document.getElementById('openGmailFeedbackBtn'), feedbackImageName: document.getElementById('feedbackImageName'), feedbackContact: document.getElementById('feedbackContact'), sendFeedbackBtn: document.getElementById('sendFeedbackBtn'), saveFeedbackBtn: document.getElementById('saveFeedbackBtn'), copyFeedbackBtn: document.getElementById('copyFeedbackBtn'), downloadFeedbackBtn: document.getElementById('downloadFeedbackBtn'), feedbackStatus: document.getElementById('feedbackStatus'), langSelect: document.getElementById('langSelect'), gmailInput: document.getElementById('gmailInput'), gmailLoginBtn: document.getElementById('gmailLoginBtn'), gmailLogoutBtn: document.getElementById('gmailLogoutBtn'), accountStatus: document.getElementById('accountStatus'), accountEmailText: document.getElementById('accountEmailText'), licenseInput: document.getElementById('licenseInput'), activateBtn: document.getElementById('activateBtn'), buyBtn: document.getElementById('buyBtn'), purchaseModal: document.getElementById('purchaseModal'), closePurchase: document.getElementById('closePurchase'), copyDeviceBtn: document.getElementById('copyDeviceBtn'), copyDeviceBtn2: document.getElementById('copyDeviceBtn2'), orderCodeText: document.getElementById('orderCodeText'), orderEmailText: document.getElementById('orderEmailText'), transferContentText: document.getElementById('transferContentText'), copyOrderBtn: document.getElementById('copyOrderBtn'), copyOrderEmailBtn: document.getElementById('copyOrderEmailBtn'), copyTransferBtn: document.getElementById('copyTransferBtn'), payVietnamBtn: document.getElementById('payVietnamBtn'), payInternationalBtn: document.getElementById('payInternationalBtn'), openIntlPayBtn: document.getElementById('openIntlPayBtn'), outputSize: document.getElementById('outputSize'), customSizeRow: document.getElementById('customSizeRow'), customW: document.getElementById('customW'), customH: document.getElementById('customH'), outputBgMode: document.getElementById('outputBgMode'), customBgColor: document.getElementById('customBgColor'), maxFileSizeMb: document.getElementById('maxFileSizeMb'), strokeMode: document.getElementById('strokeMode'), strokePx: document.getElementById('strokePx'), strokeColor: document.getElementById('strokeColor'), shadowMode: document.getElementById('shadowMode'), renameOn: document.getElementById('renameOn'), renamePrefix: document.getElementById('renamePrefix'), renameStart: document.getElementById('renameStart'), renameZipName: document.getElementById('renameZipName'), lightbox: document.getElementById('lightbox'), lightboxImg: document.getElementById('lightboxImg'), lightboxTitle: document.getElementById('lightboxTitle'), lightboxBody: document.getElementById('lightboxBody'), zoomInBtn: document.getElementById('zoomInBtn'), zoomOutBtn: document.getElementById('zoomOutBtn'), zoomResetBtn: document.getElementById('zoomResetBtn'), closeLightbox: document.getElementById('closeLightbox')
};
const uid = ()=>Math.random().toString(36).slice(2,10);
const sleep = ms=>new Promise(r=>setTimeout(r,ms));
function safeSetText(node, value){ if(node) node.textContent=value; }
function safeSetHtml(node, value){ if(node) node.innerHTML=value; }

/* v28_negative_defringe_marker */
function describeDefringeMode(v){ v=Number(v||0); if(v>0) return `Làm sạch viền: +${v}px`; if(v<0) return `Ăn viền nền: ${v}px`; return `Không làm sạch/ăn viền`; }
let toastTimer=0;
function setStatus(t){
  try{
    const n = (typeof el!=='undefined' && el && el.statusText) ? el.statusText : document.getElementById('statusText');
    if(n) n.textContent=t; else console.log('STATUS:', t);
    if(/Hoàn tất|Đã |Xong:|Lỗi|Đã tải/.test(String(t))){const box=document.getElementById('toolToast');if(box){box.textContent=t;box.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.classList.remove('show'),2200)}}
  }catch(err){ console.log('STATUS:', t); }
}

function cropToolEnabled(){ return storageGet('pip_showFreeCrop','0')==='1'; }
function refreshOptionalCropButtons(){
  const enabled=cropToolEnabled();
  const cb=document.getElementById('toggleFreeCrop');
  if(cb) cb.checked=enabled;
  document.querySelectorAll('.crop-free-one').forEach(btn=>btn.classList.toggle('hidden',!enabled));
}

function updateCounts(){
  safeSetText(el.countAll, state.items.length);
  safeSetText(el.countProcessed, state.items.filter(x=>x.processedBlob).length);
  safeSetText(document.getElementById('countFailed'), state.items.filter(x=>x.processError).length);
  const sc=document.getElementById('selectedCountText'); if(sc) sc.textContent=state.items.filter(x=>x.selected).length+' ảnh đang chọn';
  const ds=document.getElementById('dockStat'); if(ds) ds.textContent=state.items.length+' ảnh • '+state.items.filter(x=>x.processedBlob).length+' đã xử lý';
}
function humanSize(bytes){ const u=['B','KB','MB','GB']; let n=bytes||0,i=0; while(n>=1024&&i<u.length-1){n/=1024;i++;} return `${n.toFixed(n<10&&i>0?1:0)} ${u[i]}`; }
function safeName(name){ return (name||'image').replace(/[\/:*?"<>|]+/g,'_'); }
function itemFromCard(card){
  if(!card) return null;
  return state.items.find(x=>String(x.id)===String(card.dataset.id));
}

function filenameProcessed(item,index=0){ if(el.renameOn&&el.renameOn.checked){ const start=+el.renameStart.value||1; const num=String(start+index).padStart(2,'0'); return safeName(`${el.renamePrefix.value||'image'}-${num}.png`); } const name=typeof item==='string'?item:item.name; const dot=name.lastIndexOf('.'); const base=dot>-1?name.slice(0,dot):name; return safeName(`${base}_done.png`); }
function safeRevoke(url){ try{ if(url) URL.revokeObjectURL(url); }catch(e){} }
function triggerDownload(blob,name){ const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),2000); }
async function downloadFilesBatch(files,onProgress){
  files=dedupeArchiveNames((files||[]).filter(f=>f&&f.blob));
  if(!files.length) throw new Error('Không có file để tải.');
  const report=(msg)=>{try{onProgress&&onProgress(msg)}catch(e){}};
  if(window.showDirectoryPicker && window.isSecureContext){
    try{
      const dir=await window.showDirectoryPicker({mode:'readwrite'});
      for(let i=0;i<files.length;i++){
        const f=files[i]; report(`Đang lưu ${i+1}/${files.length}: ${f.name}`);
        const handle=await dir.getFileHandle(f.name,{create:true});
        const writable=await handle.createWritable();
        await writable.write(f.blob); await writable.close();
      }
      report(`Đã lưu ${files.length} file riêng.`);
      return {mode:'folder',count:files.length};
    }catch(e){
      if(e && e.name==='AbortError') throw e;
      console.warn('Không dùng được chọn thư mục, chuyển sang tải tuần tự.',e);
    }
  }
  for(let i=0;i<files.length;i++){
    const f=files[i]; report(`Đang tải ${i+1}/${files.length}: ${f.name}`);
    triggerDownload(f.blob,f.name);
    await new Promise(r=>setTimeout(r,260));
  }
  report(`Đã gửi ${files.length} file để tải.`);
  return {mode:'downloads',count:files.length};
}

function loadImage(url){ return new Promise((resolve,reject)=>{ const img=new Image(); img.onload=()=>resolve(img); img.onerror=()=>reject(new Error('Không đọc được ảnh này')); img.src=url; }); }
async function addFiles(fileList){ const files=Array.from(fileList||[]).filter(f=>/^image\/(png|jpeg|webp)$/.test(f.type)||/\.(png|jpe?g|webp)$/i.test(f.name)); if(!files.length){ alert('Chưa chọn đúng file ảnh PNG/JPG/WEBP.'); return; } setStatus(`Đang nạp ${files.length} ảnh...`); let ok=0; for(const file of files){ let url=''; try{ url=URL.createObjectURL(file); const img=await loadImage(url); state.items.push({ id:uid(), file, name:file.name, origUrl:url, origW:img.naturalWidth, origH:img.naturalHeight, selected:true, processedBlob:null, processedUrl:null, processedW:null, processedH:null, scannedColors:[] }); ok++; }catch(e){ safeRevoke(url); console.error(e); } } 
render(); setStatus(`Đã nạp ${ok}/${files.length} ảnh.`); }
function cleanup(item){ if(!item)return; safeRevoke(item.origUrl); safeRevoke(item.processedUrl); item.origUrl=''; item.processedUrl=''; }
function colorDistSq(r,g,b,c){ const dr=r-c[0], dg=g-c[1], db=b-c[2]; return dr*dr+dg*dg+db*db; }
function uniqueColors(colors, distance=28){ const out=[]; for(const c of colors){ let dup=false; for(const e of out){ if(Math.sqrt(colorDistSq(c[0],c[1],c[2],e)) < distance){ dup=true; break; } } if(!dup) out.push(c); } return out; }
const lightboxZoom={scale:2.2,x:0,y:0,drag:false,sx:0,sy:0,ox:0,oy:0};
function applyLightboxTransform(){
  if(!el.lightboxImg)return;
  el.lightboxImg.style.transform=`translate(${lightboxZoom.x}px, ${lightboxZoom.y}px) scale(${lightboxZoom.scale})`;
}
function resetLightboxZoom(scale=2.2){
  lightboxZoom.scale=scale; lightboxZoom.x=0; lightboxZoom.y=0; applyLightboxTransform();
}
function changeLightboxZoom(delta,centered=true){
  const old=lightboxZoom.scale;
  lightboxZoom.scale=Math.max(.5,Math.min(8,lightboxZoom.scale+delta));
  if(centered && old!==0){
    const ratio=lightboxZoom.scale/old;
    lightboxZoom.x*=ratio; lightboxZoom.y*=ratio;
  }
  applyLightboxTransform();
}
function openLightbox(src,title){
  el.lightboxImg.src=src;
  el.lightboxTitle.textContent=title+'  •  kéo chuột để xem vùng ảnh';
  el.lightbox.classList.remove('hidden');
  setTimeout(()=>resetLightboxZoom(2.2),30);
}
function closeLightbox(){ el.lightbox.classList.add('hidden'); el.lightboxImg.src=''; }
function itemMatchesGalleryFilter(item){
 const q=(document.getElementById('gallerySearch')?.value||'').trim().toLowerCase(); const f=document.getElementById('galleryFilter')?.value||'all';
 if(q && !String(item.name||'').toLowerCase().includes(q)) return false;
 if(f==='pending' && item.processedBlob) return false; if(f==='done' && !item.processedBlob) return false; if(f==='error' && !item.processError) return false; if(f==='selected' && !item.selected) return false; return true;
}
function refreshGalleryVisibleCount(){const n=state.items.filter(itemMatchesGalleryFilter).length; const t=document.getElementById('galleryVisibleText'); if(t)t.textContent=n+' ảnh hiển thị';}
function render(){
 try{
 el.gallery.innerHTML='';
 const galleryFrag=document.createDocumentFragment();
 refreshGalleryVisibleCount();
 for(const item of state.items){ if(!itemMatchesGalleryFilter(item)) continue;
 const tpl=document.getElementById('cardTpl');
 if(!tpl){ setStatus('Lỗi: thiếu mẫu cardTpl trong HTML'); return; }
 const card=tpl.content.firstElementChild.cloneNode(true);
 card.dataset.id=item.id; if(item.processError) card.classList.add('has-error');
 const fileNameNode=card.querySelector('.file-name'); if(fileNameNode) fileNameNode.textContent=item.name; const chk=card.querySelector('.pick-card'); chk.checked=item.selected; chk.onchange=()=>item.selected=chk.checked; const oImg=card.querySelector('.img-original'); oImg.src=item.origUrl; oImg.onclick=()=>openLightbox(item.origUrl, `${item.name} - gốc`); const pImg=card.querySelector('.img-processed'); pImg.src=item.processedUrl||item.origUrl; pImg.onclick=()=>openLightbox(item.processedUrl||item.origUrl, item.processedUrl?`${item.name} - kết quả`:`${item.name} - xem trước chỉnh ảnh`);
 const note=card.querySelector('.card-note'); if(!item.scannedColors.length){ note.innerHTML='Chưa quét màu nền. Bạn có thể bấm <b>1 Quét màu 4 góc</b>. Nếu 4 góc trong suốt, tool sẽ tự đoán nền bên trong. Với ảnh nền loang/gradient, nếu xử lý lần 1 chưa sạch hãy bấm <b>3 Quét màu nền</b> ở 2–4 vùng khác nhau rồi chạy <b>Xử lý lần 2</b>.'; } else if(item.scannedColors.length<3){ note.innerHTML=`Hiện mới quét <b>${item.scannedColors.length} màu nền</b>. Nếu nền loang nhiều sắc hoặc còn sót trong lòng chữ/số, hãy quét thêm 2–4 vùng nền khác nhau rồi dùng <b>Xóa toàn bộ màu đã quét</b> hoặc <b>Thông minh</b>.`; } else { const modeText=item.lastAutoScanMode==='inner' ? 'Tool đã tự bỏ qua 4 góc và đoán nền bên trong.' : 'Đã có đủ màu quét để xử lý tốt hơn.'; note.innerHTML=`Đã quét <b>${item.scannedColors.length} màu nền</b>. ${modeText} Bây giờ chế độ <b>Thông minh</b> hoặc <b>Xóa toàn bộ màu đã quét</b> sẽ xóa được cả vùng kín bên trong nếu màu trùng hoặc gần giống.`; }
 card.querySelector('.meta').innerHTML=`Gốc: ${item.origW} × ${item.origH} px • ${humanSize(item.file.size)}<br>` + (item.processedW?`KQ: ${item.processedW} × ${item.processedH} px • ${humanSize(item.processedBlob.size)} • ${item.scannedColors.length} màu quét`:`Chưa xử lý • ${item.scannedColors.length} màu quét`);
 const paletteWrap=card.querySelector('.palette-wrap'); const palette=card.querySelector('.palette'); if(item.scannedColors.length){ paletteWrap.classList.remove('hidden'); item.scannedColors.forEach((c,idx)=>{ const wrap=document.createElement('div'); wrap.className='swatch-wrap'; const sw=document.createElement('div'); sw.className='swatch'; sw.style.background=`rgb(${c[0]}, ${c[1]}, ${c[2]})`; sw.title=`rgb(${c[0]}, ${c[1]}, ${c[2]})`; const del=document.createElement('button'); del.className='btn tiny swatch-del'; del.textContent='Xóa'; del.onclick=()=>{ item.scannedColors.splice(idx,1); render(); }; wrap.append(sw,del); palette.appendChild(wrap); }); }
 card.querySelector('.clear-colors').onclick=()=>{ item.scannedColors=[]; render(); };
 const autoBtn=card.querySelector('.auto-scan-one'); if(autoBtn) autoBtn.onclick=async()=>{ await autoScanCorners(item); render(); };
 card.querySelector('.scan-one').onclick=()=>activateScan(card,item);
 const cropBtn=card.querySelector('.crop-free-one'); if(cropBtn) cropBtn.onclick=()=>activateFreeCrop(card,item);
 const vectorBtn=card.querySelector('.vector-one'); if(vectorBtn) vectorBtn.onclick=()=>vectorizeItem(item);
 const adjustInputs=card.querySelectorAll('.brightness-range,.contrast-range,.saturation-range');
 adjustInputs.forEach(inp=>inp.oninput=()=>updateAdjustPreview(card,item));
 const editApply=card.querySelector('.edit-apply-one'); if(editApply) editApply.onclick=()=>applyAdjustToItem(card,item);
 const editNew=card.querySelector('.edit-new-one'); if(editNew) editNew.onclick=()=>makeAdjustedNewItem(card,item);
 const editReset=card.querySelector('.edit-reset-one'); if(editReset) editReset.onclick=()=>resetAdjustControls(card,item);
 updateAdjustLabels(card);
 refreshOptionalCropButtons();
 const runProcess=async()=>{ if(!consumeUse()) return; await processOneWithUI(item, card, 'Đang xử lý'); render(); };
 const p1=card.querySelector('.process1-one'); if(p1) p1.onclick=runProcess;
 const p2=card.querySelector('.process2-one'); if(p2) p2.onclick=runProcess;
 card.querySelector('.download-one').onclick=()=>{ if(!item.processedBlob) return alert('Ảnh này chưa xử lý xong.'); triggerDownload(item.processedBlob, filenameProcessed(item,0)); };
 card.querySelector('.remove-one').onclick=()=>{ if(guardBatchMutation('xóa ảnh'))return; stashDeleted([item]); const i=state.items.indexOf(item); if(i>=0) state.items.splice(i,1); render(); setStatus('Đã xóa 1 ảnh • có thể Hoàn tác.'); };
 galleryFrag.appendChild(card); }
 el.gallery.appendChild(galleryFrag);
 updateCounts(); document.body.classList.toggle('has-files', state.items.length > 0); applyBatchBrightnessPreview();
 }catch(err){
   console.error(err);
   setStatus('Lỗi render: '+(err.message||err));
 }
}

async function processOneWithUI(item, card, label='Đang xử lý'){
  const btns = card ? card.querySelectorAll('.process1-one,.process2-one,.process-one') : [];
  try{
    if(card) card.classList.add('processing');
    btns.forEach(b=>{ b.classList.add('busy'); b.dataset.oldText=b.innerHTML; b.innerHTML='Đang xử lý...'; });
    setStatus(label+': '+item.name);
    await sleep(120);
    await processItem(item);
    setStatus('Đã xử lý xong: '+item.name);
  }catch(err){
    console.error(err);
    setStatus('Lỗi xử lý: '+(err.message||err));
    alert('Lỗi xử lý: '+(err.message||err));
  } finally {
    if(card) card.classList.remove('processing');
    btns.forEach(b=>{ b.classList.remove('busy'); if(b.dataset.oldText)b.innerHTML=b.dataset.oldText; });
  }
}

function syncCropPadUI(){
  const x=Math.max(0, +(el.paddingXPx?.value||0));
  const y=Math.max(0, +(el.paddingYPx?.value||0));
  if(el.cropPadXQuick) el.cropPadXQuick.value=x;
  if(el.cropPadYQuick) el.cropPadYQuick.value=y;
  const same=x===y;
  if(el.cropPadLive) el.cropPadLive.textContent=same?`Đang chừa: ${x}px`:`Đang chừa: ngang ${x}px • dọc ${y}px`;
  document.querySelectorAll('.crop-pad-chip').forEach(btn=>{
    const v=+btn.dataset.cropPad;
    btn.classList.toggle('active', same && x===v && y===v);
  });
}
function setCropPadBoth(v){
  const n=Math.max(0, Math.round(+v||0));
  if(el.paddingXPx) el.paddingXPx.value=n;
  if(el.paddingYPx) el.paddingYPx.value=n;
  if(el.cropPadXQuick) el.cropPadXQuick.value=n;
  if(el.cropPadYQuick) el.cropPadYQuick.value=n;
  syncCropPadUI();
}

function settings(){
  let defringePx=+(el.defringePx?.value||0);
  let trimAlphaPx=+(el.trimAlphaPx?.value||0);
  if(defringePx<0){ trimAlphaPx=Math.max(trimAlphaPx, Math.abs(defringePx)); defringePx=0; }
  return {
  removeBg:el.optRemoveBg?el.optRemoveBg.checked:true,
  removeMode:el.removeMode?el.removeMode.value:'smart',
  bgThreshold:+(el.bgThreshold?.value||34),
  scanKeep:+(el.scanKeep?.value||12),
  defringe:el.optDefringe?el.optDefringe.checked:true,
  defringePx:defringePx,
  trimAlphaPx:trimAlphaPx,
  crop:el.optCrop?el.optCrop.checked:true,
  paddingXPx:+((el.paddingXPx?.value ?? el.paddingPx?.value) || 0),
  paddingYPx:+((el.paddingYPx?.value ?? el.paddingPx?.value) || 0),
  paddingPx:+((el.paddingXPx?.value ?? el.paddingPx?.value) || 0),
  sharpen:el.optSharpen?el.optSharpen.checked:true,
  sharpenStrength:+(el.sharpenStrength?.value||0),
  outputSize:el.outputSize?el.outputSize.value:'auto',
  customW:+(el.customW?.value||1000),
  customH:+(el.customH?.value||1000),
  bgMode:el.outputBgMode?el.outputBgMode.value:'transparent',
  bgColor:el.customBgColor?el.customBgColor.value:'#ffffff',
  maxFileSizeMb:+(el.maxFileSizeMb?.value||0),
  strokeMode:el.strokeMode?el.strokeMode.value:'none',
  strokePx:+(el.strokePx?.value||0),
  strokeColor:el.strokeMode?.value==='white'?'#ffffff':el.strokeMode?.value==='black'?'#000000':(el.strokeColor?.value||'#ffffff'),
  shadowMode:el.shadowMode?el.shadowMode.value:'none'
}; }
function applyDefaults(){
  if(el.removeMode) el.removeMode.value='smart';
  if(el.bgThreshold) el.bgThreshold.value=34;
  safeSetText(el.bgThresholdVal,'34');
  if(el.scanKeep) el.scanKeep.value=12;
  if(el.defringePx) el.defringePx.value=1;
  if(el.trimAlphaPx) el.trimAlphaPx.value=0;
  if(el.paddingXPx) el.paddingXPx.value=2;
  if(el.paddingYPx) el.paddingYPx.value=2;
  if(el.paddingPx) el.paddingPx.value=2;
  if(el.sharpenStrength) el.sharpenStrength.value=25;
  safeSetText(el.sharpenStrengthVal,'25');
  if(el.optRemoveBg) el.optRemoveBg.checked=true;
  if(el.optDefringe) el.optDefringe.checked=true;
  if(el.optCrop) el.optCrop.checked=true;
  if(el.optSharpen) el.optSharpen.checked=true;
  if(el.outputSize) el.outputSize.value='auto';
  if(el.outputBgMode) el.outputBgMode.value='transparent';
  if(el.customBgColor) el.customBgColor.classList.add('hidden');
  if(el.maxFileSizeMb) el.maxFileSizeMb.value=0;
  if(el.strokeMode) el.strokeMode.value='none';
  if(el.strokePx) el.strokePx.value=0;
  if(el.shadowMode) el.shadowMode.value='none';
  setStatus('Đã đặt lại thông số.');
}
function createCanvas(w,h){ const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(w)); c.height=Math.max(1,Math.round(h)); return c; }
function canvasToBlob(canvas,type='image/png',quality){ return new Promise(resolve=>canvas.toBlob(resolve,type,quality)); }
async function exportCanvasWithLimit(canvas,maxMb,mime='image/png'){
  const maxBytes=(+maxMb||0)*1024*1024;
  if(maxBytes<=0){ const blob=await canvasToBlob(canvas,mime,mime==='image/jpeg'?0.92:undefined); return {blob,canvas}; }
  let work=canvas;
  let blob=await canvasToBlob(work,mime,mime==='image/jpeg'?0.92:undefined);
  if(blob && blob.size<=maxBytes) return {blob,canvas:work};
  if(mime==='image/jpeg'){
    for(const q of [0.88,0.82,0.76,0.7,0.64,0.58]){
      blob=await canvasToBlob(work,mime,q);
      if(blob && blob.size<=maxBytes) return {blob,canvas:work};
    }
  }
  for(let i=0;i<8 && blob && blob.size>maxBytes && work.width>220 && work.height>220;i++){
    const ratio=Math.max(0.5, Math.min(0.95, Math.sqrt(maxBytes/blob.size)*0.98));
    const nw=Math.max(1,Math.round(work.width*ratio));
    const nh=Math.max(1,Math.round(work.height*ratio));
    const smaller=createCanvas(nw,nh);
    smaller.getContext('2d').drawImage(work,0,0,nw,nh);
    work=smaller;
    blob=await canvasToBlob(work,mime,mime==='image/jpeg'?0.86:undefined);
    if(mime==='image/jpeg' && blob && blob.size>maxBytes){
      for(const q of [0.8,0.74,0.68,0.62,0.56]){ blob=await canvasToBlob(work,mime,q); if(blob && blob.size<=maxBytes) break; }
    }
  }
  return {blob,canvas:work};
}
function avg(points){ const n=points.length||1; const s=points.reduce((a,p)=>[a[0]+p[0],a[1]+p[1],a[2]+p[2]],[0,0,0]); return [Math.round(s[0]/n),Math.round(s[1]/n),Math.round(s[2]/n)]; }
function estimateCornerStats(data,w,h){
  const patch=Math.max(6,Math.min(22,Math.floor(Math.min(w,h)/18)));
  const starts=[[0,0],[Math.max(0,w-patch),0],[0,Math.max(0,h-patch)],[Math.max(0,w-patch),Math.max(0,h-patch)]];
  return starts.map(([sx,sy])=>{
    const pts=[]; let total=0, opaque=0;
    for(let y=sy;y<Math.min(h,sy+patch);y++){
      for(let x=sx;x<Math.min(w,sx+patch);x++){
        const i=(y*w+x)*4; total++;
        if(data[i+3]<20) continue;
        opaque++;
        pts.push([data[i],data[i+1],data[i+2]]);
      }
    }
    return { color: pts.length?avg(pts):null, opaqueRatio: total?opaque/total:0, opaqueCount: opaque };
  });
}
function estimateBg(data,w,h){
  return estimateCornerStats(data,w,h).filter(v=>v.color && v.opaqueRatio>=0.18).map(v=>v.color);
}
function quantizePixels(pixels, keep=8){
  const bins=new Map();
  for(const p of pixels){
    const r=(p[0]>>4)<<4, g=(p[1]>>4)<<4, b=(p[2]>>4)<<4;
    const key=`${r},${g},${b}`;
    const entry=bins.get(key)||{count:0,sum:[0,0,0]};
    entry.count++; entry.sum[0]+=p[0]; entry.sum[1]+=p[1]; entry.sum[2]+=p[2]; bins.set(key,entry);
  }
  return [...bins.values()].sort((a,b)=>b.count-a.count).slice(0,keep).map(v=>[Math.round(v.sum[0]/v.count),Math.round(v.sum[1]/v.count),Math.round(v.sum[2]/v.count)]);
}
function quantizeRegionColors(imageData, keep=8){
  const data=imageData.data; const bins=new Map();
  for(let i=0;i<data.length;i+=4){ if(data[i+3]<20) continue; const r=(data[i]>>4)<<4, g=(data[i+1]>>4)<<4, b=(data[i+2]>>4)<<4; const key=`${r},${g},${b}`; const entry=bins.get(key)||{count:0,sum:[0,0,0]}; entry.count++; entry.sum[0]+=data[i]; entry.sum[1]+=data[i+1]; entry.sum[2]+=data[i+2]; bins.set(key,entry); }
  return [...bins.values()].sort((a,b)=>b.count-a.count).slice(0,keep).map(v=>[Math.round(v.sum[0]/v.count),Math.round(v.sum[1]/v.count),Math.round(v.sum[2]/v.count)]);
}
function detectEdgeBandColors(data,w,h,keep=8){
  const band=Math.max(8,Math.min(36,Math.floor(Math.min(w,h)/12)));
  const pts=[];
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      if(!(x<band || x>=w-band || y<band || y>=h-band)) continue;
      const i=(y*w+x)*4;
      if(data[i+3]<20) continue;
      pts.push([data[i],data[i+1],data[i+2]]);
    }
  }
  return quantizePixels(pts, keep);
}
function detectImageDominantColors(data,w,h,keep=6){
  const pts=[];
  const step=Math.max(1,Math.floor(Math.max(w,h)/900));
  for(let y=0;y<h;y+=step){
    for(let x=0;x<w;x+=step){
      const i=(y*w+x)*4;
      if(data[i+3]<20) continue;
      pts.push([data[i],data[i+1],data[i+2]]);
    }
  }
  return quantizePixels(pts, keep);
}
function estimateBgSmart(data,w,h,keep=12){
  const cornerColors=estimateBg(data,w,h);
  const edgeColors=detectEdgeBandColors(data,w,h,Math.max(4,Math.min(keep,8)));
  const dominant=detectImageDominantColors(data,w,h,Math.max(3,Math.min(keep,6)));
  if(cornerColors.length>=2) return uniqueColors([...cornerColors,...edgeColors], keep);
  return uniqueColors([...edgeColors,...dominant], keep);
}

async function autoScanCorners(item){
  const img=await loadImage(item.origUrl);
  const c=createCanvas(item.origW,item.origH);
  const ctx=c.getContext('2d');
  ctx.drawImage(img,0,0);
  const imageData=ctx.getImageData(0,0,item.origW,item.origH);
  const cornerColors=estimateBg(imageData.data,item.origW,item.origH);
  const useFallback=cornerColors.length<2;
  const colors=useFallback ? estimateBgSmart(imageData.data,item.origW,item.origH,Math.max(6, settings().scanKeep||12)) : uniqueColors(cornerColors,12);
  item.scannedColors=uniqueColors([...item.scannedColors,...colors],28);
  item.lastAutoScanMode=useFallback ? 'inner' : 'corners';
  setStatus(useFallback ? `4 góc trong suốt/không hợp lệ, đã tự đoán nền bên trong cho ${item.name}` : `Đã tự quét 4 góc cho ${item.name}`);
}

function activateScan(card,item){ (async()=>{
 const overlay=card.querySelector('.scan-overlay');
 const sel=card.querySelector('.selection-box');
 const imgEl=card.querySelector('.img-original');
 const zoomBox=card.querySelector('.scan-zoom-box');
 const zoomCanvas=card.querySelector('.scan-zoom-canvas');
 const zctx=zoomCanvas?zoomCanvas.getContext('2d'):null;
 overlay.classList.remove('hidden');
 if(zoomBox) zoomBox.classList.remove('hidden');
 let dragging=false,sx=0,sy=0,ex=0,ey=0;
 const srcImg=await loadImage(item.origUrl);
 const srcCanvas=createCanvas(item.origW,item.origH);
 const srcCtx=srcCanvas.getContext('2d',{willReadFrequently:true});
 srcCtx.drawImage(srcImg,0,0);
 const p=e=>{ const r=overlay.getBoundingClientRect(); return {x:Math.max(0,Math.min(r.width,e.clientX-r.left)), y:Math.max(0,Math.min(r.height,e.clientY-r.top)), w:r.width, h:r.height}; };
 function draw(){ const x=Math.min(sx,ex), y=Math.min(sy,ey), w=Math.abs(ex-sx), h=Math.abs(ey-sy); sel.style.left=x+'px'; sel.style.top=y+'px'; sel.style.width=w+'px'; sel.style.height=h+'px'; }
 function drawZoom(clientX,clientY){
   if(!zctx||!zoomCanvas) return;
   const rect=imgEl.getBoundingClientRect(), overRect=overlay.getBoundingClientRect();
   const x=clientX-overRect.left, y=clientY-overRect.top;
   const imgX=rect.left-overRect.left, imgY=rect.top-overRect.top;
   const imgW=rect.width, imgH=rect.height;
   zctx.clearRect(0,0,zoomCanvas.width,zoomCanvas.height);
   zctx.fillStyle='#0f172a'; zctx.fillRect(0,0,zoomCanvas.width,zoomCanvas.height);
   if(x<imgX || x>imgX+imgW || y<imgY || y>imgY+imgH){ return; }
   const relX=(x-imgX)/imgW, relY=(y-imgY)/imgH;
   const natX=Math.round(relX*item.origW), natY=Math.round(relY*item.origH);
   const zoom=3;
   const sw=Math.max(24, Math.round(zoomCanvas.width/zoom));
   const sh=Math.max(24, Math.round(zoomCanvas.height/zoom));
   const sx0=Math.max(0, Math.min(item.origW-sw, natX-Math.floor(sw/2)));
   const sy0=Math.max(0, Math.min(item.origH-sh, natY-Math.floor(sh/2)));
   zctx.imageSmoothingEnabled=false;
   zctx.drawImage(srcCanvas,sx0,sy0,sw,sh,0,0,zoomCanvas.width,zoomCanvas.height);
   zctx.imageSmoothingEnabled=true;
   zctx.strokeStyle='rgba(96,165,250,.95)'; zctx.lineWidth=1.5;
   zctx.beginPath(); zctx.moveTo(zoomCanvas.width/2,0); zctx.lineTo(zoomCanvas.width/2,zoomCanvas.height); zctx.moveTo(0,zoomCanvas.height/2); zctx.lineTo(zoomCanvas.width,zoomCanvas.height/2); zctx.stroke();
   zctx.strokeStyle='rgba(255,255,255,.85)'; zctx.strokeRect(0.5,0.5,zoomCanvas.width-1,zoomCanvas.height-1);
 }
 function finish(){ overlay.removeEventListener('pointerdown',down); overlay.removeEventListener('pointermove',move); overlay.removeEventListener('pointerup',up); overlay.removeEventListener('pointercancel',cancel); overlay.removeEventListener('pointerleave',leave); overlay.classList.add('hidden'); if(zoomBox) zoomBox.classList.add('hidden'); sel.removeAttribute('style'); }
 async function compute(){ const rect=imgEl.getBoundingClientRect(), overRect=overlay.getBoundingClientRect(); const imgX=rect.left-overRect.left, imgY=rect.top-overRect.top; const imgW=rect.width, imgH=rect.height; const x0=Math.min(sx,ex), y0=Math.min(sy,ey), x1=Math.max(sx,ex), y1=Math.max(sy,ey); const ix0=Math.max(0,Math.min(imgW,x0-imgX)), iy0=Math.max(0,Math.min(imgH,y0-imgY)), ix1=Math.max(0,Math.min(imgW,x1-imgX)), iy1=Math.max(0,Math.min(imgH,y1-imgY)); if(ix1-ix0<4 || iy1-iy0<4){ alert('Vùng quét quá nhỏ.'); return; }
  const natX=Math.round(ix0/imgW*item.origW), natY=Math.round(iy0/imgH*item.origH), natW=Math.round((ix1-ix0)/imgW*item.origW), natH=Math.round((iy1-iy0)/imgH*item.origH);
  const data=srcCtx.getImageData(natX,natY,Math.max(1,natW),Math.max(1,natH)); const newColors=quantizeRegionColors(data,settings().scanKeep); item.scannedColors=uniqueColors([...item.scannedColors,...newColors],28); render(); setStatus(`Đã quét thêm ${newColors.length} màu cho ${item.name}`); }
 function down(e){ dragging=true; const t=p(e); sx=ex=t.x; sy=ey=t.y; draw(); drawZoom(e.clientX,e.clientY); overlay.setPointerCapture(e.pointerId); }
 function move(e){ const t=p(e); drawZoom(e.clientX,e.clientY); if(!dragging) return; ex=t.x; ey=t.y; draw(); }
 async function up(e){ if(!dragging) return; dragging=false; const t=p(e); ex=t.x; ey=t.y; draw(); drawZoom(e.clientX,e.clientY); await compute(); finish(); }
 function cancel(){ dragging=false; finish(); }
 function leave(){ if(!dragging && zctx){ zctx.clearRect(0,0,zoomCanvas.width,zoomCanvas.height); } }
 overlay.addEventListener('pointerdown',down); overlay.addEventListener('pointermove',move); overlay.addEventListener('pointerup',up); overlay.addEventListener('pointercancel',cancel); overlay.addEventListener('pointerleave',leave);
 })().catch(err=>{ console.error(err); alert('Lỗi quét màu nền: '+(err.message||err)); }); }

function luminanceRgb(c){
  return 0.299*c[0]+0.587*c[1]+0.114*c[2];
}
function filterBgColorsForSafety(colors){
  try{
    colors = (typeof uniqueColors==='function') ? uniqueColors(colors||[],32) : (colors||[]);
    if(!colors.length) return colors;
    const hasBright = colors.some(c=>luminanceRgb(c)>80);
    if(!hasBright) return colors;
    const filtered = colors.filter(c=>luminanceRgb(c)>45);
    return filtered.length ? filtered : colors;
  }catch(err){
    console.warn('filterBgColorsForSafety fallback', err);
    return colors || [];
  }
}

function removeBackground(canvas, threshold, mode='smart', customColors=[]){ const ctx=canvas.getContext('2d',{willReadFrequently:true}); const img=ctx.getImageData(0,0,canvas.width,canvas.height); const data=img.data, w=img.width, h=img.height; const autoColors=estimateBgSmart(data,w,h,12); let colors=filterBgColorsForSafety(uniqueColors([...(customColors||[]), ...autoColors],22)); let effectiveMode=mode; if(mode==='smart') effectiveMode = (customColors && customColors.length) ? 'global' : 'edge'; const t2=threshold*threshold;
 if(effectiveMode==='global'){
   for(let y=0;y<h;y++){
     for(let x=0;x<w;x++){
       const i=(y*w+x)*4;
       if(data[i+3]===0) continue;
       for(const c of colors){
         if(colorDistSq(data[i],data[i+1],data[i+2],c)<=t2){ data[i+3]=0; break; }
       }
     }
   }
   ctx.putImageData(img,0,0); return canvas;
 }
 const visited=new Uint8Array(w*h); const q=new Int32Array(w*h); let head=0,tail=0;
 function push(x,y){ if(x<0||x>=w||y<0||y>=h) return; const idx=y*w+x; if(visited[idx]) return; const i=idx*4; if(data[i+3]===0){ visited[idx]=1; return; } for(const c of colors){ if(colorDistSq(data[i],data[i+1],data[i+2],c)<=t2){ visited[idx]=1; q[tail++]=idx; return; } } }
 for(let x=0;x<w;x++){ push(x,0); push(x,h-1);} for(let y=0;y<h;y++){ push(0,y); push(w-1,y);} while(head<tail){ const idx=q[head++], x=idx%w, y=(idx/w)|0; data[idx*4+3]=0; push(x+1,y); push(x-1,y); push(x,y+1); push(x,y-1); }
 ctx.putImageData(img,0,0); return canvas;
}
function defringeAlpha(canvas, px, bgColors=[], threshold=34){
 px=Number(px||0);
 if(px===0) return canvas;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 const img=ctx.getImageData(0,0,canvas.width,canvas.height);
 const data=img.data,w=img.width,h=img.height;
 let alpha=new Uint8Array(w*h);
 for(let i=0;i<w*h;i++) alpha[i]=data[i*4+3]>8?1:0;
 const dist=Math.max(1,Math.round(Math.abs(px)));
 bgColors=filterBgColorsForSafety(bgColors||[]);
 function isNearTransparent(x,y,range=1){
   for(let oy=-range;oy<=range;oy++){
     for(let ox=-range;ox<=range;ox++){
       if(ox===0&&oy===0) continue;
       const nx=x+ox, ny=y+oy;
       if(nx<0||nx>=w||ny<0||ny>=h) return true;
       if(!alpha[ny*w+nx]) return true;
     }
   }
   return false;
 }
 function closestBg(r,g,b){
   let best=null, bd=Infinity;
   for(const c of bgColors){
     const d=colorDistSq(r,g,b,c);
     if(d<bd){bd=d; best=c;}
   }
   return [best, bd];
 }
 function dominantBgChannels(c){
   const maxv=Math.max(c[0],c[1],c[2]);
   const out=[];
   for(let k=0;k<3;k++){
     if(c[k] >= maxv-22 && c[k] > 70) out.push(k);
   }
   return out.length ? out : [0,1,2];
 }
 if(px>0){
   if(!bgColors.length) return canvas;
   const t=Math.max(10,threshold*1.45), t2=t*t;
   const kill=new Uint8Array(w*h);
   for(let y=0;y<h;y++){
     for(let x=0;x<w;x++){
       const idx=y*w+x;
       if(!alpha[idx]) continue;
       if(!isNearTransparent(x,y,dist)) continue;
       const i=idx*4;
       for(const c of bgColors){
         if(colorDistSq(data[i],data[i+1],data[i+2],c)<=t2){ kill[idx]=1; break; }
       }
     }
   }
   for(let i=0;i<w*h;i++) if(kill[i]) data[i*4+3]=0;
 } else {
   // Số âm: chỉ khử lem màu nền ở sát mép, KHÔNG xóa alpha.
   if(!bgColors.length) return canvas;
   const strength=Math.min(1,0.32+Math.abs(px)*0.22);
   const nearT=Math.max(18, threshold*1.8), nearT2=nearT*nearT;
   for(let y=0;y<h;y++){
     for(let x=0;x<w;x++){
       const idx=y*w+x;
       if(!alpha[idx]) continue;
       if(!isNearTransparent(x,y,dist)) continue;
       const i=idx*4;
       const r=data[i], g=data[i+1], b=data[i+2];
       const [c,bgDist]=closestBg(r,g,b);
       if(!c) continue;
       const dom=dominantBgChannels(c);
       let spillTotal=0;
       for(const ch of dom){
         const other1=(ch+1)%3, other2=(ch+2)%3;
         spillTotal += Math.max(0, data[i+ch] - Math.max(data[i+other1], data[i+other2]));
       }
       // Nếu không gần màu nền và cũng không có độ dư kênh màu nền thì bỏ qua.
       if(bgDist > nearT2 && spillTotal < 16*dom.length) continue;
       // Bảo vệ các pixel có màu vật thể thật (ví dụ da, áo đỏ, quần đen),
       // chỉ giảm kênh nào đang dư theo màu nền.
       for(const ch of dom){
         const other1=(ch+1)%3, other2=(ch+2)%3;
         const otherMax=Math.max(data[i+other1], data[i+other2]);
         const excess=data[i+ch]-otherMax;
         if(excess<=0) continue;
         const protect=(bgDist<=nearT2) ? 0 : 4; // nếu không quá gần màu nền thì giữ lại ít nhiều
         const target=Math.max(otherMax+protect, Math.round(data[i+ch] - excess*strength));
         if(target < data[i+ch]) data[i+ch]=target;
       }
     }
   }
 }
 ctx.putImageData(img,0,0);
 return canvas;
}
function trimAlphaEdge(canvas, px, bgColors=[], threshold=34){
 px=Math.max(0, Math.round(Number(px||0)));
 if(px<=0) return canvas;
 bgColors=filterBgColorsForSafety(bgColors||[]);
 if(!bgColors.length) return canvas;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 const baseT=Math.max(14, threshold*1.35), t2=baseT*baseT;
 for(let pass=0; pass<px; pass++){
   const img=ctx.getImageData(0,0,canvas.width,canvas.height);
   const data=img.data,w=img.width,h=img.height;
   const alpha=new Uint8Array(w*h);
   for(let i=0;i<w*h;i++) alpha[i]=data[i*4+3]>8?1:0;
   const kill=new Uint8Array(w*h);
   const nearTransparent=(x,y)=>{
     for(let oy=-1;oy<=1;oy++){
       for(let ox=-1;ox<=1;ox++){
         if(ox===0&&oy===0) continue;
         const nx=x+ox, ny=y+oy;
         if(nx<0||ny<0||nx>=w||ny>=h) return true;
         if(!alpha[ny*w+nx]) return true;
       }
     }
     return false;
   };
   for(let y=0;y<h;y++){
     for(let x=0;x<w;x++){
       const idx=y*w+x;
       if(!alpha[idx]) continue;
       if(!nearTransparent(x,y)) continue;
       const i=idx*4;
       for(const c of bgColors){
         if(colorDistSq(data[i],data[i+1],data[i+2],c)<=t2){ kill[idx]=1; break; }
       }
     }
   }
   let changed=0;
   for(let i=0;i<w*h;i++) if(kill[i]){ data[i*4+3]=0; changed++; }
   ctx.putImageData(img,0,0);
   if(!changed) break;
 }
 return canvas;
}
function getAlphaBounds(canvas){ const ctx=canvas.getContext('2d',{willReadFrequently:true}); const img=ctx.getImageData(0,0,canvas.width,canvas.height); const data=img.data,w=img.width,h=img.height; let minX=w,minY=h,maxX=-1,maxY=-1; for(let y=0;y<h;y++){ for(let x=0;x<w;x++){ if(data[(y*w+x)*4+3]>8){ if(x<minX)minX=x; if(y<minY)minY=y; if(x>maxX)maxX=x; if(y>maxY)maxY=y; } } } if(maxX<0) return null; return {minX,minY,maxX,maxY}; }
function cropAlpha(canvas,paddingXPx,paddingYPx){ const b=getAlphaBounds(canvas); if(!b) return canvas; const padX=Math.max(0,Math.round(paddingXPx ?? 0)); const padY=Math.max(0,Math.round((paddingYPx ?? paddingXPx) ?? 0)); const sx=Math.max(0,b.minX-padX), sy=Math.max(0,b.minY-padY), ex=Math.min(canvas.width-1,b.maxX+padX), ey=Math.min(canvas.height-1,b.maxY+padY); const w=ex-sx+1,h=ey-sy+1; const out=createCanvas(w,h); out.getContext('2d').drawImage(canvas,sx,sy,w,h,0,0,w,h); return out; }
function sharpen(canvas,strength){ if(strength<=0) return canvas; const amount=0.35 + strength/100*1.05; const w=canvas.width,h=canvas.height; const ctx=canvas.getContext('2d',{willReadFrequently:true}); const src=ctx.getImageData(0,0,w,h); const out=ctx.createImageData(w,h); const d=src.data,o=out.data; const idx=(x,y)=>(y*w+x)*4; for(let y=0;y<h;y++){ for(let x=0;x<w;x++){ const i=idx(x,y); let rs=0,gs=0,bs=0,c=0; for(let yy=-1;yy<=1;yy++){ for(let xx=-1;xx<=1;xx++){ const nx=Math.max(0,Math.min(w-1,x+xx)), ny=Math.max(0,Math.min(h-1,y+yy)), j=idx(nx,ny); rs+=d[j]; gs+=d[j+1]; bs+=d[j+2]; c++; } } o[i]=Math.max(0,Math.min(255,d[i]+(d[i]-rs/c)*amount)); o[i+1]=Math.max(0,Math.min(255,d[i+1]+(d[i+1]-gs/c)*amount)); o[i+2]=Math.max(0,Math.min(255,d[i+2]+(d[i+2]-bs/c)*amount)); o[i+3]=d[i+3]; } } const outCanvas=createCanvas(w,h); outCanvas.getContext('2d').putImageData(out,0,0); return outCanvas; }

function hexToRgb(hex){hex=(hex||'#ffffff').replace('#','');return[parseInt(hex.slice(0,2),16)||255,parseInt(hex.slice(2,4),16)||255,parseInt(hex.slice(4,6),16)||255]}
function addStroke(canvas,px,color){
  px=Math.max(0,Math.round(px));
  if(px<=0)return canvas;
  /* R18.1: mở rộng canvas TRƯỚC khi giãn alpha để viền không bị cắt ở mép. */
  const srcW=canvas.width,srcH=canvas.height,pad=px;
  const base=createCanvas(srcW+pad*2,srcH+pad*2),bc=base.getContext('2d');
  bc.drawImage(canvas,pad,pad);
  const w=base.width,h=base.height,ctx=base.getContext('2d',{willReadFrequently:true}),img=ctx.getImageData(0,0,w,h),a=new Uint8Array(w*h);
  for(let i=0;i<w*h;i++)a[i]=img.data[i*4+3]>8?1:0;
  let dil=new Uint8Array(a);
  for(let step=0;step<px;step++){
    const n=new Uint8Array(dil);
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
      const idx=y*w+x;
      if(dil[idx])for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++)n[(y+oy)*w+x+ox]=1;
    }
    dil=n;
  }
  const out=createCanvas(w,h),oc=out.getContext('2d'),rgb=hexToRgb(color),od=oc.createImageData(w,h);
  for(let i=0;i<w*h;i++)if(dil[i]&&!a[i]){
    od.data[i*4]=rgb[0];od.data[i*4+1]=rgb[1];od.data[i*4+2]=rgb[2];od.data[i*4+3]=255;
  }
  oc.putImageData(od,0,0);
  oc.drawImage(base,0,0);
  return out;
}
function bgColor(s){if(s.bgMode==='white')return'#fff';if(s.bgMode==='black')return'#000';if(s.bgMode==='gray')return'#e5e7eb';if(s.bgMode==='custom')return s.bgColor;return null}
function shadowSpec(mode){return {light:[10,3,3,.25],medium:[18,6,6,.32],strong:[28,9,9,.42]}[mode]||null}
function finalizeCanvas(canvas,s){
  let c=canvas;
  if(s.strokeMode!=='none'&&s.strokePx>0)c=addStroke(c,s.strokePx,s.strokeColor);

  const sm=(s.shadowMode&&s.shadowMode!=='none')?shadowSpec(s.shadowMode):null;
  /* Canvas shadowBlur có vùng ảnh hưởng ngoài vật thể. Chừa dư để bóng không bị xén. */
  let safeL=0,safeT=0,safeR=0,safeB=0;
  if(sm){
    const blurPad=Math.ceil(sm[0]*1.6);
    safeL=blurPad+Math.max(0,-sm[1]);
    safeR=blurPad+Math.max(0, sm[1]);
    safeT=blurPad+Math.max(0,-sm[2]);
    safeB=blurPad+Math.max(0, sm[2]);
  }

  let tw=c.width+safeL+safeR,th=c.height+safeT+safeB;
  const fixed=!!(s.outputSize&&s.outputSize!=='auto');
  if(fixed){
    if(s.outputSize==='custom'){tw=s.customW;th=s.customH}else{tw=th=+s.outputSize}
  }
  tw=Math.max(1,Math.round(tw)); th=Math.max(1,Math.round(th));
  const out=createCanvas(tw,th),ctx=out.getContext('2d'),bg=bgColor(s);
  if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,tw,th)}

  const usableW=Math.max(1,tw-safeL-safeR), usableH=Math.max(1,th-safeT-safeB);
  const scale=fixed?Math.min(usableW/c.width,usableH/c.height):1;
  const dw=c.width*scale,dh=c.height*scale;
  const dx=safeL+(usableW-dw)/2,dy=safeT+(usableH-dh)/2;

  if(sm){
    ctx.save();ctx.shadowColor=`rgba(0,0,0,${sm[3]})`;ctx.shadowBlur=sm[0];ctx.shadowOffsetX=sm[1];ctx.shadowOffsetY=sm[2];ctx.drawImage(c,dx,dy,dw,dh);ctx.restore();
  }
  ctx.drawImage(c,dx,dy,dw,dh);
  return out;
}

async function processItem(item){
 try{
  item.processError='';
  const s=settings();
  if(s.removeBg && !item.scannedColors.length){ item.scanHint='auto'; } else if(s.removeBg && item.scannedColors.length>0 && item.scannedColors.length<3){ item.scanHint='few'; } else { item.scanHint='ok'; }
  setStatus(`Đang xử lý: ${item.name}`); await sleep(60);
  const img=await loadImage(item.origUrl); let canvas=createCanvas(img.naturalWidth,img.naturalHeight); canvas.getContext('2d').drawImage(img,0,0);
  const bgColorsForClean=filterBgColorsForSafety(uniqueColors([...(item.scannedColors||[]), ...estimateBgSmart(canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height,12)],28));
  if(s.removeBg) canvas=removeBackground(canvas,s.bgThreshold,s.removeMode,item.scannedColors);
  if(s.defringe && Number(s.defringePx)!==0) canvas=defringeAlpha(canvas,s.defringePx,bgColorsForClean,s.bgThreshold);
  if(s.defringe && Number(s.trimAlphaPx||0)>0) canvas=trimAlphaEdge(canvas,s.trimAlphaPx,bgColorsForClean,s.bgThreshold);
  if(s.crop) canvas=cropAlpha(canvas,s.paddingXPx,s.paddingYPx); if(s.sharpen) canvas=sharpen(canvas,s.sharpenStrength); canvas=finalizeCanvas(canvas,s);
  const exported=await exportCanvasWithLimit(canvas,s.maxFileSizeMb,'image/png'); const blob=exported.blob; const outCanvas=exported.canvas;
  if(item.processedUrl) URL.revokeObjectURL(item.processedUrl); item.processedBlob=blob; item.processedUrl=URL.createObjectURL(blob); item.processedW=outCanvas.width; item.processedH=outCanvas.height;
  setStatus(`Xong: ${item.name}${s.maxFileSizeMb>0?` • ${humanSize(blob.size)}`:''}`); return true;
 }catch(e){ console.error(e); item.processError=String(e?.message||e||'Lỗi không xác định'); alert(`Lỗi ở ảnh ${item.name}: ${item.processError}`); setStatus(`Lỗi: ${item.name}`); updateCounts(); return false; }
}
function setBatchProgress(done,total,label){
  const pct=total?Math.max(0,Math.min(100,Math.round(done/total*100))):0;
  const bar=document.getElementById('batchProgressBar'), txt=document.getElementById('batchProgressText'), p=document.getElementById('batchProgressPct');
  if(bar) bar.style.width=pct+'%'; if(txt) txt.textContent=label||'Sẵn sàng.'; if(p) p.textContent=pct+'%';
}
function setBatchBusy(on){ document.body.classList.toggle('batch-busy',!!on); }
let batchRunning=false,batchCancelRequested=false;
async function processList(list,quick=false){
  if(batchRunning){ setStatus('Đang có một lượt xử lý chạy.'); return false; }
  if(!list.length) return alert('Chưa có ảnh nào.'); if(!consumeUse()) return false;
  batchRunning=true; batchCancelRequested=false; // R16.5: quick mode respects current UI settings; do not reset/tick options
  setBatchBusy(true); setBatchProgress(0,list.length,`Chuẩn bị xử lý ${list.length} ảnh...`);
  let done=0, failed=0;
  try{
    for(let i=0;i<list.length;i++){
      if(batchCancelRequested) break; const item=list[i];
      setBatchProgress(done,list.length,`Đang xử lý ${i+1}/${list.length}: ${item.name}`); setStatus(`Đang xử lý ${i+1}/${list.length}: ${item.name}`); await sleep(50);
      if(batchCancelRequested) break; if(quick && settings().removeBg && !item.scannedColors.length) await autoScanCorners(item); if(batchCancelRequested) break;
      const ok=await processItem(item); done++; if(!ok) failed++; updateCounts(); render();
      setBatchProgress(done,list.length,`Đã xong ${done}/${list.length}${failed?` • lỗi ${failed}`:''}`); await sleep(35);
    }
    updateCounts(); render();
    if(batchCancelRequested){ setBatchProgress(done,list.length,`Đã dừng • ${done}/${list.length} • lỗi ${failed}`); setStatus(`Đã dừng sau ${done}/${list.length} ảnh${failed?` • ${failed} lỗi`:''}.`); return false; }
    setBatchProgress(list.length,list.length,`Hoàn tất ${list.length} ảnh${failed?` • ${failed} lỗi`:''}.`); setStatus(failed?`Hoàn tất, có ${failed} ảnh lỗi.`:'Hoàn tất.'); return failed===0;
  } finally { batchRunning=false; batchCancelRequested=false; setBatchBusy(false); }
}
function requestBatchStop(){ if(batchRunning){ batchCancelRequested=true; setStatus('Đang dừng sau bước hiện tại...'); } }
const stopBatchBtn=document.getElementById('stopBatchBtn'); if(stopBatchBtn) stopBatchBtn.onclick=requestBatchStop;

/* ===== R14 session integrity ===== */
function guardBatchMutation(label='thao tác này'){
  if(!batchRunning)return false;
  setStatus(`Đang xử lý hàng loạt • chưa thể ${label}. Hãy bấm Dừng trước.`); return true;
}

/* ===== R12 safer ZIP/export ===== */
function dedupeArchiveNames(files){
  const used=new Set();
  return (files||[]).map((f,i)=>{
    let name=safeName(f.name||`image-${i+1}.png`), candidate=name, n=2;
    const dot=name.lastIndexOf('.'), base=dot>0?name.slice(0,dot):name, ext=dot>0?name.slice(dot):'';
    while(used.has(candidate.toLowerCase())) candidate=`${base}_${n++}${ext}`;
    used.add(candidate.toLowerCase()); return {...f,name:candidate};
  });
}

function crc32(buf){ let table=crc32.table; if(!table){ table=crc32.table=new Uint32Array(256); for(let i=0;i<256;i++){ let c=i; for(let k=0;k<8;k++) c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1); table[i]=c>>>0; } } let c=0xffffffff; for(let i=0;i<buf.length;i++) c=table[(c^buf[i])&255]^(c>>>8); return (c^0xffffffff)>>>0; }
function u16(n){ return [n&255,(n>>>8)&255]; } function u32(n){ return [n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]; }
function dosTimeDate(date=new Date()){ const time=(date.getHours()<<11)|(date.getMinutes()<<5)|Math.floor(date.getSeconds()/2); const d=((date.getFullYear()-1980)<<9)|((date.getMonth()+1)<<5)|date.getDate(); return {time,date:d}; }
async function makeZip(files){ files=dedupeArchiveNames(files); const enc=new TextEncoder(); const chunks=[], central=[]; let offset=0; const td=dosTimeDate(); for(const f of files){ const nameBytes=enc.encode(f.name); const data=new Uint8Array(await f.blob.arrayBuffer()); const crc=crc32(data); const local=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(td.time),...u16(td.date),...u32(crc),...u32(data.length),...u32(data.length),...u16(nameBytes.length),...u16(0)]); chunks.push(local,nameBytes,data); const cent=new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(td.time),...u16(td.date),...u32(crc),...u32(data.length),...u32(data.length),...u16(nameBytes.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset)]); central.push(cent,nameBytes); offset+=local.length+nameBytes.length+data.length; } const centralSize=central.reduce((s,c)=>s+c.length,0), centralOffset=offset; const end=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(centralSize),...u32(centralOffset),...u16(0)]); return new Blob([...chunks,...central,end],{type:'application/zip'}); }



async function runSelfTest(){
 const status=document.getElementById('selfTestStatus'),checks=[]; const add=(name,ok,note='')=>checks.push({name,ok,note});
 try{add('Engine',typeof processItem==='function'&&typeof processList==='function'&&typeof render==='function');}catch(e){add('Engine',false,String(e))}
 try{const c=document.createElement('canvas');c.width=16;c.height=16;const g=c.getContext('2d');g.fillRect(0,0,8,8);const blob=await new Promise(r=>c.toBlob(r,'image/png'));add('Canvas/PNG',!!blob&&blob.size>0);}catch(e){add('Canvas/PNG',false,String(e))}
 try{const u=URL.createObjectURL(new Blob(['ok']));URL.revokeObjectURL(u);add('Blob URL',true);}catch(e){add('Blob URL',false,String(e))}
 try{const z=await makeZip([{name:'test.txt',blob:new Blob(['ok'])}]);const a=new Uint8Array(await z.slice(0,2).arrayBuffer());add('ZIP',a[0]===80&&a[1]===75);}catch(e){add('ZIP',false,String(e))}
 try{const c=document.createElement('canvas');c.width=48;c.height=48;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,48,48);g.fillStyle='#111';g.fillRect(12,12,24,24);const b=await new Promise(r=>c.toBlob(r,'image/png'));const u=URL.createObjectURL(b);const ti={id:'selftest',name:'selftest.png',origUrl:u,origW:48,origH:48,scannedColors:[[255,255,255]],processedBlob:null,processedUrl:null,selected:false};const good=await processItem(ti);add('Xử lý ảnh mẫu',!!good&&!!ti.processedBlob&&ti.processedBlob.size>0);cleanup(ti);}catch(e){add('Xử lý ảnh mẫu',false,String(e))}
 try{const ok=storageSet('__pip_test__','1')&&storageGet('__pip_test__')==='1';storageRemove('__pip_test__');add('Nhớ cài đặt',ok,ok?'':'Trình duyệt đang chặn localStorage; tool vẫn dùng được.');}catch(e){add('Nhớ cài đặt',false,'Không lưu được cài đặt.')}
 add('4 chế độ',!!document.getElementById('openPrepModeBtn')&&!!document.getElementById('openPreviewModeBtn')&&!!document.getElementById('openLogoModeBtn')&&!!document.getElementById('openRenameModeBtn'));
 const critical=checks.filter(x=>x.name!=='Nhớ cài đặt');const ok=critical.every(x=>x.ok);const storage=checks.find(x=>x.name==='Nhớ cài đặt');
 if(status){status.className='diag-status '+(ok?(storage?.ok?'selftest-ok':'selftest-warn'):'selftest-bad');status.textContent=ok?(storage?.ok?`✓ ${critical.length}/${critical.length} kiểm tra chính đạt.`:`✓ ${critical.length}/${critical.length} kiểm tra chính đạt • không lưu được cài đặt.`):`⚠ Có ${critical.filter(x=>!x.ok).length} kiểm tra chính lỗi.`;}
 setStatus(ok?'Tự kiểm tra hoàn tất.':'Tự kiểm tra phát hiện lỗi.'); return {ok,checks};
}
const selfTestBtn=document.getElementById('selfTestBtn');if(selfTestBtn)selfTestBtn.onclick=async()=>{selfTestBtn.disabled=true;selfTestBtn.textContent='Đang kiểm tra...';try{await runSelfTest()}finally{selfTestBtn.disabled=false;selfTestBtn.textContent='🩺 Tự kiểm tra tool'}};


/* ===== R11 resource hygiene ===== */
window.addEventListener('beforeunload',()=>{try{state.items.forEach(cleanup);if(deleteUndoBuffer?.items)deleteUndoBuffer.items.forEach(cleanup);}catch(e){}});

/* ===== R2 preset engine ===== */
function setVal(id,v){ const n=document.getElementById(id); if(!n)return; if(n.type==='checkbox')n.checked=!!v; else n.value=String(v); n.dispatchEvent(new Event('change',{bubbles:true})); n.dispatchEvent(new Event('input',{bubbles:true})); }
function applyWorkPreset(name){
  const common={optRemoveBg:true,optCrop:true,optSharpen:true,outputBgMode:'transparent',outputSize:'auto',maxFileSizeMb:0,strokeMode:'none',shadowMode:'none'};
  const presets={
    clean:{...common,removeMode:'smart',bgThreshold:34,scanKeep:12,optDefringe:true,defringePx:1,trimAlphaPx:0,paddingXPx:2,paddingYPx:2,sharpenStrength:25,label:'Nền sạch'},
    detail:{...common,removeMode:'edge',bgThreshold:24,scanKeep:8,optDefringe:false,defringePx:0,trimAlphaPx:0,paddingXPx:3,paddingYPx:3,sharpenStrength:15,label:'Giữ nét mảnh'},
    hard:{...common,removeMode:'global',bgThreshold:46,scanKeep:18,optDefringe:true,defringePx:2,trimAlphaPx:1,paddingXPx:2,paddingYPx:2,sharpenStrength:20,label:'Nền khó / loang'},
    shopee:{...common,removeMode:'smart',bgThreshold:34,scanKeep:12,optDefringe:true,defringePx:1,trimAlphaPx:0,paddingXPx:20,paddingYPx:20,sharpenStrength:20,outputSize:2000,outputBgMode:'white',maxFileSizeMb:2,label:'Shopee 2K'}
  };
  const p=presets[name]; if(!p)return;
  Object.entries(p).forEach(([k,v])=>{if(k!=='label')setVal(k,v)});
  const st=document.getElementById('presetStatus'); if(st)st.textContent='Đã áp dụng: '+p.label;
  setStatus('Đã áp preset '+p.label+'.');
}
document.querySelectorAll('[data-work-preset]').forEach(b=>b.addEventListener('click',()=>applyWorkPreset(b.dataset.workPreset)));

/* ===== Bản không đăng nhập: tương thích các hàm cũ ===== */
function currentEmail(){ return ''; }

/* ===== Feedback v5.1 ===== */
function feedbackStorageKey(){return 'pip_feedback_guest'}
function getFeedbackList(){try{return JSON.parse(localStorage.getItem(feedbackStorageKey())||'[]')}catch(e){return[]}}
function saveFeedbackList(list){return storageSet(feedbackStorageKey(),JSON.stringify(list))}
function buildFeedbackText(item){
  return [
    'PRO IMAGE PREP - GÓP Ý / BÁO LỖI',
    '--------------------------------',
    'Thời gian: '+item.time,
    'Loại: '+item.type,
    'Mức độ: '+item.level,
    'Tên ảnh/thao tác lỗi: '+(item.imageName||''),
    'Liên hệ khách: '+(item.contact||''),
    'Phiên bản: Vietnam v5.4',
    'Trình duyệt: '+item.ua,
    '',
    'Nội dung:',
    item.text
  ].join('\n');
}
function makeFeedbackItem(){
  const text=(el.feedbackText?.value||'').trim();
  if(!text){alert('Bạn chưa nhập nội dung góp ý.');return null}
  return {
    time:new Date().toLocaleString('vi-VN'),
    type:el.feedbackType?.value||'Góp ý',
    level:el.feedbackLevel?.value||'Bình thường',
    imageName:(el.feedbackImageName?.value||'').trim(),
    contact:(el.feedbackContact?.value||'').trim(),
    text,
    ua:navigator.userAgent
  };
}
function saveFeedbackOnly(){
  const item=makeFeedbackItem(); if(!item)return null;
  const list=getFeedbackList(); list.push(item); saveFeedbackList(list);
  if(el.feedbackStatus)el.feedbackStatus.textContent='Đã lưu góp ý. Tổng góp ý đã lưu: '+list.length;
  return item;
}
function downloadTextFile(content,name){
  const blob=new Blob([content],{type:'text/plain;charset=utf-8'});
  triggerDownload(blob,name);
}

function feedbackEndpointReady(){
  return CONFIG.feedbackApiUrl && !CONFIG.feedbackApiUrl.includes('PASTE_') && /^https?:\/\//i.test(CONFIG.feedbackApiUrl);
}
async function sendFeedbackOnline(item){
  if(!feedbackEndpointReady()){
    if(el.feedbackStatus)el.feedbackStatus.innerHTML='<span class="feedback-online-warn">Chưa cấu hình Google Sheet API. Góp ý đã lưu trên máy, hãy copy gửi Zalo: '+CONFIG.feedbackZalo+'</span>';
    return false;
  }
  const payload={app:'Pro Image Prep Vietnam',version:'no-login',time:item.time,type:item.type,level:item.level,imageName:item.imageName||'',contact:item.contact||'',text:item.text,userAgent:item.ua};
  try{
    await fetch(CONFIG.feedbackApiUrl,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
    if(el.feedbackStatus)el.feedbackStatus.innerHTML='<span class="feedback-online-ok">Đã gửi góp ý tự động. Nếu mạng chậm, kiểm tra Google Sheet sau vài giây.</span>';
    return true;
  }catch(err){
    if(el.feedbackStatus)el.feedbackStatus.innerHTML='<span class="feedback-online-error">Gửi tự động lỗi. Đã lưu trên máy, hãy copy gửi Zalo hoặc tải TXT.</span>';
    return false;
  }
}



/* ===== v5.5 Gmail feedback ===== */
function openFeedbackGmail(){
  const type=el.feedbackType?.value||'Góp ý';
  const img=(el.feedbackImageName?.value||'').trim();
  const text=(el.feedbackText?.value||'').trim();
  const subject=`[Pro Image Prep] ${type}`;
  const body=[
    'Loại góp ý: '+type,
    'Tên ảnh / thao tác lỗi: '+img,
    'Phiên bản: Bản không đăng nhập',
    'Trình duyệt: '+navigator.userAgent,
    '',
    'Nội dung:',
    text || '(Chưa nhập nội dung)'
  ].join('\n');
  const url='https://mail.google.com/mail/?view=cm&fs=1&to=loihoang77%40gmail.com&su='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
  window.open(url,'_blank');
  if(el.feedbackStatus)el.feedbackStatus.textContent='Đã mở Gmail soạn thư tới loihoang77@gmail.com';
}


/* ===== v6 free crop + SVG vector trace ===== */
function baseNameNoExt(name){
  const dot=(name||'image').lastIndexOf('.');
  return dot>-1?name.slice(0,dot):name;
}
async function addBlobAsItem(blob,name){
  const file=new File([blob],name,{type:blob.type||'image/png'});
  const url=URL.createObjectURL(file);
  const img=await loadImage(url);
  state.items.push({id:uid(),file,name,origUrl:url,origW:img.naturalWidth,origH:img.naturalHeight,selected:true,processedBlob:null,processedUrl:null,processedW:null,processedH:null,scannedColors:[]});
  render();
  setStatus('Đã tạo ảnh mới từ vùng cắt: '+name);
}
function activateFreeCrop(card,item){
  const overlay=card.querySelector('.scan-overlay'), sel=card.querySelector('.selection-box'), imgEl=card.querySelector('.img-original');
  if(!overlay || !sel || !imgEl){ alert('Không tìm thấy vùng cắt trên ảnh này.'); return; }
  overlay.classList.remove('hidden'); overlay.classList.add('crop-mode');
  const help=overlay.querySelector('.scan-help'); if(help) help.textContent='Kéo chọn vùng cần cắt. Thả chuột để tạo ảnh mới từ vùng đó.';
  let dragging=false,sx=0,sy=0,ex=0,ey=0;
  const pos=e=>{ const r=overlay.getBoundingClientRect(); return {x:Math.max(0,Math.min(r.width,e.clientX-r.left)), y:Math.max(0,Math.min(r.height,e.clientY-r.top))}; };
  function draw(){ const x=Math.min(sx,ex), y=Math.min(sy,ey), w=Math.abs(ex-sx), h=Math.abs(ey-sy); Object.assign(sel.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'}); }
  function finish(){
    overlay.classList.add('hidden'); overlay.classList.remove('crop-mode');
    sel.removeAttribute('style');
    if(help) help.textContent='Kéo chuột để quét 1 vùng nền';
    overlay.onpointerdown=overlay.onpointermove=overlay.onpointerup=overlay.onpointercancel=null;
  }
  async function crop(){
    const rect=imgEl.getBoundingClientRect(), or=overlay.getBoundingClientRect();
    const imgX=rect.left-or.left, imgY=rect.top-or.top, imgW=rect.width, imgH=rect.height;
    const x0=Math.min(sx,ex), y0=Math.min(sy,ey), x1=Math.max(sx,ex), y1=Math.max(sy,ey);
    const ix0=Math.max(0,Math.min(imgW,x0-imgX)), iy0=Math.max(0,Math.min(imgH,y0-imgY));
    const ix1=Math.max(0,Math.min(imgW,x1-imgX)), iy1=Math.max(0,Math.min(imgH,y1-imgY));
    if(ix1-ix0<8 || iy1-iy0<8){ alert('Vùng cắt quá nhỏ. Hãy kéo chọn vùng lớn hơn.'); return; }

    const srcUrl=item.processedUrl||item.origUrl;
    const srcW=item.processedW||item.origW;
    const srcH=item.processedH||item.origH;
    const natX=Math.round(ix0/imgW*srcW), natY=Math.round(iy0/imgH*srcH);
    const natW=Math.round((ix1-ix0)/imgW*srcW), natH=Math.round((iy1-iy0)/imgH*srcH);

    const img=await loadImage(srcUrl);
    const c=createCanvas(natW,natH), ctx=c.getContext('2d');
    ctx.clearRect(0,0,natW,natH);
    ctx.drawImage(img,natX,natY,natW,natH,0,0,natW,natH);
    const blob=await canvasToBlob(c);
    await addBlobAsItem(blob, safeName(baseNameNoExt(item.name)+'_cat-tu-do.png'));
  }
  overlay.onpointerdown=e=>{ dragging=true; const p=pos(e); sx=ex=p.x; sy=ey=p.y; draw(); try{overlay.setPointerCapture(e.pointerId)}catch(err){} };
  overlay.onpointermove=e=>{ if(!dragging)return; const p=pos(e); ex=p.x; ey=p.y; draw(); };
  overlay.onpointerup=async e=>{ if(!dragging)return; dragging=false; const p=pos(e); ex=p.x; ey=p.y; draw(); await crop(); finish(); };
  overlay.onpointercancel=finish;
}
function svgEscape(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[m]));}
async function vectorizeItem(item){
  const src=item.processedUrl||item.origUrl;
  const img=await loadImage(src);
  const maxSide=780;
  const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
  const w=Math.max(1,Math.round(img.naturalWidth*scale)), h=Math.max(1,Math.round(img.naturalHeight*scale));
  const c=createCanvas(w,h), ctx=c.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(img,0,0,w,h);
  const id=ctx.getImageData(0,0,w,h), d=id.data;
  const gray=new Uint8ClampedArray(w*h), alpha=new Uint8ClampedArray(w*h);
  for(let i=0,p=0;i<d.length;i+=4,p++){ gray[p]=(d[i]*.299+d[i+1]*.587+d[i+2]*.114)|0; alpha[p]=d[i+3]; }
  const lines=[];
  const step=2;
  for(let y=1;y<h-1;y+=step){
    let runStart=-1;
    for(let x=1;x<w-1;x+=step){
      const p=y*w+x;
      const gx=-gray[p-w-1]-2*gray[p-1]-gray[p+w-1]+gray[p-w+1]+2*gray[p+1]+gray[p+w+1];
      const gy=-gray[p-w-1]-2*gray[p-w]-gray[p-w+1]+gray[p+w-1]+2*gray[p+w]+gray[p+w+1];
      const boundary=(alpha[p]>20 && (alpha[p-1]<20||alpha[p+1]<20||alpha[p-w]<20||alpha[p+w]<20));
      const edge=(gx*gx+gy*gy>9000)||boundary;
      if(edge){
        if(runStart<0)runStart=x;
      }else if(runStart>=0){
        if(x-runStart>=2)lines.push(`M${runStart} ${y}L${x} ${y}`);
        runStart=-1;
      }
    }
    if(runStart>=0)lines.push(`M${runStart} ${y}L${w-1} ${y}`);
  }
  const title=svgEscape(baseNameNoExt(item.name));
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<title>${title} - vector trace</title>
<rect width="100%" height="100%" fill="none"/>
<g fill="none" stroke="#111111" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
<path d="${lines.join(' ')}"/>
</g>
</svg>`;
  const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});
  triggerDownload(blob,safeName(baseNameNoExt(item.name)+'_vector.svg'));
  setStatus('Đã xuất SVG dò nét: '+item.name);
}


/* ===== v7 quick image adjustment ===== */
function clampAdjust(v){ return Math.max(-100, Math.min(100, parseInt(v||0,10)||0)); }
function adjustFilterString(b,c,s){
  return `brightness(${100+clampAdjust(b)}%) contrast(${100+clampAdjust(c)}%) saturate(${100+clampAdjust(s)}%)`;
}
function readAdjustControls(card){
  return {
    brightness: clampAdjust(card.querySelector('.brightness-range')?.value || 0),
    contrast: clampAdjust(card.querySelector('.contrast-range')?.value || 0),
    saturation: clampAdjust(card.querySelector('.saturation-range')?.value || 0)
  };
}
function updateAdjustLabels(card){
  const a=readAdjustControls(card);
  const bv=card.querySelector('.brightness-val'), cv=card.querySelector('.contrast-val'), sv=card.querySelector('.saturation-val');
  if(bv)bv.textContent=(a.brightness>0?'+':'')+a.brightness;
  if(cv)cv.textContent=(a.contrast>0?'+':'')+a.contrast;
  if(sv)sv.textContent=(a.saturation>0?'+':'')+a.saturation;
}
function updateAdjustPreview(card,item){
  updateAdjustLabels(card);
  const a=readAdjustControls(card);
  const filter=adjustFilterString(a.brightness,a.contrast,a.saturation);
  const pImg=card.querySelector('.img-processed');
  const oImg=card.querySelector('.img-original');
  if(item.processedUrl){
    pImg.style.filter=filter;
    oImg.style.filter='';
  }else{
    pImg.style.filter=filter;
    oImg.style.filter='';
  }
}
function resetAdjustControls(card,item){
  const b=card.querySelector('.brightness-range'), c=card.querySelector('.contrast-range'), s=card.querySelector('.saturation-range');
  if(b)b.value=0; if(c)c.value=0; if(s)s.value=0;
  updateAdjustLabels(card);
  const pImg=card.querySelector('.img-processed'), oImg=card.querySelector('.img-original');
  if(pImg)pImg.style.filter=''; if(oImg)oImg.style.filter='';
}
async function renderAdjustedBlob(item,adjust){
  const src=item.processedUrl||item.origUrl;
  const img=await loadImage(src);
  const c=createCanvas(img.naturalWidth,img.naturalHeight);
  const ctx=c.getContext('2d');
  ctx.clearRect(0,0,c.width,c.height);
  ctx.filter=adjustFilterString(adjust.brightness,adjust.contrast,adjust.saturation);
  ctx.drawImage(img,0,0);
  ctx.filter='none';
  return await canvasToBlob(c);
}
async function applyAdjustToItem(card,item){
  const a=readAdjustControls(card);
  if(a.brightness===0 && a.contrast===0 && a.saturation===0){ alert('Bạn chưa chỉnh Sáng / Tương phản / Rực màu.'); return; }
  const blob=await renderAdjustedBlob(item,a);
  if(item.processedUrl) URL.revokeObjectURL(item.processedUrl);
  item.processedBlob=blob;
  item.processedUrl=URL.createObjectURL(blob);
  const img=await loadImage(item.processedUrl);
  item.processedW=img.naturalWidth; item.processedH=img.naturalHeight;
  setStatus('Đã áp dụng chỉnh ảnh: '+item.name);
  render();
}
async function makeAdjustedNewItem(card,item){
  const a=readAdjustControls(card);
  if(a.brightness===0 && a.contrast===0 && a.saturation===0){ alert('Bạn chưa chỉnh Sáng / Tương phản / Rực màu.'); return; }
  const blob=await renderAdjustedBlob(item,a);
  await addBlobAsItem(blob, safeName(baseNameNoExt(item.name)+'_chinh-mau.png'));
}


/* ===== R20.10 batch brightness ===== */
function batchBrightnessValue(){
  return clampAdjust(document.getElementById('batchBrightnessRange')?.value||0);
}
function batchBrightnessItems(){
  const scope=document.getElementById('batchBrightnessScope')?.value||'selected';
  return scope==='all'?state.items:state.items.filter(x=>x.selected);
}
function syncBatchBrightnessUI(value,source='range'){
  const v=clampAdjust(value);
  const range=document.getElementById('batchBrightnessRange'),num=document.getElementById('batchBrightnessNumber'),label=document.getElementById('batchBrightnessValue');
  if(range&&source!=='range')range.value=v;
  if(num&&source!=='number')num.value=v;
  if(label)label.textContent='Độ sáng: '+(v>0?'+':'')+v;
  return v;
}
function applyBatchBrightnessPreview(){
  const v=batchBrightnessValue(),targets=new Set(batchBrightnessItems().map(x=>String(x.id)));
  document.querySelectorAll('#gallery .card').forEach(card=>{
    const img=card.querySelector('.img-processed');if(!img)return;
    if(v!==0&&targets.has(String(card.dataset.id))) img.style.filter=adjustFilterString(v,0,0);
    else img.style.filter='';
  });
}
function resetBatchBrightness(){
  syncBatchBrightnessUI(0);
  applyBatchBrightnessPreview();
  setStatus('Đã đặt chỉnh sáng hàng loạt về 0.');
}
async function applyBatchBrightness(){
  if(batchRunning){setStatus('Đang có một lượt xử lý khác chạy.');return}
  const v=batchBrightnessValue(),list=batchBrightnessItems();
  if(!list.length){alert((document.getElementById('batchBrightnessScope')?.value==='selected')?'Chưa có ảnh nào được tick.':'Chưa có ảnh nào.');return}
  if(v===0){alert('Độ sáng đang là 0. Hãy kéo thanh sang trái/phải trước khi áp dụng.');return}
  batchRunning=true;batchCancelRequested=false;setBatchBusy(true);setBatchProgress(0,list.length,`Chuẩn bị chỉnh sáng ${list.length} ảnh...`);
  let done=0,failed=0;
  try{
    for(let i=0;i<list.length;i++){
      if(batchCancelRequested)break;
      const item=list[i];
      setBatchProgress(done,list.length,`Đang chỉnh sáng ${i+1}/${list.length}: ${item.name}`);
      setStatus(`Đang chỉnh sáng ${i+1}/${list.length}: ${item.name}`);
      try{
        const blob=await renderAdjustedBlob(item,{brightness:v,contrast:0,saturation:0});
        if(!blob)throw new Error('Không tạo được ảnh kết quả');
        if(item.processedUrl)URL.revokeObjectURL(item.processedUrl);
        item.processedBlob=blob;item.processedUrl=URL.createObjectURL(blob);
        const img=await loadImage(item.processedUrl);
        item.processedW=img.naturalWidth;item.processedH=img.naturalHeight;item.processError=null;
      }catch(err){
        console.error('Batch brightness:',item.name,err);failed++;
      }
      done++;setBatchProgress(done,list.length,`Đã chỉnh ${done}/${list.length}${failed?` • lỗi ${failed}`:''}`);
      updateCounts();await sleep(20);
    }
    syncBatchBrightnessUI(0);render();
    if(batchCancelRequested){
      setBatchProgress(done,list.length,`Đã dừng chỉnh sáng • ${done}/${list.length}`);
      setStatus(`Đã dừng sau ${done}/${list.length} ảnh.`);
      return;
    }
    setBatchProgress(done,list.length,`Hoàn tất chỉnh sáng ${done} ảnh${failed?` • lỗi ${failed}`:''}.`);
    setStatus(failed?`Đã chỉnh sáng ${done-failed}/${done} ảnh • ${failed} ảnh lỗi.`:`Đã chỉnh sáng hàng loạt ${done} ảnh.`);
  }finally{
    batchRunning=false;batchCancelRequested=false;setBatchBusy(false);
  }
}
(function installBatchBrightness(){
  const range=document.getElementById('batchBrightnessRange'),num=document.getElementById('batchBrightnessNumber'),scope=document.getElementById('batchBrightnessScope'),apply=document.getElementById('batchBrightnessApply'),reset=document.getElementById('batchBrightnessReset');
  if(range)range.addEventListener('input',()=>{syncBatchBrightnessUI(range.value,'range');applyBatchBrightnessPreview()});
  if(num){num.addEventListener('input',()=>{syncBatchBrightnessUI(num.value,'number');applyBatchBrightnessPreview()});num.addEventListener('change',()=>{syncBatchBrightnessUI(num.value);applyBatchBrightnessPreview()})}
  if(scope)scope.addEventListener('change',applyBatchBrightnessPreview);
  if(apply)apply.addEventListener('click',applyBatchBrightness);
  if(reset)reset.addEventListener('click',resetBatchBrightness);
  syncBatchBrightnessUI(0);
})();

function installMainProcessDelegate(){
  if(!el.gallery || el.gallery.dataset.processDelegateInstalled==='1') return;
  el.gallery.dataset.processDelegateInstalled='1';
  el.gallery.addEventListener('click', async function(e){
    const btn=e.target.closest && e.target.closest('.process1-one,.process2-one');
    if(!btn) return;
    if(document.body.dataset.mode && document.body.dataset.mode!=='prep') return;
    e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    const card=btn.closest('.card');
    const item=itemFromCard(card);
    if(!item){
      setStatus('Không tìm thấy ảnh tương ứng để xử lý.');
      alert('Không tìm thấy ảnh tương ứng để xử lý. Hãy tải lại ảnh rồi thử lại.');
      return;
    }
    if(!consumeUse()) return;
    await processOneWithUI(item,card,btn.classList.contains('process2-one')?'Đang xử lý lần 2':'Đang xử lý lần 1');
    render();
  }, true);
}

el.pickBtn.onclick=()=>el.fileInput.click(); el.dropPickBtn.onclick=(e)=>{ e.stopPropagation(); el.fileInput.click(); }; el.fileInput.onchange=e=>{ addFiles(e.target.files); el.fileInput.value=''; };
el.dropzone.onclick=(e)=>{ if(e.target.closest('button')) return; el.fileInput.click(); };
['dragenter','dragover'].forEach(ev=>el.dropzone.addEventListener(ev,e=>{ e.preventDefault(); e.stopPropagation(); el.dropzone.classList.add('dragover'); })); ['dragleave','drop'].forEach(ev=>el.dropzone.addEventListener(ev,e=>{ e.preventDefault(); e.stopPropagation(); el.dropzone.classList.remove('dragover'); })); el.dropzone.addEventListener('drop',e=>addFiles(e.dataTransfer.files));



/* ===== R5 quick dock / compact workspace ===== */
const dockMap={dockPick:'pickBtn',dockProcess:'quickAllBtn',dockDownload:'downloadAllBtn'};Object.entries(dockMap).forEach(([a,b])=>{const x=document.getElementById(a);if(x)x.onclick=()=>document.getElementById(b)?.click()});
const compactBtn=document.getElementById('compactHelpBtn');if(compactBtn){const compactRead=()=>{try{return localStorage.getItem('pip_compact_help')==='1'}catch(e){return false}};const applyCompact=()=>{const on=compactRead();document.body.classList.toggle('compact-help',on);compactBtn.textContent=on?'Hiện hướng dẫn':'Ẩn hướng dẫn'};compactBtn.onclick=()=>{try{localStorage.setItem('pip_compact_help',document.body.classList.contains('compact-help')?'0':'1')}catch(e){document.body.classList.toggle('compact-help');compactBtn.textContent=document.body.classList.contains('compact-help')?'Hiện hướng dẫn':'Ẩn hướng dẫn';return}applyCompact()};applyCompact()}
updateCounts();

/* ===== R4 local setting memory + shortcuts ===== */
const PIP_SETTING_IDS=['optRemoveBg','optDefringe','optCrop','optSharpen','removeMode','bgThreshold','scanKeep','defringePx','trimAlphaPx','paddingXPx','paddingYPx','sharpenStrength','outputSize','customW','customH','outputBgMode','customBgColor','maxFileSizeMb','strokeMode','strokePx','strokeColor','shadowMode','renameOn','renamePrefix','renameStart','renameZipName'];
function rememberOn(){const n=document.getElementById('rememberSettings');return !n||n.checked}
function snapshotSettings(){const o={};for(const id of PIP_SETTING_IDS){const n=document.getElementById(id);if(!n)continue;o[id]=n.type==='checkbox'?n.checked:n.value}return o}
function saveSettingsMemory(){if(!rememberOn())return;try{localStorage.setItem('pip_settings_v4',JSON.stringify(snapshotSettings()))}catch(e){}}
function restoreSettingsMemory(){try{const o=JSON.parse(localStorage.getItem('pip_settings_v4')||'null');if(!o)return;for(const [id,v] of Object.entries(o))setVal(id,v)}catch(e){console.warn('restore settings',e)}}
let saveSettingsTimer=0;document.addEventListener('input',e=>{if(PIP_SETTING_IDS.includes(e.target?.id)){clearTimeout(saveSettingsTimer);saveSettingsTimer=setTimeout(saveSettingsMemory,180)}});document.addEventListener('change',e=>{if(PIP_SETTING_IDS.includes(e.target?.id))saveSettingsMemory()});
const rememberBox=document.getElementById('rememberSettings');if(rememberBox){try{rememberBox.checked=localStorage.getItem('pip_remember')!=='0'}catch(e){rememberBox.checked=true}rememberBox.onchange=()=>{try{localStorage.setItem('pip_remember',rememberBox.checked?'1':'0');if(!rememberBox.checked)localStorage.removeItem('pip_settings_v4')}catch(e){}if(rememberBox.checked)saveSettingsMemory()}}
restoreSettingsMemory();
document.addEventListener('keydown',e=>{
  if(e.ctrlKey && !e.shiftKey && e.key.toLowerCase()==='o'){e.preventDefault();document.getElementById('pickBtn')?.click();}
  if(e.ctrlKey && e.key==='Enter'){e.preventDefault();document.getElementById('quickAllBtn')?.click();}
  if(e.ctrlKey && e.shiftKey && e.key.toLowerCase()==='s'){e.preventDefault();document.getElementById('downloadAllBtn')?.click();}
  if(e.key==='Escape' && batchRunning){e.preventDefault();requestBatchStop();}
});

/* ===== R3 selection & clipboard ===== */
let deleteUndoBuffer=null,deleteUndoTimer=0;
function updateUndoButton(){const b=document.getElementById('undoDeleteBtn');if(!b)return;const n=deleteUndoBuffer?.items?.length||0;b.disabled=!n;b.classList.toggle('undo-ready',!!n);b.textContent=n?`↶ Hoàn tác xóa (${n})`:'↶ Hoàn tác xóa';}
function discardUndoBuffer(){if(deleteUndoBuffer?.items)deleteUndoBuffer.items.forEach(cleanup);deleteUndoBuffer=null;clearTimeout(deleteUndoTimer);updateUndoButton();}
function stashDeleted(items){if(deleteUndoBuffer)discardUndoBuffer();deleteUndoBuffer={items:[...items],at:Date.now()};clearTimeout(deleteUndoTimer);deleteUndoTimer=setTimeout(discardUndoBuffer,120000);updateUndoButton();}
function undoLastDelete(){if(guardBatchMutation('hoàn tác xóa'))return;if(!deleteUndoBuffer?.items?.length)return;const items=deleteUndoBuffer.items;deleteUndoBuffer=null;clearTimeout(deleteUndoTimer);state.items.push(...items);render();updateCounts();updateUndoButton();setStatus(`Đã hoàn tác ${items.length} ảnh.`);}
const undoDeleteBtn=document.getElementById('undoDeleteBtn');if(undoDeleteBtn)undoDeleteBtn.onclick=undoLastDelete;updateUndoButton();

function setSelection(mode){
  for(const item of state.items){ if(mode==='all')item.selected=true; else if(mode==='none')item.selected=false; else if(mode==='unprocessed')item.selected=!item.processedBlob; else if(mode==='invert')item.selected=!item.selected; }
  render(); updateCounts();
}
[['selectAllBtn','all'],['selectNoneBtn','none'],['selectUnprocessedBtn','unprocessed'],['invertSelectionBtn','invert']].forEach(([id,m])=>{const b=document.getElementById(id);if(b)b.onclick=()=>setSelection(m)});
const retryErrorsBtn=document.getElementById('retryErrorsBtn');if(retryErrorsBtn)retryErrorsBtn.onclick=()=>{const list=state.items.filter(x=>x.processError);if(!list.length)return setStatus('Không có ảnh lỗi cần thử lại.');processList(list,false)};
const gallerySearch=document.getElementById('gallerySearch'),galleryFilter=document.getElementById('galleryFilter');
let gallerySearchTimer=0;
if(gallerySearch) gallerySearch.addEventListener('input',()=>{clearTimeout(gallerySearchTimer);gallerySearchTimer=setTimeout(()=>render(),90)}); if(galleryFilter) galleryFilter.addEventListener('change',()=>render());

document.addEventListener('paste',e=>{
  if(['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
  const files=[...(e.clipboardData?.files||[])].filter(f=>f.type.startsWith('image/'));
  if(files.length){ e.preventDefault(); addFiles(files); setStatus('Đã dán '+files.length+' ảnh từ clipboard.'); }
});

let batchDownloadRunning=false;
async function downloadMainBatch(){
  if(batchRunning) return setStatus('Hãy chờ xử lý xong hoặc bấm Dừng trước khi tải hàng loạt.');
  if(batchDownloadRunning) return setStatus('Đang tải hàng loạt.');
  const list=state.items.filter(x=>x.selected&&x.processedBlob).map((x,i)=>({name:filenameProcessed(x,i), blob:x.processedBlob}));
  if(!list.length) return alert('Chưa có ảnh đã xử lý để tải.');
  batchDownloadRunning=true; const btn=el.downloadAllBtn; if(btn){btn.disabled=true;btn.classList.add('busy');btn.textContent='Đang tải...';}
  try{
    const result=await downloadFilesBatch(list,msg=>setStatus(msg));
    setStatus(result.mode==='folder'?`Đã lưu ${result.count} ảnh riêng vào thư mục đã chọn.`:`Đã gửi ${result.count} ảnh để tải riêng lẻ. Nếu Chrome hỏi, hãy cho phép tải nhiều file.`);
    return true;
  }catch(e){
    if(e&&e.name==='AbortError') setStatus('Đã hủy chọn thư mục.');
    else {console.error(e);setStatus('Lỗi tải hàng loạt: '+(e.message||e));alert('Không tải được hàng loạt. Hãy thử lại.');}
    return false;
  }finally{batchDownloadRunning=false;if(btn){btn.disabled=false;btn.classList.remove('busy');btn.textContent='Tải hàng loạt';}}
}
if(el.quickAllBtn) el.quickAllBtn.onclick=()=>processList(state.items,true); el.processAllBtn.onclick=()=>processList(state.items,false); el.processSelectedBtn.onclick=()=>processList(state.items.filter(x=>x.selected),false); el.downloadAllBtn.onclick=downloadMainBatch;
el.clearBtn.onclick=()=>{ if(guardBatchMutation('xóa danh sách'))return; if(!state.items.length)return setStatus('Danh sách đang trống.'); if(!confirm('Xóa toàn bộ danh sách ảnh?')) return; const old=[...state.items]; stashDeleted(old); state.items=[]; render(); setBatchProgress(0,0,'Sẵn sàng xử lý ảnh hàng loạt.'); setStatus(`Đã xóa ${old.length} ảnh • có thể Hoàn tác.`); };
if(el.copyFirstColorsBtn) el.copyFirstColorsBtn.onclick=()=>{ const first=state.items.find(x=>x.scannedColors.length); if(!first) return alert('Chưa có ảnh nào được quét màu nền.'); for(const item of state.items){ item.scannedColors=first.scannedColors.map(c=>[...c]); } render(); setStatus('Đã áp màu quét đầu tiên cho tất cả ảnh.'); };
if(el.resetSettingsBtn) el.resetSettingsBtn.onclick=applyDefaults;
if(el.openGmailFeedbackBtn) el.openGmailFeedbackBtn.onclick=openFeedbackGmail;

if(el.zoomInBtn) el.zoomInBtn.onclick=()=>changeLightboxZoom(.5);
if(el.zoomOutBtn) el.zoomOutBtn.onclick=()=>changeLightboxZoom(-.5);
if(el.zoomResetBtn) el.zoomResetBtn.onclick=()=>resetLightboxZoom(2.2);
if(el.lightboxBody){
  el.lightboxBody.onwheel=(e)=>{e.preventDefault();changeLightboxZoom(e.deltaY<0?.35:-.35)};
  el.lightboxBody.onpointerdown=(e)=>{if(el.lightbox.classList.contains('hidden'))return;lightboxZoom.drag=true;lightboxZoom.sx=e.clientX;lightboxZoom.sy=e.clientY;lightboxZoom.ox=lightboxZoom.x;lightboxZoom.oy=lightboxZoom.y;el.lightboxBody.classList.add('dragging');el.lightboxBody.setPointerCapture(e.pointerId)};
  el.lightboxBody.onpointermove=(e)=>{if(!lightboxZoom.drag)return;lightboxZoom.x=lightboxZoom.ox+(e.clientX-lightboxZoom.sx);lightboxZoom.y=lightboxZoom.oy+(e.clientY-lightboxZoom.sy);applyLightboxTransform()};
  el.lightboxBody.onpointerup=(e)=>{lightboxZoom.drag=false;el.lightboxBody.classList.remove('dragging')};
  el.lightboxBody.onpointercancel=()=>{lightboxZoom.drag=false;el.lightboxBody.classList.remove('dragging')};
}
if(el.sendFeedbackBtn) el.sendFeedbackBtn.onclick=async()=>{const item=saveFeedbackOnly(); if(!item)return; await sendFeedbackOnline(item);};

if(el.bgThreshold) el.bgThreshold.oninput=()=>safeSetText(el.bgThresholdVal, el.bgThreshold.value);
if(el.sharpenStrength) el.sharpenStrength.oninput=()=>safeSetText(el.sharpenStrengthVal, el.sharpenStrength.value); el.closeLightbox.onclick=closeLightbox; el.lightbox.onclick=(e)=>{ if(e.target===el.lightbox) closeLightbox(); };


if(el.langSelect) el.langSelect.onchange=()=>{storageSet('pip_lang',el.langSelect.value);applyLang();};
if(el.outputSize) el.outputSize.onchange=()=>el.customSizeRow.classList.toggle('hidden',el.outputSize.value!=='custom');
if(el.outputBgMode) el.outputBgMode.onchange=()=>el.customBgColor.classList.toggle('hidden',el.outputBgMode.value!=='custom');



if(el.openFeedbackBtn) el.openFeedbackBtn.onclick=()=>document.querySelector('.feedback-card')?.scrollIntoView({behavior:'smooth',block:'start'});
if(el.saveFeedbackBtn) el.saveFeedbackBtn.onclick=()=>saveFeedbackOnly();
if(el.copyFeedbackBtn) el.copyFeedbackBtn.onclick=async()=>{
  const item=saveFeedbackOnly(); if(!item)return;
  const txt=buildFeedbackText(item);
  await navigator.clipboard.writeText(txt);
  if(el.feedbackStatus)el.feedbackStatus.textContent='Đã copy góp ý. Khách có thể dán gửi Zalo cho bạn: '+CONFIG.feedbackZalo;
};
if(el.downloadFeedbackBtn) el.downloadFeedbackBtn.onclick=()=>{
  const list=getFeedbackList();
  if(!list.length){alert('Chưa có góp ý nào được lưu.');return}
  const content=list.map(buildFeedbackText).join('\n\n================================\n\n');
  downloadTextFile(content,'gop-y.txt');
};

const toggleFreeCrop=document.getElementById('toggleFreeCrop');
if(toggleFreeCrop){ toggleFreeCrop.checked=cropToolEnabled(); toggleFreeCrop.onchange=()=>{ storageSet('pip_showFreeCrop', toggleFreeCrop.checked?'1':'0'); refreshOptionalCropButtons(); }; }
if(el.cropPadXQuick){ el.cropPadXQuick.addEventListener('input',()=>{ if(el.paddingXPx) el.paddingXPx.value=el.cropPadXQuick.value||0; syncCropPadUI('quick'); }); }
if(el.cropPadYQuick){ el.cropPadYQuick.addEventListener('input',()=>{ if(el.paddingYPx) el.paddingYPx.value=el.cropPadYQuick.value||0; syncCropPadUI('quick'); }); }
if(el.paddingXPx){ el.paddingXPx.addEventListener('input',()=>syncCropPadUI('advanced')); }
if(el.paddingYPx){ el.paddingYPx.addEventListener('input',()=>syncCropPadUI('advanced')); }
document.querySelectorAll('.crop-pad-chip').forEach(btn=>btn.addEventListener('click',()=>setCropPadBoth(btn.dataset.cropPad)));
syncCropPadUI();

installMainProcessDelegate();
applyLang();
refreshOptionalCropButtons();

render();

window.addEventListener('error', e=>{
  try{ if(typeof setStatus==='function') setStatus('Lỗi JS: '+(e.message||'không rõ')); }catch(err){}
});
window.addEventListener('unhandledrejection', e=>{
  try{ if(typeof setStatus==='function') setStatus('Lỗi xử lý: '+((e.reason&&e.reason.message)||e.reason||'không rõ')); }catch(err){}
});

/* v23_global_error_marker */
window.addEventListener('error', e=>{
  try{ setStatus('Lỗi JS: '+(e.message||'không rõ')); }catch(err){}
});
window.addEventListener('unhandledrejection', e=>{
  try{ setStatus('Lỗi xử lý: '+((e.reason&&e.reason.message)||e.reason||'không rõ')); }catch(err){}
});

/* v25_missing_helper_guard */
if(typeof window!=='undefined'){
  window.addEventListener('error', e=>{
    try{ if(typeof setStatus==='function') setStatus('Lỗi JS: '+(e.message||'không rõ')); }catch(err){}
  });
}
