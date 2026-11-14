#!/usr/bin/env node
/* Dependency-free regression tests for Xiaomi patch crop + automatic tone. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const root=require('node:path').resolve(__dirname,'../batch-editor');
let source=null;
const fakeDoc={createElement(type){
  assert.equal(type,'canvas');
  const canvas={width:0,height:0};
  canvas.getContext=()=>({
    drawImage(img){source=img;},
    getImageData(){
      const data=new Uint8ClampedArray(canvas.width*canvas.height*4);
      for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
        const xx=Math.round((x+.5)*source.width/canvas.width),
          yy=Math.round((y+.5)*source.height/canvas.height);
        data.set(source.pixel(xx,yy),(y*canvas.width+x)*4);
      }
      return {data};
    }
  });
  return canvas;
}};
const sandbox={window:{},document:fakeDoc,Uint8Array,Uint8ClampedArray,Uint32Array,
  Math,Number,Error,Array,JSON};
for(const name of ['patch-ruler.js','auto-tone.js'])
  vm.runInNewContext(fs.readFileSync(require('node:path').join(root,name),'utf8'),sandbox,
    {filename:name});
const patch=sandbox.window.DHLPatchCrop,auto=sandbox.window.DHLAutoTone;
const scene={width:1000,height:1333,pixel(x,y){
  if(y>=1168)return [255,231,174,255];
  if(x<116&&y<1020)return [44,43,41,255];
  if(y>=1060&&x>156)return [155,152,150,255];
  if(x>=160&&x<=387&&y>=704&&y<=1015)return [221,184,86,255];
  if(x%42===0||y%42===0)return [18,215,212,255];
  return [1,140,111,255];
}};
const result=patch.analyze(scene,{cropPatchKeepLeft:true,cropPatchKeepBottom:true,
  cropPatchRemoveCaption:true,cropRatio:'1:1'});
assert.equal(result.needsReview,false,JSON.stringify(result));
assert.equal(result.features.left,true);
assert.equal(result.features.bottom,true);
assert.equal(result.features.caption,true);
const r=result.rect;
const x=r.x*scene.width,y=r.y*scene.height,
  w=r.w*scene.width,h=r.h*scene.height;
assert.ok(Math.abs(w-h)<3,'crop must be 1:1');
assert.ok(x<116,'left ruler must remain');
assert.ok(y+h>1060,'bottom ruler must remain');
assert.ok(y+h<1168,'Chinese banner must be excluded');
assert.ok(x<=160&&x+w>=387&&y<=704&&y+h>=1015,'patch must remain complete');
assert.ok(w>=520&&w<=660,'patch should be enlarged like reference, not tiny');
const cases=[
  {name:'bright',pixel:i=>i%10<2?[254,253,250,255]:i%10<5?[240,236,230,255]:[199,190,183,255],want:'overbright'},
  {name:'dark',pixel:i=>i%5<3?[41,45,50,255]:[96,98,93,255],want:'dark'},
  {name:'balanced',pixel:i=>i%3===0?[74,133,117,255]:i%3===1?[139,159,150,255]:[210,203,188,255],want:'balanced'}
];
for(const item of cases){
  const image={width:240,height:240,pixel:(x,y)=>item.pixel(x+y*240)};
  const analysis=auto.analyze(image);
  assert.equal(analysis.scene,item.want,item.name);
  const applied=auto.adaptiveConfig({autoTone:true,exposure:.09,brightness:12,
    toneHighlights:65,toneShadows:28,toneClarity:28},analysis);
  if(item.want==='overbright')assert.ok(applied.exposure<0);
  if(item.want==='dark')assert.ok(applied.exposure>0);
}
console.log('PASS: square crop preserves patch + rulers, strips caption; auto tone dark/bright/normal.');