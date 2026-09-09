from pathlib import Path
p=Path('assets/video-compressor.js')
s=p.read_text(encoding='utf-8')
s=s.replace('if(window.__VIDCOMP_R196)return; window.__VIDCOMP_R196=1;','if(window.__VIDCOMP_R197)return; window.__VIDCOMP_R197=1;')
s=s.replace("else {sm.innerHTML=`Tối đa <span class=\"vc5-big\">${c.mb} MB</span> mỗi video`;sm.className='vc5-summary'}","else {sm.innerHTML=`Giới hạn cứng <span class=\"vc5-big\">≤ ${c.mb} MB</span> mỗi video • chỉ cho tải khi không vượt`;sm.className='vc5-summary'}")
s=s.replace("<span class=\"vc5-badge\">Mục tiêu ${fmt(t)}</span>","<span class=\"vc5-badge\">${cfg().mode==='mb'?'Trần cứng ≤ '+fmt(t):'Mục tiêu '+fmt(t)}</span>")
s=s.replace("const c=cfg(), base=bitrate(x,mt).video, desired=targetBytes(x)*8/Math.max(.1,x.d), sampleSec=","const c=cfg(), base=bitrate(x,mt).video, desired=targetBytes(x)*(c.mode==='mb'?.88:1)*8/Math.max(.1,x.d), sampleSec=")
s=s.replace("async function encode(x,idx,total,forceFmt=''){","async function encode(x,idx,total,forceFmt='',forcedVideo=0,attempt=1){")
s=s.replace("const tunedVideo=await calibrateBitrate(x,idx,total,mt);","const tunedVideo=forcedVideo>0?forcedVideo:await calibrateBitrate(x,idx,total,mt);")
s=s.replace("setStatus(`Đang nén ${idx+1}/${total}: ${x.name} • ${Math.round(x.progress)}%`)","setStatus(`${attempt>1?'Đang căn lại giới hạn • ':''}Đang nén ${idx+1}/${total}: ${x.name} • ${Math.round(x.progress)}%`)")
old="""const target=targetBytes(x), source=x.file.size, tooBig=blob.size>=source*.98, farOver=target>0&&blob.size>target*1.30;
      if(tooBig||farOver){URL.revokeObjectURL(pm.url);const e=Error(tooBig?`Kết quả ${fmt(blob.size)} không nhỏ hơn file gốc ${fmt(source)}. Tool đã chặn, không coi đây là nén thành công.`:`Kết quả ${fmt(blob.size)} vượt quá xa mục tiêu ${fmt(target)}.`);e.code=tooBig?'OVERSIZE':'MISSTARGET';e.usedMime=mt;throw e}
      return {blob,mime:mt,dur:pm.d,url:pm.url,w:pm.w,h:pm.h};"""
new="""const target=targetBytes(x), source=x.file.size, hardCap=c.mode==='mb', overHard=hardCap&&blob.size>target, tooBig=blob.size>=source*.98, farOver=!hardCap&&target>0&&blob.size>target*1.30;
      if(overHard||tooBig||farOver){URL.revokeObjectURL(pm.url);let msg=overHard?`Kết quả ${fmt(blob.size)} vượt trần cứng ${fmt(target)}. Tool sẽ không cho tải file này.`:tooBig?`Kết quả ${fmt(blob.size)} không nhỏ hơn file gốc ${fmt(source)}. Tool đã chặn, không coi đây là nén thành công.`:`Kết quả ${fmt(blob.size)} vượt quá xa mục tiêu ${fmt(target)}.`;const e=Error(msg);e.code=overHard?'HARDCAP':tooBig?'OVERSIZE':'MISSTARGET';e.usedMime=mt;e.usedVideo=tunedVideo;e.actualSize=blob.size;e.targetSize=target;throw e}
      return {blob,mime:mt,dur:pm.d,url:pm.url,w:pm.w,h:pm.h};"""
assert old in s, 'output validation block not found'
s=s.replace(old,new)
old2="""async function runItem(i,idx=0,total=1){let x=S.items[i];if(!x)return; if(x.outUrl){URL.revokeObjectURL(x.outUrl);x.outUrl=''}x.out=null;x.valid=false;x.err='';x.codecNote='';x.work=true;x.progress=0;render();try{let r;try{r=await encode(x,idx,total)}catch(e){let canFallback=(e.code==='OVERSIZE'||e.code==='MISSTARGET')&&cfg().fmt==='auto'&&outputMime('webm')&&!(e.usedMime||'').includes('webm');if(!canFallback)throw e;setStatus(`MP4 không đạt mục tiêu với ${x.name}. Đang thử WebM từ file gốc...`);x.codecNote='MP4 vượt dung lượng → tự chuyển WebM';r=await encode(x,idx,total,'webm')}x.out=r.blob;x.outUrl=r.url;x.outDur=r.dur;x.mime=r.mime;x.valid=true;x.progress=100}catch(e){if(e.name==='AbortError')throw e;x.err=e.message}finally{x.work=false;render()}}"""
new2="""async function runItem(i,idx=0,total=1){let x=S.items[i];if(!x)return;if(x.outUrl){URL.revokeObjectURL(x.outUrl);x.outUrl=''}x.out=null;x.valid=false;x.err='';x.codecNote='';x.work=true;x.progress=0;render();try{let r,forceFmt='',forcedVideo=0,attempt=1;for(;;){try{r=await encode(x,idx,total,forceFmt,forcedVideo,attempt);break}catch(e){if(e.name==='AbortError')throw e;const c=cfg();if(c.mode==='mb'&&e.code==='HARDCAP'&&attempt<3){const ratio=e.targetSize/Math.max(1,e.actualSize);forcedVideo=Math.max(180000,(e.usedVideo||bitrate(x,e.usedMime).video)*ratio*.88);x.codecNote=`Vượt trần lần ${attempt} → tự nén lại từ file gốc`;setStatus(`${x.name}: ${fmt(e.actualSize)} > trần ${fmt(e.targetSize)}. Đang nén lại từ file gốc với bitrate thấp hơn...`);attempt++;continue}let canFallback=(e.code==='OVERSIZE'||e.code==='MISSTARGET'||e.code==='HARDCAP')&&c.fmt==='auto'&&outputMime('webm')&&!(e.usedMime||'').includes('webm');if(canFallback){forceFmt='webm';forcedVideo=0;attempt=1;x.codecNote='MP4 không đạt giới hạn → thử WebM từ file gốc';setStatus(`MP4 chưa đạt giới hạn với ${x.name}. Đang thử WebM từ file gốc...`);continue}throw e}}x.out=r.blob;x.outUrl=r.url;x.outDur=r.dur;x.mime=r.mime;x.valid=true;x.progress=100;if(cfg().mode==='mb'&&x.out.size>targetBytes(x)){x.valid=false;throw Error(`Lỗi an toàn: file ${fmt(x.out.size)} vẫn vượt trần ${fmt(targetBytes(x))}. Đã chặn tải.`)}}catch(e){if(e.name==='AbortError')throw e;x.err=e.message}finally{x.work=false;render()}}"""
assert old2 in s, 'runItem block not found'
s=s.replace(old2,new2)
s=s.replace("version:'R19.6-calibrated'","version:'R19.7-hard-cap'")
p.write_text(s,encoding='utf-8')
for hp in [Path('index.html'),Path('direct/index.html')]:
    if hp.exists():
        h=hp.read_text(encoding='utf-8').replace('video-compressor.js?v=r196-calibrated-safe','video-compressor.js?v=r197-hard-cap')
        hp.write_text(h,encoding='utf-8')
print('R19.7 patch applied')
