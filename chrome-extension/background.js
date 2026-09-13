const TOOL=chrome.runtime.getURL('tool.html');
chrome.action.onClicked.addListener(async()=>{
  const tabs=await chrome.tabs.query({});
  const found=tabs.find(t=>t.url&&t.url.startsWith(TOOL));
  if(found){await chrome.tabs.update(found.id,{active:true});if(found.windowId)await chrome.windows.update(found.windowId,{focused:true});}
  else await chrome.tabs.create({url:TOOL});
});
