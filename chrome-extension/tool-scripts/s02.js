(function(){
  function initPreviewModule(){
    const $=id=>document.getElementById(id);
    const prepBtn=$('openPrepModeBtn'), prevBtn=$('openPreviewModeBtn'), logoBtn=$('openLogoModeBtn'), renameBtn=$('openRenameModeBtn'), prepSection=$('prepSection'), previewSection=$('previewSection'), logoSection=$('logoSection'), renameSection=$('renameSection');
    function setBtnText(id,text){ const b=$(id); if(b) b.textContent=text; }
    function updateTopActions(mode){
      const pick=$('pickBtn'), quick=$('quickAllBtn'), all=$('processAllBtn'), zip=$('downloadAllBtn'), clear=$('clearBtn');
      if(mode==='logo'){
        setBtnText('pickBtn','+ Chọn ảnh');
        setBtnText('quickAllBtn','Xử lý logo/chữ');
        setBtnText('processAllBtn','Xử lý tất cả');
        setBtnText('downloadAllBtn','Tải hàng loạt');
        setBtnText('clearBtn','Xóa ảnh');
        if(quick) quick.title='Xử lý ảnh trong tab Chèn logo / chữ';
        if(all) all.title='Xử lý tất cả ảnh trong tab Chèn logo / chữ';
        if(zip) zip.title='Tải hàng loạt ảnh watermark đã xử lý';
      }else if(mode==='preview'){
        setBtnText('pickBtn','+ Chọn ảnh áo');
        setBtnText('quickAllBtn','Xuất PNG');
        setBtnText('processAllBtn','Xuất JPG');
        setBtnText('downloadAllBtn','Tải Preview');
        setBtnText('clearBtn','Đặt lại');
      }else{
        setBtnText('pickBtn','+ Chọn ảnh');
        setBtnText('quickAllBtn','Xử lý nhanh');
        setBtnText('processAllBtn','Xử lý tất cả');
        setBtnText('downloadAllBtn','Tải hàng loạt');
        setBtnText('clearBtn','Xóa');
      }
    }
    function showMode(mode){
      if(prepSection) prepSection.classList.toggle('hidden', mode!=='prep');
      if(previewSection) previewSection.classList.toggle('hidden', mode!=='preview');
      if(logoSection) logoSection.classList.toggle('hidden', mode!=='logo');
      if(renameSection) renameSection.classList.toggle('hidden', mode!=='rename');
      if(prepBtn) prepBtn.classList.toggle('active', mode==='prep');
      if(prevBtn) prevBtn.classList.toggle('active', mode==='preview');
      if(logoBtn) logoBtn.classList.toggle('active', mode==='logo');
      if(renameBtn) renameBtn.classList.toggle('active', mode==='rename');
      document.body.dataset.mode=mode;
      updateTopActions(mode);
      try{localStorage.setItem('pip_mainMode', mode)}catch(e){}
      window.pipSetMainMode = showMode;
    }
    if(prepBtn) prepBtn.addEventListener('click', ()=>showMode('prep'));
    if(prevBtn) prevBtn.addEventListener('click', ()=>showMode('preview'));
    if(logoBtn) logoBtn.addEventListener('click', ()=>showMode('logo'));
    if(renameBtn) renameBtn.addEventListener('click', ()=>showMode('rename'));
    let saved='prep'; try{saved=localStorage.getItem('pip_mainMode')||'prep'}catch(e){}
    if(!['prep','preview','logo','rename'].includes(saved)) saved='prep';
    showMode(saved);

    const canvas=$('p_canvas'); if(!canvas) return;
    const ctx=canvas.getContext('2d');
    const els={
      bgFile:$('p_bgFile'),fitBtn:$('p_fitBtn'),resetPosBtn:$('p_resetPosBtn'),nameText:$('p_nameText'),numberText:$('p_numberText'),uppercaseName:$('p_uppercaseName'),
      nameFontFile:$('p_nameFontFile'),numberFontFile:$('p_numberFontFile'),nameFontLabel:$('p_nameFontLabel'),numberFontLabel:$('p_numberFontLabel'),
      nameHeightCm:$('p_nameHeightCm'),numberHeightCm:$('p_numberHeightCm'),gapCm:$('p_gapCm'),pxPerCm:$('p_pxPerCm'),nameTrackingCm:$('p_nameTrackingCm'),numberTrackingCm:$('p_numberTrackingCm'),strokePx:$('p_strokePx'),
      centerXCm:$('p_centerXCm'),topYCm:$('p_topYCm'),nameColor:$('p_nameColor'),numberColor:$('p_numberColor'),strokeColor:$('p_strokeColor'),showRuler:$('p_showRuler'),
      exportBtn:$('p_exportBtn'),exportJpgBtn:$('p_exportJpgBtn'),maxFileSizeMb:$('p_maxFileSizeMb'),exportName:$('p_exportName'),zoomInBtn:$('p_zoomInBtn'),zoomOutBtn:$('p_zoomOutBtn'),zoomResetBtn:$('p_zoomResetBtn'),status:$('p_status')
    };
    const state={
      bgImage:null,bgUrl:'',zoom:1,
      overlayImage:null,overlayUrl:'',overlaySourceCanvas:null,overlayProcessed:null,overlay:{x:0,y:0,w:0,h:0,visible:true,selected:false},overlayBg:{color:null,label:'',tolerance:36,picking:false},
      nameFontFamily:'Arial, sans-serif',
      numberFontFamily:'Arial Black, Arial, sans-serif',
      drag:{active:false,mode:'move',offsetX:0,offsetY:0,startX:0,startY:0,startW:0,startH:0,startNameCm:4,startNumCm:22,startGapCm:2,startOverlayX:0,startOverlayY:0,startOverlayW:0,startOverlayH:0}
    };
    function setStatus(msg){ if(els.status) els.status.textContent=msg; }
    function safeName(name){
      return String(name||'preview-ao').replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ').trim() || 'preview-ao';
    }
    function exportBaseName(){
      return safeName(els.exportName && els.exportName.value ? els.exportName.value : 'preview-ao');
    }
    function num(el,fallback=0){ const v=parseFloat(el&&el.value); return Number.isFinite(v)?v:fallback; }
    function cmToPx(cm){return num(els.pxPerCm,38)*cm}
    function pxToCm(px){return px/Math.max(.0001,num(els.pxPerCm,38))}
    function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
    function nameValue(){const t=(els.nameText&&els.nameText.value)||'';return els.uppercaseName&&els.uppercaseName.value==='on'?t.toUpperCase():t}
    function numberValue(){return (els.numberText&&els.numberText.value)||''}
    function drawRuler(){if(!els.showRuler||els.showRuler.value!=='on')return;const ppcm=num(els.pxPerCm,38);ctx.save();ctx.strokeStyle='rgba(120,170,255,.55)';ctx.fillStyle='rgba(210,230,255,.9)';ctx.lineWidth=1;ctx.font='12px Arial';for(let x=0,i=0;x<=canvas.width;x+=ppcm,i++){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,i%5===0?22:12);ctx.stroke();if(i>0)ctx.fillText(i+'cm',x+2,10)}for(let y=0,i=0;y<=canvas.height;y+=ppcm,i++){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(i%5===0?22:12,y);ctx.stroke();if(i>0)ctx.fillText(i+'cm',4,y-2)}ctx.restore()}
    function fitFontPx(text,family,targetHeightPx,weight='700'){const probe=text&&text.trim()?text:'10';let low=1,high=1000,best=10;for(let i=0;i<18;i++){const mid=(low+high)/2;ctx.font=`${weight} ${mid}px ${family}`;const m=ctx.measureText(probe);const h=(m.actualBoundingBoxAscent||mid*.8)+(m.actualBoundingBoxDescent||mid*.2);if(h<targetHeightPx){low=mid;best=mid}else high=mid}return best}
    function measureSpacedText(text,family,fontPx,trackingPx,weight='700'){ctx.font=`${weight} ${fontPx}px ${family}`;let width=0;for(let i=0;i<text.length;i++){width+=ctx.measureText(text[i]).width;if(i<text.length-1)width+=trackingPx}const m=ctx.measureText(text||' ');const height=(m.actualBoundingBoxAscent||fontPx*.8)+(m.actualBoundingBoxDescent||fontPx*.2);return{width,height,ascent:(m.actualBoundingBoxAscent||fontPx*.8),descent:(m.actualBoundingBoxDescent||fontPx*.2)}}
    function drawSpacedText(text,x,baselineY,family,fontPx,trackingPx,fill,strokePx,strokeColor,align='center',weight='700'){ctx.save();ctx.font=`${weight} ${fontPx}px ${family}`;ctx.textBaseline='alphabetic';ctx.fillStyle=fill;ctx.lineJoin='round';ctx.lineCap='round';ctx.lineWidth=strokePx;ctx.strokeStyle=strokeColor;const meas=measureSpacedText(text,family,fontPx,trackingPx,weight);let startX=x;if(align==='center')startX=x-meas.width/2;else if(align==='right')startX=x-meas.width;let cursorX=startX;for(let i=0;i<text.length;i++){const ch=text[i];if(strokePx>0)ctx.strokeText(ch,cursorX,baselineY);ctx.fillText(ch,cursorX,baselineY);cursorX+=ctx.measureText(ch).width+(i<text.length-1?trackingPx:0)}ctx.restore();return meas}
    function getLayout(){
      const name=nameValue(),number=numberValue(),centerX=cmToPx(num(els.centerXCm,15)),topY=cmToPx(num(els.topYCm,5)),nameHeightPx=cmToPx(num(els.nameHeightCm,4)),numHeightPx=cmToPx(num(els.numberHeightCm,22)),gapPx=cmToPx(num(els.gapCm,2)),nameTrackingPx=cmToPx(num(els.nameTrackingCm,.15)),numberTrackingPx=cmToPx(num(els.numberTrackingCm,.05)),strokePx=num(els.strokePx,0);
      const nameFontPx=fitFontPx(name||'ABC',state.nameFontFamily,nameHeightPx,'700'),numberFontPx=fitFontPx(number||'10',state.numberFontFamily,numHeightPx,'900');
      const nameMeasure=measureSpacedText(name||'ABC',state.nameFontFamily,nameFontPx,nameTrackingPx,'700'),numberMeasure=measureSpacedText(number||'10',state.numberFontFamily,numberFontPx,numberTrackingPx,'900');
      const nameTop=topY,nameBaseline=nameTop+nameMeasure.ascent,nameBottom=nameTop+nameMeasure.height,numberTop=nameBottom+gapPx,numberBaseline=numberTop+numberMeasure.ascent,blockTop=nameTop,blockBottom=numberTop+numberMeasure.height,blockWidth=Math.max(nameMeasure.width,numberMeasure.width);
      return{name,number,centerX,topY,nameTrackingPx,numberTrackingPx,strokePx,nameFontPx,numberFontPx,nameMeasure,numberMeasure,nameTop,nameBaseline,nameBottom,numberTop,numberBaseline,blockTop,blockBottom,blockWidth,blockHeight:blockBottom-blockTop,blockLeft:centerX-blockWidth/2,blockRight:centerX+blockWidth/2};
    }
    function drawHandles(L){
      const hs=Math.max(12, Math.min(22, canvas.width/70));
      const pts=[
        [L.blockLeft-6,L.blockTop-6],
        [L.blockRight+6,L.blockTop-6],
        [L.blockLeft-6,L.blockBottom+6],
        [L.blockRight+6,L.blockBottom+6]
      ];
      ctx.save();
      ctx.setLineDash([8,6]);ctx.strokeStyle='rgba(59,130,246,.9)';ctx.lineWidth=1.6;
      ctx.strokeRect(L.blockLeft-6,L.blockTop-6,L.blockWidth+12,L.blockHeight+12);
      ctx.setLineDash([]);ctx.fillStyle='#1d4ed8';ctx.strokeStyle='#bfdbfe';ctx.lineWidth=2;
      for(const [x,y] of pts){ctx.beginPath();ctx.rect(x-hs/2,y-hs/2,hs,hs);ctx.fill();ctx.stroke();}
      ctx.restore();
    }
    function overlayRect(){const o=state.overlay;return{left:o.x,top:o.y,right:o.x+o.w,bottom:o.y+o.h,width:o.w,height:o.h}}
    function drawOverlayHandles(){
      if(!state.overlayImage||!state.overlay.visible)return;
      const r=overlayRect(),hs=Math.max(16,Math.min(28,canvas.width/55));
      ctx.save();ctx.setLineDash([9,6]);ctx.strokeStyle='rgba(34,197,94,.95)';ctx.lineWidth=2;
      ctx.strokeRect(r.left-4,r.top-4,r.width+8,r.height+8);ctx.setLineDash([]);
      ctx.fillStyle='#16a34a';ctx.strokeStyle='#dcfce7';ctx.lineWidth=2;
      ctx.beginPath();ctx.rect(r.right-hs/2,r.bottom-hs/2,hs,hs);ctx.fill();ctx.stroke();ctx.restore();
    }
    function renderPreview(guides=true){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      if(state.bgImage){ctx.drawImage(state.bgImage,0,0,canvas.width,canvas.height)}
      else{ctx.fillStyle='#0b1220';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='rgba(255,255,255,.25)';ctx.font='bold 28px Arial';ctx.textAlign='center';ctx.fillText('Hãy tải ảnh preview áo để bắt đầu',canvas.width/2,canvas.height/2);if(guides)drawRuler();return}
      if(state.overlayImage&&state.overlay.visible){
        const o=state.overlay;ctx.drawImage(state.overlayProcessed||state.overlayImage,o.x,o.y,o.w,o.h);
      }
      const L=getLayout();
      if(L.name)drawSpacedText(L.name,L.centerX,L.nameBaseline,state.nameFontFamily,L.nameFontPx,L.nameTrackingPx,els.nameColor.value,L.strokePx,els.strokeColor.value,'center','700');
      if(L.number)drawSpacedText(L.number,L.centerX,L.numberBaseline,state.numberFontFamily,L.numberFontPx,L.numberTrackingPx,els.numberColor.value,L.strokePx,els.strokeColor.value,'center','900');
      if(guides){drawRuler();if(L.name||L.number)drawHandles(L);if(state.overlayImage&&state.overlay.visible)drawOverlayHandles();}
    }
    async function loadFontFile(file,target){if(!file)return;const family='LocalFont_'+Date.now()+'_'+Math.floor(Math.random()*99999);const url=URL.createObjectURL(file);try{const font=new FontFace(family,`url(${url})`);await font.load();document.fonts.add(font);if(target==='name'){state.nameFontFamily=`'${family}', Arial, sans-serif`;els.nameFontLabel.textContent='Đang dùng: '+file.name}else{state.numberFontFamily=`'${family}', Arial Black, Arial, sans-serif`;els.numberFontLabel.textContent='Đang dùng: '+file.name}setStatus('Đã nạp font: '+file.name);renderPreview()}catch(err){console.error(err);alert('Không đọc được font này. Hãy thử file TTF / OTF / WOFF khác.')}finally{safeRevoke(url)}}
    function loadBackground(file){if(!file)return;const url=URL.createObjectURL(file);const img=new Image();img.onload=()=>{safeRevoke(state.bgUrl);state.bgImage=img;state.bgUrl=url;canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;fitCanvas();autoCenterDefaults();setStatus(`Đã tải ảnh nền: ${file.name} (${img.naturalWidth} × ${img.naturalHeight}px)`);renderPreview()};img.onerror=()=>{safeRevoke(url);setStatus('Không đọc được ảnh nền preview.');};img.src=url}
    function rgbHex(rgb){return '#'+rgb.map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('').toUpperCase()}
    function ensureOverlaySourceCanvas(){
      if(!state.overlayImage)return null;
      if(state.overlaySourceCanvas&&state.overlaySourceCanvas.width===state.overlayImage.naturalWidth&&state.overlaySourceCanvas.height===state.overlayImage.naturalHeight)return state.overlaySourceCanvas;
      const c=makeCanvas(Math.max(1,state.overlayImage.naturalWidth),Math.max(1,state.overlayImage.naturalHeight));
      c.getContext('2d',{willReadFrequently:true}).drawImage(state.overlayImage,0,0);
      state.overlaySourceCanvas=c;
      return c;
    }
    function rebuildOverlayProcessed(){
      if(!state.overlayImage)return;
      if(!state.overlayBg.color){state.overlayProcessed=null;renderPreview();return;}
      const src=ensureOverlaySourceCanvas();if(!src)return;
      const c=makeCanvas(src.width,src.height),cctx=c.getContext('2d',{willReadFrequently:true});
      cctx.drawImage(src,0,0);
      const im=cctx.getImageData(0,0,c.width,c.height),d=im.data,[tr,tg,tb]=state.overlayBg.color;
      const tol=clamp(Number(state.overlayBg.tolerance)||0,0,180),feather=Math.max(6,Math.min(28,tol*.35+5));
      for(let i=0;i<d.length;i+=4){
        const dr=Math.abs(d[i]-tr),dg=Math.abs(d[i+1]-tg),db=Math.abs(d[i+2]-tb),dist=Math.max(dr,dg,db);
        if(dist<=tol)d[i+3]=0;
        else if(dist<tol+feather)d[i+3]=Math.round(d[i+3]*((dist-tol)/feather));
      }
      cctx.putImageData(im,0,0);state.overlayProcessed=c;renderPreview();
    }
    function setOverlayBgColor(color,label=''){
      state.overlayBg.color=color?color.slice(0,3).map(v=>clamp(Number(v)||0,0,255)):null;
      state.overlayBg.label=label||'';state.overlayBg.picking=false;
      rebuildOverlayProcessed();
      setStatus(state.overlayBg.color?`Đã xóa nền gần màu ${state.overlayBg.label||rgbHex(state.overlayBg.color)} • dung sai ${state.overlayBg.tolerance}.`:'Đã tắt xóa nền cho ảnh dán.');
    }
    function setOverlayBgTolerance(value){
      state.overlayBg.tolerance=clamp(Number(value)||0,0,180);
      if(state.overlayBg.color)rebuildOverlayProcessed();
      setStatus(`Dung sai xóa nền: ${state.overlayBg.tolerance}.`);
    }
    function beginOverlayBgPick(){
      if(!state.overlayImage){setStatus('Hãy dán ảnh trước rồi mới chích màu nền.');return}
      state.overlayBg.picking=true;
      setStatus('Ống hút đang bật: click trực tiếp vào màu nền trên ảnh dán.');
      renderPreview();
    }
    function sampleOverlayBgColor(p){
      if(!state.overlayImage||!pointInOverlay(p))return false;
      const src=ensureOverlaySourceCanvas();if(!src)return false;
      const o=state.overlay,rx=clamp((p.x-o.x)/Math.max(1,o.w),0,0.999999),ry=clamp((p.y-o.y)/Math.max(1,o.h),0,0.999999);
      const sx=clamp(Math.floor(rx*src.width),0,src.width-1),sy=clamp(Math.floor(ry*src.height),0,src.height-1);
      const px=src.getContext('2d',{willReadFrequently:true}).getImageData(sx,sy,1,1).data,rgb=[px[0],px[1],px[2]],hex=rgbHex(rgb);
      setOverlayBgColor(rgb,hex);
      window.dispatchEvent(new CustomEvent('nameset:overlayPickedColor',{detail:{rgb,color:hex}}));
      setStatus(`Đã chích màu nền ${hex}. Có thể tăng/giảm dung sai nếu mép còn viền.`);
      return true;
    }
    function resetOverlayPosition(){
      if(!state.overlayImage)return;
      const img=state.overlayImage;
      const scale=Math.min(1,(canvas.width*.62)/Math.max(1,img.naturalWidth),(canvas.height*.58)/Math.max(1,img.naturalHeight));
      state.overlay.w=Math.max(20,img.naturalWidth*scale);state.overlay.h=Math.max(20,img.naturalHeight*scale);
      state.overlay.x=(canvas.width-state.overlay.w)/2;state.overlay.y=Math.max(0,canvas.height*.10);
      state.overlay.visible=true;state.overlay.selected=true;renderPreview();
    }
    function loadOverlay(file){
      if(!file)return;
      const url=URL.createObjectURL(file),img=new Image();
      img.onload=()=>{safeRevoke(state.overlayUrl);state.overlayImage=img;state.overlayUrl=url;state.overlaySourceCanvas=null;state.overlayProcessed=null;state.overlayBg.color=null;state.overlayBg.label='';state.overlayBg.picking=false;ensureOverlaySourceCanvas();resetOverlayPosition();window.dispatchEvent(new CustomEvent('nameset:overlayBgReset'));setStatus(`Đã dán thêm ảnh: ${file.name||'clipboard'} • kéo để di chuyển, kéo ô xanh góc phải dưới để co giãn.`);renderPreview();};
      img.onerror=()=>{safeRevoke(url);setStatus('Không đọc được ảnh dán thêm.');};
      img.src=url;
    }
    function clearOverlay(){safeRevoke(state.overlayUrl);state.overlayImage=null;state.overlayUrl='';state.overlaySourceCanvas=null;state.overlayProcessed=null;state.overlayBg.color=null;state.overlayBg.label='';state.overlayBg.picking=false;state.overlay.selected=false;window.dispatchEvent(new CustomEvent('nameset:overlayBgReset'));renderPreview();setStatus('Đã xóa ảnh dán thêm.')}
    function toggleOverlay(force){if(!state.overlayImage)return;state.overlay.visible=typeof force==='boolean'?force:!state.overlay.visible;renderPreview();setStatus(state.overlay.visible?'Đã hiện ảnh dán thêm.':'Đã ẩn ảnh dán thêm.')}
    window.namesetPreviewOverlay={loadOverlay,clearOverlay,toggleOverlay,resetOverlayPosition,setOverlayBgColor,setOverlayBgTolerance,beginOverlayBgPick,get state(){return state.overlay},get bg(){return state.overlayBg}};
    window.addEventListener('nameset:overlayFile',e=>{const f=e.detail&&e.detail.file;if(f)loadOverlay(f)});
    window.addEventListener('nameset:overlayCommand',e=>{const d=e.detail||{},cmd=d.command;if(cmd==='clear')clearOverlay();else if(cmd==='toggle')toggleOverlay();else if(cmd==='reset')resetOverlayPosition();else if(cmd==='bg-none')setOverlayBgColor(null,'');else if(cmd==='bg-white')setOverlayBgColor([255,255,255],'trắng');else if(cmd==='bg-black')setOverlayBgColor([0,0,0],'đen');else if(cmd==='bg-pick')beginOverlayBgPick();else if(cmd==='bg-tolerance')setOverlayBgTolerance(d.value)});
    function autoCenterDefaults(){if(els.centerXCm)els.centerXCm.value=(pxToCm(canvas.width/2)).toFixed(1);if(els.topYCm)els.topYCm.value=Math.max(0,pxToCm(canvas.height*.12)).toFixed(1)}
    function fitCanvas(){canvas.style.width=`${Math.round(canvas.width*state.zoom)}px`;canvas.style.height=`${Math.round(canvas.height*state.zoom)}px`}
    function makeCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
    function blobFromCanvas(c,mime='image/png',quality){return new Promise(resolve=>c.toBlob(resolve,mime,quality))}
    async function exportCanvasWithLimit(srcCanvas,mime='image/png'){
      const maxMb=parseFloat(els.maxFileSizeMb&&els.maxFileSizeMb.value||0)||0, maxBytes=maxMb*1024*1024;
      if(maxBytes<=0){const blob=await blobFromCanvas(srcCanvas,mime,mime==='image/jpeg'?0.96:undefined);return {blob,canvas:srcCanvas};}
      let work=makeCanvas(srcCanvas.width,srcCanvas.height); work.getContext('2d').drawImage(srcCanvas,0,0);
      let blob=await blobFromCanvas(work,mime,mime==='image/jpeg'?0.92:undefined);
      if(blob&&blob.size<=maxBytes)return{blob,canvas:work};
      if(mime==='image/jpeg'){for(const q of [0.88,0.82,0.76,0.7,0.64,0.58]){blob=await blobFromCanvas(work,mime,q);if(blob&&blob.size<=maxBytes)return{blob,canvas:work};}}
      for(let i=0;i<8&&blob&&blob.size>maxBytes&&work.width>220&&work.height>220;i++){
        const ratio=Math.max(0.5,Math.min(0.95,Math.sqrt(maxBytes/blob.size)*0.98));
        const nw=Math.max(1,Math.round(work.width*ratio)), nh=Math.max(1,Math.round(work.height*ratio));
        const smaller=makeCanvas(nw,nh); smaller.getContext('2d').drawImage(work,0,0,nw,nh); work=smaller;
        blob=await blobFromCanvas(work,mime,mime==='image/jpeg'?0.86:undefined);
        if(mime==='image/jpeg'&&blob&&blob.size>maxBytes){for(const q of [0.8,0.74,0.68,0.62,0.56]){blob=await blobFromCanvas(work,mime,q);if(blob&&blob.size<=maxBytes)break;}}
      }
      return{blob,canvas:work};
    }
    async function exportImage(type='png'){
      if(!state.bgImage){ alert('Bạn chưa tải ảnh nền.'); return; }
      try{
        setStatus('Đang xuất file preview...');
        renderPreview(false);
        const mime=type==='jpg' ? 'image/jpeg' : 'image/png';
        const exported=await exportCanvasWithLimit(canvas,mime);
        const blob=exported.blob;
        if(!blob) throw new Error('Không tạo được file ảnh để tải về.');
        const a=document.createElement('a');
        a.href=URL.createObjectURL(blob);
        a.download=`${exportBaseName()}.${type==='jpg'?'jpg':'png'}`;
        document.body.appendChild(a);
        a.click();
        setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500);
        setStatus(`Đã xuất preview ${type.toUpperCase()}${(parseFloat(els.maxFileSizeMb&&els.maxFileSizeMb.value||0)||0)>0?` • ${Math.round(blob.size/1024)} KB`:''}`);
      }catch(err){
        console.error(err);
        alert('Lỗi xuất preview: ' + (err.message || err));
        setStatus('Lỗi xuất preview.');
      }finally{
        setTimeout(()=>renderPreview(true),50);
      }
    }
    function canvasMousePos(evt){const rect=canvas.getBoundingClientRect(),scaleX=canvas.width/rect.width,scaleY=canvas.height/rect.height;return{x:(evt.clientX-rect.left)*scaleX,y:(evt.clientY-rect.top)*scaleY}}
    function hitResizeHandle(p,L){
      const hs=Math.max(18, Math.min(32, canvas.width/45));
      const pts=[[L.blockLeft-6,L.blockTop-6],[L.blockRight+6,L.blockTop-6],[L.blockLeft-6,L.blockBottom+6],[L.blockRight+6,L.blockBottom+6]];
      for(const [x,y] of pts){ if(Math.abs(p.x-x)<=hs && Math.abs(p.y-y)<=hs) return true; }
      return false;
    }
    function pointInBlock(p,L){return p.x>=L.blockLeft-14&&p.x<=L.blockRight+14&&p.y>=L.blockTop-14&&p.y<=L.blockBottom+14}
    function pointInOverlay(p){if(!state.overlayImage||!state.overlay.visible)return false;const r=overlayRect();return p.x>=r.left&&p.x<=r.right&&p.y>=r.top&&p.y<=r.bottom}
    function hitOverlayResize(p){if(!state.overlayImage||!state.overlay.visible)return false;const r=overlayRect(),hs=Math.max(20,Math.min(34,canvas.width/45));return Math.abs(p.x-r.right)<=hs&&Math.abs(p.y-r.bottom)<=hs}
    ['p_nameText','p_numberText','p_uppercaseName','p_nameHeightCm','p_numberHeightCm','p_gapCm','p_pxPerCm','p_nameTrackingCm','p_numberTrackingCm','p_strokePx','p_centerXCm','p_topYCm','p_nameColor','p_numberColor','p_strokeColor','p_showRuler'].forEach(id=>{const el=$(id);if(!el)return;el.addEventListener('input',()=>renderPreview());el.addEventListener('change',()=>renderPreview())});
    if(els.bgFile)els.bgFile.addEventListener('change',e=>loadBackground(e.target.files[0]));
    if(els.nameFontFile)els.nameFontFile.addEventListener('change',e=>loadFontFile(e.target.files[0],'name'));
    if(els.numberFontFile)els.numberFontFile.addEventListener('change',e=>loadFontFile(e.target.files[0],'number'));
    if(els.exportBtn)els.exportBtn.addEventListener('click',()=>exportImage('png'));
    if(els.exportJpgBtn)els.exportJpgBtn.addEventListener('click',()=>exportImage('jpg'));
    if(els.fitBtn)els.fitBtn.addEventListener('click',()=>{fitCanvas();setStatus('Đã canh lại khung preview.')});
    if(els.resetPosBtn)els.resetPosBtn.addEventListener('click',()=>{autoCenterDefaults();renderPreview();setStatus('Đã đặt lại vị trí khối chữ.')});
    if(els.zoomInBtn)els.zoomInBtn.addEventListener('click',()=>{state.zoom=clamp(state.zoom+.1,.2,4);fitCanvas()});
    if(els.zoomOutBtn)els.zoomOutBtn.addEventListener('click',()=>{state.zoom=clamp(state.zoom-.1,.2,4);fitCanvas()});
    if(els.zoomResetBtn)els.zoomResetBtn.addEventListener('click',()=>{state.zoom=1;fitCanvas()});
    canvas.addEventListener('mousedown',e=>{
      if(!state.bgImage)return;
      const p=canvasMousePos(e), L=getLayout();
      if(state.overlayBg.picking){
        if(sampleOverlayBgColor(p))return;
        state.overlayBg.picking=false;setStatus('Đã hủy ống hút màu.');renderPreview();return;
      }
      if(hitOverlayResize(p)){
        const o=state.overlay;state.drag.active=true;state.drag.mode='overlay-resize';state.drag.startX=p.x;state.drag.startY=p.y;state.drag.startOverlayX=o.x;state.drag.startOverlayY=o.y;state.drag.startOverlayW=o.w;state.drag.startOverlayH=o.h;
        canvas.classList.add('dragging');setStatus('Đang co giãn ảnh dán thêm...');
      }else if(pointInOverlay(p)){
        const o=state.overlay;state.drag.active=true;state.drag.mode='overlay-move';state.drag.offsetX=p.x-o.x;state.drag.offsetY=p.y-o.y;
        canvas.classList.add('dragging');setStatus('Đang di chuyển ảnh dán thêm...');
      }else if((L.name||L.number)&&hitResizeHandle(p,L)){
        state.drag.active=true;state.drag.mode='resize';state.drag.startY=p.y;state.drag.startW=L.blockWidth;state.drag.startH=L.blockHeight;
        state.drag.startNameCm=num(els.nameHeightCm,4);state.drag.startNumCm=num(els.numberHeightCm,22);state.drag.startGapCm=num(els.gapCm,2);
        canvas.classList.add('dragging');setStatus('Đang đổi kích thước: kéo ra xa để phóng to, kéo vào gần để thu nhỏ...');
      }else if((L.name||L.number)&&pointInBlock(p,L)){
        state.drag.active=true;state.drag.mode='move';state.drag.offsetX=p.x-L.centerX;state.drag.offsetY=p.y-L.topY;canvas.classList.add('dragging');setStatus('Đang di chuyển tên/số bằng chuột...');
      }
    });
    window.addEventListener('mousemove',e=>{
      if(!state.drag.active)return;
      const p=canvasMousePos(e);
      if(state.drag.mode==='overlay-move'){
        const o=state.overlay;o.x=clamp(p.x-state.drag.offsetX,-o.w*.85,canvas.width-o.w*.15);o.y=clamp(p.y-state.drag.offsetY,-o.h*.85,canvas.height-o.h*.15);
      }else if(state.drag.mode==='overlay-resize'){
        const aspect=Math.max(.001,state.drag.startOverlayW/Math.max(1,state.drag.startOverlayH));
        let nw=Math.max(24,state.drag.startOverlayW+(p.x-state.drag.startX));
        let nh=nw/aspect;
        if(nh<24){nh=24;nw=nh*aspect}
        const maxW=Math.max(24,canvas.width-state.drag.startOverlayX+canvas.width*.5),maxH=Math.max(24,canvas.height-state.drag.startOverlayY+canvas.height*.5);
        if(nw>maxW){nw=maxW;nh=nw/aspect}
        if(nh>maxH){nh=maxH;nw=nh*aspect}
        state.overlay.w=nw;state.overlay.h=nh;
      }else if(state.drag.mode==='move'){
        const newCenter=p.x-state.drag.offsetX,newTop=p.y-state.drag.offsetY;
        if(els.centerXCm)els.centerXCm.value=pxToCm(newCenter).toFixed(2);
        if(els.topYCm)els.topYCm.value=pxToCm(newTop).toFixed(2);
      }else{
        const L0=getLayout();
        const startCX=L0.centerX;
        const startCY=L0.blockTop + L0.blockHeight/2;
        const startDist=Math.hypot((startCX)-(startCX), (state.drag.startY)-(startCY));
        const currentDist=Math.hypot((p.x)-(startCX), (p.y)-(startCY));
        const base=Math.max(30, startDist || (L0.blockHeight/2));
        const scale=clamp(currentDist/base, .25, 4);
        if(els.nameHeightCm)els.nameHeightCm.value=(state.drag.startNameCm*scale).toFixed(2);
        if(els.numberHeightCm)els.numberHeightCm.value=(state.drag.startNumCm*scale).toFixed(2);
        if(els.gapCm)els.gapCm.value=(state.drag.startGapCm*scale).toFixed(2);
      }
      renderPreview();
    });
    window.addEventListener('mouseup',()=>{if(state.drag.active)setStatus(state.drag.mode.startsWith('overlay-')?'Đã cập nhật vị trí/kích thước ảnh dán thêm.':'Đã cập nhật vị trí/kích thước tên số.');state.drag.active=false;canvas.classList.remove('dragging')});
    
    function isPreviewMode(){ try{return localStorage.getItem('pip_mainMode')==='preview'}catch(e){return document.body.dataset.mode==='preview'} }
    function interceptTopForPreview(id, handler){
      const btn=document.getElementById(id);
      if(!btn) return;
      btn.addEventListener('click', function(e){
        if(!isPreviewMode()) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        handler();
      }, true);
    }
    interceptTopForPreview('pickBtn', ()=>{ if(els.bgFile) els.bgFile.click(); });
    interceptTopForPreview('dropPickBtn', ()=>{ if(els.bgFile) els.bgFile.click(); });
    interceptTopForPreview('quickAllBtn', ()=>exportImage('png'));
    interceptTopForPreview('processAllBtn', ()=>exportImage('jpg'));
    interceptTopForPreview('downloadAllBtn', ()=>exportImage('png'));
    interceptTopForPreview('clearBtn', ()=>{ state.bgImage=null; autoCenterDefaults(); renderPreview(); setStatus('Đã đặt lại preview tên số.'); });

    fitCanvas();renderPreview();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initPreviewModule);else initPreviewModule();
})();
