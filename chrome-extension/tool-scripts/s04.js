/* R16 UI composition only — no processing logic changed. */
(function(){
  function el(tag, cls, text){const n=document.createElement(tag); if(cls)n.className=cls; if(text!=null)n.textContent=text; return n;}
  function buildDisclosure(title, nodes){
    const d=el('details','simple-disclosure');
    const s=el('summary','',title); const body=el('div','simple-disclosure-body');
    d.append(s,body); nodes.filter(Boolean).forEach(n=>body.appendChild(n)); return d;
  }
  function initModernUI(){
    document.body.classList.add('modern-ui');
    const h=document.querySelector('.brand h1'), p=document.querySelector('.brand p');
    if(h) h.textContent='Image Studio';
    if(p) p.textContent='Xóa nền · Crop · Preview tên số · Chèn logo';

    const prep=document.getElementById('openPrepModeBtn'), prev=document.getElementById('openPreviewModeBtn'), logo=document.getElementById('openLogoModeBtn'), rename=document.getElementById('openRenameModeBtn');
    if(prep) prep.textContent='Xử lý ảnh'; if(prev) prev.textContent='Tên & số'; if(logo) logo.textContent='Logo / chữ'; if(rename) rename.textContent='Đổi tên';

    // Put secondary header actions behind one compact menu.
    const actions=document.querySelector('.top-actions');
    if(actions && !document.querySelector('.top-more')){
      const more=el('details','top-more'); const sm=el('summary',''); sm.setAttribute('aria-label','Thêm thao tác'); sm.textContent='•••';
      const menu=el('div','top-more-menu');
      ['processAllBtn','openFeedbackBtn','clearBtn'].forEach(id=>{const n=document.getElementById(id); if(n)menu.appendChild(n)});
      more.append(sm,menu); actions.appendChild(more);
      menu.addEventListener('click',()=>{setTimeout(()=>more.removeAttribute('open'),0)});
    }

    // Simplify the main sidebar without deleting any features.
    const side=document.querySelector('#prepSection .sidebar');
    if(side && !side.querySelector('.simple-disclosure')){
      const session=side.querySelector('.session-tools');
      const support=side.querySelector('.support-card');
      const guide=side.querySelector('.quick-guide');
      const feedback=side.querySelector('.feedback-card');
      const hint=side.querySelector('.hint-box');
      const settings=[...side.querySelectorAll(':scope > .settings-block')];
      const effects=settings[1], rename=settings[2];
      const more=buildDisclosure('Tùy chọn thêm',[effects,rename,session]);
      const help=buildDisclosure('Hướng dẫn & hỗ trợ',[guide,support,feedback,hint]);
      side.append(more,help);
    }

    const advanced=document.querySelector('.advanced'); if(advanced) advanced.open=false;
    const ct=document.querySelector('.center-tools-title'); if(ct) ct.textContent='Công cụ phụ';
    const self=document.getElementById('selfTestBtn'); if(self) self.textContent='Tự kiểm tra';
    const compact=document.getElementById('compactHelpBtn'); if(compact) compact.textContent='Tối giản';

    // Make upload language shorter and clearer.
    const dz=document.querySelector('#dropzone h2'), dp=document.querySelector('#dropzone p'), db=document.getElementById('dropPickBtn');
    if(dz) dz.textContent='Thả ảnh vào đây'; if(dp) dp.textContent='PNG, JPG, WEBP · có thể chọn nhiều ảnh'; if(db) db.textContent='Chọn ảnh';
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initModernUI); else initModernUI();
})();
