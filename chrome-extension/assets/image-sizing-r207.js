/* Image Studio R20.12 — independent batch resize & file-size control */
(function(){
  'use strict';
  var $=function(id){return document.getElementById(id);};
  var enabled=function(){return !!($('dhlResizeEnable') && $('dhlResizeEnable').checked);};
  window.__DHL_RESIZE_ONLY__=enabled;

  var css=document.createElement('style');
  css.textContent=
    '#dhlResizeSection{border:1px solid #40628c;border-radius:13px;padding:13px;margin:14px 0;background:#101d30;color:#e5eefb;box-shadow:0 6px 20px #0002}' +
    '#dhlResizeSection .dhl-size-switch{display:flex;gap:10px;align-items:center;cursor:pointer;font-weight:750;font-size:14px;line-height:1.45}' +
    '#dhlResizeSection .dhl-size-switch input{width:19px;height:19px;flex:none;accent-color:#38bdf8}' +
    '#dhlResizeSection .dhl-size-tip{font-size:12px;line-height:1.5;color:#bbcee6;margin:7px 0 0}' +
    '#dhlResizeOptions{border-top:1px solid #345071;margin-top:12px;padding-top:12px}' +
    '#dhlResizeOptions[hidden]{display:none!important}' +
    '.dhl-size-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}' +
    '.dhl-size-field{display:flex;flex-direction:column;gap:5px;font-size:12px;font-weight:650;color:#d6e6f8}' +
    '.dhl-size-field input,.dhl-size-field select{width:100%;min-width:0;box-sizing:border-box;border:1px solid #496182;background:#14253c;color:#fff;border-radius:8px;padding:10px;font-size:14px;opacity:1}' +
    '.dhl-size-field input:focus,.dhl-size-field select:focus{outline:2px solid #38bdf8;outline-offset:1px}' +
    '.dhl-size-wide{grid-column:1/-1}.dhl-size-check{display:flex;align-items:center;gap:8px;font-size:12px;color:#e0eafa}' +
    '.dhl-size-check input{accent-color:#38bdf8;width:16px;height:16px}.dhl-size-muted{font-size:12px;color:#b7cadf;line-height:1.5}' +
    '#dhlResizeSection.dhl-size-active{border-color:#38bdf8;box-shadow:0 0 0 1px #38bdf855}' +
    '@media(max-width:380px){.dhl-size-grid{grid-template-columns:1fr}}';
  document.head.appendChild(css);

  function init(){
    if($('dhlResizeSection'))return;
    var target=$('r17ActiveSummary') || document.querySelector('#prepSection .r17-workflow') || document.querySelector('#prepSection .sidebar');
    if(!target)return;
    var sec=document.createElement('section');
    sec.id='dhlResizeSection';
    sec.innerHTML=[
      '<label class="dhl-size-switch"><input type="checkbox" id="dhlResizeEnable"><span>📐 Điều chỉnh dung lượng &amp; độ phân giải</span></label>',
      '<p class="dhl-size-tip">Tùy chọn <b>độc lập</b>, mặc định tắt. Tích để chỉ thay kích thước/nén ảnh, không chạy xóa nền, crop, làm nét hay hiệu ứng khác.</p>',
      '<div id="dhlResizeOptions" hidden>',
      '<div class="dhl-size-grid">',
      '<label class="dhl-size-field dhl-size-wide">Độ phân giải ảnh xuất',
      '<select id="dhlResizeMode"><option value="keep">Giữ độ phân giải gốc</option><option value="800">Cạnh dài 800px</option><option value="1000">Cạnh dài 1000px</option><option value="1200">Cạnh dài 1200px</option><option value="1500">Cạnh dài 1500px</option><option value="2000">Cạnh dài 2000px</option><option value="3000">Cạnh dài 3000px</option><option value="custom">Tự nhập rộng × cao</option></select></label>',
      '<label class="dhl-size-field" id="dhlResizeWidthWrap" hidden>Chiều rộng (px)<input id="dhlResizeW" type="number" min="1" max="8000" step="1" value="1500"></label>',
      '<label class="dhl-size-field" id="dhlResizeHeightWrap" hidden>Chiều cao (px)<input id="dhlResizeH" type="number" min="1" max="8000" step="1" value="1500"></label>',
      '<label class="dhl-size-check dhl-size-wide"><input type="checkbox" id="dhlResizeAspect" checked>Giữ đúng tỷ lệ ảnh, không kéo méo</label>',
      '<label class="dhl-size-check dhl-size-wide"><input type="checkbox" id="dhlResizeNoUpscale" checked>Không phóng to ảnh nhỏ hơn mức đặt</label>',
      '<label class="dhl-size-field">Giới hạn dung lượng (MB)<input type="number" id="dhlResizeMB" min="0" max="100" step="0.1" value="2" title="0 = không giới hạn"></label>',
      '<label class="dhl-size-field">Định dạng file<select id="dhlResizeFormat"><option value="auto">Theo định dạng gốc</option><option value="jpeg">JPG — nhẹ hơn</option><option value="webp">WebP — nén tốt</option><option value="png">PNG — giữ trong suốt</option></select></label>',
      '<label class="dhl-size-field dhl-size-wide">Chất lượng JPG/WebP (%)<input type="number" id="dhlResizeQuality" min="35" max="100" step="1" value="85"></label>',
      '<div class="dhl-size-muted dhl-size-wide" id="dhlResizeInfo">0 MB = không giới hạn. Nếu khó đạt mức MB, tool sẽ giảm chất lượng rồi mới giảm độ phân giải và thông báo nếu chưa đạt.</div>',
      '</div></div>'
    ].join('');
    if(target.id==='r17ActiveSummary')target.insertAdjacentElement('beforebegin',sec);
    else target.appendChild(sec);
    var ids=['dhlResizeMode','dhlResizeW','dhlResizeH','dhlResizeAspect','dhlResizeNoUpscale','dhlResizeMB','dhlResizeFormat','dhlResizeQuality'];
    try{var saved=JSON.parse(localStorage.getItem('dhl_resize_settings_v1')||'{}');ids.forEach(function(id){if(!(id in saved)||!$(id))return;if($(id).type==='checkbox')$(id).checked=!!saved[id];else $(id).value=saved[id];});}catch(e){}
    function update(){
      $('dhlResizeOptions').hidden=!enabled();
      sec.classList.toggle('dhl-size-active',enabled());
      var custom=$('dhlResizeMode').value==='custom';
      $('dhlResizeWidthWrap').hidden=!custom;
      $('dhlResizeHeightWrap').hidden=!custom;
      try{var data={};ids.forEach(function(id){data[id]=$(id).type==='checkbox'?$(id).checked:$(id).value;});localStorage.setItem('dhl_resize_settings_v1',JSON.stringify(data));}catch(e){}
      var summary=$('r17ActiveSummary');
      if(summary && enabled()){summary.setAttribute('data-resize-only','1');}
      else if(summary)summary.removeAttribute('data-resize-only');
      if(typeof setStatus==='function' && document.activeElement===$('dhlResizeEnable'))setStatus(enabled()?'Chỉ chỉnh dung lượng & độ phân giải (độc lập).':'Đã tắt chỉnh dung lượng & độ phân giải.');
    }
    $('dhlResizeEnable').addEventListener('change',update);
    ids.forEach(function(id){$(id).addEventListener('change',update);$(id).addEventListener('input',update);});
    update();
  }

  function params(){
    var mode=$('dhlResizeMode').value, fmt=$('dhlResizeFormat').value;
    var mb=Number($('dhlResizeMB').value), quality=Number($('dhlResizeQuality').value);
    if(!Number.isFinite(mb)||mb<0||mb>100)throw Error('Dung lượng phải từ 0 đến 100 MB.');
    if(!Number.isFinite(quality)||quality<35||quality>100)throw Error('Chất lượng phải từ 35% đến 100%.');
    var w=Number($('dhlResizeW').value), h=Number($('dhlResizeH').value);
    if(mode==='custom'&&(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>8000||h>8000))throw Error('Chiều rộng/cao phải từ 1 đến 8000 px.');
    return {mode:mode,fmt:fmt,mb:mb,quality:quality/100,w:w,h:h,aspect:$('dhlResizeAspect').checked, noUpscale:$('dhlResizeNoUpscale').checked};
  }
  function dimensions(w,h,p){
    var dw=w,dh=h;
    if(p.mode==='custom'){
      if(p.aspect){var r=Math.min(p.w/w,p.h/h); if(p.noUpscale)r=Math.min(1,r);dw=Math.round(w*r);dh=Math.round(h*r);}
      else {dw=p.noUpscale?Math.min(w,p.w):p.w;dh=p.noUpscale?Math.min(h,p.h):p.h;}
    }else if(p.mode!=='keep'){
      var ratio=Number(p.mode)/Math.max(w,h);
      if(p.noUpscale)ratio=Math.min(1,ratio);
      dw=Math.round(w*ratio);dh=Math.round(h*ratio);
    }
    return [Math.max(1,Math.min(8000,dw)),Math.max(1,Math.min(8000,dh))];
  }
  function mimeFor(item,fmt){
    if(fmt==='jpeg')return 'image/jpeg';if(fmt==='png')return 'image/png';if(fmt==='webp')return 'image/webp';
    var ext=((item.name||'').split('.').pop()||'').toLowerCase();
    return ext==='jpg'||ext==='jpeg'?'image/jpeg':ext==='webp'?'image/webp':'image/png';
  }
  function makeCanvasFrom(src,w,h,mime){
    var c=document.createElement('canvas');c.width=w;c.height=h;
    var ctx=c.getContext('2d',{alpha:mime!=='image/jpeg'});
    if(!ctx)throw Error('Trình duyệt không hỗ trợ Canvas.');
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    if(mime==='image/jpeg'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);}
    ctx.drawImage(src,0,0,w,h);return c;
  }
  function blobFrom(canvas,mime,q){
    return new Promise(function(resolve,reject){
      canvas.toBlob(function(blob){
        if(!blob)return reject(Error('Không thể mã hóa ảnh.'));
        if(blob.type!==mime && mime==='image/webp')return reject(Error('Trình duyệt không hỗ trợ xuất WebP.'));
        resolve(blob);
      },mime,q);
    });
  }
  async function encode(src,desired,p){
    var width=desired[0],height=desired[1], mime=p.mime, limit=p.mb*1024*1024, quality=p.quality;
    var work=makeCanvasFrom(src,width,height,mime),blob=await blobFrom(work,mime,quality);
    if(limit<=0 || blob.size<=limit)return {blob:blob,canvas:work,hit:true};
    var i=0;
    while(i<13 && blob.size>limit){
      if(mime!=='image/png'){
        for(var q of [Math.min(quality,0.8),0.68,0.55,0.42,0.35]){
          var trial=await blobFrom(work,mime,q);
          if(trial.size<blob.size)blob=trial;
          if(blob.size<=limit)break;
        }
        if(blob.size<=limit)break;
      }
      var shrink=Math.max(0.55,Math.min(0.90,Math.sqrt(limit/blob.size)*0.96));
      var nw=Math.max(1,Math.floor(width*shrink)), nh=Math.max(1,Math.floor(height*shrink));
      if(nw===width&&nh===height)break;
      width=nw;height=nh;
      work=makeCanvasFrom(src,width,height,mime);
      blob=await blobFrom(work,mime,mime==='image/png'?undefined:0.75);
      i++;
    }
    return {blob:blob,canvas:work,hit:blob.size<=limit};
  }

  async function resizeOnly(item){
    item.processError='';
    try{
      var p=params(),img=await loadImage(item.origUrl),desired=dimensions(img.naturalWidth,img.naturalHeight,p);
      p.mime=mimeFor(item,p.fmt);
      if(desired[0]*desired[1]>42000000)throw Error('Ảnh xuất quá lớn, hãy chọn độ phân giải thấp hơn.');
      setStatus('Đang chỉnh dung lượng: '+item.name);
      var r=await encode(img,desired,p);
      if(item.processedUrl)URL.revokeObjectURL(item.processedUrl);
      item.processedBlob=r.blob;item.processedUrl=URL.createObjectURL(r.blob);
      item.processedW=r.canvas.width;item.processedH=r.canvas.height;
      item.__dhlResizeOnly=true;
      item.__dhlResizeWarning=r.hit?'':('Chưa đạt '+p.mb+' MB; ảnh hiện '+(r.blob.size/1048576).toFixed(2)+' MB.');
      setStatus('Đã chỉnh '+item.name+' → '+r.canvas.width+' × '+r.canvas.height+' px • '+(r.blob.size/1048576).toFixed(2)+' MB'+(r.hit?'':' • Chưa đạt dung lượng đặt.'));
      return true;
    }catch(e){
      item.processError=String(e&&e.message||e);
      console.error('Image Studio resize:',e);
      setStatus('Lỗi chỉnh ảnh '+item.name+': '+item.processError);
      return false;
    }
  }
  if(typeof window.processItem==='function'){
    var existingProcess=window.processItem;
    window.processItem=async function(item){
      if(enabled())return resizeOnly(item);
      item.__dhlResizeOnly=false;item.__dhlResizeWarning='';
      return existingProcess(item);
    };
  }
  if(typeof window.filenameProcessed==='function'){
    var existingName=window.filenameProcessed;
    window.filenameProcessed=function(item,index){
      var name=existingName(item,index);
      if(!item||!item.__dhlResizeOnly||!item.processedBlob)return name;
      var ext={'image/jpeg':'jpg','image/webp':'webp','image/png':'png'}[item.processedBlob.type]||'png';
      return name.replace(/\.[^.]+$/,'.'+ext);
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
