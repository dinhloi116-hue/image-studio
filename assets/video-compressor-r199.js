(()=>{
  if(window.__IMAGE_STUDIO_R200_LOADER)return;
  window.__IMAGE_STUDIO_R200_LOADER=1;
  const current=document.currentScript&&document.currentScript.src?document.currentScript.src:'';
  const base=current?new URL('.',current).href:(location.protocol==='file:'?'assets/':new URL('/image-studio/assets/',location.origin).href);
  const load=(name)=>new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src=new URL(name,base).href;
    s.async=false;
    s.onload=resolve;
    s.onerror=()=>reject(new Error('Không tải được '+name));
    document.head.appendChild(s);
  });
  load('video-compressor-core-r199.js?v=r199-core')
    .then(()=>load('halftone-r200.js?v=r200'))
    .catch(err=>{console.error('Image Studio module loader:',err);});
})();
