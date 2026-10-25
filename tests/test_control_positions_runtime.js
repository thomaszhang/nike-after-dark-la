"use strict";
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8');

test('progress dot follows actual padded chart geometry at start, middle and end', () => {
  const node = () => ({style:{}, attrs:{}, classList:{toggle(){}}, toggleAttribute(k,v){this.attrs[k]=v;}, setAttribute(k,v){this.attrs[k]=v;}});
  const els = {'elevation-progress':node(), 'elevation-cursor':node(),
    'elevation-chart':{getBoundingClientRect:()=>({left:24,top:713,width:342,height:31})},
    'elevation-profile':{clientLeft:1,clientTop:1,getBoundingClientRect:()=>({left:12,top:702})}};
  const fn = source.slice(source.indexOf('  function renderElevationProgress('), source.indexOf('  const previewDirectionIcon'));
  const context = vm.createContext({els, elevationScale:{minimum:0,range:100}, totalMeters:1000,
    elevation:{samples:[],elevationAtDistance:()=>50}});
  vm.runInContext(fn,context);
  for (const [distance,x] of [[0,11],[500,182],[1000,353]]) {
    context.distance=distance;
    vm.runInContext('renderElevationProgress(distance,true)',context);
    assert.equal(els['elevation-progress'].style.left,`${x}px`);
    assert.ok(Math.abs(parseFloat(els['elevation-progress'].style.top)-(10+15*31/30))<0.01);
    assert.equal(els['elevation-progress'].attrs.hidden,false);
  }
  vm.runInContext('renderElevationProgress(NaN)',context);
  assert.equal(els['elevation-progress'].attrs.hidden,true);
});

test('course fit measures top and bottom controls instead of their former offsets', () => {
  const fn=source.slice(source.indexOf('  function courseViewPadding()'),source.indexOf('  const updateControlGeometry'));
  const context=vm.createContext({window:{innerHeight:844},document:{
    querySelector:selector=>({getBoundingClientRect:()=>selector === ".progress-card" ? {top:780} : {bottom:290}}),
    getElementById:()=>({getBoundingClientRect:()=>({top:780})})}});
  vm.runInContext(fn,context);
  assert.equal(JSON.stringify(vm.runInContext('courseViewPadding()',context)),JSON.stringify({paddingTopLeft:[20,302],paddingBottomRight:[20,76]}));
});

test('taller portrait and landscape charts retain cursor/dot/distance agreement', () => {
  const node=()=>({style:{},classList:{toggle(){}},toggleAttribute(){},attrs:{},setAttribute(k,v){this.attrs[k]=v}});
  const fn=source.slice(source.indexOf('  function renderElevationProgress('),source.indexOf('  const previewDirectionIcon'));
  for(const height of [54,46]) {
    const els={'elevation-progress':node(),'elevation-cursor':node(),'elevation-chart':{getBoundingClientRect:()=>({left:24,top:705,width:280,height})},'elevation-profile':{clientLeft:0,clientTop:0,getBoundingClientRect:()=>({left:24,top:700})}};
    const c=vm.createContext({els,totalMeters:21400,elevationScale:{minimum:0,range:100},elevation:{samples:[],elevationAtDistance:()=>50}});vm.runInContext(fn,c);
    for(const fraction of [0,.25,.5,1]){
      c.along=21400*fraction;vm.runInContext('renderElevationProgress(along,true)',c);
      assert.equal(parseFloat(els['elevation-progress'].style.left),280*fraction);
      assert.equal(Number(els['elevation-cursor'].attrs.x1),220*fraction);
      assert.equal(parseFloat(els['elevation-progress'].style.top),5+height/2);
    }
  }
});
test('isolated viewport measurements leave fit space clear of whole cards and safe insets',()=>{
  const fn=source.slice(source.indexOf('  function courseViewPadding()'),source.indexOf('  const updateControlGeometry'));
  // Explicit geometry fixtures, not browser measurements or physical iPhone screenshots.
  for(const [width,height,top,bottom] of [[320,568,198,416],[390,844,200,680],[844,390,162,258],[568,320,154,198]]){
    const c=vm.createContext({window:{innerHeight:height},document:{querySelector:s=>({getBoundingClientRect:()=>s==='.progress-card'?{top:bottom}:{bottom:top}})}});vm.runInContext(fn,c);
    const p=vm.runInContext('courseViewPadding()',c);
    assert.equal(p.paddingTopLeft[1],top+12);assert.equal(p.paddingBottomRight[1],height-bottom+12);
    assert.ok(height-p.paddingTopLeft[1]-p.paddingBottomRight[1]>0,`${width}x${height}`);
  }
});
