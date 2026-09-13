(()=>{
  if(window.__HALFTONE_ZOOM_R202)return;
  window.__HALFTONE_ZOOM_R202=1;

  const $=id=>document.getElementById(id);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  const style=document.createElement('style');
  style.textContent=`
    #ht2Orig,#ht2Out{cursor:zoom-in!important}
    .htz-modal{position:fixed;inset:0;z-index:999999;background:rgba(2,6,23,.96);display:grid;grid-template-rows:auto 1fr;color:#e5e7eb;font-family:Segoe UI,Arial,sans-serif}
    .htz-modal.hidden{display:none!important}
    .htz-bar{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#0b1220;border-bottom:1px solid #334155;box-shadow:0 8px 24px #0005}
    .htz-title{min-width:0;flex:1;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .htz-help{font-size:12px;color:#94a3b8;white-space:nowrap}
    .htz-btn{appearance:none;border:1px solid #3b4a60;background:#172234;color:#f8fafc;border-radius:10px;padding:8px 11px;font-weight:800;cursor:pointer}
    .htz-btn:hover{background:#213149}.htz-close{background:#7f1d1d;border-color:#ef4444}
    .htz-stage{position:relative;overflow:hidden;display:grid;place-items:center;cursor:grab;touch-action:none;background-color:#111827;background-image:linear-gradient(45deg,#263449 25%,transparent 25%),linear-gradient(-45deg,#263449 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#263449 75%),linear-gradient(-45deg,transparent 75%,#263449 75%);background-size:24px 24px;background-position:0 0,0 12px,12px -12px,-12px 0}
    .htz-stage.dragging{cursor:grabbing}
    .htz-img{display:block;max-width:92vw;max-height:86vh;object-fit:contain;transform-origin:center center;will-change:transform;user-select:none;-webkit-user-drag:none;box-shadow:0 18px 55px #0009}
    .htz-badge{position:absolute;left:14px;bottom:14px;padding:7px 10px;border-radius:999px;background:rgba(2,6,23,.82);border:1px solid #334155;color:#cbd5e1;font-size:12px;pointer-events:none}
    @media(max-width:760px){.htz-help{display:none}.htz-bar{gap:6px;padding:8px}.htz-btn{padding:7px 9px}.htz-title{font-size:13px}}
  `;
  document.head.appendChild(style);

  const modal=document.createElement('div');
  modal.id='htzModal';
  modal.className='htz-modal hidden';
  modal.innerHTML=`
    <div class="htz-bar">
      <div id="htzTitle" class="htz-title">Xem ảnh</div>
      <div class="htz-help">Lăn chuột để zoom • kéo để di chuyển • double click về 100%</div>
      <button type="button" id="htzMinus" class="htz-btn">−</button>
      <button type="button" id="htzReset" class="htz-btn">100%</button>
      <button type="button" id="htzPlus" class="htz-btn">+</button>
      <button type="button" id="htzClose" class="htz-btn htz-close">Đóng</button>
    </div>
    <div id="htzStage" class="htz-stage">
      <img id="htzImg" class="htz-img" alt="Xem phóng to">
      <div id="htzBadge" class="htz-badge">100%</div>
    </div>`;
  document.body.appendChild(modal);

  const stage=$('htzStage'),img=$('htzImg'),badge=$('htzBadge'),title=$('htzTitle');
  const Z={scale:1,x:0,y:0,drag:false,sx:0,sy:0,ox:0,oy:0,min:.35,max:8};

  function apply(){
    img.style.transform=`translate(${Z.x}px,${Z.y}px) scale(${Z.scale})`;
    badge.textContent=Math.round(Z.scale*100)+'%';
    $('htzReset').textContent=Math.round(Z.scale*100)+'%';
  }
  function reset(){Z.scale=1;Z.x=0;Z.y=0;apply()}
  function zoomBy(delta){
    Z.scale=clamp(Z.scale+delta,Z.min,Z.max);
    if(Z.scale<=1){Z.x*=.8;Z.y*=.8}
    apply();
  }
  function close(){modal.classList.add('hidden');img.removeAttribute('src');Z.drag=false;stage.classList.remove('dragging')}

  function activeItem(){
    try{
      const hs=window.halftoneStudio?.S;
      return hs?.items?.[hs.active]||null;
    }catch(_){return null}
  }
  function sourceFor(canvas){
    const item=activeItem();
    if(canvas.id==='ht2Orig' && item?.url)return {src:item.url,label:`Ảnh gốc • ${item.name||''}`,full:true};
    if(canvas.id==='ht2Out' && item?.outUrl)return {src:item.outUrl,label:`PNG tram full-size • ${item.name||''}`,full:true};
    try{return {src:canvas.toDataURL('image/png'),label:canvas.id==='ht2Out'?'Preview tram':'Ảnh gốc',full:false}}catch(_){return null}
  }
  function open(canvas){
    if(!canvas||canvas.width<=1||canvas.height<=1)return;
    const src=sourceFor(canvas);if(!src)return;
    title.textContent=src.label+(src.full?' • full-size':' • preview');
    img.src=src.src;
    reset();
    modal.classList.remove('hidden');
  }

  function bindCanvas(canvas){
    if(!canvas||canvas.dataset.htzBound==='1')return;
    canvas.dataset.htzBound='1';
    canvas.title='Bấm để phóng to';
    canvas.addEventListener('click',()=>open(canvas));
  }
  function installTargets(){bindCanvas($('ht2Orig'));bindCanvas($('ht2Out'))}

  $('htzPlus').onclick=()=>zoomBy(.35);
  $('htzMinus').onclick=()=>zoomBy(-.35);
  $('htzReset').onclick=reset;
  $('htzClose').onclick=close;
  stage.addEventListener('wheel',e=>{e.preventDefault();zoomBy(e.deltaY<0?.28:-.28)},{passive:false});
  stage.addEventListener('dblclick',e=>{e.preventDefault();reset()});
  stage.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    Z.drag=true;Z.sx=e.clientX;Z.sy=e.clientY;Z.ox=Z.x;Z.oy=Z.y;
    stage.classList.add('dragging');
    try{stage.setPointerCapture(e.pointerId)}catch(_){ }
  });
  stage.addEventListener('pointermove',e=>{if(!Z.drag)return;Z.x=Z.ox+(e.clientX-Z.sx);Z.y=Z.oy+(e.clientY-Z.sy);apply()});
  const stopDrag=e=>{Z.drag=false;stage.classList.remove('dragging');try{stage.releasePointerCapture(e.pointerId)}catch(_){ }};
  stage.addEventListener('pointerup',stopDrag);stage.addEventListener('pointercancel',stopDrag);
  modal.addEventListener('click',e=>{if(e.target===modal)close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.classList.contains('hidden'))close()});

  installTargets();
  const mo=new MutationObserver(()=>installTargets());
  mo.observe(document.body,{childList:true,subtree:true});

  window.halftoneZoom={open,close,reset,version:'R20.3'};
})();

(()=>{
  if(window.__HALFTONE_HELP_LOADER_R203)return;
  window.__HALFTONE_HELP_LOADER_R203=1;
  try{
    const here=document.currentScript?.src||'';
    const src=here?new URL('halftone-help-r203.js',here).href:'assets/halftone-help-r203.js';
    const s=document.createElement('script');s.src=src;s.async=false;document.head.appendChild(s);
  }catch(e){console.warn('Halftone help loader:',e)}
})();
