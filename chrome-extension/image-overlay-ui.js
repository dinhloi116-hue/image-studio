/* DHL Image Studio R20.24 - resilient multi-image overlay input and layer gallery.
 * Ctrl+C / Ctrl+V duplicate the currently selected logo with a small offset.
 * Layers may apply only to the viewed photo or globally to all photo exports.
 */
(function(global){
  'use strict';
  const $=id=>document.getElementById(id);
  const core=global.DHLImageOverlay;
  if(!core)throw Error('Load image-overlay.js before image-overlay-ui.js');
  const state={
    assets:new Map(),global:[],perFile:new Map(),selected:null,clipboard:null,
    currentFile:null,seq:1,drag:null,base:null,bridge:null,loading:false
  };
  const next=prefix=>prefix+(state.seq++);
  const enabled=()=>!!$('overlayEnabled')?.checked;
  function currentFile(){return state.bridge?.getFile?.()||null;}
  function arrays(){return [state.global,state.perFile.get(currentFile())||[]];}
  function visible(){if(!enabled())return [];return arrays().flat();}
  function selected(){return visible().find(l=>l.id===state.selected)||null;}
  function asset(layer){return state.assets.get(layer?.assetId);}
  function updateStatus(text,error=false){
    const el=$('overlayStatus');if(!el)return;
    el.textContent=text;el.style.color=error?'#ffb4b4':'#c5f1d8';
  }
  function findList(layer){
    if(state.global.includes(layer))return state.global;
    const per=state.perFile.get(currentFile());
    return per?.includes(layer)?per:null;
  }
  function pushLayer(layer,file=currentFile(),applyAll=$('overlayApplyAll').checked){
    if(applyAll)state.global.push(layer);
    else {
      if(!file)throw Error('Hãy chọn ảnh gốc trước khi chèn logo.');
      let list=state.perFile.get(file);
      if(!list){list=[];state.perFile.set(file,list);}
      list.push(layer);
    }
  }
  function gallery(layers){
    const list=$('overlayLayerGallery');
    if(!list)return;
    list.replaceChildren();
    $('overlayLayerCount').textContent=layers.length+' lớp';
    if(!layers.length){
      const hint=document.createElement('p');hint.className='overlaySmall';
      hint.textContent='Chưa có ảnh đè. Nhấn “Chọn nhiều ảnh đè” để thêm 2, 3, 5 logo hoặc nhiều hơn.';
      list.appendChild(hint);
      return;
    }
    for(let index=0;index<layers.length;index++){
      const layer=layers[index],info=asset(layer);
      const button=document.createElement('button');
      button.type='button';
      button.className='overlayTile'+(layer.id===state.selected?' active':'');
      button.setAttribute('aria-pressed',String(layer.id===state.selected));
      const thumb=document.createElement('img');
      if(info?.thumb)thumb.src=info.thumb;
      thumb.alt='Logo '+(index+1);
      const details=document.createElement('span');details.className='overlayTileText';
      const title=document.createElement('strong');title.className='overlayTileTitle';
      title.textContent=(index+1)+'. '+(info?.name||'Hình đè');
      const meta=document.createElement('span');meta.className='overlayTileMeta';
      meta.textContent=(state.global.includes(layer)?'Tất cả ảnh':'Ảnh hiện tại')+
        ' • '+Math.round(layer.opacity*100)+'%';
      details.append(title,meta);button.append(thumb,details);
      button.addEventListener('click',()=>{state.selected=layer.id;refresh();});
      list.appendChild(button);
    }
  }
  function refresh(){
    const on=enabled();
    $('overlaySettings').hidden=!on;
    const file=currentFile(),layer=selected(),layers=visible();
    if(!layer)state.selected=null;
    const picker=$('overlayLayerPicker');
    picker.replaceChildren();
    const empty=document.createElement('option');
    empty.value='';empty.textContent=layers.length?'Chọn lớp ảnh…':'Chưa thêm lớp ảnh';
    picker.appendChild(empty);
    layers.forEach((l,i)=>{
      const opt=document.createElement('option');
      opt.value=l.id;
      const global=state.global.includes(l)?' • Toàn bộ':' • Ảnh này';
      opt.textContent=(i+1)+'. '+(asset(l)?.name||'Hình đè')+global;
      picker.appendChild(opt);
    });
    picker.value=state.selected||'';
    gallery(layers);
    for(const id of ['overlayCopy','overlayDelete','overlayDuplicate','overlayForward','overlayBackward'])
      $(id).disabled=!on||!layer;
    $('overlayPaste').disabled=!on||!state.clipboard||!file;
    $('overlayFile').disabled=!on||!file||state.loading;
    for(const id of ['overlayOpacity','overlayWidth','overlayRotation'])$(id).disabled=!on||!layer;
    $('overlayOpacity').value=layer?Math.round(layer.opacity*100):100;
    $('overlayWidth').value=layer?Math.round(layer.width*100):42;
    $('overlayRotation').value=layer?Math.round(layer.rotation):0;
    $('overlayOpacityValue').textContent=$('overlayOpacity').value+'%';
    $('overlayWidthValue').textContent=$('overlayWidth').value+'%';
    $('overlayRotationValue').textContent=$('overlayRotation').value+'°';
    $('overlayHandles').classList.toggle('overlayActive',on&&!!layers.length);
    sync();
  }
  function snapshotBase(canvas,file){
    if(!enabled()||!visible().length)return;
    const clean=document.createElement('canvas');
    clean.width=canvas.width;clean.height=canvas.height;
    clean.getContext('2d').drawImage(canvas,0,0);
    if(state.base){state.base.canvas.width=0;state.base.canvas.height=0;}
    state.base={canvas:clean,file};
  }
  function draw(ctx,w,h,file){
    if(!enabled())return;
    const layers=[...state.global,...(state.perFile.get(file)||[])];
    core.draw(ctx,w,h,layers,state.assets);
  }
  function redrawPreview(){
    const base=state.base;
    if(!base||base.file!==currentFile())return;
    const preview=$('preview');
    if(preview.width!==base.canvas.width||preview.height!==base.canvas.height)return;
    const ctx=preview.getContext('2d');
    ctx.clearRect(0,0,preview.width,preview.height);
    ctx.drawImage(base.canvas,0,0);
    draw(ctx,preview.width,preview.height,currentFile());
    sync();
  }
  function sync(){
    const preview=$('preview'),stage=$('previewStage'),guide=$('overlayHandles');
    if(!preview||!stage||!guide)return;
    const p=preview.getBoundingClientRect(),s=stage.getBoundingClientRect();
    guide.style.left=(p.left-s.left)+'px';
    guide.style.top=(p.top-s.top)+'px';
    guide.style.width=p.width+'px';guide.style.height=p.height+'px';
    if(guide.width!==preview.width)guide.width=preview.width;
    if(guide.height!==preview.height)guide.height=preview.height;
    const ctx=guide.getContext('2d');
    ctx.clearRect(0,0,guide.width,guide.height);
    const layer=selected();
    if(layer)core.guides(ctx,guide.width,guide.height,layer,asset(layer));
  }
  function notifyChange(){
    redrawPreview();
    refresh();
    state.bridge?.schedulePreview?.();
  }
  function makeThumbnail(img){
    const canvas=document.createElement('canvas');
    canvas.width=72;canvas.height=72;
    try{
      const ctx=canvas.getContext('2d');
      const iw=img.width||img.naturalWidth||img.displayWidth||1;
      const ih=img.height||img.naturalHeight||img.displayHeight||1;
      const fit=Math.min(70/iw,70/ih);
      const w=iw*fit,h=ih*fit;
      ctx.drawImage(img,(72-w)/2,(72-h)/2,w,h);
      return canvas.toDataURL('image/png');
    }catch(_){return '';}
    finally{canvas.width=0;canvas.height=0;}
  }
  async function loadAsset(file){
    if(!file||!(/^(image\/(png|jpeg|webp))$/i.test(file.type||'')||
      /\.(png|jpe?g|webp)$/i.test(file.name||'')))
      throw Error('Chỉ chấp nhận PNG/JPG/WebP.');
    // Android Gallery may revoke a picked File after the input is cleared.
    // Read its bytes while selection is alive, then decode the stable local blob.
    const bytes=await file.arrayBuffer();
    if(!bytes.byteLength)throw Error('Tệp ảnh rỗng hoặc không đọc được.');
    const stable=new Blob([bytes],{type:file.type||'application/octet-stream'});
    const img=await state.bridge.decode(stable);
    const id=next('asset-');
    state.assets.set(id,{image:img,name:file.name,thumb:makeThumbnail(img)});
    return id;
  }
  function arrangeNew(layer,index,existing,totalNew){
    if(totalNew===1&&existing===0)return;
    // Spread multiple logos into distinct visible positions instead of stacking
    // every new image at the center, which made the UI look limited to one image.
    const slot=(existing+index)%9;
    layer.x=[.20,.50,.80][slot%3];
    layer.y=[.22,.50,.78][Math.floor(slot/3)];
    layer.width=Math.min(layer.width,.24);
  }
  async function upload(event){
    if(state.loading)return;
    const picker=event.target;
    const files=Array.from(picker.files||[]);
    if(!files.length)return;
    const target=currentFile();
    if(!target){updateStatus('Chọn ảnh gốc trước khi thêm hình đè.',true);return;}
    const applyAll=$('overlayApplyAll').checked;
    const existing=state.global.length+(state.perFile.get(target)?.length||0);
    state.loading=true;refresh();
    let ok=0;
    const errors=[];
    try{
      for(const file of files){
        try{
          const assetId=await loadAsset(file);
          const layer=core.make(assetId,next('layer-'),state.assets.get(assetId));
          arrangeNew(layer,ok,existing,files.length);
          layer.opacity=1;
          pushLayer(layer,target,applyAll);
          state.selected=layer.id;
          ok++;
          updateStatus('Đang thêm '+ok+'/'+files.length+' ảnh đè…');
        }catch(error){
          errors.push(file.name+': '+String(error?.message||error));
        }
      }
    }finally{
      // Only reset after reading and decoding every selected image (Xiaomi).
      picker.value='';
      state.loading=false;
      refresh();
      if(ok){redrawPreview();state.bridge.schedulePreview();}
      updateStatus(ok+' ảnh mới được thêm, tổng '+visible().length+' lớp trên ảnh này.'+
        (errors.length?' Không đọc được: '+errors.join('; '):''),!!errors.length);
    }
  }
  function copy(){
    const layer=selected();
    if(!layer)return false;
    state.clipboard={...layer};
    updateStatus('Đã copy “'+(asset(layer)?.name||'logo')+'”. Ctrl+V hoặc bấm Dán để thêm bản sao.');
    refresh();return true;
  }
  function paste(){
    if(!enabled()||!state.clipboard||!currentFile())return false;
    const layer=core.duplicate(state.clipboard,next('layer-'),.04);
    pushLayer(layer);state.selected=layer.id;
    updateStatus('Đã dán thêm một lớp ảnh; kéo khung tím đến logo tiếp theo.');
    notifyChange();
    // Keep advancing paste position for repeated Ctrl+V.
    state.clipboard={...layer};
    return true;
  }
  function duplicate(){if(copy())paste();}
  function remove(){
    const layer=selected();if(!layer)return;
    const list=findList(layer);if(!list)return;
    list.splice(list.indexOf(layer),1);
    state.selected=list.at(-1)?.id||visible().at(-1)?.id||null;
    updateStatus('Đã xóa lớp đè, không ảnh hưởng ảnh gốc.');notifyChange();
  }
  function order(direction){
    const layer=selected(),list=layer&&findList(layer);
    if(!list)return;
    const current=list.indexOf(layer),to=core.clamp(current+direction,0,list.length-1);
    if(to===current)return;
    list.splice(current,1);list.splice(to,0,layer);notifyChange();
  }
  function changeSlider(id){
    const layer=selected();if(!layer)return;
    if(id==='overlayOpacity')layer.opacity=Number($(id).value)/100;
    if(id==='overlayWidth')layer.width=Number($(id).value)/100;
    if(id==='overlayRotation')layer.rotation=Number($(id).value);
    $('overlayOpacityValue').textContent=Math.round(layer.opacity*100)+'%';
    $('overlayWidthValue').textContent=Math.round(layer.width*100)+'%';
    $('overlayRotationValue').textContent=Math.round(layer.rotation)+'°';
    redrawPreview();
    state.bridge.schedulePreview();
  }
  function px(event){
    const el=$('overlayHandles'),r=el.getBoundingClientRect();
    return {x:(event.clientX-r.left)/Math.max(1,r.width)*el.width,
      y:(event.clientY-r.top)/Math.max(1,r.height)*el.height,
      scale:r.width/Math.max(1,el.width)};
  }
  function pointerDown(event){
    if(!enabled()||state.loading||!currentFile()||event.button>0)return;
    const p=px(event),canvas=$('overlayHandles');
    const result=core.hit(visible(),state.assets,p,canvas.width,canvas.height,p.scale);
    if(!result){
      state.selected=null;refresh();return;
    }
    state.selected=result.layer.id;
    state.drag={layer:result.layer,mode:result.mode,start:p,
      previous:{...result.layer},angle:Math.atan2(p.y-result.layer.y*canvas.height,
        p.x-result.layer.x*canvas.width)};
    canvas.setPointerCapture?.(event.pointerId);
    canvas.focus?.({preventScroll:true});
    refresh();event.preventDefault();
  }
  function pointerMove(event){
    if(!state.drag)return;
    const {layer,mode,start,previous,angle}=state.drag;
    const canvas=$('overlayHandles'),p=px(event);
    if(mode==='move'){
      layer.x=core.clamp(previous.x+(p.x-start.x)/canvas.width,-.15,1.15);
      layer.y=core.clamp(previous.y+(p.y-start.y)/canvas.height,-.15,1.15);
    }else if(mode==='resize'){
      const cx=previous.x*canvas.width,cy=previous.y*canvas.height;
      const initial=Math.hypot(start.x-cx,start.y-cy);
      const now=Math.hypot(p.x-cx,p.y-cy);
      layer.width=core.clamp(previous.width*now/Math.max(10,initial),.05,1.8);
    }else if(mode==='rotate'){
      const now=Math.atan2(p.y-previous.y*canvas.height,p.x-previous.x*canvas.width);
      const deg=previous.rotation+(now-angle)*180/Math.PI;
      layer.rotation=((deg+180)%360+360)%360-180;
    }
    redrawPreview();
    $('overlayOpacityValue').textContent=Math.round(layer.opacity*100)+'%';
    $('overlayWidth').value=Math.round(layer.width*100);
    $('overlayWidthValue').textContent=$('overlayWidth').value+'%';
    $('overlayRotation').value=Math.round(layer.rotation);
    $('overlayRotationValue').textContent=$('overlayRotation').value+'°';
    event.preventDefault();
  }
  function pointerEnd(event){
    if(!state.drag)return;
    state.drag=null;
    try{$('overlayHandles').releasePointerCapture?.(event.pointerId);}catch(_){}
    state.bridge.schedulePreview();
  }
  function keys(event){
    if(!(event.ctrlKey||event.metaKey)||event.altKey)return;
    const tag=document.activeElement?.tagName?.toLowerCase();
    if(tag==='input'||tag==='textarea'||document.activeElement?.isContentEditable)return;
    const key=event.key?.toLowerCase();
    if(key==='c'&&selected()){event.preventDefault();copy();}
    if(key==='v'&&state.clipboard&&enabled()){event.preventDefault();paste();}
  }
  function clear(){
    for(const item of state.assets.values()){
      const image=item.image;
      if(image&&typeof image.close==='function')image.close();
    }
    state.assets.clear();state.global.length=0;state.perFile.clear();
    state.selected=null;state.clipboard=null;state.seq=1;
    if(state.base){state.base.canvas.width=0;state.base.canvas.height=0;}
    state.base=null;state.drag=null;refresh();
  }
  function init(bridge){
    state.bridge=bridge;
    $('overlayFile').addEventListener('change',upload);
    $('overlayEnabled').addEventListener('change',()=>{
      if(!$('overlayEnabled').checked)state.selected=null;
      refresh();state.bridge.schedulePreview();
    });
    $('overlayApplyAll').addEventListener('change',refresh);
    $('overlayLayerPicker').addEventListener('change',e=>{state.selected=e.target.value||null;refresh();});
    $('overlayCopy').addEventListener('click',copy);
    $('overlayPaste').addEventListener('click',paste);
    $('overlayDuplicate').addEventListener('click',duplicate);
    $('overlayDelete').addEventListener('click',remove);
    $('overlayForward').addEventListener('click',()=>order(1));
    $('overlayBackward').addEventListener('click',()=>order(-1));
    for(const id of ['overlayOpacity','overlayWidth','overlayRotation'])
      $(id).addEventListener('input',()=>changeSlider(id));
    const canvas=$('overlayHandles');
    canvas.addEventListener('pointerdown',pointerDown);
    canvas.addEventListener('pointermove',pointerMove);
    canvas.addEventListener('pointerup',pointerEnd);
    canvas.addEventListener('pointercancel',pointerEnd);
    document.addEventListener('keydown',keys);
    window.addEventListener('resize',sync);
    window.addEventListener('orientationchange',sync);
    refresh();
  }
  global.DHLOverlayUI={init,draw,snapshotBase,sync,redrawPreview,refresh,clear};
})(typeof window!=='undefined'?window:globalThis);