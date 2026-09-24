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
    .p-paste-btn:disabled{opacity:.42;cursor:not-allowed;background:#111827;border-color:#29374b}
    .p-paste-status{font-size:11px;color:#8fa3bf;min-height:16px}
    .p-paste-status.ok{color:#86efac}.p-paste-status.err{color:#fca5a5}
    .p-bg-tools{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:10px;padding-top:9px;border-top:1px solid #26364d}
    .p-bg-label{font-size:11.5px;font-weight:800;color:#dbeafe;margin-right:2px}
    .p-bg-tools .p-paste-btn.is-active{border-color:#60a5fa;background:#17345c;box-shadow:0 0 0 2px rgba(96,165,250,.12)}
    .p-bg-chip{width:22px;height:22px;border-radius:6px;border:1px solid #52657f;background:linear-gradient(45deg,#fff 25%,#ddd 25%,#ddd 50%,#fff 50%,#fff 75%,#ddd 75%);background-size:8px 8px}
    .p-bg-range{display:inline-flex;align-items:center;gap:6px;color:#9fb0c8;font-size:11px;margin-left:3px}
    .p-bg-range input{width:110px;accent-color:#60a5fa}
    .p-bg-hint{width:100%;font-size:10.8px;color:#8396b2;line-height:1.4}
    @media(max-width:700px){.p-paste-head{align-items:flex-start;flex-direction:column}.p-paste-box{padding:10px}.p-bg-range{width:100%}.p-bg-range input{flex:1}}
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
    if(!file)return false;
    const type=file.type||'image/png';
    const ext=type.includes('jpeg')?'jpg':type.includes('webp')?'webp':'png';
    const named=(file.name&&file.name!=='image.png')?file:new File([file],`corel-paste-${stamp()}.${ext}`,{type,lastModified:Date.now()});
    try{
      window.dispatchEvent(new CustomEvent('nameset:overlayFile',{detail:{file:named,fileName:named.name,source}}));
      window.dispatchEvent(new CustomEvent('nameset:corelPaste',{detail:{fileName:named.name,source}}));
      setMsg(`✓ Đã thêm ảnh lên trên nền: ${named.name}`,'ok');
      const zone=$('p_clipPasteZone');
      if(zone){zone.classList.remove('is-over');zone.focus({preventScroll:true});}
      return true;
    }catch(err){
      console.error('Corel overlay paste:',err);
      setMsg('Không thêm được ảnh clipboard lên preview. Hãy thử Ctrl+V lại.','err');
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
        <div class="p-paste-title">Dán thêm ảnh từ Corel</div>
        <div class="p-paste-key">Ctrl + V</div>
      </div>
      <div class="p-paste-desc">Copy tên/số/logo trong Corel → quay lại đây → click ô này và nhấn <b>Ctrl+V</b>. Ảnh được thêm thành lớp riêng. <b>Kéo giữa</b> để di chuyển, <b>8 ô xanh</b> để co giãn, <b>4 nút tròn ở góc</b> để xoay. Nếu kéo sai, bấm <b>Hoàn tác</b>.</div>
      <div class="p-paste-actions">
        <button type="button" id="p_clipPasteBtn" class="p-paste-btn">Dán thêm ảnh</button>
        <button type="button" id="p_clipToggleBtn" class="p-paste-btn">Ẩn/hiện ảnh dán</button>
        <button type="button" id="p_clipUndoBtn" class="p-paste-btn" disabled>↶ Hoàn tác</button>
        <button type="button" id="p_clipResetBtn" class="p-paste-btn">Đặt lại vị trí</button>
        <button type="button" id="p_clipClearBtn" class="p-paste-btn">Xóa ảnh dán</button>
        <span id="p_clipPasteStatus" class="p-paste-status">Sẵn sàng nhận ảnh PNG/JPG/WebP từ clipboard.</span>
      </div>
      <div class="p-bg-tools">
        <span class="p-bg-label">Xóa nền ảnh dán:</span>
        <button type="button" id="p_bgNoneBtn" class="p-paste-btn is-active">Không</button>
        <button type="button" id="p_bgWhiteBtn" class="p-paste-btn">Trắng</button>
        <button type="button" id="p_bgBlackBtn" class="p-paste-btn">Đen</button>
        <button type="button" id="p_bgPickBtn" class="p-paste-btn">Ống hút màu</button>
        <span id="p_bgColorChip" class="p-bg-chip" title="Màu nền đang chọn"></span>
        <label class="p-bg-range">Dung sai
          <input id="p_bgTolerance" type="range" min="0" max="120" step="1" value="36">
          <b id="p_bgToleranceValue">36</b>
        </label>
        <div class="p-bg-hint">Ảnh số thường là nền trắng/chữ đen hoặc nền đen/chữ trắng. Chọn nhanh Trắng/Đen; nếu nền màu khác, bấm <b>Ống hút màu</b> rồi click đúng màu nền trên ảnh dán.</div>
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
    $('p_clipToggleBtn')?.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('nameset:overlayCommand',{detail:{command:'toggle'}})));
    $('p_clipUndoBtn')?.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('nameset:overlayCommand',{detail:{command:'undo'}})));
    $('p_clipResetBtn')?.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('nameset:overlayCommand',{detail:{command:'reset'}})));
    $('p_clipClearBtn')?.addEventListener('click',()=>{window.dispatchEvent(new CustomEvent('nameset:overlayCommand',{detail:{command:'clear'}}));setMsg('Đã xóa ảnh dán thêm.');});
    window.addEventListener('nameset:overlayUndoState',e=>{const b=$('p_clipUndoBtn');if(!b)return;const n=Number(e.detail?.count)||0;b.disabled=!e.detail?.available;b.textContent=n?('↶ Hoàn tác ('+n+')'):'↶ Hoàn tác';});
    const bgBtns=['p_bgNoneBtn','p_bgWhiteBtn','p_bgBlackBtn','p_bgPickBtn'];
    const activeBg=id=>bgBtns.forEach(x=>$(x)?.classList.toggle('is-active',x===id));
    $('p_bgNoneBtn')?.addEventListener('click',()=>{activeBg('p_bgNoneBtn');window.dispatchEvent(new CustomEvent('nameset:overlayCommand',{detail:{command:'bg-none'}}));setMsg('Không xóa nền ảnh dán.');});
    $('p_bgWhiteBtn')?.addEventListener('click',()=>{activeBg('p_bgWhiteBtn');const chip=$('p_bgColorChip');if(chip)chip.style.background='#FFFFFF';window.dispatchEvent(new CustomEvent('nameset:overlayCommand',{detail:{command:'bg-white'}}));setMsg('Đang xóa nền trắng. Nếu còn viền, tăng Dung sai.','ok');});
    $('p_bgBlackBtn')?.addEventListener('click',()=>{activeBg('p_bgBlackBtn');const chip=$('p_bgColorChip');if(chip)chip.style.background='#000000';window.dispatchEvent(new CustomEvent('nameset:overlayCommand',{detail:{command:'bg-black'}}));setMsg('Đang xóa nền đen. Nếu còn viền, tăng Dung sai.','ok');});
    $('p_bgPickBtn')?.addEventListener('click',()=>{activeBg('p_bgPickBtn');window.dispatchEvent(new CustomEvent('nameset:overlayCommand',{detail:{command:'bg-pick'}}));setMsg('Ống hút đang bật: click đúng vào màu nền trên ảnh dán.');});
    $('p_bgTolerance')?.addEventListener('input',e=>{const v=Number(e.target.value)||0;const n=$('p_bgToleranceValue');if(n)n.textContent=String(v);});
    $('p_bgTolerance')?.addEventListener('change',e=>{const v=Number(e.target.value)||0;window.dispatchEvent(new CustomEvent('nameset:overlayCommand',{detail:{command:'bg-tolerance',value:v}}));setMsg(`Dung sai xóa nền: ${v}.`);});
    window.addEventListener('nameset:overlayPickedColor',e=>{const color=e.detail?.color||'';const chip=$('p_bgColorChip');if(chip&&color)chip.style.background=color;activeBg('p_bgPickBtn');setMsg(`✓ Đã chích màu nền ${color}. Chỉnh Dung sai nếu cần.`,'ok');});
    window.addEventListener('nameset:overlayBgReset',()=>{activeBg('p_bgNoneBtn');const chip=$('p_bgColorChip');if(chip)chip.style.background='';});
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
  window.namesetPaste={install,useImageFile,version:'R20.9'};
})();