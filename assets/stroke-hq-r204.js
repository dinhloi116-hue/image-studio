(()=>{
  if(window.__STROKE_HQ_R204)return;
  window.__STROKE_HQ_R204=1;
  const legacyStroke=window.addStroke;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const create=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c};
  const rgb=hex=>{let h=String(hex||'#ffffff').replace('#','').trim();if(h.length===3)h=h.split('').map(x=>x+x).join('');return [parseInt(h.slice(0,2),16)||0,parseInt(h.slice(2,4),16)||0,parseInt(h.slice(4,6),16)||0]};
  function edt1d(f,n,d,v,z){
    const INF=1e20;let k=0;v[0]=0;z[0]=-INF;z[1]=INF;
    for(let q=1;q<n;q++){
      let vk=v[k],den=2*(q-vk),s=((f[q]+q*q)-(f[vk]+vk*vk))/den;
      while(s<=z[k]&&k>0){k--;vk=v[k];s=((f[q]+q*q)-(f[vk]+vk*vk))/(2*(q-vk))}
      k++;v[k]=q;z[k]=s;z[k+1]=INF;
    }
    k=0;
    for(let q=0;q<n;q++){while(z[k+1]<q)k++;const dx=q-v[k];d[q]=dx*dx+f[v[k]]}
  }
  function addStrokeHQ(canvas,px,color,quality){
    px=Math.max(0,+px||0);if(px<=0)return canvas;
    quality=quality||document.getElementById('strokeQuality')?.value||'standard';
    if(quality==='fast'&&typeof legacyStroke==='function')return legacyStroke(canvas,px,color);
    const srcW=canvas.width,srcH=canvas.height,pad=Math.ceil(px)+1,outW=srcW+pad*2,outH=srcH+pad*2;
    const desired=quality==='ultra'?3:2,maxPixels=quality==='ultra'?12000000:8000000;
    let scale=Math.min(desired,Math.sqrt(maxPixels/Math.max(1,outW*outH)));scale=clamp(scale,1,desired);
    const W=Math.max(1,Math.round(outW*scale)),H=Math.max(1,Math.round(outH*scale)),mask=create(W,H),mg=mask.getContext('2d',{willReadFrequently:true});
    mg.clearRect(0,0,W,H);mg.imageSmoothingEnabled=true;mg.imageSmoothingQuality='high';mg.drawImage(canvas,pad*scale,pad*scale,srcW*scale,srcH*scale);
    const id=mg.getImageData(0,0,W,H),data=id.data,tmp=new Float32Array(W*H),N=Math.max(W,H),f=new Float64Array(N),d=new Float64Array(N),v=new Int32Array(N),z=new Float64Array(N+1),LARGE=1e12;
    for(let x=0;x<W;x++){
      for(let y=0;y<H;y++)f[y]=data[(y*W+x)*4+3]>=12?0:LARGE;
      edt1d(f,H,d,v,z);for(let y=0;y<H;y++)tmp[y*W+x]=d[y];
    }
    const [R,G,B]=rgb(color),radius=px*scale,soft=Math.max(1,scale*.85);
    for(let y=0;y<H;y++){
      const off=y*W;for(let x=0;x<W;x++)f[x]=tmp[off+x];
      edt1d(f,W,d,v,z);
      for(let x=0;x<W;x++){
        const dist=Math.sqrt(d[x]),coverage=clamp((radius+soft-dist)/soft,0,1),i=(off+x)*4;
        data[i]=R;data[i+1]=G;data[i+2]=B;data[i+3]=Math.round(coverage*255);
      }
    }
    mg.putImageData(id,0,0);
    const out=create(outW,outH),g=out.getContext('2d');g.clearRect(0,0,outW,outH);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(mask,0,0,W,H,0,0,outW,outH);g.drawImage(canvas,pad,pad);
    out.dataset.strokeQuality=quality;out.dataset.strokeScale=scale.toFixed(2);return out;
  }
  window.addStrokeHQ=addStrokeHQ;
  try{window.addStroke=addStrokeHQ;addStroke=addStrokeHQ}catch(_){window.addStroke=addStrokeHQ}
  function installUI(){
    const mode=document.getElementById('strokeMode');if(!mode||document.getElementById('strokeQuality'))return false;
    const section=mode.closest('.settings-block')||mode.parentElement,anchor=section?.querySelector('.field-tip');
    const label=document.createElement('label');label.className='field stroke-quality-field';label.innerHTML='<span>Chất lượng viền <span class="tip" data-tip="Chuẩn HQ dùng supersampling + anti-alias để mép chéo mượt hơn. Siêu mịn xử lý nặng hơn nhưng đẹp nhất. Nhanh dùng engine cũ.">?</span></span><select id="strokeQuality"><option value="fast">Nhanh — engine cũ</option><option value="standard" selected>Chuẩn HQ — khuyên dùng</option><option value="ultra">Siêu mịn — đẹp nhất</option></select>';
    if(anchor)anchor.before(label);else section?.append(label);
    const q=label.querySelector('#strokeQuality');try{q.value=localStorage.getItem('pip_stroke_quality')||'standard'}catch(_){q.value='standard'}
    const refresh=()=>{label.style.display=mode.value==='none'?'none':'grid'};q.addEventListener('change',()=>{try{localStorage.setItem('pip_stroke_quality',q.value)}catch(_){} });mode.addEventListener('change',refresh);refresh();
    const tip=section?.querySelector('.field-tip');if(tip)tip.innerHTML='<b>Viền HQ:</b> mặc định dùng <b>Chuẩn HQ</b>, render mask ở độ phân giải cao rồi thu về bằng anti-alias để mép chéo/bo cong ít răng cưa hơn. Nếu ảnh rất lớn, tool tự hạ hệ số supersampling để tránh ngốn RAM.';
    return true;
  }
  if(!installUI()){const mo=new MutationObserver(()=>{if(installUI())mo.disconnect()});mo.observe(document.documentElement,{childList:true,subtree:true});setTimeout(installUI,300)}
  window.strokeHQ={addStrokeHQ,version:'R20.4'};
})();
