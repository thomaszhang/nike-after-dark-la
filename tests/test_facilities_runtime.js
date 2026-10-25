"use strict";
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'course-facilities.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'route-data.js'), 'utf8'), context);

test('real facility creation makes eight sourced pins, venue details and a working layer toggle', () => {
  const points = context.window.NIKE_ROUTE.points.map(([lon, lat]) => ({lon, lat}));
  const R = 6371008.8, rad = x => x * Math.PI / 180;
  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i-1], b = points[i];
    const h = Math.sin(rad(b.lat-a.lat)/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(rad(b.lon-a.lon)/2)**2;
    cumulative.push(cumulative.at(-1) + 2*R*Math.asin(Math.sqrt(h)));
  }
  let visible = true, change;
  const markers = [];
  const map = {removeLayer(){visible=false;}};
  const L = {layerGroup:()=>({addTo(){visible=true;return this;}}),divIcon:x=>x,
    marker:(latlng, options)=>{const m={latlng,options,addTo(){markers.push(this);return this;},bindPopup(html){this.html=html;return this;}};return m;}};
  const env = {window:context.window,L,map,route:context.window.NIKE_ROUTE,points,cumulative,totalMeters:cumulative.at(-1),label:()=>({}),document:{getElementById:()=>({addEventListener:(name,fn)=>{change=fn;}})}};
  vm.createContext(env);
  vm.runInContext(source.slice(source.indexOf('  function pointAtCourse'),source.indexOf('  function bearingBetween')),env);
  vm.runInContext(source.slice(source.indexOf('  const facilities ='),source.indexOf('  const headingPane =')),env);
  assert.equal(markers.length,10);
  const aids=markers.slice(0,8);
  aids.forEach((m,i)=>{
    assert.match(m.html,new RegExp(`Aid ${i+1} · mile`));
    assert.match(m.html,/Approximate/);
    assert.match(m.html,/Restroom at this stop: not confirmed/);
    assert(m.latlng[0]>33.79&&m.latlng[0]<33.89);
    assert(m.latlng[1]>-118.42&&m.latlng[1]<-118.37);
  });
  assert.match(aids[4].html,/SIS gel/);
  assert.match(markers[8].html,/not an exact toilet location/);
  assert.match(markers[9].html,/Post-finish water/);
  change({target:{checked:false}});assert.equal(visible,false);
  change({target:{checked:true}});assert.equal(visible,true);
});
