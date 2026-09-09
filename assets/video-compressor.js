(()=>{
  if(window.__VIDCOMP_R198)return; window.__VIDCOMP_R198=1;
  const $=id=>document.getElementById(id), $$=s=>[...document.querySelectorAll(s)];
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const fmt=n=>{if(!Number.isFinite(n))return '-';let u=['B','KB','MB','GB'],i=0;while(n>=1024&&i<3){n/=1024;i++}return n.toFixed(i&&n<10?1:0)+' '+u[i]};
  const fmtDur=s=>{if(!Number.isFinite(s))return '-';let m=Math.floor(s/60),ss=Math.floor(s%60);return `${m}:${String(ss).padStart(2,'0')}`};
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const css=`
  .vc5-page{padding:0 16px 22px;max-width:1600px;margin:auto}.vc5-layout{display:grid;grid-template-columns:minmax(300px,390px) 1fr;gap:14px}
  .vc5-panel{padding:14px}.vc5-card{background:#0d1627;border:1px solid #2d3d55;border-radius:16px;padding:14px;margin-bottom:12px}
  .vc5-card h2,.vc5-card h3{margin:0 0 8px}.vc5-note{color:#9fb0c7;font-size:12px;line-height:1.5}.vc5-muted{color:#94a3b8}
  .vc5-pick{border:2px dashed #3b82f6;border-radius:16px;padding:22px 14px;text-align:center;cursor:pointer;background:#0a1322;transition:.15s}.vc5-pick:hover,.vc5-pick.drag{background:#10213c;border-color:#60a5fa}
  .vc5-pick strong{display:block;font-size:16px;margin-bottom:5px}.vc5-ratios{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin:10px 0}.vc5-ratio.active{outline:2px solid #60a5fa;background:#1d4ed8!important}
  .vc5-mbpresets{display:grid;grid-template-columns:repeat(6,1fr);gap:7px;margin:10px 0}.vc5-mb.active{outline:2px solid #22c55e;background:#166534!important}.vc5-mbline{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.vc5-mbline input{font-size:22px;font-weight:900;text-align:center;background:#071523;color:#fff;border:1px solid #22c55e;border-radius:12px;padding:11px}.vc5-mbline b{font-size:17px}.vc5-primary-card{border-color:#16a34a;background:#0b1f1b}.vc5-modehint{font-size:12px;color:#86efac;margin-top:7px}
  .vc5-slider{display:grid;grid-template-columns:1fr 70px;gap:8px;align-items:center}.vc5-slider input[type=range]{width:100%}.vc5-big{font-size:22px;font-weight:900}.vc5-summary{padding:11px;border-radius:12px;background:#0a2131;border:1px solid #155e75;margin-top:10px}.vc5-summary.warn{background:#2a1807;border-color:#a16207;color:#fde68a}
  .vc5-actions{display:grid;gap:8px}.vc5-row{display:flex;gap:8px;align-items:center}.vc5-row>*{flex:1}.vc5-progress{height:10px;background:#020617;border-radius:99px;overflow:hidden;margin-top:10px}.vc5-progress i{display:block;height:100%;width:0;background:linear-gradient(90deg,#2563eb,#22c55e)}
  .vc5-list{display:grid;gap:12px}.vc5-item{background:#0d1627;border:1px solid #334155;border-radius:16px;padding:12px}.vc5-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.vc5-name{font-weight:850;word-break:break-word}.vc5-badges{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}.vc5-badge{padding:4px 7px;border-radius:99px;background:#111d31;border:1px solid #334155;color:#cbd5e1;font-size:11px}.vc5-badge.ok{border-color:#166534;color:#bbf7d0}.vc5-badge.warn{border-color:#a16207;color:#fde68a}
  .vc5-previews{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.vc5-preview{background:#020617;border:1px solid #263449;border-radius:12px;overflow:hidden}.vc5-preview label{display:block;padding:6px 8px;font-size:11px;color:#94a3b8}.vc5-preview video{width:100%;max-height:240px;display:block;background:#000}.vc5-empty-preview{min-height:120px;display:grid;place-items:center;color:#64748b;font-size:12px}
  .vc5-result{margin-top:9px;font-size:13px;color:#cbd5e1}.vc5-result.ok{color:#86efac}.vc5-result.err{color:#fca5a5}.vc5-mini{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}.vc5-mini .btn{min-width:110px}
  .vc5-empty{min-height:340px;display:grid;place-items:center;border:2px dashed #334155;border-radius:16px;color:#94a3b8;text-align:center;padding:20px}.vc5-advanced summary{cursor:pointer;font-weight:800}.vc5-fields{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.vc5-fields label{display:grid;gap:5px;font-size:12px;color:#dbeafe}.vc5-fields .full{grid-column:1/-1}.vc5-fields select,.vc5-fields input{width:100%;background:#08111f;color:white;border:1px solid #35506f;border-radius:9px;padding:9px}
  body[data-mode=video] .top-actions,body[data-mode=video] #batchProgress,body[data-mode=video] #quickDock,body[data-mode=video] .html-test-notice{display:none!important}
  @media(max-width:980px){.vc5-layout{grid-template-columns:1fr}.vc5-previews{grid-template-columns:1fr}.vc5-ratios{grid-template-columns:repeat(3,1fr)}.vc5-mbpresets{grid-template-columns:repeat(3,1fr)}}
  @media(max-width:560px){.vc5-page{padding:0 8px 16px}.vc5-fields{grid-template-columns:1fr}.vc5-fields .full{grid-column:auto}.vc5-ratios{grid-template-columns:repeat(2,1fr)}.vc5-row{flex-direction:column}.vc5-row>*{width:100%}.mode-switch{display:grid!important;grid-template-columns:1fr 1fr!important}.mode-tab{width:100%!important}}
  `;
  const sty=document.createElement('style'); sty.textContent=css; document.head.appendChild(sty);

  let tip=document.querySelector('.mode-switch .mode-tip'), tab=document.getElementById('openVideoModeBtn');
  if(!tab){tab=document.createElement('button');tab.id='openVideoModeBtn';tab.className='mode-tab';tab.textContent='Nén video';tip?tip.before(tab):document.querySelector('.mode-switch')?.append(tab)} else tab.textContent='Nén video';
  document.getElementById('videoSection')?.remove();
  const sec=document.createElement('section');sec.id='videoSection';sec.className='vc5-page hidden';
  sec.innerHTML=`<div class="vc5-layout">
    <aside class="vc5-panel panel">
      <div class="vc5-card">
        <h2>🎬 Nén video</h2>
        <div class="vc5-note">Không cắt video. Luôn xử lý từ <b>file gốc đầy đủ</b>, giữ âm thanh và kiểm tra thời lượng trước khi cho tải.</div>
        <div id="vc5Pick" class="vc5-pick" tabindex="0"><strong>+ Chọn hoặc kéo video vào đây</strong><span class="vc5-note">MP4 / MOV / WebM / M4V • chọn nhiều file</span></div>
        <input id="vc5File" type="file" accept="video/*,.mp4,.mov,.m4v,.webm" multiple hidden>
      </div>
      <div class="vc5-card vc5-primary-card">
        <h3>1. Dung lượng tối đa / video</h3>
        <div class="vc5-note">Đây là <b>trần cứng</b>. Ví dụ nhập 29 MB thì file cuối chỉ được tải khi <b>≤ 29 MB</b>.</div>
        <div class="vc5-mbpresets">
          <button class="btn vc5-mb" data-mb="10">10 MB</button><button class="btn vc5-mb" data-mb="20">20 MB</button><button class="btn vc5-mb active" data-mb="29">29 MB</button><button class="btn vc5-mb" data-mb="30">30 MB</button><button class="btn vc5-mb" data-mb="50">50 MB</button><button class="btn vc5-mb" data-mb="100">100 MB</button>
        </div>
        <div class="vc5-mbline"><input id="vc5Mb" type="number" min="1" step="1" value="29"><b>MB</b></div>
        <input id="vc5Mode" type="hidden" value="mb">
        <div id="vc5Summary" class="vc5-summary">Giới hạn cứng <span class="vc5-big">≤ 29 MB</span> mỗi video • chỉ cho tải khi không vượt</div>
        <div class="vc5-modehint">✓ Mặc định dùng giới hạn MB để phù hợp Shopee.</div>
      </div>
      <div class="vc5-card">
        <h3>2. Hoặc nén theo % dung lượng gốc</h3>
        <div class="vc5-note">Chỉ dùng phần này nếu bạn không cần giới hạn MB tuyệt đối. Bấm một mức % sẽ chuyển sang chế độ theo %.</div>
        <div class="vc5-ratios">
          <button class="btn vc5-ratio" data-r="90">90%</button><button class="btn vc5-ratio" data-r="80">80%</button><button class="btn vc5-ratio" data-r="70">70%</button><button class="btn vc5-ratio" data-r="60">60%</button><button class="btn vc5-ratio" data-r="50">50%</button>
        </div>
        <div class="vc5-slider"><input id="vc5Pct" type="range" min="20" max="95" step="1" value="80"><input id="vc5PctNum" type="number" min="20" max="95" value="80"></div>
      </div>
      <div class="vc5-card">
        <h3>3. Nén</h3>
        <div class="vc5-actions"><button id="vc5Run" class="btn success">Nén tất cả video</button><div class="vc5-row"><button id="vc5Stop" class="btn danger" disabled>Dừng</button><button id="vc5Clear" class="btn">Xóa danh sách</button></div><button id="vc5Down" class="btn primary" disabled>Tải tất cả file đã nén</button></div>
        <div class="vc5-progress"><i id="vc5Bar"></i></div><div id="vc5Status" class="vc5-note" style="margin-top:7px">Sẵn sàng.</div>
      </div>
      <details class="vc5-card vc5-advanced"><summary>Tùy chọn nâng cao</summary>
        <div class="vc5-fields">
          <label>Giới hạn độ phân giải<select id="vc5H"><option value="0" selected>Giữ nguyên</option><option value="2160">Tối đa 4K / 2160p</option><option value="1440">Tối đa 1440p</option><option value="1080">Tối đa 1080p</option><option value="720">Tối đa 720p</option><option value="480">Tối đa 480p</option></select></label>
          <label>FPS khi cần resize<select id="vc5Fps"><option value="30" selected>30 FPS</option><option value="24">24 FPS</option><option value="20">20 FPS</option><option value="15">15 FPS</option></select></label>
          <label>Âm thanh<select id="vc5Audio"><option value="160">Giữ tốt - 160 kbps</option><option value="128" selected>Chuẩn - 128 kbps</option><option value="96">Nhẹ - 96 kbps</option><option value="64">Rất nhẹ - 64 kbps</option><option value="0">Tắt âm thanh</option></select></label>
          <label>Định dạng<select id="vc5Fmt"><option value="auto" selected>Tự động - ưu tiên MP4</option><option value="mp4">MP4</option><option value="webm">WebM</option></select></label>
        </div>
        <div class="vc5-note" style="margin-top:10px">Âm thanh mặc định được giữ ở <b>128 kbps</b>. Tool ưu tiên lấy audio track trực tiếp từ video gốc; nếu không lấy được âm thanh thì sẽ báo lỗi thay vì xuất file im tiếng.</div>
      </details>
    </aside>
    <main class="vc5-panel panel"><div class="vc5-row"><b>Danh sách video</b><span id="vc5Stats" class="vc5-note"></span></div><div id="vc5List" class="vc5-list"></div></main>
  </div>`;
  (document.getElementById('logoSection')||document.body.lastElementChild).before(sec);

  const S={items:[],running:false,cancel:false,stopCurrent:null};
  const setStatus=t=>{$('vc5Status').textContent=t};
  function cfg(){return{pct:Math.max(20,Math.min(95,+$('vc5PctNum').value||80)),h:+$('vc5H').value||0,fps:+$('vc5Fps').value||30,a:+$('vc5Audio').value||0,fmt:$('vc5Fmt').value,mode:$('vc5Mode').value||'mb',mb:Math.max(1,+$('vc5Mb').value||29)}}
  function targetBytes(x){let c=cfg();return c.mode==='mb'?Math.min(x.file.size*.98,c.mb*1024*1024):x.file.size*c.pct/100}
  function dims(x){let h=cfg().h;if(!h||x.h<=h)return [x.w-(x.w%2),x.h-(x.h%2)];let w=Math.round(x.w*h/x.h);return [Math.max(2,w-(w%2)),Math.max(2,h-(h%2))]}
  function outputMime(force=''){let f=force||cfg().fmt;let mp=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4;codecs=avc1.42E01E','video/mp4'];let wb=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];let all=f==='mp4'?mp:f==='webm'?wb:[...mp,...wb];return all.find(m=>MediaRecorder.isTypeSupported(m))||''}
  function bitrate(x,mime='',scale=1){let c=cfg(),t=targetBytes(x),dur=Math.max(.1,x.d),audio=c.a*1000,origTotal=x.file.size*8/dur,targetTotal=Math.max(300000,t*8/dur),video=Math.max(180000,(targetTotal-audio)*scale);video=Math.min(video,Math.max(180000,origTotal*.95-audio));return {video,audio,total:targetTotal,target:t,origTotal}}
  function pctActual(x){return x.out?Math.round(x.out.size/x.file.size*100):null}
  function updateSummary(){let c=cfg(),sm=$('vc5Summary'); if(c.mode==='percent'){sm.innerHTML=`<span class="vc5-big">${c.pct}%</span> dung lượng gốc • giảm khoảng ${100-c.pct}%`;sm.className='vc5-summary'+(c.pct<50?' warn':'')} else {sm.innerHTML=`Giới hạn cứng <span class="vc5-big">≤ ${c.mb} MB</span> mỗi video • chỉ cho tải khi không vượt`;sm.className='vc5-summary'} }
  function qualityWarn(x){let b=bitrate(x,outputMime()).video,[w,h]=dims(x),bpp=b/Math.max(1,w*h);if(h>=1080&&b<2500000)return 'Bitrate khá thấp cho 1080p — có thể mờ';if(h>=720&&b<1200000)return 'Bitrate khá thấp cho 720p — có thể mờ';if(bpp<1.2)return 'Mức nén mạnh — nên tăng % nếu cần giữ nét';return ''}
  function render(){
    updateSummary(); let L=$('vc5List'); $('vc5Stats').textContent=`${S.items.length} video • gốc ${fmt(S.items.reduce((a,x)=>a+x.file.size,0))} • đã nén ${fmt(S.items.reduce((a,x)=>a+(x.out&&x.valid?x.out.size:0),0))}`; $('vc5Down').disabled=!S.items.some(x=>x.out&&x.valid);
    if(!S.items.length){L.innerHTML='<div class="vc5-empty"><div><b>Chưa có video</b><br><span class="vc5-note">Chọn video ở bên trái. Sau khi nén sẽ có preview trước/sau và kiểm tra thời lượng ở đây.</span></div></div>';return}
    L.innerHTML=S.items.map((x,i)=>{
      let t=targetBytes(x),pa=pctActual(x),warn=qualityWarn(x),res=dims(x),status=x.err?`<div class="vc5-result err">❌ ${esc(x.err)}</div>`:x.work?`<div class="vc5-result">⏳ Đang nén ${Math.round(x.progress||0)}%</div>`:x.out&&x.valid?`<div class="vc5-result ok">✓ ${fmt(x.file.size)} → <b>${fmt(x.out.size)}</b> • còn ${pa}% • thời lượng ${x.outDur.toFixed(2)}s / gốc ${x.d.toFixed(2)}s</div>`:x.out?'<div class="vc5-result err">❌ File đầu ra không hợp lệ</div>':'<div class="vc5-result">Chưa xử lý</div>';
      return `<div class="vc5-item" data-i="${i}"><div class="vc5-head"><div><div class="vc5-name">${esc(x.name)}</div><div class="vc5-badges"><span class="vc5-badge">Gốc ${fmt(x.file.size)}</span><span class="vc5-badge">${x.w}×${x.h}</span><span class="vc5-badge">${fmtDur(x.d)}</span><span class="vc5-badge">${cfg().mode==='mb'?'Trần cứng ≤ '+fmt(t):'Mục tiêu '+fmt(t)}</span><span class="vc5-badge">Ra ${res[0]}×${res[1]}</span>${warn?`<span class="vc5-badge warn">⚠ ${esc(warn)}</span>`:''}${x.out&&x.valid?'<span class="vc5-badge ok">✓ đủ thời lượng</span>':''}${x.codecNote?`<span class="vc5-badge warn">${esc(x.codecNote)}</span>`:''}</div></div></div>${status}<div class="vc5-previews"><div class="vc5-preview"><label>Video gốc</label><video controls preload="metadata" src="${x.srcUrl}"></video></div><div class="vc5-preview"><label>Sau nén</label>${x.outUrl&&x.valid?`<video controls preload="metadata" src="${x.outUrl}"></video>`:'<div class="vc5-empty-preview">Chưa có kết quả</div>'}</div></div><div class="vc5-mini"><button class="btn tiny vc5One" ${S.running?'disabled':''}>${x.out?'Nén lại từ file gốc':'Nén video này'}</button><button class="btn tiny vc5Get" ${x.out&&x.valid?'':'disabled'}>Tải file</button><button class="btn tiny vc5Remove" ${S.running?'disabled':''}>Bỏ video</button></div></div>`
    }).join('');
    $$('.vc5-item').forEach(el=>{let i=+el.dataset.i;el.querySelector('.vc5One').onclick=()=>runOne(i);el.querySelector('.vc5Get').onclick=()=>downloadOne(i);el.querySelector('.vc5Remove').onclick=()=>removeOne(i)});
  }
  function probeUrl(url,timeout=15000){return new Promise((ok,no)=>{let v=document.createElement('video'),done=false,tm=setTimeout(()=>finish(no,Error('Không đọc được metadata video')),timeout);function finish(fn,arg){if(done)return;done=true;clearTimeout(tm);v.removeAttribute('src');v.load();fn(arg)}v.preload='metadata';v.onloadedmetadata=()=>finish(ok,{d:v.duration,w:v.videoWidth,h:v.videoHeight});v.onerror=()=>finish(no,Error('Codec video không được trình duyệt hỗ trợ'));v.src=url})}
  async function addFiles(files){for(const file of files){if(!file.type.startsWith('video/')&&!/\.(mp4|mov|m4v|webm)$/i.test(file.name))continue;let srcUrl=URL.createObjectURL(file);try{let m=await probeUrl(srcUrl);S.items.push({file,name:file.name,srcUrl,d:m.d,w:m.w,h:m.h,out:null,outUrl:'',outDur:0,mime:'',progress:0,work:false,err:'',valid:false,codecNote:''})}catch(e){URL.revokeObjectURL(srcUrl);alert(`${file.name}: ${e.message}`)}}render();setStatus(`Đã nạp ${S.items.length} video.`)}
  async function probeBlob(blob){let u=URL.createObjectURL(blob);try{let m=await probeUrl(u);return {...m,url:u}}catch(e){URL.revokeObjectURL(u);throw e}}
  function freshVideo(file){let url=URL.createObjectURL(file),v=document.createElement('video');v.preload='auto';v.playsInline=true;v.muted=true;v.src=url;return {v,url}}
  async function waitReady(v){await new Promise((ok,no)=>{let done=false,tm=setTimeout(()=>finish(no,Error('Video tải quá lâu/codec không hỗ trợ')),20000);function finish(fn,arg){if(done)return;done=true;clearTimeout(tm);fn(arg)}v.onloadeddata=()=>finish(ok);v.onerror=()=>finish(no,Error('Không đọc được dữ liệu video'))});if(v.currentTime>0.01){v.currentTime=0;await new Promise(r=>{let tm=setTimeout(r,1500);v.onseeked=()=>{clearTimeout(tm);r()}})}}
  async function calibrateBitrate(x,idx,total,mt){
    if(x.d<5)return bitrate(x,mt).video;
    const c=cfg(),base=bitrate(x,mt).video,desired=targetBytes(x)*(c.mode==='mb'?.88:1)*8/Math.max(.1,x.d),sampleSec=Math.min(3.5,Math.max(2,x.d*.12));
    const start=Math.max(0,Math.min(x.d*.18,Math.max(0,x.d-sampleSec-.5)));
    const {v,url}=freshVideo(x.file);await waitReady(v);const [ow,oh]=dims(x);let ac=null,stream=null,rawStream=null,drawTimer=null;
    try{
      if(start>.05){v.currentTime=start;await new Promise(r=>{let done=0,tm=setTimeout(()=>{if(done)return;done=1;r()},1800);v.onseeked=()=>{if(done)return;done=1;clearTimeout(tm);r()}})}
      let videoTrack=null; const sameSize=ow===x.w-(x.w%2)&&oh===x.h-(x.h%2);
      if(typeof v.captureStream==='function'){try{rawStream=v.captureStream()}catch(e){console.warn('captureStream unavailable',e)}}
      if(rawStream&&sameSize)videoTrack=rawStream.getVideoTracks()[0]||null;
      if(!videoTrack){let canvas=document.createElement('canvas');canvas.width=ow;canvas.height=oh;let cx=canvas.getContext('2d',{alpha:false});stream=canvas.captureStream(c.fps);videoTrack=stream.getVideoTracks()[0];drawTimer=setInterval(()=>{try{cx.drawImage(v,0,0,ow,oh)}catch(_){}},Math.max(16,1000/c.fps))}
      let audioTracks=c.a>0&&rawStream?rawStream.getAudioTracks().filter(t=>t.readyState==='live'):[];
      if(c.a>0&&!audioTracks.length){try{let AC=window.AudioContext||window.webkitAudioContext;ac=new AC();await ac.resume();let source=ac.createMediaElementSource(v),dest=ac.createMediaStreamDestination(),gain=ac.createGain();gain.gain.value=0;source.connect(dest);source.connect(gain);gain.connect(ac.destination);audioTracks=dest.stream.getAudioTracks().filter(t=>t.readyState==='live')}catch(e){console.warn('AudioContext fallback unavailable',e)}}
      const ms=new MediaStream([videoTrack,...audioTracks]),opts={mimeType:mt,videoBitsPerSecond:base};if(c.a>0)opts.audioBitsPerSecond=c.a*1000;
      const rec=new MediaRecorder(ms,opts),chunks=[];let timer=null,aborted=false;
      setStatus(`Đang đo bitrate thực tế ${idx+1}/${total}: ${x.name} • ~${sampleSec.toFixed(1)} giây`);
      const blob=await new Promise(async(resolve,reject)=>{rec.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};rec.onerror=()=>reject(Error('Không đo được bitrate codec'));rec.onstop=()=>{clearInterval(timer);if(aborted)return reject(Object.assign(Error('Đã dừng'),{name:'AbortError'}));let b=new Blob(chunks,{type:mt});b.size?resolve(b):reject(Error('Không đo được bitrate codec'))};timer=setInterval(()=>{if(v.currentTime>=start+sampleSec||v.ended){try{if(rec.state!=='inactive')rec.stop()}catch(_){}}},80);S.stopCurrent=()=>{aborted=true;try{v.pause()}catch(_){}try{if(rec.state!=='inactive')rec.stop()}catch(_){}};try{rec.start(500);await v.play()}catch(e){clearInterval(timer);reject(Error('Không chạy được bước đo bitrate'))}});
      const mediaSec=Math.max(.5,Math.min(sampleSec,Math.max(0,v.currentTime-start))),actual=blob.size*8/mediaSec;let factor=desired/Math.max(1,actual);factor=Math.max(.3,Math.min(3.5,factor));const adjusted=Math.max(180000,Math.min(100000000,base*factor));console.info('Video calibration',{name:x.name,base,actual,desired,factor,adjusted});return adjusted;
    }finally{clearInterval(drawTimer);S.stopCurrent=null;try{v.pause()}catch(_){}try{rawStream?.getTracks().forEach(t=>t.stop())}catch(_){}try{stream?.getTracks().forEach(t=>t.stop())}catch(_){}try{ac?.close()}catch(_){}URL.revokeObjectURL(url)}
  }
  async function encode(x,idx,total,forceFmt='',forcedVideo=0,attempt=1){
    const c=cfg(), mt=outputMime(forceFmt); if(!mt)throw Error('Chrome không hỗ trợ định dạng xuất đã chọn');
    const tunedVideo=forcedVideo>0?forcedVideo:await calibrateBitrate(x,idx,total,mt);
    const {v,url}=freshVideo(x.file); await waitReady(v); const [ow,oh]=dims(x); let ac=null,stream=null,canvas=null,drawTimer=null,rawStream=null;
    try{
      let videoTrack=null;
      const sameSize=ow===x.w-(x.w%2)&&oh===x.h-(x.h%2);
      if(typeof v.captureStream==='function'){try{rawStream=v.captureStream()}catch(e){console.warn('captureStream unavailable',e)}}
      if(rawStream&&sameSize)videoTrack=rawStream.getVideoTracks()[0]||null;
      if(!videoTrack){canvas=document.createElement('canvas');canvas.width=ow;canvas.height=oh;let cx=canvas.getContext('2d',{alpha:false});stream=canvas.captureStream(c.fps);videoTrack=stream.getVideoTracks()[0];drawTimer=setInterval(()=>{try{cx.drawImage(v,0,0,ow,oh)}catch(_){}},Math.max(16,1000/c.fps))}
      let audioTracks=c.a>0&&rawStream?rawStream.getAudioTracks().filter(t=>t.readyState==='live'):[];
      if(c.a>0&&!audioTracks.length){try{let AC=window.AudioContext||window.webkitAudioContext;ac=new AC();await ac.resume();let source=ac.createMediaElementSource(v),dest=ac.createMediaStreamDestination(),gain=ac.createGain();gain.gain.value=0;source.connect(dest);source.connect(gain);gain.connect(ac.destination);audioTracks=dest.stream.getAudioTracks().filter(t=>t.readyState==='live')}catch(e){console.warn('Audio capture fallback unavailable',e)}}
      if(c.a>0&&!audioTracks.length)throw Error('Không lấy được âm thanh từ video gốc. Tool đã dừng để tránh xuất file bị mất tiếng.');
      const ms=new MediaStream([videoTrack,...audioTracks]); const br=bitrate(x,mt); br.video=tunedVideo; const opts={mimeType:mt,videoBitsPerSecond:br.video}; if(c.a>0)opts.audioBitsPerSecond=br.audio;
      const rec=new MediaRecorder(ms,opts),chunks=[]; let aborted=false,settled=false,progressTimer=null,hardTimer=null;
      let blob=await new Promise(async(resolve,reject)=>{
        const cleanup=()=>{clearInterval(progressTimer);clearTimeout(hardTimer);S.stopCurrent=null};
        const fail=e=>{if(settled)return;settled=true;cleanup();reject(e)};
        rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
        rec.onerror=()=>fail(Error('Lỗi mã hóa video'));
        rec.onstop=()=>{if(settled)return;settled=true;cleanup();if(aborted)return reject(Object.assign(Error('Đã dừng'),{name:'AbortError'}));let b=new Blob(chunks,{type:mt});b.size?resolve(b):reject(Error('Không tạo được file đầu ra'))};
        v.onended=()=>{try{if(rec.state!=='inactive')rec.stop()}catch(e){fail(e)}};
        progressTimer=setInterval(()=>{x.progress=x.d?Math.min(99,v.currentTime/x.d*100):0;$('vc5Bar').style.width=((idx+x.progress/100)/Math.max(1,total)*100)+'%';setStatus(`${attempt>1?'Đang căn lại giới hạn • ':''}Đang nén ${idx+1}/${total}: ${x.name} • ${Math.round(x.progress)}%`)},250);
        hardTimer=setTimeout(()=>fail(Error('Nén quá thời gian dự kiến, đã dừng để tránh treo')),Math.max(30000,(x.d*1.8+20)*1000));
        S.stopCurrent=()=>{aborted=true;try{v.pause()}catch(_){}try{if(rec.state!=='inactive')rec.stop()}catch(_){} };
        try{rec.start(1000);await v.play()}catch(e){aborted=true;try{if(rec.state!=='inactive')rec.stop()}catch(_){}fail(Error('Chrome không phát được video nguồn/codec này'))}
      });
      const pm=await probeBlob(blob); const tol=Math.max(.75,x.d*.03), delta=Math.abs(pm.d-x.d); if(delta>tol){URL.revokeObjectURL(pm.url);throw Error(`Sai thời lượng: gốc ${x.d.toFixed(2)}s nhưng file nén ${pm.d.toFixed(2)}s. Kết quả đã bị chặn, không cho tải.`)}
      const target=targetBytes(x), source=x.file.size, hardCap=c.mode==='mb', overHard=hardCap&&blob.size>target, tooBig=blob.size>=source*.98, farOver=!hardCap&&target>0&&blob.size>target*1.30;
      if(overHard||tooBig||farOver){URL.revokeObjectURL(pm.url);let msg=overHard?`Kết quả ${fmt(blob.size)} vượt trần cứng ${fmt(target)}. Tool sẽ không cho tải file này.`:tooBig?`Kết quả ${fmt(blob.size)} không nhỏ hơn file gốc ${fmt(source)}. Tool đã chặn, không coi đây là nén thành công.`:`Kết quả ${fmt(blob.size)} vượt quá xa mục tiêu ${fmt(target)}.`;const e=Error(msg);e.code=overHard?'HARDCAP':tooBig?'OVERSIZE':'MISSTARGET';e.usedMime=mt;e.usedVideo=tunedVideo;e.actualSize=blob.size;e.targetSize=target;throw e}
      return {blob,mime:mt,dur:pm.d,url:pm.url,w:pm.w,h:pm.h};
    } finally {
      clearInterval(drawTimer);try{v.pause()}catch(_){}try{rawStream?.getTracks().forEach(t=>t.stop())}catch(_){}try{stream?.getTracks().forEach(t=>t.stop())}catch(_){}try{ac?.close()}catch(_){}URL.revokeObjectURL(url)
    }
  }
  async function runItem(i,idx=0,total=1){let x=S.items[i];if(!x)return;if(x.outUrl){URL.revokeObjectURL(x.outUrl);x.outUrl=''}x.out=null;x.valid=false;x.err='';x.codecNote='';x.work=true;x.progress=0;render();try{let r,forceFmt='',forcedVideo=0,attempt=1;for(;;){try{r=await encode(x,idx,total,forceFmt,forcedVideo,attempt);break}catch(e){if(e.name==='AbortError')throw e;const c=cfg();if(c.mode==='mb'&&e.code==='HARDCAP'&&attempt<3){const ratio=e.targetSize/Math.max(1,e.actualSize);forcedVideo=Math.max(180000,(e.usedVideo||bitrate(x,e.usedMime).video)*ratio*.88);x.codecNote=`Vượt trần lần ${attempt} → tự nén lại từ file gốc`;setStatus(`${x.name}: ${fmt(e.actualSize)} > trần ${fmt(e.targetSize)}. Đang nén lại từ file gốc với bitrate thấp hơn...`);attempt++;continue}let canFallback=(e.code==='OVERSIZE'||e.code==='MISSTARGET'||e.code==='HARDCAP')&&c.fmt==='auto'&&outputMime('webm')&&!(e.usedMime||'').includes('webm');if(canFallback){forceFmt='webm';forcedVideo=0;attempt=1;x.codecNote='MP4 không đạt giới hạn → thử WebM từ file gốc';setStatus(`MP4 chưa đạt giới hạn với ${x.name}. Đang thử WebM từ file gốc...`);continue}throw e}}x.out=r.blob;x.outUrl=r.url;x.outDur=r.dur;x.mime=r.mime;x.valid=true;x.progress=100;if(cfg().mode==='mb'&&x.out.size>targetBytes(x)){x.valid=false;throw Error(`Lỗi an toàn: file ${fmt(x.out.size)} vẫn vượt trần ${fmt(targetBytes(x))}. Đã chặn tải.`)}}catch(e){if(e.name==='AbortError')throw e;x.err=e.message}finally{x.work=false;render()}}
  async function runOne(i){if(S.running)return;S.running=true;S.cancel=false;$('vc5Stop').disabled=false;try{await runItem(i,0,1);let x=S.items[i];setStatus(x?.err?`Lỗi: ${x.err}`:`Hoàn tất ${x?.name||''}`)}catch(e){if(e.name==='AbortError')setStatus('Đã dừng.')}finally{S.running=false;$('vc5Stop').disabled=true;$('vc5Bar').style.width='0%';render()}}
  async function runAll(){if(S.running||!S.items.length)return;S.running=true;S.cancel=false;$('vc5Run').disabled=true;$('vc5Stop').disabled=false;let done=0;try{for(let i=0;i<S.items.length;i++){if(S.cancel)break;try{await runItem(i,i,S.items.length);if(S.items[i].valid)done++}catch(e){if(e.name==='AbortError'){S.cancel=true;break}}}}finally{S.running=false;$('vc5Run').disabled=false;$('vc5Stop').disabled=true;$('vc5Bar').style.width='0%';setStatus(S.cancel?'Đã dừng.':`Hoàn tất ${done}/${S.items.length} video.`);render()}}
  function outName(x){let ext=(x.mime||'').includes('mp4')?'mp4':'webm';return x.name.replace(/\.[^.]+$/,'')+`_compressed.${ext}`}
  function dl(blob,name){let u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000)}
  function downloadOne(i){let x=S.items[i];if(x?.out&&x.valid)dl(x.out,outName(x))}
  async function downloadAll(){let arr=S.items.filter(x=>x.out&&x.valid).map(x=>({name:outName(x),blob:x.out}));if(!arr.length)return;if(typeof downloadFilesBatch==='function')await downloadFilesBatch(arr,setStatus);else for(const f of arr){dl(f.blob,f.name);await sleep(250)}}
  function removeOne(i){if(S.running)return;let [x]=S.items.splice(i,1);if(x){URL.revokeObjectURL(x.srcUrl);if(x.outUrl)URL.revokeObjectURL(x.outUrl)}render()}
  function clearAll(){if(S.running)return;S.items.forEach(x=>{URL.revokeObjectURL(x.srcUrl);if(x.outUrl)URL.revokeObjectURL(x.outUrl)});S.items=[];render();setStatus('Đã xóa danh sách.')}
  function syncModeButtons(){let c=cfg();$$('.vc5-ratio').forEach(b=>b.classList.toggle('active',c.mode==='percent'&&+b.dataset.r===c.pct));$$('.vc5-mb').forEach(b=>b.classList.toggle('active',c.mode==='mb'&&+b.dataset.mb===c.mb))}
  function setPct(v){v=Math.max(20,Math.min(95,+v||80));$('vc5Mode').value='percent';$('vc5Pct').value=v;$('vc5PctNum').value=v;syncModeButtons();render()}
  function setMb(v){v=Math.max(1,+v||29);$('vc5Mode').value='mb';$('vc5Mb').value=v;syncModeButtons();render()}
  function show(){['prepSection','previewSection','logoSection','renameSection'].forEach(id=>$(id)?.classList.add('hidden'));sec.classList.remove('hidden');$$('.mode-tab').forEach(b=>b.classList.remove('active'));tab.classList.add('active');document.body.dataset.mode='video'}
  function leave(){sec.classList.add('hidden')}
  tab.onclick=show;['openPrepModeBtn','openPreviewModeBtn','openLogoModeBtn','openRenameModeBtn'].forEach(id=>$(id)?.addEventListener('click',leave));
  $('vc5Pick').onclick=()=>$('vc5File').click();$('vc5Pick').onkeydown=e=>{if(e.key==='Enter'||e.key===' ')$('vc5File').click()};$('vc5File').onchange=e=>{addFiles([...e.target.files]);e.target.value=''};
  ['dragenter','dragover'].forEach(ev=>$('vc5Pick').addEventListener(ev,e=>{e.preventDefault();$('vc5Pick').classList.add('drag')}));['dragleave','drop'].forEach(ev=>$('vc5Pick').addEventListener(ev,e=>{e.preventDefault();$('vc5Pick').classList.remove('drag')}));$('vc5Pick').addEventListener('drop',e=>addFiles([...e.dataTransfer.files]));
  $$('.vc5-ratio').forEach(b=>b.onclick=()=>setPct(b.dataset.r));$('vc5Pct').oninput=e=>setPct(e.target.value);$('vc5PctNum').oninput=e=>setPct(e.target.value);
  $$('.vc5-mb').forEach(b=>b.onclick=()=>setMb(b.dataset.mb));$('vc5Mb').oninput=e=>setMb(e.target.value);
  ['vc5H','vc5Fps','vc5Audio','vc5Fmt'].forEach(id=>$(id).oninput=render);
  $('vc5Run').onclick=runAll;$('vc5Stop').onclick=()=>{S.cancel=true;S.stopCurrent?.()};$('vc5Clear').onclick=clearAll;$('vc5Down').onclick=downloadAll;
  window.videoCompressor={S,addFiles,runAll,runOne,show,version:'R19.8-audio-hardcap'};syncModeButtons();render();
})();
