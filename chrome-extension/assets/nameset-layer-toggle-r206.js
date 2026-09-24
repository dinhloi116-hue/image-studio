(()=>{
  if(window.__NAMESET_LAYER_TOGGLE_R206)return;
  window.__NAMESET_LAYER_TOGGLE_R206=1;
  const $=id=>document.getElementById(id);
  const STORE={name:'',number:'',ready:false};

  const style=document.createElement('style');
  style.textContent=`
    .p-layer-toggle-box{margin:8px 0 10px;padding:9px 10px;border:1px solid #2f4057;border-radius:10px;background:#0c1523}
    .p-layer-toggle-title{font-size:11.5px;color:#9fb0c8;margin-bottom:7px}
    .p-layer-toggle-row{display:grid;grid-template-columns:1fr 1fr;gap:7px}
    .p-layer-toggle{display:flex;align-items:center;gap:8px;padding:8px 9px;border:1px solid #334155;border-radius:9px;background:#111c2d;color:#e5edf8;font-size:12px;font-weight:750;cursor:pointer;user-select:none}
    .p-layer-toggle input{width:17px;height:17px;accent-color:#5b7cff}
    .p-layer-toggle.off{opacity:.65;background:#0d131d;color:#94a3b8}
    .p-layer-note{margin-top:7px;color:#8495ac;font-size:10.8px;line-height:1.4}
    @media(max-width:620px){.p-layer-toggle-row{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function fire(el){
    if(!el)return;
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function captureCurrent(){
    const n=$('p_nameText'),num=$('p_numberText');
    if(!STORE.ready){
      STORE.name=n?.value||'';
      STORE.number=num?.value||'';
      STORE.ready=true;
    }
  }
  function setLayer(kind,on,{silent=false}={}){
    captureCurrent();
    const isName=kind==='name';
    const input=$(isName?'p_nameText':'p_numberText');
    const toggle=$(isName?'p_showNamePreview':'p_showNumberPreview');
    if(!input)return;
    const key=isName?'name':'number';
    if(on){
      input.disabled=false;
      if(input.value==='' && STORE[key]!=='')input.value=STORE[key];
    }else{
      if(input.value!=='')STORE[key]=input.value;
      input.value='';
      input.disabled=true;
    }
    if(toggle)toggle.checked=!!on;
    toggle?.closest('.p-layer-toggle')?.classList.toggle('off',!on);
    fire(input);
    if(!silent){
      const st=$('p_status');
      if(st)st.textContent=(on?'Đã bật ':'Đã tắt ')+(isName?'tên':'số')+' preview.';
    }
  }
  function hideAllForCorel(){
    setLayer('name',false,{silent:true});
    setLayer('number',false,{silent:true});
    const st=$('p_status');
    if(st)st.textContent='Đã dán ảnh từ Corel • đã tắt tên và số preview để không che ảnh.';
  }
  function previewActive(){
    const sec=$('previewSection');
    return !!sec && (document.body.dataset.mode==='preview'||!sec.classList.contains('hidden'));
  }
  function clipboardHasImage(dt){
    return Array.from(dt?.items||[]).some(x=>x.kind==='file'&&/^image\//i.test(x.type||''));
  }
  function install(){
    const name=$('p_nameText'),num=$('p_numberText');
    if(!name||!num)return false;
    if($('p_layerToggleBox'))return true;
    captureCurrent();

    const section=name.closest('.preview-card');
    if(!section)return false;
    const title=[...section.querySelectorAll('h3')].find(x=>/2\)\s*Nội dung/i.test(x.textContent||''))||section.querySelector('h3');
    const box=document.createElement('div');
    box.id='p_layerToggleBox';
    box.className='p-layer-toggle-box';
    box.innerHTML=`
      <div class="p-layer-toggle-title">Lớp chữ preview</div>
      <div class="p-layer-toggle-row">
        <label class="p-layer-toggle"><input id="p_showNamePreview" type="checkbox" checked> Hiện tên preview</label>
        <label class="p-layer-toggle"><input id="p_showNumberPreview" type="checkbox" checked> Hiện số preview</label>
      </div>
      <div class="p-layer-note">Tắt lớp nào thì lớp đó không xuất hiện trên ảnh. Khi dán ảnh từ Corel, tool tự tắt cả hai để không che nội dung đã có sẵn.</div>`;
    if(title)title.after(box);else section.prepend(box);

    $('p_showNamePreview').addEventListener('change',e=>setLayer('name',e.target.checked));
    $('p_showNumberPreview').addEventListener('change',e=>setLayer('number',e.target.checked));

    name.addEventListener('input',()=>{if(!name.disabled)STORE.name=name.value});
    num.addEventListener('input',()=>{if(!num.disabled)STORE.number=num.value});

    document.addEventListener('paste',e=>{
      if(previewActive()&&clipboardHasImage(e.clipboardData))hideAllForCorel();
    },true);

    document.addEventListener('drop',e=>{
      if(!previewActive())return;
      const has=Array.from(e.dataTransfer?.files||[]).some(f=>/^image\//i.test(f.type||'')||/\.(png|jpe?g|webp)$/i.test(f.name||''));
      if(has && e.target?.closest?.('#p_clipPasteZone'))hideAllForCorel();
    },true);

    window.addEventListener('nameset:corelPaste',hideAllForCorel);
    return true;
  }

  if(!install()){
    const mo=new MutationObserver(()=>{if(install())mo.disconnect()});
    mo.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(install,600);
  }
  window.namesetLayerToggle={install,setLayer,hideAll:hideAllForCorel,version:'R20.6'};
})();