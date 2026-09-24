(()=>{
  if(window.__NAMESET_PASTE_R205)return;
  window.__NAMESET_PASTE_R205=1;
  const $=id=>document.getElementById(id);

  const style=document.createElement('style');
  style.textContent=`
    .p-paste-box{margin-top:10px;padding:12px;border:1.5px dashed #4b6284;border-radius:11px;background:#0b1422;outline:none;transition:.15s}
    .p-paste-box:hover,.p-paste-box:focus,.p-paste-box.is-over{border-color:#6d8cff;background:#101d31;box-shadow:0 0 0 3px rgba(91,124,255,.10)}
    .p-paste-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
    .p-paste-title{font-weight:800;color:#eef3ff;font-size:13px}
    .p-paste-key{display:inline-flex;align-items:center;gap:4px;padding:4px 7px;border-radius:7px;background:#172338;border:1px solid #334764;color:#bfdbfe;font-size:11px;font-weight:800;white-space:nowrap}
    .p-paste-desc{margin-top:5px;color:#9fb0c8;font-size:11.5px;line-height:1.45}
    .p-paste-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-top:9px}
    .p-paste-btn{appearance:none;border:1px solid #3d4d63;border-radius:8px;background:#182234;color:#eef3ff;padding:7px 10px;font-size:11.5px;font-weight:750;cursor:pointer}
    .p-paste-btn:hover{border-color:#6f88b7;background:#202d43}
    .p-paste-status{font-size:11px;color:#8fa3bf;min-height:16px}
    .p-paste-status.ok{color:#86efac}.p-paste-status.err{color:#fca5a5}
    @media(max-width:700px){.p-paste-head{align-items:flex-start;flex-direction:column}.p-paste-box{padding:10px}}
  `;
  document.head.appendChild(style);

  function previewActive(){
    const sec=$('previewSection');
    if(!sec)return false;
    return document.body.dataset.mode==='preview' || !sec.classList.contains('hidden');
  }
  function stamp(){
    const d=new Date(),p=n=>String(n).padStart(2,'0');
    return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());
  }
  function imageFromClipboardData(data){
    if(!data)return null;
    const items=Array.from(data.items||[]);
    const item=items.find(x=>x.kind==='file'&&/^image\//i.test(x.type||''));
    return item?item.getAsFile():null;
  }
  function setMsg(msg,kind=''){
    const n=$('p_clipPasteStatus');if(!n)return;
    n.textContent=msg;n.className='p-paste-status'+(kind?' '+kind:'');
  }
  function useImageFile(file,source='clipboard'){
    const input=$('p_bgFile');
    if(!input||!file)return false;
    const type=file.type||'image/png';
    const ext=type.includes('jpeg')?'jpg':type.includes('webp')?'webp':'png';
    const named=(file.name&&file.name!=='image.png')?file:new File([file],`corel-paste-${stamp()}.${ext}`,{type,lastModified:Date.now()});
    try{
      const dt=new DataTransfer();
      dt.items.add(named);
      input.files=dt.files;
      input.dispatchEvent(new Event('change',{bubbles:true}));
      window.dispatchEvent(new CustomEvent('nameset:corelPaste',{detail:{fileName:named.name,source}}));
      setMsg(`✓ Đã nhận ảnh từ ${source}: ${named.name}`,'ok');
      const zone=$('p_clipPasteZone');
      if(zone){zone.classList.remove('is-over');zone.focus({preventScroll:true});}
      return true;
    }catch(err){
      console.error('Corel clipboard paste:',err);
      setMsg('Không đưa được ảnh clipboard vào preview. Hãy thử Ctrl+V lại.','err');
      return false;
    }
  }
  async function readClipboardButton(){
    if(!navigator.clipboard?.read){
      setMsg('Chrome không cho đọc clipboard bằng nút này. Click ô rồi nhấn Ctrl+V.','err');return;
    }
    try{
      setMsg('Đang đọc clipboard...');
      const list=await navigator.clipboard.read();
      for(const item of list){
        const type=(item.types||[]).find(t=>/^image\//i.test(t));
        if(type){const blob=await item.getType(type);useImageFile(new File([blob],`corel-paste-${stamp()}.png`,{type:blob.type||'image/png'}),'clipboard');return;}
      }
      setMsg('Clipboard chưa có ảnh. Copy ảnh trong Corel rồi thử lại.','err');
    }catch(err){
      console.warn('navigator.clipboard.read failed',err);
      setMsg('Hãy click vào ô dán rồi nhấn Ctrl+V.','err');
    }
  }
  function onPaste(e){
    if(!previewActive())return;
    const f=imageFromClipboardData(e.clipboardData);
    if(!f)return;
    e.preventDefault();
    useImageFile(f,'Corel / Ctrl+V');
  }
  function install(){
    const sec=$('previewSection'),input=$('p_bgFile');
    if(!sec||!input)return false;
    if($('p_clipPasteZone'))return true;
    const field=input.closest('.field')||input.parentElement;
    if(!field)return false;
    const zone=document.createElement('div');
    zone.id='p_clipPasteZone';
    zone.className='p-paste-box';
    zone.tabIndex=0;
    zone.setAttribute('role','button');
    zone.setAttribute('aria-label','Dán ảnh từ Corel bằng Ctrl V');
    zone.innerHTML=`
      <div class="p-paste-head">
        <div class="p-paste-title">Dán nhanh ảnh từ Corel</div>
        <div class="p-paste-key">Ctrl + V</div>
      </div>
      <div class="p-paste-desc">Copy đối tượng/ảnh trong Corel → quay lại đây → click ô này và nhấn <b>Ctrl+V</b>. Ảnh sẽ tự thay ảnh nền preview, không cần lưu file rồi chọn lại.</div>
      <div class="p-paste-actions">
        <button type="button" id="p_clipPasteBtn" class="p-paste-btn">Dán từ clipboard</button>
        <span id="p_clipPasteStatus" class="p-paste-status">Sẵn sàng nhận ảnh PNG/JPG/WebP từ clipboard.</span>
      </div>`;
    field.after(zone);
    zone.addEventListener('click',e=>{if(e.target.closest('button'))return;zone.focus()});
    zone.addEventListener('paste',onPaste);
    zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('is-over')});
    zone.addEventListener('dragleave',()=>zone.classList.remove('is-over'));
    zone.addEventListener('drop',e=>{
      e.preventDefault();zone.classList.remove('is-over');
      const f=Array.from(e.dataTransfer?.files||[]).find(x=>/^image\//i.test(x.type||'')||/\.(png|jpe?g|webp)$/i.test(x.name||''));
      if(f)useImageFile(f,'kéo thả');else setMsg('File vừa thả không phải ảnh hỗ trợ.','err');
    });
    $('p_clipPasteBtn')?.addEventListener('click',readClipboardButton);
    document.addEventListener('paste',e=>{
      if(!previewActive()||zone.contains(e.target))return;
      const f=imageFromClipboardData(e.clipboardData);
      if(!f)return;
      e.preventDefault();useImageFile(f,'Corel / Ctrl+V');
    });
    return true;
  }
  if(!install()){
    const mo=new MutationObserver(()=>{if(install())mo.disconnect()});
    mo.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(install,600);
  }
  window.namesetPaste={install,useImageFile,version:'R20.5'};
})();