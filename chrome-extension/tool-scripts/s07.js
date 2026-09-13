/* R18 - Batch rename module, offline XLSX/TXT/CSV import */
(function(){
  const $=id=>document.getElementById(id);
  const state={images:[],workbook:null,rows:[],names:[],mapping:[]};
  window.__IMAGE_STUDIO_RENAME_STATE__=state;
  const imageExts=new Set(['png','jpg','jpeg','webp']);
  function extOf(name){const m=String(name||'').match(/\.([^.]+)$/);return m?m[1]:''}
  function baseOf(name){return String(name||'').replace(/\.[^.]+$/,'')}
  function safeBase(s){
    s=String(s??'').normalize('NFC').replace(/[\x00-\x1f<>:"/\\|?*]+/g,'-').replace(/\s+/g,' ').trim().replace(/[. ]+$/g,'');
    return s||'image';
  }
  function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function colName(i){let s='';i++;while(i){i--;s=String.fromCharCode(65+i%26)+s;i=Math.floor(i/26)}return s}
  function colIndex(ref){const m=String(ref||'').match(/^([A-Z]+)/i);if(!m)return 0;let n=0;for(const ch of m[1].toUpperCase())n=n*26+(ch.charCodeAt(0)-64);return n-1}
  function setStatus(msg,type=''){const n=$('rn_status');if(!n)return;n.textContent=msg;n.className='rename-status'+(type?' '+type:'')}
  function cleanupImages(){for(const x of state.images){try{URL.revokeObjectURL(x.url)}catch(e){}}state.images=[]}
  function orderedImages(){const m=$('rn_sortMode')?.value||'upload';const a=[...state.images];if(m==='az')a.sort((x,y)=>x.name.localeCompare(y.name,undefined,{numeric:true,sensitivity:'base'}));if(m==='za')a.sort((x,y)=>y.name.localeCompare(x.name,undefined,{numeric:true,sensitivity:'base'}));return a}
  function dedupeNames(rows){
    if(!$('rn_dedupe')?.checked)return rows;
    const seen=new Map();
    return rows.map(r=>{if(!r.newName)return r;const e=extOf(r.newName),b=e?r.newName.slice(0,-e.length-1):r.newName;const key=r.newName.toLocaleLowerCase();let n=seen.get(key)||0;seen.set(key,n+1);if(!n)return r;let candidate,idx=n+1;do{candidate=`${b}_${idx}${e?'.'+e:''}`;idx++}while(seen.has(candidate.toLocaleLowerCase()));seen.set(candidate.toLocaleLowerCase(),1);return {...r,newName:candidate,status:'Tên trùng → đã thêm số',level:'warn'}})
  }
  function currentNames(){return state.names.map(x=>String(x??'').trim()).filter(x=>x!=='')}
  function buildMapping(){
    const imgs=orderedImages(), names=currentNames(), prefix=$('rn_prefix')?.value||'',suffix=$('rn_suffix')?.value||'',keepExt=$('rn_keepExt')?.checked!==false,keepUnmatched=$('rn_keepUnmatched')?.checked!==false;
    let rows=imgs.map((img,i)=>{
      const raw=names[i];let newName='',status='Sẵn sàng',level='ok';
      if(raw!=null&&raw!==''){
        let imported=String(raw).trim();
        const importedExt=extOf(imported).toLowerCase();
        if(keepExt)imported=baseOf(imported);
        let b=safeBase(prefix+imported+suffix);
        let e=keepExt?extOf(img.name):(imageExts.has(importedExt)?importedExt:extOf(img.name));
        newName=b+(e?'.'+e:'');
      }else if(keepUnmatched){newName=img.name;status='Thiếu tên → giữ tên cũ';level='warn'}
      else{status='Thiếu tên';level='bad'}
      return{index:i+1,img,oldName:img.name,newName,status,level};
    });
    rows=dedupeNames(rows); state.mapping=rows; return rows;
  }
  function render(){
    const rows=buildMapping(),body=$('rn_tableBody');
    $('rn_imageCount').textContent=`${state.images.length} ảnh`;$('rn_nameCount').textContent=`${currentNames().length} tên`;$('rn_matchCount').textContent=`${Math.min(state.images.length,currentNames().length)} khớp`;
    if(!rows.length){body.innerHTML='<tr><td colspan="5" style="text-align:center;color:#8290a3;padding:30px">Chưa có ảnh</td></tr>';setStatus('Chưa có ảnh. Hãy chọn ảnh và nạp danh sách tên.');return}
    body.innerHTML=rows.map(r=>`<tr class="rename-row ${r.level==='bad'?'bad':r.level==='warn'?'warn':''}"><td>${r.index}</td><td><img class="rename-thumb" src="${r.img.url}" alt=""></td><td class="rename-old">${escapeHtml(r.oldName)}</td><td class="rename-new">${escapeHtml(r.newName||'—')}</td><td><span class="rename-pill ${r.level}">${escapeHtml(r.status)}</span></td></tr>`).join('');
    const missing=rows.filter(r=>!r.newName).length, extra=Math.max(0,currentNames().length-state.images.length),warn=rows.filter(r=>r.level==='warn').length;
    if(missing)setStatus(`Còn ${missing} ảnh chưa có tên mới. Hãy bổ sung tên hoặc bật “Ảnh thiếu tên: giữ tên cũ”.`,'err');
    else if(extra)setStatus(`Đã sẵn sàng ${rows.length} ảnh. Danh sách tên đang thừa ${extra} dòng, các dòng thừa sẽ không dùng.`,'warn');
    else if(warn)setStatus(`Đã sẵn sàng ${rows.length} ảnh. Có ${warn} dòng được tự xử lý/cảnh báo.`,'warn');
    else setStatus(`Đã ghép đủ ${rows.length}/${rows.length} ảnh. Có thể tải hàng loạt.`,'ok');
  }
  function parseCSV(text){
    text=String(text||'').replace(/^\uFEFF/,'');const delim=(text.match(/;/g)||[]).length>(text.match(/,/g)||[]).length?';':',';const rows=[];let row=[],field='',q=false;
    for(let i=0;i<text.length;i++){const c=text[i];if(q){if(c==='"'&&text[i+1]==='"'){field+='"';i++}else if(c==='"')q=false;else field+=c}else{if(c==='"')q=true;else if(c===delim){row.push(field);field=''}else if(c==='\n'){row.push(field.replace(/\r$/,''));rows.push(row);row=[];field=''}else field+=c}}
    row.push(field.replace(/\r$/,''));if(row.some(x=>x!==''))rows.push(row);return rows
  }
  function parseTxt(text){return String(text||'').replace(/^\uFEFF/,'').split(/\r?\n/).map(s=>[s.trim()]).filter(r=>r[0]!=='')}
  function xml(text){return new DOMParser().parseFromString(text,'application/xml')}
  async function inflateRaw(bytes){if(typeof DecompressionStream==='undefined')throw new Error('Trình duyệt này không hỗ trợ giải nén Excel. Hãy dùng Chrome/Edge mới.');const ds=new DecompressionStream('deflate-raw');return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer())}
  async function unzipXlsx(buf){
    const u=new Uint8Array(buf),v=new DataView(buf);let eocd=-1;for(let i=Math.max(0,u.length-65557);i<=u.length-22;i++){if(v.getUint32(i,true)===0x06054b50)eocd=i}if(eocd<0)throw new Error('Không đọc được cấu trúc file .xlsx.');
    const count=v.getUint16(eocd+10,true),cd=v.getUint32(eocd+16,true),dec=new TextDecoder('utf-8');let p=cd;const entries=new Map();
    for(let k=0;k<count;k++){if(v.getUint32(p,true)!==0x02014b50)break;const method=v.getUint16(p+10,true),cs=v.getUint32(p+20,true),us=v.getUint32(p+24,true),nl=v.getUint16(p+28,true),el=v.getUint16(p+30,true),cl=v.getUint16(p+32,true),lo=v.getUint32(p+42,true),name=dec.decode(u.slice(p+46,p+46+nl));entries.set(name,{method,cs,us,lo});p+=46+nl+el+cl}
    async function get(name){const e=entries.get(name);if(!e)return null;const lp=e.lo;if(v.getUint32(lp,true)!==0x04034b50)throw new Error('Excel bị lỗi header ZIP.');const nl=v.getUint16(lp+26,true),el=v.getUint16(lp+28,true),start=lp+30+nl+el,comp=u.slice(start,start+e.cs);if(e.method===0)return comp;if(e.method===8)return await inflateRaw(comp);throw new Error('Kiểu nén Excel chưa được hỗ trợ: '+e.method)}
    return{entries,get,text:async name=>{const b=await get(name);return b?dec.decode(b):null}}
  }
  function normalizePath(path){const out=[];for(const p of path.split('/')){if(!p||p==='.')continue;if(p==='..')out.pop();else out.push(p)}return out.join('/')}
  async function readXlsx(file){
    const z=await unzipXlsx(await file.arrayBuffer()),wbText=await z.text('xl/workbook.xml');if(!wbText)throw new Error('Không tìm thấy workbook trong file Excel.');
    const relText=await z.text('xl/_rels/workbook.xml.rels'),wb=xml(wbText),rels=relText?xml(relText):null,relMap={};
    if(rels)for(const r of rels.getElementsByTagName('Relationship'))relMap[r.getAttribute('Id')]=r.getAttribute('Target');
    let shared=[];const ss=await z.text('xl/sharedStrings.xml');if(ss){const d=xml(ss);shared=[...d.getElementsByTagName('si')].map(si=>[...si.getElementsByTagName('t')].map(t=>t.textContent||'').join(''))}
    const sheets=[...wb.getElementsByTagName('sheet')].map((s,i)=>({name:s.getAttribute('name')||`Sheet ${i+1}`,rid:s.getAttribute('r:id')||s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')}));
    const result=[];
    for(const sh of sheets){let target=relMap[sh.rid]||`worksheets/sheet${result.length+1}.xml`;let path=target.startsWith('/')?target.slice(1):normalizePath('xl/'+target);const st=await z.text(path);if(!st)continue;const d=xml(st),rows=[];
      for(const row of d.getElementsByTagName('row')){const arr=[];for(const c of row.getElementsByTagName('c')){const idx=colIndex(c.getAttribute('r'));const t=c.getAttribute('t');let val='';if(t==='inlineStr'){val=[...c.getElementsByTagName('t')].map(x=>x.textContent||'').join('')}else{const vn=c.getElementsByTagName('v')[0];const raw=vn?vn.textContent||'':'';val=t==='s'?(shared[+raw]??raw):raw}arr[idx]=val}rows.push(arr)}
      result.push({name:sh.name,rows});
    }
    if(!result.length)throw new Error('Không đọc được sheet nào trong Excel.');return result
  }
  function detectHeader(rows){if(!rows.length)return false;const a=rows[0].map(x=>String(x||'').trim().toLowerCase());return a.some(x=>['name','filename','file name','tên','ten','tên file','ten file','new name','tên mới'].includes(x))}
  function updateColumns(){
    const wb=state.workbook,sidx=+$('rn_sheetSelect').value||0,rows=wb?.[sidx]?.rows||[],max=Math.max(1,...rows.map(r=>r.length));const sel=$('rn_columnSelect');sel.innerHTML='';for(let i=0;i<max;i++){const head=String(rows[0]?.[i]??'').trim();const o=document.createElement('option');o.value=i;o.textContent=`Cột ${colName(i)}${head?' — '+head:''}`;sel.appendChild(o)}
    let best=0;for(let i=0;i<max;i++){const h=String(rows[0]?.[i]??'').trim().toLowerCase();if(['name','filename','file name','tên','ten','tên file','ten file','new name','tên mới'].includes(h)){best=i;break}}sel.value=best;$('rn_skipHeader').checked=detectHeader(rows);applyWorkbookNames()
  }
  function applyWorkbookNames(){const wb=state.workbook,sidx=+$('rn_sheetSelect').value||0,cidx=+$('rn_columnSelect').value||0,skip=$('rn_skipHeader').checked,rows=wb?.[sidx]?.rows||[];state.names=rows.slice(skip?1:0).map(r=>String(r[cidx]??'').trim()).filter(Boolean);render()}
  async function loadNameFile(file){
    if(!file)return;const ext=extOf(file.name).toLowerCase();setStatus('Đang đọc danh sách tên...');
    try{
      if(ext==='xlsx'){state.workbook=await readXlsx(file);$('rn_excelOptions').classList.remove('rename-hidden');const ss=$('rn_sheetSelect');ss.innerHTML='';state.workbook.forEach((s,i)=>{const o=document.createElement('option');o.value=i;o.textContent=s.name;ss.appendChild(o)});updateColumns();setStatus(`Đã đọc Excel: ${state.workbook.length} sheet.`,'ok')}
      else if(ext==='csv'){state.workbook=[{name:'CSV',rows:parseCSV(await file.text())}];$('rn_excelOptions').classList.remove('rename-hidden');const ss=$('rn_sheetSelect');ss.innerHTML='<option value="0">CSV</option>';updateColumns();setStatus('Đã đọc file CSV.','ok')}
      else if(ext==='txt'){state.workbook=null;$('rn_excelOptions').classList.add('rename-hidden');state.names=parseTxt(await file.text()).map(r=>r[0]);render();setStatus(`Đã đọc ${state.names.length} tên từ TXT.`,'ok')}
      else if(ext==='xls'){throw new Error('Định dạng .xls cũ chưa hỗ trợ. Hãy mở Excel và Save As thành .xlsx.')}
      else throw new Error('Chỉ hỗ trợ TXT, CSV hoặc Excel .xlsx.')
    }catch(e){console.error(e);setStatus('Lỗi đọc danh sách: '+(e.message||e),'err')}
  }
  function exportMap(){const rows=buildMapping();if(!rows.length)return setStatus('Chưa có dữ liệu để xuất bảng đối chiếu.','warn');const q=s=>'"'+String(s??'').replace(/"/g,'""')+'"';const csv='STT,Tên cũ,Tên mới,Trạng thái\r\n'+rows.map(r=>[r.index,r.oldName,r.newName,r.status].map(q).join(',')).join('\r\n');triggerDownload(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}),'bang_doi_chieu_doi_ten.csv')}
  async function downloadZip(){const rows=buildMapping();if(!rows.length)return setStatus('Chưa có ảnh để tải.','warn');const bad=rows.filter(r=>!r.newName);if(bad.length)return setStatus(`Còn ${bad.length} ảnh chưa có tên mới. Chưa thể tải hàng loạt.`,'err');const btn=$('rn_downloadZip');btn.disabled=true;btn.textContent='Đang tải...';try{const files=rows.map(r=>({name:r.newName,blob:r.img.file}));const result=await downloadFilesBatch(files,msg=>setStatus(msg));setStatus(result.mode==='folder'?`Đã lưu ${rows.length} ảnh riêng, giữ nguyên chất lượng gốc.`:`Đã gửi ${rows.length} ảnh để tải riêng lẻ, giữ nguyên chất lượng gốc.`,'ok')}catch(e){if(e?.name==='AbortError')setStatus('Đã hủy chọn thư mục.','warn');else{console.error(e);setStatus('Lỗi tải hàng loạt: '+(e.message||e),'err')}}finally{btn.disabled=false;btn.textContent='Tải hàng loạt đã đổi tên'}}
  function bind(){
    $('rn_imageInput').addEventListener('change',e=>{cleanupImages();state.images=[...e.target.files].filter(f=>/^image\/(png|jpeg|webp)$/i.test(f.type)||/\.(png|jpe?g|webp)$/i.test(f.name)).map((f,i)=>({file:f,name:f.name,url:URL.createObjectURL(f),order:i}));render()});
    $('rn_nameFile').addEventListener('change',e=>loadNameFile(e.target.files[0]));
    $('rn_sheetSelect').addEventListener('change',updateColumns);$('rn_columnSelect').addEventListener('change',applyWorkbookNames);$('rn_skipHeader').addEventListener('change',applyWorkbookNames);
    $('rn_useText').addEventListener('click',()=>{state.workbook=null;$('rn_excelOptions').classList.add('rename-hidden');state.names=parseTxt($('rn_nameText').value).map(r=>r[0]);render();setStatus(`Đã dùng ${state.names.length} tên từ ô dán.`,'ok')});
    $('rn_clearNames').addEventListener('click',()=>{state.workbook=null;state.names=[];$('rn_nameText').value='';$('rn_nameFile').value='';$('rn_excelOptions').classList.add('rename-hidden');render()});
    $('rn_clearImages').addEventListener('click',()=>{cleanupImages();$('rn_imageInput').value='';render()});
    ['rn_sortMode','rn_prefix','rn_suffix','rn_keepExt','rn_keepUnmatched','rn_dedupe'].forEach(id=>{$(id).addEventListener('input',render);$(id).addEventListener('change',render)});
    $('rn_preview').addEventListener('click',render);$('rn_downloadZip').addEventListener('click',downloadZip);$('rn_exportMap').addEventListener('click',exportMap);
    window.addEventListener('beforeunload',cleanupImages);
  }
  function init(){if(!$('renameSection'))return;bind();render()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
