/* Image Studio DHL - Batch Photo Editor R20.13. Browser-only, no uploads. */
(function () {
  'use strict';
  const el = id => document.getElementById(id);
  const keys = ['exposure','brightness','contrast','vibrance','sharpness','wmOpacity','wmSize','wmGap','wmAngle','quality'];
  const state = { files: [], index: 0, busy: false, cancel: false, previewSeq: 0, timer: null };
  const presets = {
    neutral: { exposure:0, brightness:0, contrast:0, vibrance:0, sharpness:0 },
    shop: { exposure:14, brightness:8, contrast:8, vibrance:18, sharpness:26 },
    vivid: { exposure:9, brightness:12, contrast:14, vibrance:33, sharpness:34 }
  };
  const clamp = v => Math.max(0, Math.min(255, v));
  const number = id => Number(el(id).value);
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
      quality:number('quality')/100, maxEdge:number('maxEdge')
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
    el('count').textContent=len+' ảnh';
    el('download').disabled=!len||state.busy;
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
    let img;
    try {
      img=await decode(file);
      if(id!==state.previewSeq) return;
      const c=renderImage(img,config(),true);
      if(id!==state.previewSeq) return;
      const canvas=el('preview');
      canvas.width=c.width;canvas.height=c.height;
      canvas.getContext('2d').drawImage(c,0,0);
      c.width=0;c.height=0;
      el('previewNote').textContent='Xem trước ảnh '+(state.index+1)+' • Xuất sẽ dùng thông số này cho toàn bộ ảnh';
    } catch(e) {if(id===state.previewSeq)show('Lỗi xem trước: '+e.message,true);}
    finally {release(img);}
  }
  function loadFiles(list) {
    if(state.busy) return;
    const arr=Array.from(list).filter(f=>/^image\/(png|jpeg|webp)$/.test(f.type)||/\.(jpe?g|png|webp)$/i.test(f.name));
    if(!arr.length){show('Chỉ hỗ trợ ảnh JPG, PNG và WebP.',true);return;}
    state.files=arr;state.index=0;
    setPreviewStatus(); schedulePreview();
    el('progress').value=0;el('progress').max=arr.length;
    el('failures').textContent='';
    show('Đã chọn '+arr.length+' ảnh. Chỉnh một lần, bấm Xuất ZIP để áp dụng tất cả.');
  }
  const crcTable=(()=>{
    const table=new Uint32Array(256);
    for(let i=0;i<256;i++) {
      let crc=i;
      for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
      table[i]=crc>>>0;
    }
    return table;
  })();
  function crc32(bytes) {
    let crc=0xffffffff;
    for(let i=0;i<bytes.length;i++) crc=crcTable[(crc^bytes[i])&255]^(crc>>>8);
    return (crc^0xffffffff)>>>0;
  }
  function le16(view,pos,n){view.setUint16(pos,n&65535,true);}
  function le32(view,pos,n){view.setUint32(pos,n>>>0,true);}
  function zipStamp(date) {
    const y=Math.max(1980,date.getFullYear());
    return [((date.getHours()&31)<<11)|((date.getMinutes()&63)<<5)|((date.getSeconds()>>1)&31),(((y-1980)&127)<<9)|(((date.getMonth()+1)&15)<<5)|(date.getDate()&31)];
  }
  function zipLocal(name,crc,size,time,date) {
    const a=new Uint8Array(30),v=new DataView(a.buffer);
    le32(v,0,0x04034b50);le16(v,4,20);le16(v,6,0x0800);le16(v,8,0);
    le16(v,10,time);le16(v,12,date);le32(v,14,crc);le32(v,18,size);le32(v,22,size);
    le16(v,26,name.length);le16(v,28,0);return a;
  }
  function zipCentral(name,crc,size,offset,time,date) {
    const a=new Uint8Array(46),v=new DataView(a.buffer);
    le32(v,0,0x02014b50);le16(v,4,20);le16(v,6,20);le16(v,8,0x0800);
    le16(v,10,0);le16(v,12,time);le16(v,14,date);le32(v,16,crc);
    le32(v,20,size);le32(v,24,size);le16(v,28,name.length);
    le16(v,30,0);le16(v,32,0);le16(v,34,0);le16(v,36,0);
    le32(v,38,0);le32(v,42,offset);return a;
  }
  function zipEnd(entries,centralSize,centralOffset) {
    const a=new Uint8Array(22),v=new DataView(a.buffer);
    le32(v,0,0x06054b50);le16(v,4,0);le16(v,6,0);
    le16(v,8,entries);le16(v,10,entries);le32(v,12,centralSize);le32(v,16,centralOffset);
    le16(v,20,0);return a;
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
  function triggerDownload(blob,name) {
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  async function exportAll() {
    if(state.busy||!state.files.length)return;
    state.busy=true;state.cancel=false;state.previewSeq++;
    const c=config(), ext=c.format==='image/png'?'png':c.format==='image/webp'?'webp':'jpg';
    const files=state.files.slice(), used=new Set(), parts=[],central=[],errors=[];
    let offset=0,count=0,centralSize=0;
    el('download').disabled=true;el('selectFiles').disabled=true;el('clear').disabled=true;
    el('cancel').hidden=false;
    el('progress').max=files.length;el('progress').value=0;
    el('failures').textContent='';
    show('Đang xử lý 0 / '+files.length+' ảnh…');
    try {
      for(let i=0;i<files.length;i++) {
        if(state.cancel)break;
        let img,canvas;
        try {
          img=await decode(files[i]);
          canvas=renderImage(img,c,false);
          const blob=await blobFromCanvas(canvas,c);
          if(blob.type && blob.type!==c.format) throw new Error('Trình duyệt không hỗ trợ định dạng '+c.format);
          if(blob.size>0xffffffff)throw new Error('File vượt giới hạn ZIP32');
          const bytes=new Uint8Array(await blob.arrayBuffer());
          const checksum=crc32(bytes);
          const name=new TextEncoder().encode(nameFor(files[i],ext,used));
          const stamp=zipStamp(new Date(files[i].lastModified||Date.now()));
          const local=zipLocal(name,checksum,blob.size,stamp[0],stamp[1]);
          if(offset+local.length+name.length+blob.size>0xffffffff)throw new Error('Tổng ZIP vượt 4 GB. Hãy chia lô.');
          parts.push(local,name,blob);
          const cent=zipCentral(name,checksum,blob.size,offset,stamp[0],stamp[1]);
          central.push(cent,name);centralSize+=cent.length+name.length;
          offset+=local.length+name.length+blob.size;
          count++;
        }catch(e){errors.push(files[i].name+': '+e.message);}
        finally {
          release(img);
          if(canvas){canvas.width=0;canvas.height=0;}
        }
        el('progress').value=i+1;
        show('Đã xử lý '+(i+1)+' / '+files.length+' • Thành công '+count+' • Lỗi '+errors.length);
        await new Promise(resolve=>setTimeout(resolve,0));
      }
      if(count) {
        if(offset+centralSize>0xffffffff)throw new Error('ZIP quá lớn để xuất. Hãy chia lô nhỏ.');
        const zip=new Blob([...parts,...central,zipEnd(count,centralSize,offset)],{type:'application/zip'});
        triggerDownload(zip,'DHL_Anh_Bao_Ve_'+count+'_anh.zip');
        show('Đã xuất ZIP gồm '+count+' ảnh'+(state.cancel?' (đã dừng phần còn lại)':'')+'.'+(errors.length?' Lỗi '+errors.length+' ảnh.':''));
      }else show('Không có ảnh nào xuất thành công.',true);
      if(errors.length) el('failures').textContent='Ảnh lỗi:\n'+errors.join('\n');
    }catch(e) {show('Lỗi tạo ZIP: '+e.message,true);}
    finally {
      state.busy=false;state.cancel=false;
      el('selectFiles').disabled=false;el('cancel').hidden=true;
      setPreviewStatus();schedulePreview();
    }
  }
  function applyPreset(name) {
    const preset=presets[name];
    if(!preset)return;
    Object.entries(preset).forEach(([id,value])=>{el(id).value=String(value);});
    refreshLabels();schedulePreview();
  }
  function init() {
    keys.forEach(id=>el(id).addEventListener('input',()=>{refreshLabels();schedulePreview();}));
    ['wmMode','wmColor','wmText','format','maxEdge'].forEach(id=>{
      el(id).addEventListener('input',schedulePreview);el(id).addEventListener('change',schedulePreview);
    });
    document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>applyPreset(b.dataset.preset)));
    el('selectFiles').addEventListener('change',e=>{loadFiles(e.target.files);e.target.value='';});
    el('previous').addEventListener('click',()=>{if(state.index>0){state.index--;setPreviewStatus();schedulePreview();}});
    el('next').addEventListener('click',()=>{if(state.index<state.files.length-1){state.index++;setPreviewStatus();schedulePreview();}});
    el('fileSelect').addEventListener('change',e=>{state.index=Number(e.target.value);setPreviewStatus();schedulePreview();});
    el('download').addEventListener('click',exportAll);
    el('cancel').addEventListener('click',()=>{state.cancel=true;show('Đang dừng sau ảnh hiện tại…');});
    el('clear').addEventListener('click',()=>{
      if(state.busy)return;
      state.files=[];state.index=0;state.previewSeq++;clearTimeout(state.timer);
      el('preview').width=1;el('preview').height=1;
      el('progress').value=0;el('failures').textContent='';
      el('previewNote').textContent='Chọn ảnh để xem trước';
      setPreviewStatus();show('Đã xóa danh sách. Ảnh gốc trên máy không thay đổi.');
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
