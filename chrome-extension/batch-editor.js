/* Image Studio DHL - Batch Photo Editor R20.20. Smart batch crop review and text overlay. */
(function () {
  'use strict';
  const el = id => document.getElementById(id);
  const keys = ['exposure','brightness','contrast','vibrance','sharpness','wmOpacity','wmSize','wmGap','wmAngle','quality'];
  const savedSettingIds = [...keys,'wmText','wmMode','wmColor','format','maxEdge','compressionMode','cropEnabled','cropRatio','cropMode','cropPadding','cropSensitivity','textEnabled','textContent','textFont','textPosition','textColor','textOutlineColor','textBackground','textBold','textSize','textOpacity','textOutline','textMargin','textX','textY'];
  const settingsKey='dhl-image-studio-android-settings-v2';
  let installEvent=null;
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    installEvent=event;
    const b=document.getElementById('installPwa');
    if(b)b.textContent='Cài DHL Ảnh ngay';
  });
  window.addEventListener('appinstalled',()=>{
    installEvent=null;
    const banner=document.getElementById('installStrip');
    if(banner)banner.hidden=true;
  });
  function storeSettings(){
    try{
      const saved={};
      for(const id of savedSettingIds){const control=document.getElementById(id);if(control)saved[id]=control.type==='checkbox'?control.checked:control.value;}
      localStorage.setItem(settingsKey,JSON.stringify(saved));
    }catch(_){ /* private mode may block storage */ }
  }
  function restoreSettings(){
    try{
      const data=JSON.parse(localStorage.getItem(settingsKey)||'{}');
      for(const id of savedSettingIds){
        const node=document.getElementById(id);
        if(node && Object.prototype.hasOwnProperty.call(data,id)){
          if(node.type==='checkbox')node.checked=data[id]===true;
          else if(node.tagName!=='SELECT'||[...node.options].some(option=>option.value===data[id]))node.value=data[id];
        }
      }
    }catch(_){ /* use defaults if unavailable */ }
  }
  function initMobilePwa(){
    const banner=document.getElementById('installStrip');
    const button=document.getElementById('installPwa');
    const hint=document.getElementById('installHint');
    if(!button||!banner||!hint)return;
    if(location.protocol!=='https:' && location.hostname!=='localhost'){
      banner.hidden=true;
      return;
    }
    const installed=window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    if(installed){banner.hidden=true;}
    else{
      button.addEventListener('click',async()=>{
        if(installEvent){
          const event=installEvent;
          installEvent=null;
          await event.prompt();
          const choice=await event.userChoice;
          if(choice?.outcome!=='accepted') {
            hint.textContent='Để cài thủ công: Chrome ⋮ → Thêm vào màn hình chính → Cài đặt.';
          }
        }else{
          hint.textContent='Mở bằng Chrome trên Xiaomi → dấu ba chấm ⋮ → Thêm vào màn hình chính → Cài đặt hoặc Thêm.';
          show('Trong Chrome Xiaomi, chọn ⋮ → Thêm vào màn hình chính → Cài đặt hoặc Thêm.');
        }
      });
    }
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(()=>{
        if(!installed)hint.textContent='Chọn Cài lên điện thoại hoặc dùng Chrome ⋮ → Thêm vào màn hình chính. Sau lần mở có mạng, công cụ chỉnh ảnh có thể hoạt động ngoại tuyến.';
      }).catch(()=>{
        if(!installed)hint.textContent='Có thể thêm biểu tượng bằng Chrome ⋮ → Thêm vào màn hình chính. Cần mạng khi mở trang.';
      });
    }
  }
  const state = { files: [], index: 0, busy: false, loading: false, importSeq: 0, tempFolderName: null, cancel: false, previewSeq: 0, timer: null, sizeTimer: null, lastExportSettings: null, cropOverrides:new Map(), cropAnalysis:new Map(), cropThumbs:new Map(), cropReviewFilter:'all', cropScanBusy:false, cropEditor:null, cropEditorSeq:0, totals: { originals:0, exported:0, exportCount:0 } };
  const presets = {
    neutral: { exposure:0, brightness:0, contrast:0, vibrance:0, sharpness:0 },
    shop: { exposure:14, brightness:8, contrast:8, vibrance:18, sharpness:26 },
    vivid: { exposure:9, brightness:12, contrast:14, vibrance:33, sharpness:34 }
  };
  const clamp = v => Math.max(0, Math.min(255, v));
  const number = id => Number(el(id).value);
  function sourceMime(file) {
    const type=(file.type||'').toLowerCase();
    if(type==='image/jpeg'||type==='image/png'||type==='image/webp')return type;
    if(type==='image/heic'||type==='image/heif'||type==='image/avif')return 'image/jpeg';
    if(/\.jpe?g$/i.test(file.name))return 'image/jpeg';
    if(/\.webp$/i.test(file.name))return 'image/webp';
    return 'image/png';
  }
  // The Xiaomi picker can supply a .jpg name for a different underlying codec.
  function detectImageFormat(header) {
    const v=new Uint8Array(header);
    if(v.length>=3 && v[0]===255 && v[1]===216 && v[2]===255)return 'image/jpeg';
    if(v.length>=8 && [137,80,78,71,13,10,26,10].every((x,i)=>v[i]===x))return 'image/png';
    if(v.length>=12 && String.fromCharCode(...v.slice(0,4))==='RIFF' &&
      String.fromCharCode(...v.slice(8,12))==='WEBP')return 'image/webp';
    if(v.length>=12 && String.fromCharCode(...v.slice(4,8))==='ftyp'){
      const brand=String.fromCharCode(...v.slice(8,12));
      if(brand==='avif'||brand==='avis')return 'image/avif';
      if(['heic','heix','hevc','hevx','mif1','msf1'].includes(brand))return 'image/heic';
    }
    return null;
  }
  function perFileConfig(c,file) {
    return c.format==='auto'?{...c,format:sourceMime(file)}:c;
  }
  function outputExtension(mime) {
    return mime==='image/jpeg'?'jpg':mime==='image/webp'?'webp':'png';
  }
  function activeSourceFormats() {
    return new Set(state.files.map(file=>sourceMime(file)));
  }
  const mb = size => (size / 1e6).toFixed(2)+' MB';
  function totalSize(files) { return files.reduce((sum,file)=>sum+file.size,0); }

  const OPFS_THRESHOLD=160*1024*1024;
  const TEMP_PREFIX='dhl-image-temporary-';
  async function disposeTempFiles() {
    const name=state.tempFolderName;
    state.tempFolderName=null;
    if(!name||!navigator.storage?.getDirectory)return;
    try { const root=await navigator.storage.getDirectory();await root.removeEntry(name,{recursive:true}); }
    catch(_) { /* cleanup on next launch */ }
  }
  async function clearOldTempFiles() {
    if(!navigator.storage?.getDirectory)return;
    try{
      const root=await navigator.storage.getDirectory();
      for await(const [name] of root.entries()){
        if(name.startsWith(TEMP_PREFIX)&&name!==state.tempFolderName){
          try{await root.removeEntry(name,{recursive:true});}catch(_){}
        }
      }
    }catch(_){}
  }
  async function chooseTempFolder(total) {
    if(total<OPFS_THRESHOLD||!navigator.storage?.getDirectory)return null;
    try{
      const root=await navigator.storage.getDirectory();
      const name=TEMP_PREFIX+Date.now()+'-'+Math.random().toString(36).slice(2,9);
      const folder=await root.getDirectoryHandle(name,{create:true});
      state.tempFolderName=name;
      return folder;
    }catch(_){return null;}
  }
  async function snapshotSource(source,folder,index) {
    let blob;
    if(folder) {
      try {
        const handle=await folder.getFileHandle('image-'+index,{create:true});
        const writer=await handle.createWritable();
        try{await writer.write(source);await writer.close();}
        catch(e){try{await writer.abort();}catch(_){}throw e;}
        blob=await handle.getFile();
      }catch(_){blob=null;}
    }
    if(!blob){
      let bytes;
      try{bytes=await source.arrayBuffer();}
      catch(_){
        const url=URL.createObjectURL(source);
        try{const res=await fetch(url);if(!res.ok)throw Error('HTTP '+res.status);bytes=await res.arrayBuffer();}
        finally{URL.revokeObjectURL(url);}
      }
      if(!bytes?.byteLength)throw new Error('Dữ liệu ảnh rỗng hoặc quyền truy cập đã hết hạn');
      blob=new Blob([bytes],{type:source.type||'application/octet-stream'});
    }
    const signature=detectImageFormat(await blob.slice(0,32).arrayBuffer());
    const mime=signature||source.type||'application/octet-stream';
    return {name:source.name,size:blob.size,type:mime,lastModified:source.lastModified,
      blob:blob.type===mime?blob:blob.slice(0,blob.size,mime)};
  }

  function previewSizes(input,output,estimate) {
    el('originalMB').textContent=input == null?'—':mb(input);
    el('outputMB').textContent=output == null?'Đang tính…':mb(output);
    el('totalBeforeMB').textContent=mb(state.totals.originals);
    const validActual=state.totals.exportCount>0 && state.lastExportSettings===JSON.stringify(config());
    el('totalAfterMB').textContent=validActual
      ?mb(state.totals.exported)+' (thực tế, '+state.totals.exportCount+' ảnh)'
      :(estimate == null?'Chưa có số liệu':mb(estimate)+' (ước tính)');
  }
  function show(message, error) {
    el('status').textContent = message;
    el('status').classList.toggle('error', !!error);
  }
  function config() {
    return {
      exposure:number('exposure')/100, brightness:number('brightness'), contrast:number('contrast'),
      vibrance:number('vibrance'), sharpness:number('sharpness'), wmText:el('wmText').value.trim(),
      wmMode:el('wmMode').value, wmOpacity:number('wmOpacity')/100,
      wmSize:number('wmSize')/100, wmGap:number('wmGap'), wmAngle:number('wmAngle'),
      wmColor:el('wmColor').value, format:el('format').value,
      quality:number('quality')/100, maxEdge:number('maxEdge'), compressionMode:el('compressionMode').value,
      cropEnabled:el('cropEnabled').checked,cropRatio:el('cropRatio').value,
      cropMode:el('cropMode').value,cropPadding:number('cropPadding'),cropSensitivity:number('cropSensitivity'),
      textEnabled:el('textEnabled').checked,textContent:el('textContent').value,
      textFont:el('textFont').value,textPosition:el('textPosition').value,
      textColor:el('textColor').value,textOutlineColor:el('textOutlineColor').value,
      textBackground:el('textBackground').value,textBold:el('textBold').value==='yes',
      textSize:number('textSize'),textOpacity:number('textOpacity'),textOutline:number('textOutline'),
      textMargin:number('textMargin'),textX:number('textX'),textY:number('textY')
    };
  }
  function formatValue(id) {
    const n = number(id);
    if (id === 'exposure') return (n>0?'+':'')+(n/100).toFixed(2)+' EV';
    if(id==='cropPadding'||id==='cropSensitivity')return n+'%';
    if (id === 'wmSize') return n+'%';
    if (id === 'wmAngle') return n+'°';
    if (id === 'quality') return n+'%';
    if (id === 'wmOpacity') return n+'%';
    if (id === 'wmGap') return n+'×';
    return (n>0?'+':'')+n;
  }
  function refreshLabels() { keys.forEach(id=>{ const node=el(id+'Value'); if(node)node.textContent=formatValue(id); }); }

  // Every source image gets its own crop, unless the user manually overrides it.
  function cropSettingKey(c){return JSON.stringify([c.cropRatio,c.cropMode,c.cropPadding,c.cropSensitivity]);}
  function frameFor(img,c,file){
    if(!c.cropEnabled)return {x:0,y:0,w:1,h:1};
    if(!window.DHLCrop)throw Error('Không tải được mô-đun Auto Crop. Hãy tải lại ứng dụng.');
    const saved=file&&state.cropOverrides.get(file);
    if(saved)return saved;
    try{
      const key=cropSettingKey(c);
      const existing=file&&state.cropAnalysis.get(file);
      if(existing&&existing.key===key)return existing.result.rect;
      const result=window.DHLCrop.analyze?window.DHLCrop.analyze(img,c):
        {rect:c.cropMode==='center'?window.DHLCrop.centered(img,c):window.DHLCrop.plan(img,c),
          confidence:.5,needsReview:true,reason:'Dùng chế độ Auto Crop cũ'};
      if(file)state.cropAnalysis.set(file,{key,result});
      return result.rect;
    }catch(error){
      console.warn('DHL crop fallback:',error);
      return window.DHLCrop.centered(img,c);
    }
  }
  function updateCropControls(){
    const enabled=el('cropEnabled').checked;
    el('cropSettings').hidden=!enabled;
    const file=state.files[state.index];
    const canEdit=!!file&&enabled&&!state.busy&&!state.loading;
    el('cropEdit').disabled=!canEdit;
    el('cropClearSelected').disabled=!canEdit||!state.cropOverrides.has(file);
    el('cropScan').disabled=!canEdit||state.cropScanBusy;
    el('cropScanReview').disabled=!canEdit||state.cropScanBusy;
    const reviewed=[...state.cropAnalysis.values()];
    const flagged=reviewed.filter(item=>item.result?.needsReview).length;
    if(reviewed.length&&enabled)el('cropStatus').textContent='Đã phân tích '+reviewed.length+'/'+state.files.length+' ảnh · '+flagged+' ảnh cần xem lại. Chạm “Ảnh cần kiểm tra” để duyệt nhanh.';
    el('cropPaddingValue').textContent=el('cropPadding').value+'%';
    el('cropSensitivityValue').textContent=el('cropSensitivity').value+'%';
    if(!reviewed.length||!enabled){
      el('cropStatus').textContent=!enabled
        ?'Auto Crop đang tắt, ảnh xuất giữ nguyên bố cục gốc.'
        :!file?'Chọn ít nhất một ảnh để tự căn hoặc chỉnh khung.'
        :state.cropOverrides.has(file)?'Ảnh này dùng khung chỉnh tay; các ảnh còn lại vẫn tự căn.'
        :'Bấm Quét & kiểm tra cả lô để tìm những ảnh cắt chưa chắc chắn.';
    }
  }
  function closeCropEditor(){
    state.cropEditorSeq++;
    if(state.cropEditor)release(state.cropEditor.img);
    state.cropEditor=null;
    el('cropEditorPanel').hidden=true;
  }
  function drawCropEditor(){
    const ed=state.cropEditor;
    if(!ed)return;
    const c=el('cropEditor'),ctx=c.getContext('2d');
    const [sw,sh]=imageDims(ed.img),scale=Math.min(1,980/Math.max(sw,sh));
    const w=Math.max(1,Math.round(sw*scale)),h=Math.max(1,Math.round(sh*scale));
    if(c.width!==w)c.width=w;
    if(c.height!==h)c.height=h;
    ctx.clearRect(0,0,w,h);
    ctx.drawImage(ed.img,0,0,w,h);
    const box=ed.box,x=box.x*w,y=box.y*h,bw=box.w*w,bh=box.h*h;
    ctx.fillStyle='rgba(0,0,0,.57)';
    ctx.fillRect(0,0,w,Math.max(0,y));
    ctx.fillRect(0,y,Math.max(0,x),bh);
    ctx.fillRect(x+bw,y,Math.max(0,w-x-bw),bh);
    ctx.fillRect(0,y+bh,w,Math.max(0,h-y-bh));
    ctx.strokeStyle='#54f5fc';ctx.lineWidth=Math.max(2,w/400);
    ctx.strokeRect(x,y,bw,bh);
    ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1;
    for(let k=1;k<=2;k++){
      ctx.beginPath();ctx.moveTo(x+bw*k/3,y);ctx.lineTo(x+bw*k/3,y+bh);
      ctx.moveTo(x,y+bh*k/3);ctx.lineTo(x+bw,y+bh*k/3);ctx.stroke();
    }
    const rad=Math.max(6,Math.min(14,w*.013));
    ctx.fillStyle='#00e7ff';ctx.strokeStyle='#051526';ctx.lineWidth=2;
    for(const [px,py] of [[x,y],[x+bw,y],[x,y+bh],[x+bw,y+bh]]){
      ctx.beginPath();ctx.arc(px,py,rad,0,Math.PI*2);ctx.fill();ctx.stroke();
    }
  }
  async function openCropEditor(){
    if(state.busy||state.loading||!el('cropEnabled').checked)return;
    const file=state.files[state.index];
    if(!file)return;
    closeCropEditor();
    const seq=state.cropEditorSeq;
    let img;
    try{
      img=await decode(file);
      if(seq!==state.cropEditorSeq||file!==state.files[state.index]){
        release(img);return;
      }
      const c=config();
      state.cropEditor={file,img,box:{...frameFor(img,c,file)},drag:null,auto:true};
      el('cropEditorPanel').hidden=false;
      drawCropEditor();
      el('cropEditorPanel').scrollIntoView({behavior:'smooth',block:'nearest'});
    }catch(error){
      if(img)release(img);
      show('Không mở được khung cắt: '+error.message,true);
    }
  }
  function cropPointer(event){
    const c=el('cropEditor'),rect=c.getBoundingClientRect();
    return {x:Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),
            y:Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height)),
            width:rect.width,height:rect.height};
  }
  function startCropDrag(event){
    const ed=state.cropEditor;
    if(!ed||event.button>0)return;
    const p=cropPointer(event),b=ed.box;
    const corners=[[b.x,b.y,-1,-1],[b.x+b.w,b.y,1,-1],
      [b.x,b.y+b.h,-1,1],[b.x+b.w,b.y+b.h,1,1]];
    const handle=corners.find(c=>Math.hypot((p.x-c[0])*p.width,(p.y-c[1])*p.height)<29);
    const inside=p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h;
    ed.drag={box:{...b},x:p.x,y:p.y,mode:handle?'resize':'move',corner:handle};
    if(!handle&&!inside){
      ed.box=window.DHLCrop.move(b,p.x-(b.x+b.w/2),p.y-(b.y+b.h/2));
      ed.drag.box={...ed.box};
    }
    el('cropEditor').setPointerCapture?.(event.pointerId);
    event.preventDefault();
    drawCropEditor();
  }
  function moveCropDrag(event){
    const ed=state.cropEditor;
    if(!ed||!ed.drag)return;
    const p=cropPointer(event),drag=ed.drag;
    if(drag.mode==='move'){
      ed.box=window.DHLCrop.move(drag.box,p.x-drag.x,p.y-drag.y);
    }else{
      const [sw,sh]=imageDims(ed.img);
      const b=drag.box,c=drag.corner,cx=b.x+b.w/2,cy=b.y+b.h/2;
      const zoomX=2*Math.abs(p.x-cx)/Math.max(.001,b.w);
      const zoomY=2*Math.abs(p.y-cy)/Math.max(.001,b.h);
      const factor=Math.max(.20,Math.max(zoomX,zoomY));
      ed.box=window.DHLCrop.zoom(b,factor,sw,sh,el('cropRatio').value);
    }
    ed.auto=false;
    event.preventDefault();drawCropEditor();
  }
  function finishCropDrag(event){
    const ed=state.cropEditor;
    if(!ed)return;
    ed.drag=null;
    try{el('cropEditor').releasePointerCapture?.(event.pointerId);}catch(_){}
  }
  function cropControlsChanged(id){
    if(id==='cropRatio')state.cropOverrides.clear();
    if(id!=='cropEnabled')resetCropAnalysis();
    if(!el('cropEnabled').checked)closeCropEditor();
    else if(state.cropEditor)closeCropEditor();
    state.lastExportSettings=null;
    storeSettings();
    updateCropControls();
    schedulePreview();
  }

  // Decode from a stable in-memory/OPFS Blob, never directly from a picker URI.
  // Retry both bitmap and HTML image pathways for Android WebView/Chrome.
  function imageFromUrl(url,releaseUrl) {
    return new Promise((resolve,reject)=>{
      const img=new Image();
      let settled=false;
      const finish=(ok,error)=>{
        if(settled)return;
        settled=true;
        img.onload=null;img.onerror=null;
        if(releaseUrl)URL.revokeObjectURL(url);
        if(ok)resolve(img);else reject(error);
      };
      img.onload=()=>finish(true);
      img.onerror=()=>finish(false,new Error('Bộ giải mã ảnh của Chrome từ chối dữ liệu'));
      img.decoding='async';
      img.src=url;
    });
  }
  function imageFromDataUrl(blob) {
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onerror=()=>reject(reader.error||new Error('FileReader không đọc được dữ liệu'));
      reader.onload=()=>{
        imageFromUrl(String(reader.result),false).then(resolve,reject);
      };
      reader.readAsDataURL(blob);
    });
  }
  async function decode(file) {
    const data=file?.blob||file;
    if(!data||!data.size)throw new Error('Tệp ảnh rỗng hoặc không truy cập được từ thư viện Xiaomi');
    const attempts=[];
    if(typeof createImageBitmap==='function'){
      try{return await createImageBitmap(data,{imageOrientation:'from-image'});}
      catch(error){attempts.push('Bitmap/EXIF: '+String(error?.message||error));}
      try{return await createImageBitmap(data);}
      catch(error){attempts.push('Bitmap: '+String(error?.message||error));}
    }
    try{return await imageFromUrl(URL.createObjectURL(data),true);}
    catch(error){attempts.push('URL: '+String(error?.message||error));}
    if(data.size<=25*1024*1024 && typeof FileReader!=='undefined'){
      try{return await imageFromDataUrl(data);}
      catch(error){attempts.push('FileReader: '+String(error?.message||error));}
    }
    // WebCodecs is an optional final fallback when Chrome supports the codec.
    const mime=(data.type||file?.type||'').toLowerCase();
    if(typeof ImageDecoder!=='undefined' && mime && typeof ImageDecoder.isTypeSupported==='function'){
      let decoder=null;
      try{
        if(await ImageDecoder.isTypeSupported(mime)){
          decoder=new ImageDecoder({data:data.stream(),type:mime,preferAnimation:false});
          const result=await decoder.decode({frameIndex:0});
          return result.image;
        }
      }catch(error){attempts.push('WebCodecs: '+String(error?.message||error));}
      finally{try{decoder?.close()}catch(_){ }}
    }
    let type=mime;
    try{
      const head=await data.slice(0,32).arrayBuffer();
      type=detectImageFormat(head)||mime;
    }catch(_){ }
    const hint=type==='image/heic'?'Dữ liệu thực tế là HEIC/HEIF; Chrome không giải mã được. Hãy xuất bản JPG chuẩn từ thư viện Xiaomi.':
      type==='image/avif'?'Ảnh thực tế là AVIF, trình duyệt này không hỗ trợ giải mã.':
      'Dữ liệu ảnh không giải mã được trong Chrome Android. Kiểm tra ảnh gốc hoặc cập nhật Chrome.';
    throw new Error(hint+' ['+(file.name||'ảnh')+' • '+(type||'không rõ')+'] ('+attempts.slice(0,2).join('; ')+')');
  }
  function release(img) { if(img && typeof img.close === 'function') img.close(); }
  function imageDims(img) {return [img.width || img.naturalWidth || img.displayWidth, img.height || img.naturalHeight || img.displayHeight];}
  function adjustPixels(ctx,w,h,c) {
    if (!c.exposure && !c.brightness && !c.contrast && !c.vibrance && !c.sharpness) return;
    const image=ctx.getImageData(0,0,w,h), d=image.data, lut=new Uint8ClampedArray(256);
    const exp=Math.pow(2,c.exposure), k=1+c.contrast/100, bright=c.brightness*1.25;
    for(let i=0;i<256;i++) lut[i]=clamp(((i*exp+bright)-127.5)*k+127.5);
    const vib=c.vibrance/100;
    for(let i=0;i<d.length;i+=4) {
      if(!d[i+3]) continue;
      let r=lut[d[i]], g=lut[d[i+1]], b=lut[d[i+2]];
      if(vib) {
        const spread=Math.max(r,g,b)-Math.min(r,g,b);
        const amount=1+vib*(1-spread/255)*1.18;
        const lum=.2126*r+.7152*g+.0722*b;
        r=clamp(lum+(r-lum)*amount);
        g=clamp(lum+(g-lum)*amount);
        b=clamp(lum+(b-lum)*amount);
      }
      d[i]=r;d[i+1]=g;d[i+2]=b;
    }
    if(c.sharpness>0 && w>2 && h>2) {
      const original=new Uint8ClampedArray(d);
      const strength=c.sharpness/100*.42;
      for(let y=1;y<h-1;y++) {
        let i=(y*w+1)*4;
        for(let x=1;x<w-1;x++,i+=4) {
          if(!original[i+3]) continue;
          for(let ch=0;ch<3;ch++) {
            const p=original[i+ch];
            d[i+ch]=clamp(p+strength*(4*p-original[i-4+ch]-original[i+4+ch]-original[i-w*4+ch]-original[i+w*4+ch]));
          }
        }
      }
    }
    ctx.putImageData(image,0,0);
  }
  function drawWatermark(ctx,w,h,c) {
    if(c.wmMode==='none' || !c.wmText || c.wmOpacity===0) return;
    const fontPx=Math.max(9,Math.round(Math.min(w,h)*c.wmSize));
    ctx.save();
    ctx.globalAlpha=c.wmOpacity;
    ctx.fillStyle=c.wmColor;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font='600 '+fontPx+'px Arial, sans-serif';
    if(c.format==='image/png') ctx.globalCompositeOperation='source-atop';
    ctx.translate(w/2,h/2);
    ctx.rotate(c.wmAngle*Math.PI/180);
    if(c.wmMode==='center') ctx.fillText(c.wmText,0,0);
    else {
      const diag=Math.ceil(Math.hypot(w,h)), stepY=Math.max(fontPx*2,fontPx*c.wmGap);
      const stepX=Math.max(ctx.measureText(c.wmText).width+fontPx*2,fontPx*5);
      let row=0;
      for(let y=-diag;y<=diag;y+=stepY,row++) {
        const shift=(row%2)*stepX/2;
        for(let x=-diag+shift;x<=diag;x+=stepX) ctx.fillText(c.wmText,x,y);
      }
    }
    ctx.restore();
  }
  function renderImage(img,c,preview,file) {
    const [sw,sh]=imageDims(img);
    if(!sw||!sh) throw new Error('Ảnh không có kích thước hợp lệ');
    const box=frameFor(img,c,file);
    const sx=box.x*sw,sy=box.y*sh,srcW=box.w*sw,srcH=box.h*sh;
    const limit=preview?980:c.maxEdge;
    const scale=limit>0?Math.min(1,limit/Math.max(srcW,srcH)):1;
    const w=Math.max(1,Math.round(srcW*scale)),h=Math.max(1,Math.round(srcH*scale));
    const canvas=document.createElement('canvas');
    canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx) throw new Error('Trình duyệt không hỗ trợ Canvas');
    const hasAdjustments=!!(c.exposure||c.brightness||c.contrast||c.vibrance||c.sharpness);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    if(!hasAdjustments){
      if(c.format==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);}
      ctx.drawImage(img,sx,sy,srcW,srcH,0,0,w,h);
    }else{
      // Tile the corrections to avoid allocating multiple full-resolution
      // RGBA arrays on Android. A one-pixel halo prevents sharpness seams.
      const tile=document.createElement('canvas');
      const tc=tile.getContext('2d',{willReadFrequently:true});
      if(!tc)throw new Error('Không tạo được bộ nhớ xử lý ảnh');
      const step=512,halo=c.sharpness?1:0;
      try{
        for(let y=0;y<h;y+=step){
          for(let x=0;x<w;x+=step){
            const left=Math.max(0,x-halo),top=Math.max(0,y-halo);
            const right=Math.min(w,x+step+halo),bottom=Math.min(h,y+step+halo);
            const tw=right-left,th=bottom-top;
            tile.width=tw;tile.height=th;
            tc.imageSmoothingEnabled=true;tc.imageSmoothingQuality='high';
            if(c.format==='image/jpeg'){tc.fillStyle='#fff';tc.fillRect(0,0,tw,th);}
            tc.drawImage(img,sx+left*srcW/w,sy+top*srcH/h,tw*srcW/w,th*srcH/h,0,0,tw,th);
            adjustPixels(tc,tw,th,c);
            // putImageData's dirty rectangle writes only the center area;
            // neighbor tiles never modify source pixels for later tiles.
            const data=tc.getImageData(0,0,tw,th);
            ctx.putImageData(data,left,top,x-left,y-top,
              Math.min(step,w-x),Math.min(step,h-y));
          }
        }
      }finally {tile.width=0;tile.height=0;}
    }
    drawWatermark(ctx,w,h,c);
    if(c.textEnabled&&window.DHLText)window.DHLText.draw(ctx,w,h,c,file,Math.max(0,state.files.indexOf(file)),Math.max(1,state.files.length));
    return canvas;
  }
  function setPreviewStatus() {
    const len=state.files.length;
    el('count').textContent=len+' ảnh • '+mb(state.totals.originals);
    updateCropControls();
    el('download').disabled=!len||state.busy||state.loading;
    el('saveFolder').disabled=!len||state.busy||state.loading;
    el('clear').disabled=!len||state.busy||state.loading;
    el('previous').disabled=!len||state.index===0||state.busy;
    el('next').disabled=!len||state.index===len-1||state.busy;
    el('fileName').textContent=len?state.files[state.index].name:'Chưa chọn ảnh';
    el('position').textContent=len?(state.index+1)+' / '+len:'0 / 0';
    const pick=el('fileSelect');
    pick.replaceChildren();
    state.files.forEach((f,i)=>{
      const opt=document.createElement('option');opt.value=String(i);opt.textContent=(i+1)+'. '+f.name;pick.appendChild(opt);
    });
    pick.value=String(state.index);pick.disabled=!len||state.busy;
  }
  function schedulePreview() {
    clearTimeout(state.timer);
    state.previewSeq++;
    state.timer=setTimeout(renderPreview,130);
  }
  async function renderPreview() {
    const id=++state.previewSeq, file=state.files[state.index];
    if(!file || state.busy) return;
    el('previewNote').textContent='Đang tạo ảnh xem trước…';
    previewSizes(file.size,null,null);
    let img;
    try {
      img=await decode(file);
      if(id!==state.previewSeq) return;
      const c=renderImage(img,perFileConfig(config(),file),true,file);
      if(id!==state.previewSeq) return;
      const canvas=el('preview');
      canvas.width=c.width;canvas.height=c.height;
      canvas.getContext('2d').drawImage(c,0,0);
      c.width=0;c.height=0;
      el('previewNote').textContent='Xem trước ảnh '+(state.index+1)+' • Đang tính dung lượng xuất thực tế…';
      clearTimeout(state.sizeTimer);
      state.sizeTimer=setTimeout(()=>measureSelectedFile(id,file),400);
    } catch(e) {if(id===state.previewSeq)show('Lỗi xem trước: '+e.message,true);}
    finally {release(img);}
  }
  async function measureSelectedFile(id,file) {
    if(id!==state.previewSeq || state.busy) return;
    let img,canvas;
    try {
      const c=perFileConfig(config(),file);
      img=await decode(file);
      if(id!==state.previewSeq || state.busy) return;
      canvas=renderImage(img,c,false,file);
      const {blob,quality}=await encodeForExport(canvas,c,file);
      if(blob.type && blob.type!==c.format) throw new Error('Trình duyệt không hỗ trợ kiểu ảnh này');
      if(id!==state.previewSeq || state.busy) return;
      const estimate=state.totals.originals*blob.size/Math.max(1,file.size);
      previewSizes(file.size,blob.size,estimate);
      el('outputMB').textContent=mb(blob.size)+' ('+outputExtension(c.format).toUpperCase()+')';
      const difference=(blob.size/file.size-1)*100;
      const change=(difference>0?'+':'')+difference.toFixed(1)+'%';
      el('previewNote').textContent='Sau chỉnh: '+mb(blob.size)+' ('+change+' so với gốc)'+(quality!=null?' • mức nén '+Math.round(quality*100)+'%':'')+'. Tổng chỉ là ước tính từ ảnh đang xem.';
      // Preview the actual encoded file rather than the pre-encoding canvas.
      let exportedPreview;
      try {
        exportedPreview=await decode(blob);
        if(id===state.previewSeq && !state.busy){
          const [iw,ih]=imageDims(exportedPreview);
          const scale=Math.min(1,980/Math.max(iw,ih));
          const p=el('preview');
          p.width=Math.max(1,Math.round(iw*scale));
          p.height=Math.max(1,Math.round(ih*scale));
          const ctx=p.getContext('2d');
          ctx.imageSmoothingEnabled=true;
          ctx.imageSmoothingQuality='high';
          ctx.drawImage(exportedPreview,0,0,p.width,p.height);
        }
      } finally {release(exportedPreview);}
    } catch(e) {
      if(id===state.previewSeq){
        el('outputMB').textContent='Không tính được';
        el('previewNote').textContent='Không tính được dung lượng: '+e.message;
      }
    } finally {
      release(img);
      if(canvas){ canvas.width=0;canvas.height=0; }
    }
  }
  async function loadFiles(list) {
    if(state.busy||state.loading||state.cropScanBusy)return;
    const selected=Array.from(list).filter(file=>
      /^image\/(png|jpeg|webp|heic|heif|avif)$/.test(file.type)||
      /\.(jpe?g|png|webp|heic|heif|avif)$/i.test(file.name));
    if(!selected.length){show('Không tìm thấy ảnh JPG/PNG/WebP/HEIC/AVIF.',true);return;}
    closeCropEditor();state.cropOverrides.clear();resetCropAnalysis();
    state.loading=true;
    el('selectFiles').disabled=true;
    state.importSeq++;
    clearTimeout(state.timer);clearTimeout(state.sizeTimer);
    state.previewSeq++;
    state.files=[];state.index=0;
    state.totals={originals:0,exported:0,exportCount:0};
    state.lastExportSettings=null;
    setPreviewStatus();
    const accepted=[],errors=[];
    el('progress').max=selected.length;el('progress').value=0;
    let storage=null;
    try{
      await disposeTempFiles();
      storage=await chooseTempFolder(totalSize(selected));
      for(let i=0;i<selected.length;i++){
        const source=selected[i];
        show('Đang đọc và giữ dữ liệu ảnh Xiaomi: '+(i+1)+' / '+selected.length+'…');
        try {
          accepted.push(await snapshotSource(source,storage,i));
        }catch(error){
          errors.push(source.name+': '+String(error?.message||error));
        }
        el('progress').value=i+1;
        await new Promise(resolve=>setTimeout(resolve,0));
      }
    }catch(error){
      errors.push('Lỗi nhập ảnh: '+String(error?.message||error));
    }finally{
      state.loading=false;
      el('selectFiles').disabled=false;
      state.files=accepted;
      state.index=0;
      state.totals={originals:totalSize(accepted),exported:0,exportCount:0};
      setPreviewStatus();updateFormatHelp();
      el('failures').textContent=errors.length?'Ảnh không thể nhập:\n'+errors.join('\n'):'';
      if(accepted.length){
        schedulePreview();
        show('Đã nhập '+accepted.length+'/'+selected.length+' ảnh ('+mb(state.totals.originals)+'). Dữ liệu đã được tách khỏi bộ chọn ảnh Xiaomi.'+(errors.length?' Lỗi '+errors.length+' ảnh.':''));
      }else{
        show('Không đọc được dữ liệu ảnh nào từ thư viện Xiaomi. Kiểm tra quyền truy cập ảnh.',true);
      }
      el('progress').value=0;
    }
  }
  function nameFor(file,ext,used) {
    const base=file.name.replace(/\.[^.]+$/,'').replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_').slice(0,100)||'image';
    let name=base+'_DHL.'+ext,n=2;
    while(used.has(name.toLowerCase()))name=base+'_DHL_'+n++ +'.'+ext;
    used.add(name.toLowerCase());return name;
  }
  function blobFromCanvas(canvas,c) {
    return new Promise((resolve,reject)=>{
      canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Không mã hóa được ảnh')),
        c.format,c.format==='image/png'?undefined:c.quality);
    });
  }
  /**
   * Size-capped, visually high-quality export. Re-encoding JPEG/WebP
   * always incurs some change and never claims strict pixel losslessness.
   */
  async function encodeForExport(canvas,c,originalFile) {
    if(c.format==='image/png'){
      const blob=await blobFromCanvas(canvas,c);
      if(c.compressionMode==='under' && blob.size>=originalFile.size){
        throw new Error('PNG sau chỉnh lớn hơn ảnh gốc ('+mb(blob.size)+' > '+mb(originalFile.size)+'). Không thể vừa giảm dung lượng vừa đảm bảo lossless; có thể chọn chế độ Chất lượng tối đa để vẫn xuất.');
      }
      return {blob,quality:null};
    }
    if(c.compressionMode!=='under'){
      const quality=Math.min(.98,c.quality);
      const blob=await blobFromCanvas(canvas,{...c,quality});
      return {blob,quality};
    }
    const limit=Math.floor(originalFile.size*.99);
    const high=Math.min(.98,Math.max(.92,c.quality));
    const low=Math.min(.92,high);
    const encode=async quality=>{
      const blob=await blobFromCanvas(canvas,{...c,quality});
      if(blob.type && blob.type!==c.format)throw Error('Trình duyệt không hỗ trợ '+c.format);
      return {blob,quality};
    };
    let best=await encode(high);
    if(best.blob.size<=limit)return best;
    const minimum=await encode(low);
    if(minimum.blob.size>limit){
      throw new Error('Không thể giảm từ '+mb(minimum.blob.size)+' xuống dưới '+mb(originalFile.size)+' ở chất lượng '+Math.round(low*100)+'% trở lên. Bỏ qua ảnh này thay vì tăng dung lượng hay tự giảm chất lượng quá mức.');
    }
    let lo=low,hi=high;
    best=minimum;
    for(let tries=0;tries<6 && hi-lo>.004;tries++){
      const mid=(lo+hi)/2;
      const candidate=await encode(mid);
      if(candidate.blob.size<=limit){lo=mid;best=candidate;}
      else hi=mid;
    }
    return best;
  }
  function triggerDownload(blob,name) {
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),10000);
  }
  async function uniqueFolderName(dir,filename) {
    const i=filename.lastIndexOf('.');
    const stem=i>0?filename.slice(0,i):filename, extension=i>0?filename.slice(i):'';
    for(let n=1;n<10000;n++){
      const candidate=n===1?filename:stem+'_'+n+extension;
      try { await dir.getFileHandle(candidate); }
      catch(error) {
        if(error.name==='NotFoundError')return candidate;
        throw error;
      }
    }
    throw new Error('Quá nhiều tên tệp trùng trong thư mục.');
  }
  async function exportAll(directoryHandle=null) {
    if(state.busy||state.loading||state.cropScanBusy||!state.files.length)return;
    closeCropEditor();
    state.busy=true;state.cancel=false;state.previewSeq++;
    clearTimeout(state.sizeTimer);
    const c=config();
    const files=state.files.slice(), used=new Set(),errors=[];
    let count=0,originalTotal=0,outputTotal=0;
    state.lastExportSettings=JSON.stringify(c);
    el('download').disabled=true;el('saveFolder').disabled=true;
    el('selectFiles').disabled=true;el('clear').disabled=true;
    el('cancel').hidden=false;
    el('progress').max=files.length;el('progress').value=0;
    el('failures').textContent='';
    el('totalAfterMB').textContent='0.00 MB (đang xuất)';
    show('Đang xử lý 0 / '+files.length+' ảnh…');
    try {
      for(let i=0;i<files.length;i++) {
        if(state.cancel)break;
        let img,canvas;
        try {
          const one=perFileConfig(c,files[i]);
          img=await decode(files[i]);
          canvas=renderImage(img,one,false,files[i]);
          const {blob}=await encodeForExport(canvas,one,files[i]);
          if(blob.type && blob.type!==one.format) throw new Error('Trình duyệt không hỗ trợ '+one.format);
          const filename=nameFor(files[i],outputExtension(one.format),used);
          if(directoryHandle){
            const safeName=await uniqueFolderName(directoryHandle,filename);
            const handle=await directoryHandle.getFileHandle(safeName,{create:true});
            const stream=await handle.createWritable();
            try { await stream.write(blob);await stream.close(); }
            catch(e){try{await stream.abort()}catch(_){}throw e;}
          }else{
            triggerDownload(blob,filename);
          }
          count++; originalTotal+=files[i].size; outputTotal+=blob.size;
        } catch(e) { errors.push(files[i].name+': '+e.message); }
        finally {
          release(img);
          if(canvas){canvas.width=0;canvas.height=0;}
        }
        el('progress').value=i+1;
        el('totalAfterMB').textContent=mb(outputTotal)+' (đã xuất '+count+' ảnh)';
        show('Đã xử lý '+(i+1)+' / '+files.length+' • Thành công '+count+' • Lỗi '+errors.length+' • '+mb(outputTotal));
        await new Promise(resolve=>setTimeout(resolve,50));
      }
      state.totals.exported=outputTotal;
      state.totals.exportCount=count;
      if(count) {
        const note=directoryHandle?'Đã lưu '+count+' ảnh trong thư mục đã chọn.':
          'Đã gửi lệnh tải '+count+' ảnh riêng lẻ. Nếu trình duyệt hỏi, hãy cho phép tải nhiều tệp.';
        show(note+' Tổng gốc (ảnh thành công): '+mb(originalTotal)+' → đầu ra: '+mb(outputTotal)+
          (state.cancel?' (đã dừng phần còn lại)':'')+(errors.length?'. Lỗi '+errors.length+' ảnh.':''));
      }else show('Không xuất thành công ảnh nào.',true);
      if(errors.length)el('failures').textContent='Ảnh lỗi:\n'+errors.join('\n');
    } catch(e) { show('Lỗi xuất ảnh: '+e.message,true); }
    finally {
      state.busy=false;state.cancel=false;
      el('selectFiles').disabled=false;el('cancel').hidden=true;
      setPreviewStatus();schedulePreview();
    }
  }
  async function saveToFolder() {
    if(state.busy||state.loading||!state.files.length)return;
    if(typeof window.showDirectoryPicker!=='function'){
      show('Thiết bị không hỗ trợ chọn thư mục. Hãy dùng Tải tất cả ảnh.',true);return;
    }
    try {
      // Must be invoked directly in the click handler to retain user activation.
      const dir=await window.showDirectoryPicker({mode:'readwrite'});
      if(!dir)return;
      await exportAll(dir);
    } catch(e) {
      if(e.name!=='AbortError')show('Không thể chọn thư mục: '+e.message,true);
    }
  }
  function updateFormatHelp() {
    const format=el('format').value;
    const allPng=format==='auto' && state.files.length && [...activeSourceFormats()].every(t=>t==='image/png');
    const useLossless=format==='image/png'||allPng;
    el('quality').disabled=!!useLossless;
    el('qualityRow').hidden=!!useLossless;
    let help;
    if(format==='auto'){
      help='Giữ nguyên định dạng JPG / PNG / WebP từng ảnh. '+(el('compressionMode').value==='under'?'Chỉ xuất file nhỏ hơn ảnh gốc; ưu tiên chất lượng cao và bỏ qua ảnh không đạt.':'Ưu tiên chất lượng cao, có thể lớn hơn ảnh gốc.')+' JPG/WebP vẫn mã hóa lại, không thể bảo đảm giống hệt từng pixel.';
    }else if(format==='image/png'){
      help='PNG nén không mất dữ liệu ảnh sau chỉnh sửa nhưng ảnh JPG đổi sang PNG có thể nặng gấp nhiều lần.';
    }else{
      help='JPG/WebP được mã hóa lại có hao hụt nhẹ, giữ chất lượng thị giác cao nhưng không lossless tuyệt đối. Chế độ giảm MB không hạ mức nén dưới 92%.';
    }
    el('formatHelp').textContent=help;
  }
  function updatePresetSelection() {
    const selected=Object.entries(presets).find(([,values])=>
      Object.entries(values).every(([id,value])=>Number(el(id).value)===value))?.[0];
    document.querySelectorAll('[data-preset]').forEach(button=>{
      const active=button.dataset.preset===selected;
      button.classList.toggle('selected',active);
      button.setAttribute('aria-pressed',String(active));
    });
  }
  function applyPreset(name) {
    const preset=presets[name];
    if(!preset)return;
    Object.entries(preset).forEach(([id,value])=>{el(id).value=String(value);});
    storeSettings();refreshLabels();updatePresetSelection();schedulePreview();
  }
  function init() {
    restoreSettings();
    initMobilePwa();
    keys.forEach(id=>el(id).addEventListener('input',()=>{storeSettings();refreshLabels();updatePresetSelection();if(id==='quality')updateFormatHelp();schedulePreview();}));
    ['wmMode','wmColor','wmText','format','maxEdge','compressionMode'].forEach(id=>{
      el(id).addEventListener('input',()=>{storeSettings();schedulePreview();});el(id).addEventListener('change',()=>{storeSettings();schedulePreview();});
    });
    document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>applyPreset(b.dataset.preset)));
    for(const id of ['cropEnabled','cropRatio','cropMode','cropPadding','cropSensitivity']){
      const node=el(id);
      node.addEventListener('input',()=>cropControlsChanged(id));
      if(node.tagName==='SELECT')node.addEventListener('change',()=>cropControlsChanged(id));
    }
    el('cropEdit').addEventListener('click',openCropEditor);
    el('cropCancel').addEventListener('click',closeCropEditor);
    el('cropReset').addEventListener('click',()=>{
      const ed=state.cropEditor;
      if(!ed)return;
      const c=config();
      ed.box=window.DHLCrop.analyze?window.DHLCrop.analyze(ed.img,c).rect:
        (c.cropMode==='center'?window.DHLCrop.centered(ed.img,c):window.DHLCrop.plan(ed.img,c));
      ed.auto=true;drawCropEditor();
    });
    el('cropApply').addEventListener('click',()=>{
      const ed=state.cropEditor;if(!ed)return;
      if(ed.auto)state.cropOverrides.delete(ed.file);
      else state.cropOverrides.set(ed.file,{...ed.box});
      state.lastExportSettings=null;
      closeCropEditor();updateCropControls();schedulePreview();
    });
    el('cropClearSelected').addEventListener('click',()=>{
      const file=state.files[state.index];
      if(!file)return;
      state.cropOverrides.delete(file);
      state.lastExportSettings=null;closeCropEditor();updateCropControls();schedulePreview();
    });
    el('cropEditor').addEventListener('pointerdown',startCropDrag);
    el('cropEditor').addEventListener('pointermove',moveCropDrag);
    el('cropEditor').addEventListener('pointerup',finishCropDrag);
    el('cropEditor').addEventListener('pointercancel',finishCropDrag);

    el('selectFiles').addEventListener('change',async e=>{const files=Array.from(e.target.files);try{await loadFiles(files);}finally{e.target.value='';}});
    el('previous').addEventListener('click',()=>{if(state.index>0){closeCropEditor();state.index--;setPreviewStatus();schedulePreview();}});
    el('next').addEventListener('click',()=>{if(state.index<state.files.length-1){closeCropEditor();state.index++;setPreviewStatus();schedulePreview();}});
    el('fileSelect').addEventListener('change',e=>{closeCropEditor();state.index=Number(e.target.value);setPreviewStatus();schedulePreview();});
    el('download').addEventListener('click',()=>exportAll());
    el('saveFolder').addEventListener('click',saveToFolder);
    el('saveFolder').hidden=typeof window.showDirectoryPicker!=='function';
    el('format').addEventListener('change',updateFormatHelp);
    el('compressionMode').addEventListener('change',updateFormatHelp);
    updateFormatHelp();
    el('cancel').addEventListener('click',()=>{state.cancel=true;show('Đang dừng sau ảnh hiện tại…');});
    el('clear').addEventListener('click',()=>{
      if(state.busy||state.loading||state.cropScanBusy)return;
      disposeTempFiles();
      closeCropEditor();state.cropOverrides.clear();resetCropAnalysis();
      state.files=[];state.index=0;state.previewSeq++;clearTimeout(state.timer);clearTimeout(state.sizeTimer);
      state.totals={originals:0,exported:0,exportCount:0};
      state.lastExportSettings=null;
      previewSizes(null,null,null);
      el('preview').width=1;el('preview').height=1;
      el('progress').value=0;el('failures').textContent='';
      el('previewNote').textContent='Chọn ảnh để xem trước';
      setPreviewStatus();updateFormatHelp();show('Đã xóa danh sách. Ảnh gốc trên máy không thay đổi.');
    });
    const zone=el('dropZone');
    zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('drag');});
    zone.addEventListener('dragleave',()=>zone.classList.remove('drag'));
    zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('drag');loadFiles(e.dataTransfer.files);});
    el('goBack').addEventListener('click',()=>{if(history.length>1)history.back();else location.href=location.protocol==='chrome-extension:'?'tool.html':'../direct/';});
    refreshLabels();updatePresetSelection();setPreviewStatus();
    updateCropControls();
    clearOldTempFiles();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
