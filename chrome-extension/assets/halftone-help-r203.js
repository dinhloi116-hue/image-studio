(()=>{
  if(window.__HALFTONE_HELP_R203)return;
  window.__HALFTONE_HELP_R203=1;
  const $=id=>document.getElementById(id);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const HELP={
    ht2Mode:'Theo tông ảnh: kích thước lỗ thay đổi theo sáng/tối, giữ cảm giác graphic tee và chi tiết tốt hơn. Đục đều: lỗ gần như đồng đều toàn ảnh, thoáng hơn nhưng ít giữ chuyển sắc. Nếu chưa chắc, chọn Theo tông ảnh.',
    ht2Lpi:'LPI là mật độ tram. LPI thấp = ô tram lớn, dễ in và ổn định hơn. LPI cao = mịn hơn nhưng đòi hỏi máy, film, mực và powder ổn định hơn. Với DTF, nên bắt đầu khoảng 35–45 LPI; trên 50 LPI chỉ nên dùng sau khi đã test.',
    ht2Angle:'Góc xoay của lưới tram. 45° là lựa chọn an toàn, dễ nhìn và dùng được cho đa số artwork. 22.5° thường dùng khi muốn pattern bớt cảm giác chéo; 0° / 15° / 75° dùng khi bạn có chủ đích riêng.',
    ht2Shape:'Hình dạng lỗ tram. Round (tròn) là lựa chọn an toàn và ổn định nhất để test DTF. Square (vuông) nhìn graphic/mạnh hơn nhưng cạnh lỗ nhạy hơn. Ellipse và Diamond tạo phong cách riêng.',
    ht2Dpi:'DPI quy đổi dùng để tính kích thước cell tram theo pixel. 300 DPI là mức nên bắt đầu và đủ cho đa số file DTF. Tăng DPI không tự làm ảnh nét hơn nếu ảnh nguồn không có thêm chi tiết.',
    ht2Min:'Kích thước lỗ trong suốt nhỏ nhất được phép tạo. Lỗ quá nhỏ có thể bị bít sau mực/powder/ép nhiệt. Với DTF nên bắt đầu khoảng 0.40–0.55 mm. 0.15–0.25 mm là rất mịn, chỉ nên dùng khi quy trình của bạn đã test ổn.',
    ht2Strength:'Mức đục quyết định độ lớn/tác động của lỗ tram. Số cao hơn = lỗ lớn hơn và áo thoáng hơn nhưng mất nhiều mực/chi tiết hơn. Số thấp hơn = giữ artwork nhiều hơn. Preset Cân bằng 40 dùng mức 55.',
    ht2Gamma:'Gamma tông điều khiển tram ở vùng trung gian. 1.00 = trung tính. Dưới 1.00 làm vùng trung gian thoáng hơn; trên 1.00 giữ mực nhiều hơn ở vùng trung gian. Nếu chưa chắc, để 1.00.',
    ht2Protect:'Giữ viền ngoài sẽ hạn chế đục sát mép trong suốt, giúp chữ nhỏ, outline và mép artwork đỡ bị gãy. Nên bật trong đa số trường hợp.',
    ht2Invert:'Đảo vùng sáng/tối đổi vùng nào được đục mạnh hơn. Mặc định vùng sáng thoáng hơn; bật mục này khi bạn muốn vùng tối thoáng hơn. Chỉ dùng khi preview đúng ý.'
  };
  const style=document.createElement('style');
  style.textContent=`
    .ht2-help-q{appearance:none;display:inline-grid;place-items:center;width:17px;height:17px;margin-left:5px;padding:0;border-radius:50%;border:1px solid #64748b;background:#172033;color:#bfdbfe;font:800 11px/1 Segoe UI,Arial;cursor:help;vertical-align:middle;box-shadow:none!important;transform:none!important}
    .ht2-help-q:hover,.ht2-help-q:focus{border-color:#60a5fa;background:#1e3a5f;color:#fff;outline:none}
    #ht2HelpFloat{position:fixed;z-index:1000000;display:none;width:min(340px,calc(100vw - 24px));padding:11px 12px;border-radius:11px;background:#020617;color:#e2e8f0;border:1px solid #475569;box-shadow:0 14px 38px rgba(0,0,0,.55);font:12px/1.52 Segoe UI,Arial,sans-serif;pointer-events:none}
    .ht2-guide{margin:0 0 11px;padding:11px 12px;border:1px solid #35506f;border-radius:12px;background:#08111f}
    .ht2-guide-title{font-size:13px;font-weight:850;color:#f8fafc;margin-bottom:4px}.ht2-guide-sub{font-size:11.5px;line-height:1.45;color:#a9bad0}
    .ht2-guide-buttons{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:9px}.ht2-guide-btn{appearance:none;border:1px solid #334155;border-radius:9px;background:#111c2e;color:#e2e8f0;padding:8px 6px;font-weight:800;font-size:11px;cursor:pointer}.ht2-guide-btn:hover{border-color:#60a5fa;background:#172b46}.ht2-guide-btn.recommended{background:#0d3328;border-color:#22c55e;color:#bbf7d0}
    .ht2-guide-state{margin-top:9px;padding:8px 9px;border-radius:9px;border:1px solid #334155;background:#0b1220;color:#cbd5e1;font-size:11px;line-height:1.42}.ht2-guide-state.ok{border-color:#166534;background:#08291d;color:#bbf7d0}.ht2-guide-state.warn{border-color:#a16207;background:#2a1807;color:#fde68a}
    @media(max-width:700px){.ht2-guide-buttons{grid-template-columns:1fr}.ht2-help-q{width:20px;height:20px}}
  `;
  document.head.appendChild(style);

  const floater=document.createElement('div');floater.id='ht2HelpFloat';document.body.appendChild(floater);
  let hideTimer=0;
  function showTip(btn,text){
    clearTimeout(hideTimer);floater.textContent=text;floater.style.display='block';
    requestAnimationFrame(()=>{const r=btn.getBoundingClientRect(),fr=floater.getBoundingClientRect(),w=fr.width||340,h=fr.height||90;let left=clamp(r.left,12,window.innerWidth-w-12),top=r.bottom+8;if(top+h>window.innerHeight-12)top=Math.max(12,r.top-h-8);floater.style.left=left+'px';floater.style.top=top+'px'});
  }
  function hideTip(){hideTimer=setTimeout(()=>floater.style.display='none',80)}
  function addQ(target,text){
    if(!target||target.querySelector?.('.ht2-help-q'))return;
    const q=document.createElement('button');q.type='button';q.className='ht2-help-q';q.textContent='?';q.setAttribute('aria-label','Giải thích thông số');
    q.addEventListener('mouseenter',()=>showTip(q,text));q.addEventListener('mouseleave',hideTip);q.addEventListener('focus',()=>showTip(q,text));q.addEventListener('blur',hideTip);q.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();showTip(q,text)});
    target.appendChild(q);
  }
  function presetClick(id){const b=document.querySelector(`.ht2-preset[data-p="${id}"]`);if(b){b.click();return true}return false}
  function current(){return{lpi:+$('ht2LpiN')?.value||0,min:+$('ht2Min')?.value||0,str:+$('ht2StrengthN')?.value||0,shape:$('ht2Shape')?.value||'',dpi:+$('ht2Dpi')?.value||0}}
  function updateGuide(){
    const el=$('ht2GuideState');if(!el)return;const c=current();let text='',cls='ht2-guide-state';
    if(c.lpi>=55||c.min<.30){text=`⚠ Đang để tram rất mịn (${c.lpi||'—'} LPI, lỗ tối thiểu ${c.min?c.min.toFixed(2):'—'} mm). Nếu chưa test film/mực/powder, nên quay về Cân bằng 40 để tránh bít lỗ hoặc mất tram.`;cls+=' warn'}
    else if(c.lpi>=35&&c.lpi<=45&&c.min>=.35&&c.min<=.60){text='✓ Thông số hiện tại nằm trong vùng khởi đầu hợp lý cho DTF. Nếu chưa biết chọn gì, cứ dùng Cân bằng 40 rồi test 1 mẫu trước.';cls+=' ok'}
    else{text='Gợi ý: bắt đầu bằng Cân bằng 40. Nếu tram hay bít/mất lỗ → An toàn 35. Nếu máy giữ dot tốt và cần nét hơn → Nét hơn 45.'}
    el.className=cls;el.textContent=text;
  }
  function install(){
    const sec=$('halftoneSection');if(!sec||!$('ht2Mode'))return false;if(sec.dataset.htHelp203==='1')return true;sec.dataset.htHelp203='1';
    const normal=[['ht2Mode','span'],['ht2Lpi','span'],['ht2Angle','span'],['ht2Shape','span'],['ht2Dpi','span'],['ht2Min','span'],['ht2Strength','span'],['ht2Gamma','span']];
    normal.forEach(([id])=>{const el=$(id),label=el?.closest('label'),title=label?.querySelector(':scope > span');addQ(title,HELP[id])});
    [['ht2Protect','b'],['ht2Invert','b']].forEach(([id])=>{const el=$(id),label=el?.closest('label'),title=label?.querySelector('b');addQ(title,HELP[id])});
    const heading=[...sec.querySelectorAll('.ht2-card h3')].find(x=>x.textContent.trim()==='Thông số tram');const grid=heading?.parentElement?.querySelector('.ht2-grid');
    if(grid&&!$('ht2Guide')){const g=document.createElement('div');g.id='ht2Guide';g.className='ht2-guide';g.innerHTML=`<div class="ht2-guide-title">Không biết chọn mức nào? Bắt đầu ở đây</div><div class="ht2-guide-sub"><b>Cân bằng 40</b> là mức khởi đầu nên dùng. Sau khi in test mới tăng/giảm theo máy, film, mực, powder và nhiệt ép của bạn.</div><div class="ht2-guide-buttons"><button type="button" class="ht2-guide-btn" data-p="dtf35">An toàn 35</button><button type="button" class="ht2-guide-btn recommended" data-p="dtf40">✓ Cân bằng 40</button><button type="button" class="ht2-guide-btn" data-p="dtf45">Nét hơn 45</button></div><div id="ht2GuideState" class="ht2-guide-state"></div>`;grid.before(g);g.querySelectorAll('.ht2-guide-btn').forEach(b=>b.onclick=()=>{presetClick(b.dataset.p);setTimeout(updateGuide,20)})}
    ['ht2Lpi','ht2LpiN','ht2Min','ht2Strength','ht2StrengthN','ht2Shape','ht2Dpi'].forEach(id=>$(id)?.addEventListener('input',updateGuide));
    updateGuide();return true;
  }
  if(!install()){const mo=new MutationObserver(()=>{if(install())mo.disconnect()});mo.observe(document.documentElement,{childList:true,subtree:true});setTimeout(install,500)}
  window.halftoneHelp={install,updateGuide,version:'R20.3'};
})();
