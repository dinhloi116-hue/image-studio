(function(){
  const $=id=>document.getElementById(id);
  const q=s=>document.querySelector(s);
  const qa=s=>Array.from(document.querySelectorAll(s));
  const safeState=()=>{try{return (typeof state!=='undefined'&&state.items)?state.items:[]}catch(e){return[]}};
  const selected=()=>safeState().filter(x=>x.selected);
  const processed=()=>safeState().filter(x=>x.processedBlob||x.processedUrl);
  const failed=()=>safeState().filter(x=>x.processError);
  const isPrep=()=>!$('prepSection')?.classList.contains('hidden');
  function cropPad(){return {x:Math.max(0,+($('paddingXPx')?.value||0)),y:Math.max(0,+($('paddingYPx')?.value||0))}}
  function operations(){
    const a=[];
    const remove=!!$('optRemoveBg')?.checked;
    const def=!!$('optDefringe')?.checked;
    const crop=!!$('optCrop')?.checked;
    const sharp=!!$('optSharpen')?.checked;
    if(remove)a.push('Xóa nền');
    if(remove&&def)a.push('Dọn viền');
    if(crop){const p=cropPad();a.push(`Crop ${p.x===p.y?p.x+'px':p.x+'/'+p.y+'px'}`)}
    if(sharp)a.push('Làm nét');
    return a.length?a:['Không chỉnh'];
  }
  function ensureContext(){
    if($('r19ContextCard'))return;
    const wf=q('.r17-workflow'); if(!wf)return;
    const n=document.createElement('div');n.id='r19ContextCard';n.className='r19-context-card';
    n.innerHTML='<h3>Đang áp dụng</h3><div id="r19ChipRow" class="r19-chip-row"></div><p id="r19ContextText"></p>';
    const sum=$('r17ActiveSummary'); if(sum)sum.insertAdjacentElement('afterend',n); else wf.appendChild(n);
  }
  function outputText(){
    const s=$('outputSize')?.value||'auto';
    const size=s==='auto'?'giữ theo crop':s==='custom'?`${$('customW')?.value||'?'}×${$('customH')?.value||'?'}`:`${s}×${s}`;
    const bg=({'transparent':'trong suốt','white':'trắng','black':'đen','gray':'xám','custom':'tùy chọn'}[$('outputBgMode')?.value||'transparent'])||'trong suốt';
    return `${size} • nền ${bg}`;
  }
  function updateContext(){
    ensureContext();const row=$('r19ChipRow'),txt=$('r19ContextText');if(!row||!txt)return;
    const chips=[['Tác vụ',operations().join(' · ')],['Đã chọn',selected().length+' ảnh'],['Đã xử lý',processed().length+' ảnh']];
    const st=$('strokeMode')?.value||'none'; if(st!=='none')chips.push(['Viền',(+($('strokePx')?.value||0))+'px']);
    const sh=$('shadowMode')?.value||'none'; if(sh!=='none')chips.push(['Bóng',sh]);
    if(failed().length)chips.push(['Lỗi',failed().length+' ảnh']);
    row.innerHTML=chips.map(x=>`<span class="r19-chip"><strong>${x[0]}:</strong> ${x[1]}</span>`).join('');
    const p=cropPad();txt.textContent=`Lề crop: ${p.x===p.y?p.x+'px':p.x+'px ngang / '+p.y+'px dọc'} • Xuất: ${outputText()}.`;
  }
  function contextualVisibility(){
    // Keep the Easy UI workflow primary; hide duplicate old crop block.
    q('.crop-main-block')?.classList.add('r19-hidden');
    const cropOn=!!$('optCrop')?.checked;
    const cropBox=q('.r17-crop-simple'); if(cropBox)cropBox.style.display=cropOn?'':'none';
    const customSize=$('customSizeRow'); if(customSize)customSize.classList.toggle('hidden',($('outputSize')?.value||'auto')!=='custom');
    const customBg=$('customBgColor'); if(customBg)customBg.classList.toggle('hidden',($('outputBgMode')?.value||'transparent')!=='custom');
    updateContext();
  }
  function setButtonState(btn,on,offText){if(!btn)return;btn.disabled=!on;btn.classList.toggle('r19-disabled',!on);if(!on&&offText)btn.dataset.r19OldText=btn.textContent,btn.textContent=offText;else if(on&&btn.dataset.r19OldText){btn.textContent=btn.dataset.r19OldText;delete btn.dataset.r19OldText}}
  function updateMainButtons(){
    const n=selected().length;
    const run=$('r17RunBtn'); if(run){run.textContent=n?`Xử lý ${n} ảnh đang chọn`:'Chọn ảnh để xử lý';setButtonState(run,n>0)}
    setButtonState($('tightCropAllBtn'),n>0);
    setButtonState($('r17ResetBatch'),n>0);
  }
  function ensureMobileBar(){
    if($('r19MobileBar'))return;
    const bar=document.createElement('div');bar.id='r19MobileBar';bar.className='r19-mobile-bar';
    bar.innerHTML='<div class="r19-mobile-meta"><b id="r19MobileTitle">Chưa chọn ảnh</b><span id="r19MobileSub">Thêm ảnh để bắt đầu</span></div><div class="r19-mobile-actions"><button id="r19MobileCrop" type="button" class="btn">Crop</button><button id="r19MobileRun" type="button" class="btn primary">Xử lý</button></div>';
    document.body.appendChild(bar);
    $('r19MobileRun').onclick=()=>$('quickAllBtn')?.click();
    $('r19MobileCrop').onclick=()=>$('tightCropAllBtn')?.click();
  }
  function updateMobile(){
    ensureMobileBar();const bar=$('r19MobileBar');if(!bar)return;
    bar.style.display=(window.innerWidth<=900&&isPrep())?'flex':'none';
    const n=selected().length;$('r19MobileTitle').textContent=n?`Đang chọn ${n} ảnh`:'Chưa chọn ảnh';
    $('r19MobileSub').textContent=n?`${operations().join(' · ')} • ${processed().length} đã xử lý`:'Thêm hoặc chọn ảnh rồi bấm Xử lý / Crop';
    setButtonState($('r19MobileRun'),n>0);setButtonState($('r19MobileCrop'),n>0);
  }
  function ensureRenameNote(){
    const sec=$('renameSection');if(!sec||$('r19RenameNote'))return;
    const n=document.createElement('div');n.id='r19RenameNote';n.className='r19-rename-note';n.textContent='Nạp ảnh và danh sách tên để xem đối chiếu.';
    const st=$('rn_status');if(st)st.insertAdjacentElement('afterend',n);else sec.prepend(n);
  }
  function updateRenameNote(){
    ensureRenameNote();const n=$('r19RenameNote');if(!n)return;
    const rs=window.__IMAGE_STUDIO_RENAME_STATE__;const imgs=rs?.images?.length||0,names=rs?.names?.length||0;
    n.className='r19-rename-note';
    if(!imgs&&!names){n.innerHTML='Nạp <b>ảnh</b> và file <b>Excel/TXT/CSV</b> để đổi tên hàng loạt.';return}
    if(imgs===names&&imgs){n.classList.add('ok');n.innerHTML=`<b>Khớp số lượng:</b> ${imgs} ảnh • ${names} tên.`;return}
    n.classList.add('warn');
    if(names>imgs)n.innerHTML=`<b>Dư ${names-imgs} tên.</b> Ảnh: ${imgs} • Tên: ${names}. Tool sẽ dùng theo số ảnh hiện có.`;
    else n.innerHTML=`<b>Thiếu ${imgs-names} tên.</b> Ảnh: ${imgs} • Tên: ${names}. Ảnh thiếu tên có thể giữ tên cũ.`;
  }
  function refresh(){contextualVisibility();updateMainButtons();updateMobile();updateRenameNote()}
  function bind(){
    ['optRemoveBg','optDefringe','optCrop','optSharpen','paddingXPx','paddingYPx','outputSize','outputBgMode','customW','customH','strokeMode','strokePx','shadowMode'].forEach(id=>{$(id)?.addEventListener('input',refresh);$(id)?.addEventListener('change',refresh)});
    $('gallery')?.addEventListener('click',()=>setTimeout(refresh,30));
    window.addEventListener('resize',refresh);
    let refreshQueued=false;
    const queueRefresh=()=>{ if(refreshQueued)return; refreshQueued=true; requestAnimationFrame(()=>{refreshQueued=false; refresh();}); };
    const mo=new MutationObserver(()=>queueRefresh());
    mo.observe(document.body,{subtree:true,childList:true});
    setInterval(updateRenameNote,1200);
  }
  function init(){document.body.classList.add('r19-refined');ensureContext();ensureMobileBar();ensureRenameNote();bind();refresh()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
