(function(){
  function initLogoModule(){
    const $=id=>document.getElementById(id);
    const els={
      images:$('wm_images'), logoFile:$('wm_logoFile'), logoWidth:$('wm_logoWidth'), logoOpacity:$('wm_logoOpacity'),
      text:$('wm_text'), fontFile:$('wm_fontFile'), fontLabel:$('wm_fontLabel'), textSize:$('wm_textSize'), textOpacity:$('wm_textOpacity'), textColor:$('wm_textColor'), textStroke:$('wm_textStroke'), strokeColor:$('wm_strokeColor'), textAlign:$('wm_textAlign'),
      rotation:$('wm_rotation'), gap:$('wm_gap'), x:$('wm_x'), y:$('wm_y'), margin:$('wm_margin'), layout:$('wm_layout'), presetPos:$('wm_presetPos'), applyPreset:$('wm_applyPreset'), reset:$('wm_reset'),
      processAll:$('wm_processAll'), downloadZip:$('wm_downloadZip'), maxFileSizeMb:$('wm_maxFileSizeMb'), renameMode:$('wm_renameMode'), nameSuffix:$('wm_nameSuffix'), zipName:$('wm_zipName'), namePrefix:$('wm_namePrefix'), nameStart:$('wm_nameStart'), status:$('wm_status'), count:$('wm_count'), done:$('wm_done'),
      canvas:$('wm_canvas'), thumbs:$('wm_thumbs'), zoomIn:$('wm_zoomIn'), zoomOut:$('wm_zoomOut'), zoomReset:$('wm_zoomReset')
    };
    if(!els.canvas) return;
    const ctx=els.canvas.getContext('2d');
    const state={images:[], current:0, logoImg:null, logoUrl:'', zoom:1, textFont:"Arial, sans-serif", drag:{active:false, mode:'move', offX:0, offY:0, startDist:1, startLogoW:180, startTextSize:42, startGap:14}};
    function setStatus(t){ if(els.status) els.status.textContent=t; }
    function safeName(name){ return String(name||'watermark').replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ').trim() || 'watermark'; }
    function wmOutputName(item,index){ const ext=item.doneExt||'png'; const mode=els.renameMode&&els.renameMode.value||'keep'; if(mode==='custom'){ const start=parseInt(els.nameStart&&els.nameStart.value||1,10)||1; const num=String(start+index).padStart(2,'0'); return safeName(`${(els.namePrefix&&els.namePrefix.value)||'watermark'}-${num}.${ext}`); } const base=item.name.replace(/\.[^.]+$/,''); const suffix=(els.nameSuffix&&els.nameSuffix.value)||'_logo'; return safeName(base + suffix + '.' + ext); }
    function makeCanvas(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; }
    function blobFromCanvas(c,mime='image/png',quality){ return new Promise(resolve=>c.toBlob(resolve,mime,quality)); }
    async function exportCanvasWithLimit(srcCanvas,mime='image/png'){
      const maxMb=getMaxMb(), maxBytes=maxMb*1024*1024;
      const useJpg=maxMb>0;
      const finalMime=useJpg?'image/jpeg':mime;
      if(maxBytes<=0){
        const blob=await blobFromCanvas(srcCanvas,finalMime,finalMime==='image/jpeg'?0.92:undefined);
        return {blob,canvas:srcCanvas,mime:finalMime};
      }
      let work=srcCanvas;
      let blob=await blobFromCanvas(work,finalMime,0.86);
      if(blob&&blob.size<=maxBytes) return {blob,canvas:work,mime:finalMime};
      for(const q of [0.8,0.74,0.68,0.62,0.56,0.5]){
        blob=await blobFromCanvas(work,finalMime,q);
        if(blob&&blob.size<=maxBytes) return {blob,canvas:work,mime:finalMime};
      }
      for(let i=0;i<6&&blob&&blob.size>maxBytes&&work.width>500&&work.height>500;i++){
        const ratio=Math.max(0.55,Math.min(0.9,Math.sqrt(maxBytes/blob.size)*0.94));
        const nw=Math.max(1,Math.round(work.width*ratio)), nh=Math.max(1,Math.round(work.height*ratio));
        const smaller=makeCanvas(nw,nh);
        smaller.getContext('2d').drawImage(work,0,0,nw,nh);
        work=smaller;
        blob=await blobFromCanvas(work,finalMime,0.82);
        if(blob&&blob.size<=maxBytes) break;
        for(const q of [0.76,0.68,0.6,0.52]){
          blob=await blobFromCanvas(work,finalMime,q);
          if(blob&&blob.size<=maxBytes) break;
        }
      }
      return {blob,canvas:work,mime:finalMime};
    }
    function n(el, d=0){ const v=parseFloat(el&&el.value); return Number.isFinite(v)?v:d; }
    function getMaxMb(){ return parseFloat(els.maxFileSizeMb&&els.maxFileSizeMb.value||0)||0; }
    function outputMimeForLimit(){ return getMaxMb()>0 ? 'image/jpeg' : 'image/png'; }
    function outputExt(){ return getMaxMb()>0 ? 'jpg' : 'png'; }
    function initialScaleForLimit(w,h){
      const maxMb=getMaxMb();
      if(maxMb<=0) return 1;
      const maxSide = maxMb <= 1 ? 1300 : maxMb <= 2 ? 1700 : maxMb <= 3 ? 2100 : 2600;
      return Math.min(1, maxSide/Math.max(w,h));
    }
    function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
    function updateStats(){ if(els.count) els.count.textContent=`${state.images.length} ảnh`; if(els.done) els.done.textContent=`${state.images.filter(x=>x.doneBlob).length} ảnh đã xử lý`; }
    function fitCanvas(){ els.canvas.style.width=Math.round(els.canvas.width*state.zoom)+'px'; els.canvas.style.height=Math.round(els.canvas.height*state.zoom)+'px'; }
    function currentImage(){ return state.images[state.current]||null; }
    function ensureImagePosition(item){
      if(!item) return {x:50,y:50};
      if(!Number.isFinite(item.wmX)) item.wmX=50;
      if(!Number.isFinite(item.wmY)) item.wmY=50;
      return {x:item.wmX,y:item.wmY};
    }
    function syncPositionInputsFromCurrent(){
      const cur=currentImage(); if(!cur) return;
      const p=ensureImagePosition(cur);
      if(els.x) els.x.value=p.x.toFixed(1);
      if(els.y) els.y.value=p.y.toFixed(1);
    }
    function saveCurrentPositionFromInputs(){
      const cur=currentImage(); if(!cur) return;
      cur.wmX=clamp(n(els.x,50),0,100);
      cur.wmY=clamp(n(els.y,50),0,100);
    }
    function pointerPos(evt){ const rect=els.canvas.getBoundingClientRect(); return {x:(evt.clientX-rect.left)*(els.canvas.width/rect.width), y:(evt.clientY-rect.top)*(els.canvas.height/rect.height)}; }
    function loadImageFromFile(file){ return new Promise((resolve,reject)=>{ const url=URL.createObjectURL(file); const img=new Image(); img.onload=()=>resolve({img,url}); img.onerror=()=>{safeRevoke(url);reject(new Error('Không đọc được ảnh'));}; img.src=url; }); }
    async function handleImages(files){ const arr=[...files||[]]; if(!arr.length) return; const old=state.images||[]; const out=[]; setStatus('Đang nạp ảnh...'); for(const file of arr){ try{ const {img,url}=await loadImageFromFile(file); out.push({name:file.name,file,img,url,doneBlob:null,wmX:50,wmY:50}); }catch(e){} } old.forEach(x=>safeRevoke(x.url)); state.images=out; state.current=0; updateStats(); renderThumbs(); const cur=currentImage(); if(cur){ els.canvas.width=cur.img.naturalWidth; els.canvas.height=cur.img.naturalHeight; fitCanvas(); applyPreset('br'); const p=ensureImagePosition(cur); state.images.forEach((it,idx)=>{ if(idx!==state.current){it.wmX=p.x;it.wmY=p.y;} }); syncPositionInputsFromCurrent(); render(); setStatus(`Đã nạp ${state.images.length} ảnh • mỗi ảnh có vị trí watermark riêng.`); } else setStatus('Không nạp được ảnh nào.'); }
    async function handleLogo(file){ if(!file) return; try{ const {img,url}=await loadImageFromFile(file); safeRevoke(state.logoUrl); state.logoImg=img; state.logoUrl=url; render(); setStatus('Đã nạp logo.'); }catch(e){ setStatus('Không đọc được logo.'); } }
    async function handleFont(file){ if(!file) return; const url=URL.createObjectURL(file); try{ const family='WMFont_'+Date.now()+'_'+Math.floor(Math.random()*9999); const font=new FontFace(family, `url(${url})`); await font.load(); document.fonts.add(font); state.textFont=`'${family}', Arial, sans-serif`; if(els.fontLabel) els.fontLabel.textContent='Đang dùng: '+file.name; render(); setStatus('Đã nạp font chữ.'); }catch(e){ setStatus('Không nạp được font.'); } finally{safeRevoke(url)} }
    function getTextMetrics(txt, size){ ctx.save(); ctx.font=`700 ${size}px ${state.textFont}`; const m=ctx.measureText(txt||' '); const h=(m.actualBoundingBoxAscent||size*.8)+(m.actualBoundingBoxDescent||size*.2); ctx.restore(); return {w:m.width,h,ascent:(m.actualBoundingBoxAscent||size*.8)}; }
    function getGroupLayout(){
      const img=currentImage(); if(!img) return null;
      const type=els.layout.value; const text=(els.text.value||'').trim(); const hasLogo=!!state.logoImg && type!=='textOnly'; const hasText=!!text && type!=='logoOnly';
      let logoW=hasLogo ? clamp(n(els.logoWidth,180), 10, img.img.naturalWidth*0.9) : 0;
      let logoH=0; if(hasLogo){ logoH=logoW * (state.logoImg.naturalHeight/state.logoImg.naturalWidth); }
      const textSize=clamp(n(els.textSize,42), 8, 500);
      const tm=hasText ? getTextMetrics(text,textSize) : {w:0,h:0,ascent:0};
      const gap=(hasLogo && hasText) ? Math.max(0,n(els.gap,14)) : 0;
      let groupW=0, groupH=0;
      if(type==='horizontal' && hasLogo && hasText){ groupW=logoW+gap+tm.w; groupH=Math.max(logoH, tm.h); }
      else { groupW=Math.max(logoW, tm.w); groupH=(hasLogo?logoH:0)+(hasText?tm.h:0)+gap; }
      if(!hasLogo && !hasText){ groupW=140; groupH=60; }
      const pos=ensureImagePosition(img); const cx=(pos.x/100)*img.img.naturalWidth; const cy=(pos.y/100)*img.img.naturalHeight;
      return {img, type, text, hasLogo, hasText, logoW, logoH, textSize, tm, gap, groupW, groupH, cx, cy, left:cx-groupW/2, top:cy-groupH/2, right:cx+groupW/2, bottom:cy+groupH/2};
    }
    function drawWatermark(targetCtx, layout, guides=true){
      const {img,type,text,hasLogo,hasText,logoW,logoH,textSize,tm,gap,cx,cy,groupW,groupH,left,top,right,bottom}=layout;
      targetCtx.save();
      targetCtx.translate(cx,cy); targetCtx.rotate((n(els.rotation,0)||0)*Math.PI/180);
      let startX=-groupW/2, startY=-groupH/2;
      const logoOpacity=clamp(n(els.logoOpacity,75)/100,0,1); const textOpacity=clamp(n(els.textOpacity,88)/100,0,1);
      if(type==='horizontal' && hasLogo && hasText){
        let logoX=startX, logoY=-(logoH/2); let textX=logoX+logoW+gap; let textY=tm.ascent/2;
        if(hasLogo){ targetCtx.save(); targetCtx.globalAlpha=logoOpacity; targetCtx.drawImage(state.logoImg, logoX, logoY, logoW, logoH); targetCtx.restore(); }
        if(hasText){ targetCtx.save(); targetCtx.globalAlpha=textOpacity; targetCtx.font=`700 ${textSize}px ${state.textFont}`; targetCtx.textBaseline='alphabetic'; targetCtx.textAlign=els.textAlign.value==='left'?'left':(els.textAlign.value==='right'?'right':'left'); targetCtx.lineJoin='round'; targetCtx.lineWidth=Math.max(0,n(els.textStroke,2)); targetCtx.strokeStyle=els.strokeColor.value; targetCtx.fillStyle=els.textColor.value; const drawX=textX; if(n(els.textStroke,2)>0) targetCtx.strokeText(text, drawX, textY); targetCtx.fillText(text, drawX, textY); targetCtx.restore(); }
      }else{
        let cursorY=startY;
        if(hasLogo){ targetCtx.save(); targetCtx.globalAlpha=logoOpacity; targetCtx.drawImage(state.logoImg, -logoW/2, cursorY, logoW, logoH); targetCtx.restore(); cursorY += logoH + gap; }
        if(hasText){ targetCtx.save(); targetCtx.globalAlpha=textOpacity; targetCtx.font=`700 ${textSize}px ${state.textFont}`; targetCtx.textBaseline='alphabetic'; targetCtx.textAlign=els.textAlign.value||'center'; targetCtx.lineJoin='round'; targetCtx.lineWidth=Math.max(0,n(els.textStroke,2)); targetCtx.strokeStyle=els.strokeColor.value; targetCtx.fillStyle=els.textColor.value; const tx = (els.textAlign.value==='left') ? -groupW/2 : (els.textAlign.value==='right' ? groupW/2 : 0); const ty=cursorY+tm.ascent; if(n(els.textStroke,2)>0) targetCtx.strokeText(text, tx, ty); targetCtx.fillText(text, tx, ty); targetCtx.restore(); }
      }
      targetCtx.restore();
      if(guides){ targetCtx.save(); targetCtx.strokeStyle='rgba(59,130,246,.95)'; targetCtx.setLineDash([8,6]); targetCtx.lineWidth=1.6; targetCtx.strokeRect(left-6, top-6, groupW+12, groupH+12); targetCtx.setLineDash([]); targetCtx.fillStyle='#1d4ed8'; targetCtx.strokeStyle='#bfdbfe'; targetCtx.lineWidth=2; const hs=Math.max(14, Math.min(22, img.img.naturalWidth/70)); targetCtx.beginPath(); targetCtx.rect((right||left+groupW)+6-hs/2, (bottom||top+groupH)+6-hs/2, hs, hs); targetCtx.fill(); targetCtx.stroke(); targetCtx.restore(); }
    }
    function render(){
      const cur=currentImage();
      if(!cur){ ctx.clearRect(0,0,els.canvas.width,els.canvas.height); ctx.fillStyle='#0b1220'; ctx.fillRect(0,0,els.canvas.width,els.canvas.height); ctx.fillStyle='rgba(255,255,255,.25)'; ctx.font='bold 28px Arial'; ctx.textAlign='center'; ctx.fillText('Hãy tải ảnh để bắt đầu', els.canvas.width/2, els.canvas.height/2); return; }
      if(els.canvas.width!==cur.img.naturalWidth||els.canvas.height!==cur.img.naturalHeight){ els.canvas.width=cur.img.naturalWidth; els.canvas.height=cur.img.naturalHeight; fitCanvas(); }
      ctx.clearRect(0,0,els.canvas.width,els.canvas.height); ctx.drawImage(cur.img,0,0,els.canvas.width,els.canvas.height);
      const L=getGroupLayout(); if(L) drawWatermark(ctx,L,true);
    }
    function renderThumbs(){
      els.thumbs.innerHTML='';
      state.images.forEach((it,idx)=>{
        const d=document.createElement('div'); d.className='wm-thumb'+(idx===state.current?' active':'');
        d.innerHTML=`<img src="${it.url}" alt=""><div class="name">${it.name}</div><div class="done">${it.doneBlob?`Đã xử lý • ${Math.round(it.doneBlob.size/1024)} KB`:'Chưa xử lý'}</div>`;
        d.onclick=()=>{ state.current=idx; syncPositionInputsFromCurrent(); renderThumbs(); render(); setStatus('Đang xem: '+it.name+' • vị trí logo của ảnh này được giữ riêng.'); };
        els.thumbs.appendChild(d);
      });
    }
    function hitResize(p,L){ return Math.abs(p.x-(L.right+6))<=20 && Math.abs(p.y-(L.bottom+6))<=20; }
    function hitBody(p,L){ return p.x>=L.left-8 && p.x<=L.right+8 && p.y>=L.top-8 && p.y<=L.bottom+8; }
    function applyPreset(which){
      const cur=currentImage(); if(!cur) return;
      const margin=Math.max(0,n(els.margin,24));
      const L=getGroupLayout() || {groupW:120, groupH:60};
      let x=50, y=50;
      const w=cur.img.naturalWidth, h=cur.img.naturalHeight;
      const left=(margin+L.groupW/2)/w*100, right=(w-margin-L.groupW/2)/w*100, top=(margin+L.groupH/2)/h*100, bottom=(h-margin-L.groupH/2)/h*100;
      if(which==='tl'){x=left;y=top}else if(which==='tc'){x=50;y=top}else if(which==='tr'){x=right;y=top}else if(which==='cl'){x=left;y=50}else if(which==='cc'){x=50;y=50}else if(which==='cr'){x=right;y=50}else if(which==='bl'){x=left;y=bottom}else if(which==='bc'){x=50;y=bottom}else if(which==='br'){x=right;y=bottom}
      else return;
      cur.wmX=clamp(x,0,100); cur.wmY=clamp(y,0,100); syncPositionInputsFromCurrent(); render();
    }
    function resetDefaults(){ els.logoWidth.value=180; els.logoOpacity.value=75; els.textSize.value=42; els.textOpacity.value=88; els.textColor.value='#ffffff'; els.textStroke.value=2; els.strokeColor.value='#000000'; els.rotation.value=0; els.gap.value=14; els.margin.value=24; els.layout.value='vertical'; els.textAlign.value='center'; if(currentImage()) applyPreset('br'); render(); setStatus('Đã đặt lại thông số watermark.'); }
    async function processOne(item){
      const scale=initialScaleForLimit(item.img.naturalWidth,item.img.naturalHeight);
      const cw=Math.max(1,Math.round(item.img.naturalWidth*scale));
      const ch=Math.max(1,Math.round(item.img.naturalHeight*scale));
      const c=makeCanvas(cw,ch);
      const g=c.getContext('2d');
      const prevItem=state.current;
      state.current=state.images.indexOf(item);
      g.save();
      g.scale(scale,scale);
      g.drawImage(item.img,0,0,item.img.naturalWidth,item.img.naturalHeight);
      const L=getGroupLayout();
      if(L) drawWatermark(g,L,false);
      g.restore();
      state.current=prevItem;
      const exported=await exportCanvasWithLimit(c,outputMimeForLimit());
      item.doneBlob=exported.blob;
      item.doneW=exported.canvas.width;
      item.doneH=exported.canvas.height;
      item.doneMime=exported.mime;
      item.doneExt=outputExt();
    }
    async function processAll(){
      if(!state.images.length) return alert('Chưa có ảnh nào.');
      if(!state.logoImg && !(els.text.value||'').trim()) return alert('Bạn cần tải logo hoặc nhập chữ.');
      setStatus('Đang xử lý watermark...');
      if(els.processAll){ els.processAll.disabled=true; els.processAll.textContent='Đang xử lý...'; }
      try{
        for(let i=0;i<state.images.length;i++){
          state.current=i;
          syncPositionInputsFromCurrent();
          renderThumbs();
          render();
          setStatus(`Đang xử lý ${i+1}/${state.images.length}: ${state.images[i].name}`);
          await new Promise(r=>setTimeout(r,80));
          await processOne(state.images[i]);
          updateStats();
          renderThumbs();
          setStatus(`Xong ${i+1}/${state.images.length}: ${state.images[i].name} • ${Math.round(state.images[i].doneBlob.size/1024)} KB`);
          await new Promise(r=>setTimeout(r,60));
        }
        setStatus('Đã xử lý xong tất cả ảnh.');
      }catch(err){
        console.error(err);
        setStatus('Lỗi xử lý watermark: '+(err.message||err));
        alert('Lỗi xử lý watermark: '+(err.message||err));
      }finally{
        if(els.processAll){ els.processAll.disabled=false; els.processAll.textContent='Xử lý tất cả'; }
      }
    }
    async function downloadZip(){ const list=state.images.filter(x=>x.doneBlob).map((x,i)=>({name:wmOutputName(x,i), blob:x.doneBlob})); if(!list.length) return alert('Chưa có ảnh đã xử lý. Hãy bấm Xử lý tất cả trước.'); const btn=els.downloadZip; if(btn){btn.disabled=true;btn.textContent='Đang tải...';} try{const r=await downloadFilesBatch(list,msg=>setStatus(msg));setStatus(r.mode==='folder'?`Đã lưu ${r.count} ảnh watermark riêng.`:`Đã gửi ${r.count} ảnh watermark để tải riêng lẻ.`);}catch(e){if(e?.name==='AbortError')setStatus('Đã hủy chọn thư mục.');else{console.error(e);setStatus('Lỗi tải hàng loạt: '+(e.message||e));}}finally{if(btn){btn.disabled=false;btn.textContent='Tải hàng loạt';}} }

    if(els.images) els.images.addEventListener('change',e=>handleImages(e.target.files));
    if(els.logoFile) els.logoFile.addEventListener('change',e=>handleLogo(e.target.files[0]));
    if(els.fontFile) els.fontFile.addEventListener('change',e=>handleFont(e.target.files[0]));
    ['logoWidth','logoOpacity','text','textSize','textOpacity','textColor','textStroke','strokeColor','textAlign','rotation','gap','margin','layout'].forEach(k=>{ const el=els[k]; if(el){ el.addEventListener('input', render); el.addEventListener('change', render); } });
    ['x','y'].forEach(k=>{ const el=els[k]; if(el){ const update=()=>{saveCurrentPositionFromInputs();render();}; el.addEventListener('input',update);el.addEventListener('change',update); } });
    if(els.applyPreset) els.applyPreset.onclick=()=>applyPreset(els.presetPos.value);
    if(els.reset) els.reset.onclick=()=>resetDefaults();
    if(els.processAll) els.processAll.onclick=()=>processAll();
    if(els.downloadZip) els.downloadZip.onclick=()=>downloadZip();
    if(els.zoomIn) els.zoomIn.onclick=()=>{ state.zoom=clamp(state.zoom+0.1,0.2,4); fitCanvas(); };
    if(els.zoomOut) els.zoomOut.onclick=()=>{ state.zoom=clamp(state.zoom-0.1,0.2,4); fitCanvas(); };
    if(els.zoomReset) els.zoomReset.onclick=()=>{ state.zoom=1; fitCanvas(); };
    els.canvas.addEventListener('mousedown',e=>{ const L=getGroupLayout(); if(!L) return; const p=pointerPos(e); if(hitResize(p,L)){ state.drag.active=true; state.drag.mode='resize'; state.drag.startDist=Math.hypot(p.x-L.cx,p.y-L.cy); state.drag.startLogoW=n(els.logoWidth,180); state.drag.startTextSize=n(els.textSize,42); state.drag.startGap=n(els.gap,14); els.canvas.classList.add('dragging'); setStatus('Đang đổi kích thước watermark...'); } else if(hitBody(p,L)){ state.drag.active=true; state.drag.mode='move'; state.drag.offX=p.x-L.cx; state.drag.offY=p.y-L.cy; els.canvas.classList.add('dragging'); setStatus('Đang di chuyển watermark...'); } });
    window.addEventListener('mousemove',e=>{ if(!state.drag.active) return; const L=getGroupLayout(); if(!L) return; const p=pointerPos(e); if(state.drag.mode==='move'){ const cur=currentImage(); const nx=clamp((p.x-state.drag.offX)/cur.img.naturalWidth*100,0,100); const ny=clamp((p.y-state.drag.offY)/cur.img.naturalHeight*100,0,100); cur.wmX=nx;cur.wmY=ny;els.x.value=nx.toFixed(1);els.y.value=ny.toFixed(1); } else if(state.drag.mode==='resize'){ const dist=Math.hypot(p.x-L.cx,p.y-L.cy); const scale=clamp(dist/Math.max(20,state.drag.startDist),0.15,5); els.logoWidth.value=Math.round(state.drag.startLogoW*scale); els.textSize.value=Math.max(8,Math.round(state.drag.startTextSize*scale)); els.gap.value=Math.max(0,Math.round(state.drag.startGap*scale)); } render(); });
    window.addEventListener('mouseup',()=>{ if(state.drag.active){ state.drag.active=false; els.canvas.classList.remove('dragging'); const cur=currentImage(); setStatus('Đã cập nhật vị trí/kích thước trên '+(cur?cur.name:'ảnh hiện tại')+' • không ảnh hưởng ảnh khác.'); } });
    
    function isLogoMode(){ try{return localStorage.getItem('pip_mainMode')==='logo'}catch(e){return document.body.dataset.mode==='logo'} }
    function clearLogoImages(){
      (state.images||[]).forEach(x=>safeRevoke(x.url));
      state.images=[];
      state.current=0;
      if(els.images) els.images.value='';
      state.images=[];
      updateStats();
      renderThumbs();
      render();
      setStatus('Đã xóa danh sách ảnh watermark.');
    }
    function interceptTopForLogo(id, handler){
      const btn=document.getElementById(id);
      if(!btn) return;
      btn.addEventListener('click', function(e){
        if(!isLogoMode()) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        handler();
      }, true);
    }
    interceptTopForLogo('pickBtn', ()=>{ if(els.images) els.images.click(); });
    interceptTopForLogo('dropPickBtn', ()=>{ if(els.images) els.images.click(); });
    interceptTopForLogo('quickAllBtn', ()=>processAll());
    interceptTopForLogo('processAllBtn', ()=>processAll());
    interceptTopForLogo('downloadAllBtn', ()=>downloadZip());
    interceptTopForLogo('clearBtn', ()=>clearLogoImages());

    fitCanvas(); render();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', initLogoModule); else initLogoModule();
})();
