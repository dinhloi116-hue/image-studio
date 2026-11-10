/* Image Studio DHL - Batch Photo Editor R20.16. Adaptive, size-limited quality-first export. */
(function () {
  'use strict';
  const el = id => document.getElementById(id);
  const keys = ['exposure','brightness','contrast','vibrance','sharpness','wmOpacity','wmSize','wmGap','wmAngle','quality'];
  const state = { files: [], index: 0, busy: false, cancel: false, previewSeq: 0, timer: null, sizeTimer: null, lastExportSettings: null, totals: { originals:0, exported:0, exportCount:0 } };
  const presets = {
    neutral: { exposure:0, brightness:0, contrast:0, vibrance:0, sharpness:0 },
    shop: { exposure:14, brightness:8, contrast:8, vibrance:18, sharpness:26 },
    vivid: { exposure:9, brightness:12, contrast:14, vibrance:33, sharpness:34 }
  };
  const clamp = v => Math.max(0, Math.min(255, v));
  const number = id => Number(el(id).value);
  function sourceMime(file) {
    const type=(file.type||'').toLowerCase();
    if(type==='image/jpeg'||/\.jpe?g$/i.test(file.name))return 'image/jpeg';
    if(type==='image/webp'||/\.webp$/i.test(file.name))return 'image/webp';
    return 'image/png';
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
      quality:number('quality')/100, maxEdge:number('maxEdge'), compressionMode:el('compressionMode').value
    };
  }
  function formatValue(id) {
    const n = number(id);
    if (id === 'exposure') return (n>0?'+':'')+(n/100).toFixed(2)+' EV';
    if (id === 'wmSize') return n+'%';
    if (id === 'wmAngle') return n+'°';
    if (id === 'quality') return n+'%';
    if (id === 'wmOpacity') return n+'%';
    if (id === 'wmGap') return n+'×';
    return (n>0?'+':'')+n;
  }
  function refreshLabels() { keys.forEach(id=>{ const node=el(id+'Value'); if(node)node.textContent=formatValue(id); }); }
  async function decode(file) {
    if (typeof createImageBitmap === 'function') {
      try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
      catch (_) { /* browser fallback */ }
    }
    return new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(file);
      const img=new Image();
      img.onload=()=>{URL.revokeObjectURL(url); resolve(img);};
      img.onerror=()=>{URL.revokeObjectURL(url); reject(new Error('Không đọc được định dạng ảnh'));};
      img.src=url;
    });
  }
  function release(img) { if(img && typeof img.close === 'function') img.close(); }
  function imageDims(img) {return [img.width || img.naturalWidth, img.height || img.naturalHeight];}
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
  function renderImage(img,c,preview) {
    const [sw,sh]=imageDims(img);
    if(!sw||!sh) throw new Error('Ảnh không có kích thước hợp lệ');
    const limit=preview?980:c.maxEdge;
    const scale=limit>0?Math.min(1,limit/Math.max(sw,sh)):1;
    const w=Math.max(1,Math.round(sw*scale)),h=Math.max(1,Math.round(sh*scale));
    const canvas=document.createElement('canvas');
    canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx) throw new Error('Trình duyệt không hỗ trợ Canvas');
    if(c.format==='image/jpeg') {ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);}
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(img,0,0,w,h);
    adjustPixels(ctx,w,h,c);
    drawWatermark(ctx,w,h,c);
    return canvas;
  }
  function setPreviewStatus() {
    const len=state.files.length;
    el('count').textContent=len+' ảnh • '+mb(state.totals.originals);
    el('download').disabled=!len||state.busy;
    el('saveFolder').disabled=!len||state.busy;
    el('clear').disabled=!len||state.busy;
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
      const c=renderImage(img,perFileConfig(config(),file),true);
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
      canvas=renderImage(img,c,false);
      const {blob,quality}=await encodeForExport(canvas,c,file);
      if(blob.type && blob.type!==c.format) throw new Error('Trình duyệt không hỗ trợ kiểu ảnh này');
      if(id!==state.previewSeq || state.busy) return;
      const estimate=state.totals.originals*blob.size/Math.max(1,file.size);
      previewSizes(file.size,blob.size,estimate);
      el('outputMB').textContent=mb(blob.size)+' ('+outputExtension(c.format).toUpperCase()+')';
      const difference=(blob.size/file.size-1)*100;
      const change=(difference>0?'+':'')+difference.toFixed(1)+'%';
      el('previewNote').textContent='Sau chỉnh: '+mb(blob.size)+' ('+change+' so với gốc)'+(quality!=null?' • mức nén '+Math.round(quality*100)+'%':'')+'. Tổng chỉ là ước tính từ ảnh đang xem.';
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
  function loadFiles(list) {
    if(state.busy) return;
    const arr=Array.from(list).filter(f=>/^image\/(png|jpeg|webp)$/.test(f.type)||/\.(jpe?g|png|webp)$/i.test(f.name));
    if(!arr.length){show('Chỉ hỗ trợ ảnh JPG, PNG và WebP.',true);return;}
    state.files=arr;state.index=0;
    state.totals={originals:totalSize(arr),exported:0,exportCount:0};
    state.lastExportSettings=null;
    setPreviewStatus(); updateFormatHelp(); schedulePreview();
    el('progress').value=0;el('progress').max=arr.length;
    el('failures').textContent='';
    el('totalAfterMB').textContent='Chưa có số liệu';
    show('Đã chọn '+arr.length+' ảnh ('+mb(state.totals.originals)+'). Xuất ảnh riêng lẻ, không tạo ZIP.');
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
    const high=Math.min(.98,Math.max(.86,c.quality));
    const low=Math.min(.88,high);
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
    if(state.busy||!state.files.length)return;
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
          canvas=renderImage(img,one,false);
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
    if(state.busy||!state.files.length)return;
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
      help='JPG/WebP được mã hóa lại có hao hụt nhẹ, giữ chất lượng thị giác cao nhưng không lossless tuyệt đối. Chế độ giảm MB không hạ mức nén dưới 88%.';
    }
    el('formatHelp').textContent=help;
  }
  function applyPreset(name) {
    const preset=presets[name];
    if(!preset)return;
    Object.entries(preset).forEach(([id,value])=>{el(id).value=String(value);});
    refreshLabels();schedulePreview();
  }
  function init() {
    keys.forEach(id=>el(id).addEventListener('input',()=>{refreshLabels();if(id==='quality')updateFormatHelp();schedulePreview();}));
    ['wmMode','wmColor','wmText','format','maxEdge','compressionMode'].forEach(id=>{
      el(id).addEventListener('input',schedulePreview);el(id).addEventListener('change',schedulePreview);
    });
    document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>applyPreset(b.dataset.preset)));
    el('selectFiles').addEventListener('change',e=>{loadFiles(e.target.files);e.target.value='';});
    el('previous').addEventListener('click',()=>{if(state.index>0){state.index--;setPreviewStatus();schedulePreview();}});
    el('next').addEventListener('click',()=>{if(state.index<state.files.length-1){state.index++;setPreviewStatus();schedulePreview();}});
    el('fileSelect').addEventListener('change',e=>{state.index=Number(e.target.value);setPreviewStatus();schedulePreview();});
    el('download').addEventListener('click',()=>exportAll());
    el('saveFolder').addEventListener('click',saveToFolder);
    el('saveFolder').hidden=typeof window.showDirectoryPicker!=='function';
    el('format').addEventListener('change',updateFormatHelp);
    el('compressionMode').addEventListener('change',updateFormatHelp);
    updateFormatHelp();
    el('cancel').addEventListener('click',()=>{state.cancel=true;show('Đang dừng sau ảnh hiện tại…');});
    el('clear').addEventListener('click',()=>{
      if(state.busy)return;
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
    refreshLabels();setPreviewStatus();applyPreset('shop');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
