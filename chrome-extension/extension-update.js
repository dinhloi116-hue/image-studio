(()=>{
const REMOTE='https://raw.githubusercontent.com/dinhloi116-hue/image-studio/main/chrome-extension/local-version.json';
let local={};

/* R20.1: Canvas2D readback optimization.
   s01.js creates processing canvases and later calls getImageData many times.
   The first 2D context options are sticky, so initialize those canvases with
   willReadFrequently:true before any normal getContext('2d') call happens. */
function installCanvasReadbackFix(){
  try{
    const original=window.createCanvas;
    if(typeof original!=='function' || original.__dhlReadbackOptimized)return;
    function optimizedCreateCanvas(w,h){
      const c=original(w,h);
      try{ c.getContext('2d',{willReadFrequently:true}); }catch(_){ }
      return c;
    }
    optimizedCreateCanvas.__dhlReadbackOptimized=true;
    optimizedCreateCanvas.__original=original;
    window.createCanvas=optimizedCreateCanvas;
  }catch(e){console.warn('Canvas readback optimization skipped',e)}
}

/* Load the local halftone module for the packaged Chrome extension too.
   The GitHub Pages version already has this module; this keeps both builds aligned. */
function loadHalftoneModule(){
  try{
    if(window.__HALFTONE_R200 || document.getElementById('dhlHalftoneModule'))return;
    const s=document.createElement('script');
    s.id='dhlHalftoneModule';
    s.src=chrome.runtime.getURL('assets/halftone-r200.js')+'?v=r201';
    s.async=false;
    s.onerror=()=>console.error('Không tải được module Tạo tram.');
    document.head.appendChild(s);
  }catch(e){console.error('Halftone module loader',e)}
}

async function readLocal(){try{local=await (await fetch(chrome.runtime.getURL('local-version.json')+'?t='+Date.now(),{cache:'no-store'})).json()}catch(e){local={}}}
function box(text,buttons=[]){
  let old=document.getElementById('dhlGitUpdateBox');if(old)old.remove();
  const d=document.createElement('div');d.id='dhlGitUpdateBox';d.style.cssText='position:fixed;right:16px;top:70px;z-index:999999;background:#0b1220;color:#e5e7eb;border:1px solid #3b82f6;border-radius:14px;padding:14px;width:min(430px,calc(100vw - 32px));box-shadow:0 18px 50px #0008;font:14px Segoe UI,Arial';
  d.innerHTML='<div style="font-weight:800;margin-bottom:8px">Cập nhật Image Studio</div><div style="line-height:1.55;color:#cbd5e1">'+text+'</div><div id="dhlGitBtns" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"></div>';
  const row=d.querySelector('#dhlGitBtns');
  buttons.forEach(([label,fn,primary])=>{const b=document.createElement('button');b.textContent=label;b.className='btn';b.style.cssText=primary?'background:#166534;border-color:#22c55e':'';b.onclick=fn;row.appendChild(b)});
  const close=document.createElement('button');close.textContent='Đóng';close.className='btn';close.onclick=()=>d.remove();row.appendChild(close);document.body.appendChild(d);
}
async function check(){
  await readLocal();
  try{
    const r=await fetch(REMOTE+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const remote=await r.json();
    const same=remote.source_sha&&local.source_sha&&remote.source_sha===local.source_sha;
    if(same) box('Bạn đang dùng bản Git mới nhất: <b>'+String(local.tool_version||'')+'</b>.');
    else box('Có bản mới trên GitHub.<br><br><b>1.</b> Mở GitHub Desktop → repo <b>image-studio</b> → <b>Pull origin</b>.<br><b>2.</b> Quay lại đây và bấm <b>Áp dụng sau khi Pull</b>.',[
      ['Mở repo GitHub',()=>window.open('https://github.com/dinhloi116-hue/image-studio','_blank'),false],
      ['Áp dụng sau khi Pull',()=>chrome.runtime.reload(),true]
    ]);
  }catch(e){box('Không kiểm tra được GitHub: '+e.message)}
}
function add(){
  const host=document.querySelector('.top-actions')||document.querySelector('header')||document.body;
  if(document.getElementById('dhlGitUpdateBtn'))return;
  const b=document.createElement('button');b.id='dhlGitUpdateBtn';b.className='btn';b.textContent='↻ Cập nhật từ Git';b.title='Kiểm tra bản mới. Sau khi Pull origin trong GitHub Desktop, bấm áp dụng để reload extension.';b.onclick=check;host.appendChild(b);
}
installCanvasReadbackFix();
loadHalftoneModule();
readLocal().then(add);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{installCanvasReadbackFix();loadHalftoneModule();add()});else add();
})();
