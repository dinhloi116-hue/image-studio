const UPDATE_URL='https://raw.githubusercontent.com/dinhloi116-hue/image-studio/main/chrome-extension/update.json';
const VERSION_URL='https://dinhloi116-hue.github.io/image-studio/direct/version.txt';
const $=id=>document.getElementById(id);
let remote=null;
function setStatus(text,kind=''){ $('status').textContent=text; $('status').className='status'+(kind?' '+kind:''); }
function cmp(a,b){const A=String(a).split('.').map(n=>parseInt(n)||0),B=String(b).split('.').map(n=>parseInt(n)||0);for(let i=0;i<3;i++){if((A[i]||0)!=(B[i]||0))return (A[i]||0)>(B[i]||0)?1:-1}return 0}
async function fetchUpdate(){
  setStatus('Đang kiểm tra GitHub...');
  try{
    const r=await fetch(UPDATE_URL+'?t='+Date.now(),{cache:'no-store'});
    if(!r.ok)throw new Error('HTTP '+r.status);
    remote=await r.json();
    try{const vr=await fetch(VERSION_URL+'?t='+Date.now(),{cache:'no-store'});if(vr.ok)remote.tool_version=(await vr.text()).trim()}catch(_){}
    const local=chrome.runtime.getManifest().version;
    const extNew=remote.extension_version&&cmp(remote.extension_version,local)>0;
    $('download').classList.toggle('hidden',!extNew);
    await chrome.storage.local.set({lastRemote:remote,lastCheck:Date.now()});
    if(extNew)setStatus(`Có extension mới v${remote.extension_version}. Tool Git: ${remote.tool_version||'mới nhất'}.`,'warn');
    else setStatus(`Đã lấy bản Git mới nhất: ${remote.tool_version||'OK'}.`,'ok');
    return remote;
  }catch(e){setStatus('Không kiểm tra được GitHub: '+e.message,'err');return null}
}
$('open').onclick=()=>chrome.tabs.create({url:chrome.runtime.getURL('app.html')});
$('update').onclick=async()=>{
  const u=await fetchUpdate();
  if(!u)return;
  const q='?forceUpdate=1&tool='+encodeURIComponent(u.tool_version||'latest')+'&t='+Date.now();
  chrome.tabs.create({url:chrome.runtime.getURL('app.html')+q});
};
$('download').onclick=async()=>{
  if(!remote)remote=await fetchUpdate();
  if(!remote?.download_url)return setStatus('GitHub chưa có gói ZIP mới.','err');
  chrome.downloads.download({url:remote.download_url,filename:'Image-Studio-Chrome-Extension.zip',saveAs:true},()=>{
    if(chrome.runtime.lastError)setStatus('Không tải được ZIP: '+chrome.runtime.lastError.message,'err');
    else setStatus('Đã bắt đầu tải ZIP. Giải nén đè vào thư mục extension rồi bấm Reload.','ok');
  });
};
$('ver').textContent='Extension v'+chrome.runtime.getManifest().version;
chrome.storage.local.get(['lastRemote']).then(x=>{if(x.lastRemote?.tool_version)setStatus('Git gần nhất: '+x.lastRemote.tool_version)});
