"use strict";
const test=require('node:test'), assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
function fixture(permission='denied') {
  const element=()=>({dataset:{},attrs:{},textContent:'',setAttribute(k,v){this.attrs[k]=v},addEventListener(){}});
  const els=Object.fromEntries(['map-mode','mode-label','direction-label','direction-detail','heading-source','location-error'].map(k=>[k,element()]));
  const calls={views:[],fits:[],permissions:0};
  const context=vm.createContext({els,calls,Number,Math,window:{addEventListener(){}},DeviceOrientationEvent:{requestPermission:async()=>{calls.permissions++;return permission}},
    map:{invalidateSize(){},setView(ll,z){calls.views.push({ll,z})},fitBounds(b,p){calls.fits.push(p)}},routeBounds:[],courseViewPadding:()=>({paddingTopLeft:[20,180],paddingBottomRight:[20,130]}),syncMapRotationOrigin(){},setMapRotationImmediately(){},renderNavigation(){updateLabel()},endCoursePreview(){},feet:m=>m*3.28084});
  function updateLabel(){vm.runInContext('updateControlAccessibility()',context)}
  vm.runInContext(`let previewDistance=null,fullRouteMode=false,following=true,locationDirectionMode=true,routeDirectionMode=true,mapViewMode='heading',manualMapRotation=null,currentFix=null,deviceHeading=null,liveSummary=null,orientationListening=false; function onOrientation(){};`,context);
  vm.runInContext(source.slice(source.indexOf('  function updateControlAccessibility()'),source.indexOf('  map.on("dragstart"')),context);
  return {context,calls,els,run:s=>vm.runInContext(s,context)};
}
test('cycle route → real centered north-up → heading → route; only heading requests orientation',async()=>{
  const f=fixture('granted');
  f.run('currentFix={lat:33.84,lon:-118.39};liveSummary={accuracy:8};showFullRoute()');
  await f.run('cycleMapMode()'); assert.equal(f.els['map-mode'].dataset.mode,'location');
  assert.equal(JSON.stringify(f.calls.views.at(-1).ll),JSON.stringify([33.84,-118.39]));assert.equal(f.calls.permissions,0);
  await f.run('cycleMapMode()');assert.equal(f.els['map-mode'].dataset.mode,'heading');assert.equal(f.calls.permissions,1);
  assert.match(f.els['map-mode'].attrs['aria-label'],/Heading unavailable/);assert.match(f.els['map-mode'].attrs['aria-label'],/Accuracy/);
  f.run('deviceHeading=90;updateControlAccessibility()');assert.doesNotMatch(f.els['map-mode'].attrs['aria-label'],/Heading unavailable/);
  await f.run('cycleMapMode()');assert.equal(f.els['map-mode'].dataset.mode,'route');assert.equal(f.calls.fits.length,2);
});
test('denied or missing location never fabricates a fix or a heading',async()=>{
  const f=fixture();f.run('showFullRoute()');await f.run('cycleMapMode()');await f.run('cycleMapMode()');
  assert.equal(f.calls.views.length,0);assert.equal(f.run('currentFix'),null);assert.equal(f.run('deviceHeading'),null);
  assert.match(f.els['map-mode'].attrs['aria-label'],/Waiting for location/);assert.match(f.els['map-mode'].attrs['aria-label'],/Heading unavailable/);
  const fn=source.slice(source.indexOf('  function locationError('),source.indexOf('  async function requestWakeLock'));
  vm.runInContext(fn,f.context);f.run('locationError({code:1})');assert.match(f.els['location-error'].textContent,/permission is off/);
});
test('manual pan stays paused and next press recenters same mode before cycling',async()=>{
  const f=fixture();f.run('currentFix={lat:33.84,lon:-118.39};following=false;mapViewMode="location";locationDirectionMode=false;updateControlAccessibility()');
  assert.match(f.els['mode-label'].textContent,/paused/);await f.run('cycleMapMode()');assert.equal(f.els['map-mode'].dataset.mode,'location');assert.equal(f.run('following'),true);assert.equal(f.calls.permissions,0);
  f.run('showFullRoute();following=false;setFullRouteMode(false)');await f.run('cycleMapMode()');assert.equal(f.els['map-mode'].dataset.mode,'route');
});
test('pan during pending orientation permission is not overridden',async()=>{
  const f=fixture();f.context.DeviceOrientationEvent.requestPermission=()=>new Promise(resolve=>{f.context.resolvePermission=resolve});
  f.run('locationDirectionMode=false;mapViewMode="location"');const pending=f.run('cycleMapMode()');
  f.run('following=false;setFullRouteMode(false)');f.context.resolvePermission('denied');await pending;
  assert.equal(f.run('following'),false);assert.match(f.els['mode-label'].textContent,/paused/);assert.equal(f.calls.views.length,0);
});

