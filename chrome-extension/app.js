const UPDATE_URL='https://raw.githubusercontent.com/dinhloi116-hue/image-studio/main/chrome-extension/update.json';
const VERSION_URL='https://dinhloi116-hue.github.io/image-studio/direct/version.txt';
const DEFAULT_APP='https://dinhloi116-hue.github.io/image-studio/direct/';
const tool=document.getElementById('tool'), ver=document.getElementById('version'), notice=document.getElementById('notice'), header=document.querySelector('header');
let meta={pages_url:DEFAULT_APP,tool_version:'latest'};
function fitFrame(){
  const hh=Math.ceil(header?.getBoundingClientRect().height||48);
  const nh=notice&&!notice.classList.contains('hidden')?Math.ceil(notice.getBoundingClientRect().height||0):0;
  const top=hh+nh;
  const h=Math.max(240,window.innerHeight-top);
  document.documentElement.style.setProperty('--header-h',hh+'px');
  document.documentElement.style.setProperty('--frame-top',top+'px');
  // iframe is a replaced element: set a real pixel height as well as the CSS calc.
  tool.style.top=top+'px';
  tool.style.height=h+'px';
  tool.style.maxHeight=h+'px';
}
function msg(t,kind=''){
  notice.textContent=t;notice.className='notice'+(kind?' '+kind:'');fitFrame();
  clearTimeout(msg._t);msg._t=setTimeout(()=>{notice.classList.add('hidden');fitFrame()},6000);
}
function appUrl(force=false){const base=meta.pages_url||DEFAULT_APP;const u=new URL(base);u.searchParams.set('from','chrome-extension');u.searchParams.set('v',meta.tool_version||Date.now());if(force)u.searchParams.set('_',Date.now());return u.href}
async function getMeta(){
  try{
    const r=await fetch(UPDATE_URL+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);meta=await r.json();
    try{const vr=await fetch(VERSION_URL+'?t='+Date.now(),{cache:'no-store'});if(vr.ok)meta.tool_version=(await vr.text()).trim()}catch(_){}
    ver.textContent=`Git: ${meta.tool_version||'latest'} • Extension ${chrome.runtime.getManifest().version}`;
    await chrome.storage.local.set({lastRemote:meta,lastCheck:Date.now()});return true;
  }catch(e){
    try{const r=await fetch(VERSION_URL+'?t='+Date.now(),{cache:'no-store'});if(r.ok){meta.tool_version=(await r.text()).trim();ver.textContent='Git: '+meta.tool_version;return true}}catch(_){}
    ver.textContent='Không kiểm tra được GitHub';msg('Không kiểm tra được GitHub. Đang mở bản URL hiện tại.','err');return false;
  }
}
async function load(force=false){fitFrame();await getMeta();tool.src=appUrl(force);fitFrame()}
document.getElementById('refresh').onclick=()=>{tool.src=appUrl(true);msg('Đã làm mới giao diện.','ok')};
document.getElementById('update').onclick=async()=>{msg('Đang lấy version mới nhất từ GitHub...');await getMeta();tool.src=appUrl(true);msg('Đã nạp lại bản Git mới nhất: '+(meta.tool_version||'latest'),'ok')};
document.getElementById('external').onclick=()=>chrome.tabs.create({url:appUrl(true)});
tool.addEventListener('load',()=>{if(tool.src)msg('Image Studio đã tải xong.','ok')});
window.addEventListener('resize',fitFrame);
if('ResizeObserver' in window){new ResizeObserver(fitFrame).observe(header)}
fitFrame();
load(new URL(location.href).searchParams.has('forceUpdate'));
