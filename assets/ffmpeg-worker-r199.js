let ffmpeg=null;
function post(id,type,data,trans){ self.postMessage({id,type,data},trans||[]); }
self.onmessage=async ({data:{id,type,data}})=>{
  try{
    if(type==='load'){
      if(!ffmpeg){
        importScripts(data.coreURL);
        if(typeof self.createFFmpegCore!=='function') throw new Error('Không tải được FFmpeg core');
        const payload=btoa(JSON.stringify({wasmURL:data.wasmURL,workerURL:data.workerURL||''}));
        ffmpeg=await self.createFFmpegCore({mainScriptUrlOrBlob:`${data.coreURL}#${payload}`});
        ffmpeg.setLogger?.((d)=>post(0,'log',d));
        ffmpeg.setProgress?.((d)=>post(0,'progress',d));
      }
      post(id,'load',true);return;
    }
    if(!ffmpeg) throw new Error('FFmpeg chưa sẵn sàng');
    if(type==='write'){
      ffmpeg.FS.writeFile(data.path,data.bytes);
      post(id,'write',true);return;
    }
    if(type==='read'){
      const out=ffmpeg.FS.readFile(data.path);
      post(id,'read',out,[out.buffer]);return;
    }
    if(type==='delete'){
      try{ffmpeg.FS.unlink(data.path)}catch(_){}
      post(id,'delete',true);return;
    }
    if(type==='exec'){
      ffmpeg.setTimeout?.(data.timeout??-1);
      ffmpeg.exec(...data.args);
      const ret=ffmpeg.ret;
      ffmpeg.reset?.();
      post(id,'exec',ret);return;
    }
    throw new Error('Lệnh FFmpeg không hỗ trợ: '+type);
  }catch(e){post(id,'error',String(e&&e.message?e.message:e));}
};
