/* ===== R17 Easy UI ===== */
(function(){
  const $=id=>document.getElementById(id);
  const q=s=>document.querySelector(s);
  const qa=s=>[...document.querySelectorAll(s)];
  const make=(tag,cls,html='')=>{const n=document.createElement(tag); if(cls)n.className=cls; if(html)n.innerHTML=html; return n;};
  const setCheck=(id,v)=>{const n=$(id); if(!n)return; n.checked=!!v; n.dispatchEvent(new Event('change',{bubbles:true})); n.dispatchEvent(new Event('input',{bubbles:true}));};
  const getCheck=id=>!!$(id)?.checked;
  const itemsList=()=>{try{return (typeof state!=='undefined'&&state.items)?state.items:[]}catch(e){return[]}};
  function currentMode(){
    const r=getCheck('optRemoveBg'),d=getCheck('optDefringe'),c=getCheck('optCrop'),s=getCheck('optSharpen');
    if(!r&&!d&&c&&!s)return'crop';
    if(r&&d&&c&&s)return'bgcrop';
    if(r&&d&&!c&&!s)return'bg';
    if(!r&&!d&&!c&&s)return'sharpen';
    return'custom';
  }
  function chooseMode(mode){
    const map={
      crop:[0,0,1,0],
      bgcrop:[1,1,1,1],
      bg:[1,1,0,0],
      sharpen:[0,0,0,1]
    };
    const v=map[mode]; if(!v)return;
    setCheck('optRemoveBg',v[0]); setCheck('optDefringe',v[1]); setCheck('optCrop',v[2]); setCheck('optSharpen',v[3]);
    if(typeof setStatus==='function') setStatus('Đã chọn chế độ: '+({crop:'Chỉ crop sát',bgcrop:'Xóa nền + crop',bg:'Chỉ xóa nền',sharpen:'Giữ nền + làm nét'}[mode]||mode));
    updateUI();
  }
  function padXY(){return {x:Math.max(0,+($('paddingXPx')?.value||0)),y:Math.max(0,+($('paddingYPx')?.value||0))};}
  function setPad(v){
    v=Math.max(0,Math.round(+v||0));
    ['paddingXPx','paddingYPx','cropPadXQuick','cropPadYQuick'].forEach(id=>{const n=$(id);if(n)n.value=v;});
    if(typeof syncCropPadUI==='function')try{syncCropPadUI();}catch(e){}
    updateUI();
  }
  function updateUI(){
    const m=currentMode(); qa('.r17-goal').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));
    const p=padXY(); const pad=$('r17CropPad'); if(pad && document.activeElement!==pad)pad.value=p.x===p.y?p.x:p.x;
    qa('.r17-pad-chip').forEach(b=>b.classList.toggle('active',p.x===p.y && +b.dataset.pad===p.x));
    const cp=q('.r17-crop-simple'); if(cp)cp.classList.toggle('is-off',!getCheck('optCrop'));
    const ptxt=$('r17PadText'); if(ptxt)ptxt.textContent=p.x===p.y?`${p.x}px`:`${p.x}/${p.y}px`;
    const parts=[];
    if(getCheck('optRemoveBg'))parts.push('Xóa nền');
    if(getCheck('optDefringe'))parts.push('Dọn viền');
    if(getCheck('optCrop'))parts.push(`Crop ${p.x===p.y?p.x+'px':p.x+'/'+p.y+'px'}`);
    if(getCheck('optSharpen'))parts.push('Làm nét');
    if(!parts.length)parts.push('Không chỉnh ảnh');
    const size=$('outputSize')?.value||'auto'; const bg=$('outputBgMode')?.value||'transparent';
    const sizeText=size==='auto'?'Giữ kích thước crop':size==='custom'?`${$('customW')?.value||'?'}×${$('customH')?.value||'?'}`:`${size}×${size}`;
    const bgText={transparent:'nền trong suốt',white:'nền trắng',black:'nền đen',gray:'nền xám',custom:'nền tùy chọn'}[bg]||bg;
    const sum=$('r17ActiveSummary'); if(sum)sum.innerHTML=`<span>●</span><div><strong>Đang xử lý:</strong> ${parts.join(' · ')}<br><span style="color:#8290a3">Xuất: ${sizeText} · ${bgText}</span></div>`;
    const run=$('r17RunBtn'); if(run){const n=itemsList().filter(x=>x.selected).length; run.textContent=n?`Xử lý ${n} ảnh đang chọn`:'Xử lý ảnh';}
  }
  function resetProcessed(items){
    let n=0;
    (items||[]).forEach(item=>{
      if(item.processedUrl && item.processedUrl!==item.origUrl){try{URL.revokeObjectURL(item.processedUrl)}catch(e){}}
      if(item.processedBlob||item.processedUrl||item.processError){n++; item.processedBlob=null; item.processedUrl=null; item.processedW=null; item.processedH=null; item.processError='';}
    });
    if(n){try{render();updateCounts();}catch(e){} if(typeof setStatus==='function')setStatus(`Đã đưa ${n} ảnh về trạng thái gốc.`);}
    else if(typeof setStatus==='function')setStatus('Không có ảnh đã xử lý để khôi phục.');
  }
  function transformSelectionStrip(){
    const strip=q('.batch-select-strip'); if(!strip||strip.querySelector('.r17-select-more'))return;
    const d=make('details','r17-select-more'), sm=make('summary','','Thêm'), menu=make('div','r17-select-menu'); d.append(sm,menu);
    ['selectUnprocessedBtn','invertSelectionBtn','undoDeleteBtn','retryErrorsBtn'].forEach(id=>{const n=$(id);if(n)menu.appendChild(n)});
    const count=$('selectedCountText'); strip.insertBefore(d,count||null);
    menu.addEventListener('click',()=>setTimeout(()=>d.removeAttribute('open'),0));
  }
  function transformTemplate(){
    const tpl=$('cardTpl'); if(!tpl||tpl.content.querySelector('.r17-card-more'))return;
    tpl.content.querySelector('.edit-panel')?.removeAttribute('open');
    const actions=tpl.content.querySelector('.top-card-actions'); if(actions){
      const p1=actions.querySelector('.process1-one'), crop=actions.querySelector('.tight-crop-one'), dl=actions.querySelector('.download-one');
      if(p1){p1.innerHTML='Xử lý';p1.title='Xử lý ảnh này theo đúng tùy chọn hiện tại';}
      if(crop){crop.textContent='Crop';crop.title='Crop sát ảnh này theo lề crop hiện tại';}
      if(dl){dl.textContent='Tải';}
      const d=make('details','r17-card-more'), sm=make('summary','', '•••'), menu=make('div','r17-card-menu'); d.append(sm,menu);
      ['.auto-scan-one','.scan-one','.process2-one','.crop-free-one','.vector-one','.remove-one'].forEach(sel=>{const b=actions.querySelector(sel);if(b)menu.appendChild(b)});
      const reset=make('button','btn small r17-reset-one','↩ Về ảnh gốc'); reset.type='button'; menu.insertBefore(reset,menu.firstChild);
      actions.appendChild(d);
    }
    const note=tpl.content.querySelector('.card-note'); if(note && !note.closest('.r17-card-help')){
      const d=make('details','r17-card-help'), sm=make('summary','','Mẹo xử lý khi ảnh khó');
      note.parentNode.insertBefore(d,note); d.append(sm,note);
    }
  }
  function buildWorkflow(){
    const side=q('#prepSection .sidebar'); if(!side||$('.r17-workflow'))return;
    document.body.classList.add('r17-ui');
    const title=q('.brand h1'), sub=q('.brand p'); if(title)title.textContent='Image Studio'; if(sub)sub.textContent='Chọn ảnh → chọn việc cần làm → xử lý';
    const quick=$('quickAllBtn'); if(quick)quick.textContent='Xử lý'; const zip=$('downloadAllBtn'); if(zip)zip.textContent='Tải hàng loạt';

    const wf=make('section','r17-workflow');
    wf.innerHTML=`
      <div class="r17-section-head"><div><h2>Chọn việc cần làm</h2><p>Chọn một chế độ nhanh, hoặc mở “Tự chọn” nếu cần kết hợp riêng.</p></div><div class="r17-step-badge">1</div></div>
      <div class="r17-goal-grid">
        <button type="button" class="r17-goal" data-mode="crop"><b>✂ Chỉ crop sát</b><small>Không xóa nền, không làm nét</small></button>
        <button type="button" class="r17-goal" data-mode="bgcrop"><b>✨ Xóa nền + crop</b><small>Quy trình đầy đủ cho logo/patch</small></button>
        <button type="button" class="r17-goal" data-mode="bg"><b>◌ Chỉ xóa nền</b><small>Giữ nguyên kích thước ảnh</small></button>
        <button type="button" class="r17-goal" data-mode="sharpen"><b>◇ Giữ nền + làm nét</b><small>Không đụng tới nền và crop</small></button>
      </div>`;
    const manual=make('details','r17-manual'); manual.innerHTML='<summary>Tự chọn bật / tắt tính năng</summary><div class="r17-switches"></div>'; wf.appendChild(manual);
    const switches=manual.querySelector('.r17-switches'), main=q('.main-options');
    if(main){qa('.main-options > label.option-row').forEach(n=>switches.appendChild(n));main.classList.add('r17-old-hidden');}

    const cropSimple=make('div','r17-crop-simple');
    cropSimple.innerHTML=`<div class="r17-mini-label"><span>Lề crop</span><span id="r17PadText">2px</span></div><div class="r17-pad-line"><button class="r17-pad-chip" data-pad="0" type="button">0</button><button class="r17-pad-chip" data-pad="2" type="button">2</button><button class="r17-pad-chip" data-pad="5" type="button">5</button><button class="r17-pad-chip" data-pad="10" type="button">10</button><input id="r17CropPad" type="number" min="0" max="300" step="1" value="2" title="Số pixel chừa quanh ảnh sau crop"></div>`;
    wf.appendChild(cropSimple);

    const output=make('div','r17-output'); output.innerHTML='<div class="r17-mini-label"><span>Ảnh xuất</span><span></span></div><div class="r17-output-grid"></div>';
    const og=output.querySelector('.r17-output-grid');
    const sizeLabel=$('outputSize')?.closest('.field'), bgLabel=$('outputBgMode')?.closest('.field');
    if(sizeLabel)og.appendChild(sizeLabel); if(bgLabel)og.appendChild(bgLabel);
    const more=make('details','r17-output-more'); more.innerHTML='<summary>Thêm tùy chọn xuất file</summary><div class="r17-output-more-body"></div>'; const mb=more.querySelector('.r17-output-more-body');
    const customRow=$('customSizeRow'), customBg=$('customBgColor'), maxField=$('maxFileSizeMb')?.closest('.field');
    if(customRow)mb.appendChild(customRow); if(customBg)mb.appendChild(customBg); if(maxField)mb.appendChild(maxField);
    output.appendChild(more); wf.appendChild(output);
    const outputBlock=$('maxFileSizeMb')?.closest('.settings-block'); if(outputBlock)outputBlock.classList.add('r17-old-hidden');
    const cropBlock=q('.crop-main-block'); if(cropBlock)cropBlock.classList.add('r17-old-hidden');
    const preset=q('.preset-card'); if(preset)preset.classList.add('r17-old-hidden');

    const summary=make('div','r17-active-summary'); summary.id='r17ActiveSummary'; wf.appendChild(summary);
    const acts=make('div','r17-primary-actions'); const run=make('button','btn r17-run','Xử lý ảnh'); run.id='r17RunBtn';run.type='button'; acts.appendChild(run);
    const tc=$('tightCropAllBtn'); if(tc){tc.classList.add('r17-direct-crop');tc.textContent='Crop ngay';tc.title='Chỉ crop các ảnh đang chọn, không chạy xóa nền/làm nét';acts.appendChild(tc);}
    wf.appendChild(acts);
    const reset=make('button','btn r17-reset-batch','↩ Đưa ảnh đang chọn về ảnh gốc');reset.id='r17ResetBatch';reset.type='button';wf.appendChild(reset);
    side.insertBefore(wf,side.firstChild);
  }
  function placeWorkflowResponsive(){
    const wf=$('r17ActiveSummary')?.closest('.r17-workflow'), side=q('#prepSection .sidebar'), left=q('#prepSection .left-work'); if(!wf||!side||!left)return;
    if(window.matchMedia('(max-width:900px)').matches){
      const dz=$('dropzone'); if(dz && wf.parentNode!==left) left.insertBefore(wf,dz.nextSibling);
    }else if(wf.parentNode!==side){ side.insertBefore(wf,side.firstChild); }
  }
  function bind(){
    qa('.r17-goal').forEach(b=>b.addEventListener('click',()=>chooseMode(b.dataset.mode)));
    qa('.r17-pad-chip').forEach(b=>b.addEventListener('click',()=>setPad(b.dataset.pad)));
    $('r17CropPad')?.addEventListener('input',e=>setPad(e.target.value));
    $('r17RunBtn')?.addEventListener('click',()=>$('quickAllBtn')?.click());
    $('r17ResetBatch')?.addEventListener('click',()=>resetProcessed(itemsList().filter(x=>x.selected)));
    ['optRemoveBg','optDefringe','optCrop','optSharpen','paddingXPx','paddingYPx','outputSize','outputBgMode','customW','customH'].forEach(id=>$(id)?.addEventListener('input',updateUI));
    $('gallery')?.addEventListener('click',e=>{
      const b=e.target.closest('.r17-reset-one'); if(!b)return;
      const card=b.closest('.card'); const item=itemsList().find(x=>String(x.id)===String(card?.dataset.id)); if(item)resetProcessed([item]);
      b.closest('.r17-card-more')?.removeAttribute('open');
    });
    document.addEventListener('click',e=>{qa('.r17-card-more[open]').forEach(d=>{if(!d.contains(e.target))d.removeAttribute('open')})});
    const obs=new MutationObserver(()=>updateUI()); obs.observe(document.body,{attributes:true,attributeFilter:['class']});
    window.matchMedia('(max-width:900px)').addEventListener?.('change',placeWorkflowResponsive);
  }
  function init(){
    transformTemplate(); transformSelectionStrip(); buildWorkflow(); placeWorkflowResponsive(); bind(); updateUI();
    // Hide verbose helper lines that duplicate the simplified flow.
    q('.quick-guide')?.classList.add('r17-old-hidden');
    const ct=q('.center-tools-title'); if(ct)ct.textContent='Công cụ nâng cao';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
