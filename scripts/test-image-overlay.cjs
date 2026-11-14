#!/usr/bin/env node
/* Node-only regression suite for browser-based layered logo overlays. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const engine=fs.readFileSync(path.resolve(__dirname,'../batch-editor/image-overlay.js'),'utf8');
const ui=fs.readFileSync(path.resolve(__dirname,'../batch-editor/image-overlay-ui.js'),'utf8');
const w={};
vm.runInNewContext(engine,{window:w,Math,Map});
assert.ok(w.DHLImageOverlay,'Overlay geometry must initialize');
assert.doesNotThrow(()=>new vm.Script(ui),'Controller script must parse');
const api=w.DHLImageOverlay;
const image={width:750,height:300};
const assets=new Map([['a',{image,name:'DHL Overlay.png'}]]);
const layer=api.make('a','layer-1',assets.get('a'));
assert.equal(layer.opacity,1,'New overlay must be fully visible');
assert.equal(layer.rotation,0);
const clone=api.duplicate(layer,'layer-2');
assert.notEqual(layer.id,clone.id);
assert.ok(clone.x>layer.x&&clone.y>layer.y,'Pasted overlays should be shifted');
clone.opacity=.35;
clone.rotation=-13;
const calls=[];
const ctx={
  save(){calls.push('save')},restore(){calls.push('restore')},
  translate(x,y){calls.push(['translate',x,y])},
  rotate(v){calls.push(['rotate',v])},
  drawImage(img,x,y,width,height){calls.push(['image',img===image,width,height])}
};
api.draw(ctx,1000,1000,[layer,clone],assets);
assert.equal(calls.filter(x=>Array.isArray(x)&&x[0]==='image').length,2);
const rect=api.rect(layer,assets.get('a'),1000,1000);
assert.ok(rect.w>200&&rect.h>0);
assert.equal(api.hit([layer],assets,{x:rect.x,y:rect.y},1000,1000).mode,'move');
assert.equal(api.hit([layer],assets,{x:900,y:950},1000,1000),null);
const cor=api.corners(layer,assets.get('a'),1000,1000)[0];
assert.equal(api.hit([layer],assets,cor,1000,1000).mode,'resize');
const ro=api.rotateHandle?.(layer,assets.get('a'),1000,1000);
if(ro)assert.equal(api.hit([layer],assets,ro,1000,1000).mode,'rotate');
console.log('PASS: overlay default 100%, multi-layer draw, copy/paste, rotation and hit testing.');