test('actual position update keeps manual pan paused, then fits Route on off-course transition',()=>{
  const f=fixture();
  Object.assign(f.context,{
    segmentMeters:()=>0,recentGpsHeading:()=>null,normalizeHeading:x=>x,bearingBetween:()=>0,
    selectCoursePosition:()=>f.context.nearest,
    signedHeading:x=>x,smoothHeading:(a,b)=>b,miles:x=>x/1609.344,
    userDirectionIcon:{},refreshUserDirection(){},renderLiveSummary(){},refreshRouteChevrons(){},
    L:{marker:()=>({addTo(){return this},bindTooltip(){return this},setLatLng(){return this}}),circle:()=>({addTo(){return this},setLatLng(){return this},setRadius(){return this}}),circleMarker:()=>({addTo(){return this},setLatLng(){return this}})}
  });
  f.context.nearest={along:13000,distance:4,lat:33.84,lon:-118.39};
  vm.runInContext('let gpsHistory=[],currentNearest=null,currentSpeed=0,lastGpsHeadingAt=0,compassValue=null,lastCompassAt=0,userMarker=null,accuracyCircle=null,nearestMarker=null,pendingOffCourseRoute=false; const totalMeters=21400;',f.context);
  vm.runInContext(source.slice(source.indexOf('  function updatePosition('),source.indexOf('  function locationError(')),f.context);
  f.run('following=false;updatePosition({timestamp:10000,coords:{latitude:33.84,longitude:-118.39,accuracy:8,heading:null,speed:null}})');
  assert.equal(f.run('liveSummary.status'),'On course');assert.equal(f.run('liveSummary.progress'),13000);assert.equal(f.run('liveSummary.remaining'),8400);
  assert.equal(f.calls.views.length,0);assert.equal(f.run('following'),false);assert.equal(f.run('deviceHeading'),null);
  f.context.nearest.distance=150;
  f.run('updatePosition({timestamp:12000,coords:{latitude:33.84,longitude:-118.39,accuracy:8,heading:null,speed:null}})');
  assert.equal(f.run('liveSummary.status'),'Off course');assert.equal(f.run('fullRouteMode'),true);assert.equal(f.els['map-mode'].dataset.mode,'route');
});

test('actual profile preview updates metrics then restores live metrics, mode and saved view',()=>{
  const f=fixture();
  for(const id of ['distance','remaining','live-elevation','elevation-profile']) f.els[id]={textContent:'',setAttribute(){}};
  Object.assign(f.context,{
    totalMeters:21400,courseBearing:()=>60,elevation:{samples:[],elevationAtDistance:()=>20},
    displayedRoutePoint:()=>[33.84,-118.39],previewDirectionIcon:()=>({}),
    L:{marker:()=>({addTo(){return this}})},streetTiles:{off(){},once(){}},previewTilesReady(){},
    syncMapRotationOrigin(){},rotateMap(){},renderElevationProgress(){},summaryMiles:x=>(x/1609.344).toFixed(1)+' miles',miles:x=>x/1609.344,
    mapAngleSmoother:{getTarget:()=>-30},renderLiveSummary(){f.els.distance.textContent='8.1 miles';f.els.remaining.textContent='5.2 miles';f.els['live-elevation'].textContent='74 feet'}
  });
  Object.assign(f.context.map,{getCenter:()=>[33.84,-118.39],getZoom:()=>16,removeLayer(){}});
  f.run('let previewSavedView=null,previewMapRotation=null,previewSavedControls=null,previewMarker=null,previewTileAlong=null,pendingOffCourseRoute=false;currentFix={lat:33.84,lon:-118.39};');
  vm.runInContext(source.slice(source.indexOf('  function previewCourseAt('),source.indexOf('  function previewFromPointer(')),f.context);
  f.run('previewCourseAt(10700)');assert.equal(f.els.distance.textContent,'6.6 miles');assert.equal(f.els.remaining.textContent,'6.6 miles');assert.equal(f.els['live-elevation'].textContent,'66 feet');assert.equal(f.els['map-mode'].dataset.mode,'route');
  f.run('endCoursePreview()');assert.equal(f.els.distance.textContent,'8.1 miles');assert.equal(f.els['live-elevation'].textContent,'74 feet');assert.equal(f.els['map-mode'].dataset.mode,'heading');assert.equal(f.run('previewDistance'),null);assert.equal(f.run('following'),true);
});
