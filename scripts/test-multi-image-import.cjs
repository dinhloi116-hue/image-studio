#!/usr/bin/env node
/* Regression test: 3 distinct overlays in one picker + adding again + global scope. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.resolve(__dirname,'../batch-editor');
class Element {
  constructor(tag='div'){
    this.tagName=tag.toUpperCase();this.value='';this.checked=false;this.disabled=false;
    this.children=[];this.handlers={};this.style={};this.className='';
    this.classList={toggle(){}};this.width=400;this.height=400;
  }
  addEventListener(name,fn){this.handlers[name]=fn;}
  appendChild(child){this.children.push(child);return child;}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=[...children];}
  setAttribute(name,value){this[name]=value;}
  getBoundingClientRect(){return {left:0,top:0,width:400,height:400};}
  getContext(){
    const imageCtx={
      save(){},restore(){},translate(){},rotate(){},drawImage(){},clearRect(){},
      stroke(){},fill(){},setLineDash(){},beginPath(){},moveTo(){},lineTo(){},
      closePath(){},arc(){},lineWidth:1
    };
    return imageCtx;
  }
  toDataURL(){return 'data:image/png;base64,ZmFrZQ==';}
}
const ids=new Map();
const get=id=>{if(!ids.has(id))ids.set(id,new Element(id==='overlayFile'?'input':'div'));return ids.get(id);};
const doc={
  getElementById:get,
  createElement:tag=>new Element(tag),
  addEventListener(){},
  activeElement:null
};
get('overlayEnabled').checked=true;
const win={addEventListener(){}};
const context={window:win,document:doc,Blob,Map,Math,Array,Error,Number,String,
  console,Uint8Array,setTimeout};
for(const moduleName of ['image-overlay.js','image-overlay-ui.js']){
  vm.runInNewContext(fs.readFileSync(path.join(base,moduleName),'utf8'),context,
    {filename:moduleName});
}
const file={name:'target.jpg'};
let decoded=0,renderScheduled=0;
const bridge={
  getFile:()=>file,
  decode:async blob=>{decoded++;assert.ok(blob.size>0);return {width:400,height:300};},
  schedulePreview:()=>{renderScheduled++;}
};
win.DHLOverlayUI.init(bridge);
function selected(name,type){
  return {name,type,arrayBuffer:async()=>new Uint8Array([1,2,3,4]).buffer};
}
async function choose(files){
  const picker=get('overlayFile');
  picker.files=files;picker.value='selected';
  await picker.handlers.change({target:picker});
  assert.equal(picker.value,'','picker reset only after all files were read');
}
function draws(photo=file){
  const list=[];
  const ctx={
    save(){},restore(){},translate(x,y){list.push([x,y]);},rotate(){},
    drawImage(){},imageSmoothingEnabled:true
  };
  win.DHLOverlayUI.draw(ctx,1000,1000,photo);
  return list;
}
(async()=>{
  await choose([selected('first.png','image/png'),selected('second.jpg','image/jpeg'),
    selected('third.webp','image/webp')]);
  assert.equal(decoded,3);
  assert.equal(draws().length,3,'all three logos must appear on one photo');
  assert.equal(get('overlayLayerGallery').children.length,3,'all logo thumbnails visible');
  assert.equal(get('overlayLayerCount').textContent,'3 lớp');
  assert.equal(new Set(draws().map(x=>x.join(','))).size,3,'logos should not overlap on import');
  await choose([selected('fourth.png','image/png')]);
  assert.equal(draws().length,4,'a second selection must append, not replace');
  assert.equal(get('overlayLayerGallery').children.length,4);
  get('overlayApplyAll').checked=true;
  await choose([selected('global.png','image/png')]);
  assert.equal(draws().length,5);
  assert.equal(draws({name:'different-target'}).length,1,'batch overlay scope works');
  const cards=get('overlayLayerGallery').children;
  cards[0].handlers.click();
  assert.equal(get('overlayLayerCount').textContent,'5 lớp');
  assert.ok(renderScheduled>=3,'render must be updated after uploads');
  console.log('PASS: 3 distinct overlays at once, add fourth separately, scopes, thumbnails, Xiaomi-safe picker lifetime.');
})().catch(error=>{console.error(error);process.exitCode=1;});