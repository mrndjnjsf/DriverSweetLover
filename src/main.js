import { APPEARANCES } from './config/appearance.js';
import { controlSettings, CONTROL_OPTIONS } from './control-tuning.js';
import { createNavigationRouter } from './navigation.js';
const navigate=createNavigationRouter();
let navigationPoints=[];
import { configurePedals } from './career.js';
import { fullCarReset, unlockFullResets } from './career.js';
import { resetsRemaining, donationUrl } from './reset-access.js';
import { createGraffitiView } from './presentation/graffiti-view.js';
import { createActivityMarket, advanceActivityMarket, consumeActivityOffer, activitySummary } from './activity-market.js';
import { activeVehicle, driverAvailable } from './fleet.js';
import { FLEET } from './config/fleet.js';
import { createFleetPhoneView } from './fleet-phone-view.js';
import { createFleetPreview } from './development-fixtures.js';
import { buyVehicle, assignDriver, reclaimDriverCar, fundDriverReserve, advanceFleet, recordDriverWin, setVehicleAppearance } from './career.js';
import { acceptRival, declineRival, startRivalRace, settleRivalRace } from './rival.js';
import { createLifeSession, advanceLifeSession, resetLifeLocations } from './life-session.js';
import { RIVAL } from './config/rival.js';
import { createRivalView } from './presentation/rival-view.js';
import { cityProjects, cityEffects, cityProjectPoint } from './city-projects.js';
import { donateToCity } from './career.js';
import { createCityPhoneView } from './city-phone-view.js';
import { createCityProjectView } from './presentation/city-project-view.js';
import { createSpeedCameras, updateSpeedCameras } from './speed-cameras.js';
import { createParkingSites, advanceParking, parkingCondition } from './parking.js';
import { bathroomQuote } from './needs.js';
import { NEEDS } from './config/life.js';
import { purchaseBathroom } from './career.js';
import { createParkingView } from './presentation/parking-view.js';
import { resolveParkedContact } from './parked-contact.js';
import { WORLD, CAMERA, RUNTIME, SHIFTER } from "./config/gameplay.js";
import { createDrivingHud } from "./driving-hud.js";
import { drivingAdvice } from './driving-coach.js';
import { createCoachHint, advanceCoachHint } from './coach-hint.js';
const coachHint=createCoachHint();
import { selectAutomaticRange } from './automatic-transmission.js';
import { createIntro, createIntroCareer, advanceIntro, introAdvice, replacementCareer, shouldPlayFirstDrive } from './intro.js';
import { developmentToolsAvailable } from './development-mode.js';
import { chooseStarter } from './career.js';
import { createVehicleView } from './presentation/vehicle-view.js';
import * as THREE from '../vendor/three.module.js';
import {cars,createState,start,step,clamp} from './physics.js';
import {neutralPosition,positionForGear,readStick,throwLever} from './shifter.js';
import {createMouseShifter,moveMouseShifter,mouseShifterDisplay,mouseEdgeDirections} from './mouse-shifter.js';
import {rumbleLevels} from './feedback.js';
import {createGridMap,gridPoint,importGridMap,nearestRoadPoint,roadOpen,findRoute} from './grid-map.js';
import {createGridWorld} from './grid-world.js';
import {createTrafficSystem,setTrafficMap,updateTraffic} from './traffic.js';
import {createTrafficView} from './traffic-view.js';
import {createRoadEventSystem,setRoadEventMap,updateRoadEvents,findRoadEventImpact} from './road-events.js';
import {createRoadEventView} from './road-events-view.js';
import {createPoliceSystem,setPoliceMap,updatePolice} from './police.js';
import {createPoliceView} from './police-view.js';
import {findDragCourse,createDragRace,stageRace,updateDragRace} from './drag-race.js';
import {createDragRaceView} from './drag-race-view.js';
import {createPerformanceMonitor} from './performance-monitor.js';
import {frameDue,scenePixelRatio,simulationDeltaSeconds} from './render-budget.js';
import {tachPercent} from './tachometer.js';
import {createMapEditor,MAP_STORAGE_KEY} from './map-editor.js';
import {engineTone} from './engine-audio.js';
import {torqueCameraPull,easeCameraPull} from './camera-response.js';
import {createClutchInput,toggleClutchInput,readClutchInput} from './clutch-input.js';
import {advanceKeyboardClutch} from './keyboard-clutch.js';
import {advanceKeyboardThrottle} from './keyboard-throttle.js';
import {PART_KEYS,createVehicleCondition,applyDrivingWear,clutchFrictionWork,applyImpactDamage,conditionSummary,getServiceQuote,performanceModifiers} from './condition.js';
import {MIN_SHIFT_CLUTCH} from './clutch-model.js';
import {changeGearWithWear} from './gear-change.js';
import {fuelCapacity,fuelFillQuote} from './fuel.js';
import {findTrafficImpact} from './collision.js';
import {advanceToHour,cityHour,daylightAt,formatCityTime} from './time-of-day.js';
import {createCareer,loadCareer,saveCareer,switchVehicle,setVehicleCondition,createDeliveryOffer,acceptDelivery,pickupDelivery,completeDelivery,purchaseService,purchaseFuel,applyFine,awardDragWin,DRAG_WIN_PAYOUT_CENTS} from './career.js';

import { createPhoneView } from './phone-view.js';
import { trackedObjective } from './objective.js';

const $=id=>document.getElementById(id);
const phoneView=createPhoneView(document);
const setTextIfChanged=(element,value)=>{value=String(value);if(element.textContent!==value)element.textContent=value;};
const renderDrivingHud=createDrivingHud(document);
let intro=null,introOriginalCareer=null,introImpactView=null;
const introKey='driver-sweet-lover:intro-complete:v1';
const developmentMode=developmentToolsAvailable(location);
const testDrivingMustang=()=>intro?.phase==='test-drive';
const playingIntro=()=>Boolean(intro)&&!testDrivingMustang();
for(const id of ['dev-mustang','mustang-test-drive'])$(id).hidden=!developmentMode;
const profileParams=new URLSearchParams(location.search);
const profileEnabled=profileParams.has('profile');
const sandboxMode=profileParams.has('sandbox');
const profileSpeed=profileEnabled&&profileParams.has('speed')?Math.max(0,Math.min(80,Number(profileParams.get('speed')))):null;
const profileNoBlur=profileEnabled&&profileParams.has('noBlur');
const profileNoShadows=profileEnabled&&profileParams.has('noShadows');
const profileNoLocalLights=profileEnabled&&profileParams.has('noLocalLights');
const profileNoStreetLights=profileEnabled&&profileParams.has('noStreetLights');
const profileNoHeadlights=profileEnabled&&profileParams.has('noHeadlights');
const profileDpr=profileEnabled&&Number.isFinite(Number(profileParams.get('dpr')))&&profileParams.has('dpr')?Math.max(.5,Math.min(2,Number(profileParams.get('dpr')))):null;
const performanceMonitor=profileEnabled?createPerformanceMonitor():null;
const renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true});
renderer.setPixelRatio(profileDpr??scenePixelRatio(innerWidth,innerHeight,devicePixelRatio));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=!profileNoShadows;
renderer.shadowMap.type=THREE.PCFShadowMap;
const scene=new THREE.Scene(),skyColor=new THREE.Color(0xcbdbe0);scene.background=skyColor;scene.fog=new THREE.Fog(0xcbdbe0,95,255);
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,700);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const touchLayout=matchMedia('(pointer: coarse) and (max-width: 900px)');
let cameraView='chase';
let cameraPull=0;
const cameraOffset=new THREE.Vector3(...CAMERA.poses.chase);
const targetOffset=new THREE.Vector3(),cameraLook=new THREE.Vector3();
const views={12:'hood',13:'chase',14:'left',15:'right'};
function setCameraView(view){cameraView=view;notify(`Camera · ${view}`);}
const blurSize=(width,height)=>{const scale=Math.min(1,scenePixelRatio(width,height,1));return [Math.max(1,Math.round(width*scale)),Math.max(1,Math.round(height*scale))];};
const [initialBlurWidth,initialBlurHeight]=blurSize(innerWidth,innerHeight);
const blurTarget=new THREE.WebGLRenderTarget(initialBlurWidth,initialBlurHeight,{depthBuffer:true});
const blurMaterial=new THREE.ShaderMaterial({
 uniforms:{tWorld:{value:blurTarget.texture},strength:{value:0}},
 depthTest:false,depthWrite:false,
 vertexShader:'varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.0,1.0);}',
 fragmentShader:`uniform sampler2D tWorld; uniform float strength; varying vec2 vUv;
 void main(){vec2 fromCenter=vUv-vec2(.5,.57); vec2 travel=fromCenter*strength;
 vec3 color=vec3(0.0); float weight=0.0;
 for(int i=0;i<5;i++){float t=float(i)/4.0; float w=1.0-abs(t-.5)*.8;
 vec2 uv=clamp(vUv-travel*t,vec2(0.001),vec2(.999));color+=texture2D(tWorld,uv).rgb*w;weight+=w;}
 gl_FragColor=vec4(color/weight,1.0);
 #include <colorspace_fragment>
 }`
});
const blurScene=new THREE.Scene(),blurCamera=new THREE.Camera();
blurScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),blurMaterial));
const ambient=new THREE.HemisphereLight(0xffffff,0x779877,2.1);scene.add(ambient);
const sun=new THREE.DirectionalLight(0xfff4d9,2.4);sun.position.set(-35,80,45);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45;scene.add(sun);
const daySky=new THREE.Color(0xcbdbe0),nightSky=new THREE.Color(0x182536),daySun=new THREE.Color(0xfff4d9),nightSun=new THREE.Color(0x94add5);
const headlightRig=new THREE.Group();scene.add(headlightRig);
const headlightBeam=new THREE.SpotLight(0xffe9bd,0,70,Math.PI/5,.6,1.25);
headlightBeam.position.set(0,.88,-1.75);headlightBeam.target.position.set(0,-.25,-17);headlightRig.add(headlightBeam,headlightBeam.target);
const nearbyStreetLight=new THREE.PointLight(0xffd69c,0,34,1.7);scene.add(nearbyStreetLight);
let streetLightGridKey='';
let map=createGridMap();
try{const saved=profileEnabled||sandboxMode?null:localStorage.getItem(MAP_STORAGE_KEY);if(saved){const parsed=importGridMap(saved);if(parsed.size===50)map=parsed;}}catch{}
const world=createGridWorld(scene,THREE,map);
const life=createLifeSession();
let parkingSites=createParkingSites(map),parkedCars=parkingSites.flatMap(site=>site.parkedCars),activeBathroomId='public-bathroom',needWarningShown=false;
const parkingView=createParkingView(THREE,scene);parkingView.build(parkingSites);
const parkedContacts=new Set();
const parkedOverlapScratch=[];
const trafficSystem=createTrafficSystem(map,{count:WORLD.trafficCount});
const trafficView=createTrafficView(scene,THREE,{maxVehicles:WORLD.trafficCount});
let trafficVehicles=[];
const roadEventSystem=createRoadEventSystem(map,{count:WORLD.roadEventCount});
const roadEventView=createRoadEventView(scene,THREE,{maxEvents:WORLD.roadEventCount});
let roadEvents=[];
const policeSystem=createPoliceSystem(map);
const policeView=createPoliceView(scene,THREE);
let officers=[];
let latestCitation=null;
let dragCourse=findDragCourse(map);
let dragRace=createDragRace(dragCourse);
const dragRaceView=createDragRaceView(scene,THREE);
let dragRaceId=null,dragOpponent='ghost',rivalPreviewUsed=false,respectTimer=null;
const rivalView=createRivalView(THREE,scene);
let raceTrafficClearUntil=0;
const rivalTimeForCar=key=>WORLD.rivalSeconds[key]??WORLD.rivalSeconds.eclipse;
const storage=(()=>{if(profileEnabled||sandboxMode){const entries=new Map();return {getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value)};}try{return window.localStorage;}catch{return {getItem:()=>null,setItem:()=>{}};}})();
const cityTimeKey='dsl-city-time-v1';
let cityElapsed=0;
try{const saved=Number(storage.getItem(cityTimeKey));if(Number.isFinite(saved)&&saved>=0&&saved<60*24*365)cityElapsed=saved;}catch{}
if(profileEnabled&&profileParams.has('night'))cityElapsed=advanceToHour(0,20);
const activityMarket=createActivityMarket(cityHour(cityElapsed));
let lastTimeLabel='';
function persistCityTime(){try{storage.setItem(cityTimeKey,String(cityElapsed));}catch{}}
function jumpDayNight(){if(dragRace?.phase==='countdown'||dragRace?.phase==='active'){notify('Finish the race before changing city time');return;}cityElapsed=advanceToHour(cityElapsed,daylightAt(cityHour(cityElapsed))>.3?20:9);advanceActivityMarket(activityMarket,0,cityHour(cityElapsed));persistCityTime();updateCareerHud();updateRaceHud();notify(`City time · ${formatCityTime(cityHour(cityElapsed))}`);}
$('time-button').onclick=jumpDayNight;
const loadedCareer=loadCareer(storage);
let career=loadedCareer.career,saveRecovered=loadedCareer.recovered;
if(sandboxMode&&profileParams.has('fleet'))career=createFleetPreview();
let fleetClock=0;
const fleetPhoneView=createFleetPhoneView(document,{
 names:Object.fromEntries(Object.entries(cars).map(([id,car])=>[id,car.name])),
 onSwitch:id=>useCar(id),
 onBuy:modelId=>{if(!nearLocation('garage')){notify('Stop at your Garage marker before buying a car');return;}const transactionId='car:'+crypto.randomUUID();if(commitFleet(c=>buyVehicle(c,modelId,transactionId)))useCar('owned:'+transactionId);},
 onAssign:(driverId,id)=>{if(commitFleet(c=>{const next=assignDriver(c,driverId,id);if(sandboxMode&&profileParams.has('fleet'))next.fleet.drivers[driverId].elapsedSeconds=FLEET.jobSeconds-1;return next;})){life.rival=declineRival(life.rival);if(navigationKind==='rival')navigationKind=null;updateRaceHud();updateCareerHud();}},
 onReclaim:id=>commitFleet(c=>reclaimDriverCar(c,id)),
 onReserve:id=>commitFleet(c=>fundDriverReserve(c,id,FLEET.reserveTopUpCents,'reserve:'+crypto.randomUUID())),
});
function commitFleet(command){if(saveRecovered||raceActive()){notify('Finish the race or recover the save first');return false;}try{career=command(career);persistCareer();updateCareerHud();notify('Garage / driver updated');return true;}catch(error){notify(error.message);updateCareerHud();return false;}}
let activeCityEffects=cityEffects(career),cityLedgerLength=-1,cameraSession=crypto.randomUUID(),speedCameras=createSpeedCameras(map);
const cityProjectView=createCityProjectView(THREE,scene);
const graffitiView=createGraffitiView(THREE,scene);
const renderCityPhone=createCityPhoneView(document,(id,amount)=>{
 if(saveRecovered)return;
 try{const before=cityEffects(career);career=donateToCity(career,id,amount,'donation:'+crypto.randomUUID());persistCareer();updateCareerHud();drawMiniMap();const after=cityEffects(career);notify(before.park!==after.park?'Community park opened · visit the city marker':before.improvedRoads!==after.improvedRoads?'Streets renewed · fewer debris hazards':before.cameras!==after.cameras?'City upgraded · speed cameras now active':'Donation received · thank you');}catch(error){notify(error.message);}
});
if(sandboxMode&&['eclipse','civic'].includes(profileParams.get('car'))){
 const modelId=profileParams.get('car');
 if(!career.starterChoiceMade)career=chooseStarter(career,modelId);
 else{const id=Object.keys(career.vehicles).find(id=>career.vehicles[id].vehicleId===modelId);if(id)career=switchVehicle(career,id);}
}
const vehicleView=createVehicleView(THREE);
const carGroup=vehicleView.root;scene.add(carGroup);
const failureFx=new THREE.Group();scene.add(failureFx);failureFx.visible=false;
const failureLight=new THREE.PointLight(0xff7226,0,7);failureLight.visible=false;scene.add(failureLight);
const particleGeo=new THREE.SphereGeometry(1,8,6);
const failureParticles=Array.from({length:38},(_,i)=>{
 const smoke=i>=16;
 const material=new THREE.MeshBasicMaterial({color:smoke?(i%3?0x555c58:0x393c3b):(i%3?0xffcf4e:0xff632d),transparent:true,opacity:0,depthWrite:false});
 const mesh=new THREE.Mesh(particleGeo,material);failureFx.add(mesh);
 return {mesh,smoke,delay:smoke?(i-16)*.035:i*.018,spread:Math.sin(i*12.73),drift:Math.cos(i*7.81)};
});
const flames=Array.from({length:4},(_,i)=>{
 const mesh=new THREE.Mesh(new THREE.ConeGeometry(i%2?.21:.29,1.25,7),new THREE.MeshBasicMaterial({color:i%2?0xffd64f:0xff5b21,transparent:true,opacity:.9,depthWrite:false,depthTest:false}));
 mesh.renderOrder=3;failureFx.add(mesh);return mesh;
});
let failureStart=0;
function updateFailureFx(now){
 if(!failureStart){failureFx.visible=false;failureLight.visible=false;return;}
 const age=(now-failureStart)/1000;
 failureFx.visible=age<4.4;
 failureFx.position.set(state.x,0,state.z);failureFx.rotation.y=state.heading;
 failureLight.position.set(state.x-Math.sin(state.heading)*.7,1.5,state.z-Math.cos(state.heading)*.7);
 failureLight.visible=age<2.2;
 failureLight.intensity=failureLight.visible?Math.max(0,2.8-age*.75)*(1+Math.sin(now*.035)*.2):0;
 for(const p of failureParticles){
  const t=age-p.delay,life=p.smoke?2.7:.9;
  const visible=t>=0&&t<life;
  p.mesh.visible=visible;
  if(!visible)continue;
  const progress=t/life;
  p.mesh.position.set(p.spread*(p.smoke?.23+t*.65:.12+t*.65),1.15+t*(p.smoke?1.25:1.5),-.6+p.drift*(p.smoke?.25+t*.38:.12+t*.2));
  const radius=(p.smoke?.32:.23)+t*(p.smoke?.45:.31);
  p.mesh.scale.set(radius,radius*(p.smoke?1.1:1.65),radius);
  p.mesh.material.opacity=(p.smoke?.57:.94)*Math.sin(Math.PI*progress);
 }
 for(let i=0;i<flames.length;i++){
  const flame=flames[i];flame.visible=age<2.35;
  if(!flame.visible)continue;
  const flicker=1+Math.sin(now*.023+i*2.2)*.2;
  flame.position.set((i-1.5)*.22,1.95+(i%2)*.08,-1.4+(i%2)*.18);
  flame.scale.set(flicker,Math.max(.3,1-age/2.8)*flicker,flicker);
  flame.material.opacity=.88*Math.min(1,(2.35-age)*2);
 }
}
function makeCar(key){
 const appearance=career.vehicleMeta[career.activeVehicleId].appearance;
 vehicleView.setVehicle(key,{appearance});
 $('appearance-select').value=appearance;
 $('rpm-fill').parentElement.style.setProperty('--redline-percent',`${tachPercent(cars[key].redline)}%`);
 document.querySelector('footer>span').textContent=cars[key].transmission==='automatic'?'AUTOMATIC · RT / SPACE GAS · LB / S / ALT BRAKE · LS / A D STEER · B REVERSE AT A STOP':'LT / CTRL CLUTCH · RT / SPACE GAS · RS / MOUSE SHIFTER · LS / A D STEER · LB / S / ALT BRAKE · B REVERSE · D-PAD CAMERA';
 document.body.classList.toggle('automatic-car',cars[key].transmission==='automatic');
}
let selected=activeVehicle(career).vehicleId,state=createState(),shifterPos=neutralPosition(),neutralX=0,neutralHoldUntil=0,centerDetentUntil=0,verticalRepeat=null,previousButtons=[],toastTimer=0,lastRunning=true,lastBlown=false,stickArmed=true;
dragRace=createDragRace(dragCourse,{rivalTimeSeconds:rivalTimeForCar(selected)});
state.roadMode='grid';
function placeAtSpawn(){if(sandboxMode&&profileParams.has('fleet')){const garage=map.locations.find(location=>location.kind==='garage');const point=gridPoint(map,garage.col,garage.row);state.x=point.x+3.6;state.z=point.z;return;}const practiceSite=sandboxMode?parkingSites.find(site=>site.id===profileParams.get('parking')):null;if(practiceSite){state.x=practiceSite.x;state.z=practiceSite.z;state.heading=practiceSite.heading;return;}const spawn=map.locations.find(location=>location.kind==='spawn');if(spawn){const point=gridPoint(map,spawn.col,spawn.row);state.x=point.x+map.roadWidth*.25;state.z=point.z+map.blockSize*.35;}}
placeAtSpawn();
let storedClutchMode='direct';try{storedClutchMode=storage.getItem('dsl-clutch-mode')||'direct';}catch{}
let controllerClutch=createClutchInput(storedClutchMode);
makeCar(selected);
document.querySelectorAll('.car').forEach(button=>button.classList.toggle('active',button.dataset.car===selected));
const editor=createMapEditor({map,storage,onChange(next){map=next;resetLifeLocations(life);speedCameras=createSpeedCameras(map);cameraSession=crypto.randomUUID();parkingSites=createParkingSites(map);parkedCars=parkingSites.flatMap(site=>site.parkedCars);life.parking.clear();parkedContacts.clear();parkingView.build(parkingSites);streetLightGridKey='';world.setMap(next);setTrafficMap(trafficSystem,next);setRoadEventMap(roadEventSystem,next);setPoliceMap(policeSystem,next);dragCourse=findDragCourse(next);dragRace=createDragRace(dragCourse,{rivalTimeSeconds:rivalTimeForCar(selected)});dragRaceId=null;updateCareerHud();updateRaceHud();},onClose(){keys.clear();}});
document.body.append(editor.element);
const gamePaused=()=>$('controls').open||$('shop-dialog').open||$('intro-replacement').open||$('starter-choice').open||!editor.element.hidden;
const money=cents=>(cents/100).toFixed(2);
const nodeId=(col,row)=>row*map.size+col;
const nodePoint=id=>gridPoint(map,id%map.size,Math.floor(id/map.size));
const atNode=id=>{const point=nodePoint(id);return Math.hypot(state.x-point.x,state.z-point.z)<17&&Math.abs(state.speed)<2.5;};
const nearLocation=kind=>{const stop=map.locations.find(location=>location.kind===kind);if(!stop)return false;const point=gridPoint(map,stop.col,stop.row);return Math.hypot(state.x-point.x,state.z-point.z)<19&&Math.abs(state.speed)<2;};
const destinationMarker=new THREE.Mesh(new THREE.ConeGeometry(1.1,2.6,6),new THREE.MeshBasicMaterial({color:0xffd36a,depthTest:false}));
destinationMarker.renderOrder=4;destinationMarker.visible=false;scene.add(destinationMarker);
const navigationMarker=new THREE.Mesh(new THREE.ConeGeometry(.85,2.1,6),new THREE.MeshBasicMaterial({color:0x58c489,depthTest:false}));
navigationMarker.renderOrder=4;navigationMarker.visible=false;scene.add(navigationMarker);
let navigationKind=null;
let wearClock=0,clutchWearWorkJ=0,saveClock=0,mapClock=0,saveErrorShown=false;
let emptyTankReported=false;
let cachedCondition=null,cachedCarKey='',cachedTunedCar=null;
function tunedCarFor(condition){
 if(condition===cachedCondition&&selected===cachedCarKey)return cachedTunedCar;
 const modifiers=performanceModifiers(condition),baseCar=cars[selected];
 const pedals=controlSettings(condition);
 cachedCondition=condition;cachedCarKey=selected;
 cachedTunedCar={...baseCar,pedals,engineInertia:baseCar.engineInertia/pedals.rpmResponse,peakTorque:baseCar.peakTorque*modifiers.enginePower,horsepower:baseCar.horsepower*modifiers.enginePower,traction:baseCar.traction*modifiers.tireGrip,clutchCapacity:modifiers.clutchCapacity,clutchBitePoint:modifiers.clutchBitePoint,brakeEffectiveness:modifiers.brakeEffectiveness};
 return cachedTunedCar;
}
function persistCareer(){
 if(saveRecovered||intro)return;
 try{saveCareer(storage,career);}catch(error){if(!saveErrorShown){notify(`Save unavailable: ${error.message}`);saveErrorShown=true;}}
}
function currentDestination(){
 const job=career.jobs.active;
 return job?job.status==='accepted'?job.pickupNodeId:job.dropoffNodeId:null;
}
function currentBathroom(){return parkingSites.find(site=>site.id===activeBathroomId&&site.service==='bathroom');}
function pickupParking(){const job=career.jobs.active;return parkingSites.find(site=>site.service==='delivery'&&(!job||nodeId(site.col,site.row)===job.pickupNodeId));}
function currentParkingSite(){return navigationKind==='bathroom'?currentBathroom():career.jobs.active?.status==='accepted'?pickupParking():parkingSites.find(site=>Math.hypot(site.x-state.x,site.z-state.z)<28);}
function updateLifeHud(){
 const percent=Math.round(life.needs.poop*100);
 setTextIfChanged($('need-percent'),percent+'%');setTextIfChanged($('dash-need'),'🚻 '+percent+'%');$('dash-need').classList.toggle('urgent',life.needs.poop>=NEEDS.warning);$('need-fill').style.width=percent+'%';
 $('need-meter').classList.toggle('urgent',life.needs.poop>=NEEDS.warning);
 const site=currentBathroom(),park=site?life.parking.get(site.id):null;
 const cost=site?bathroomQuote(site):0;
 setTextIfChanged($('bathroom-status'),site?site.label+' · '+(site.free?'FREE':'$'+money(cost))+' · '+(park?.message||'Drive to the turquoise bay'):'No bathroom available');
 $('bathroom-use').disabled=!site||!park?.ready||Boolean(parkingCondition(state,site.bay))||life.needs.poop<NEEDS.minimumUse||career.walletCents<cost||saveRecovered;
 const target=currentParkingSite(),status=target?life.parking.get(target.id):null;
 setTextIfChanged($('parking-status'),target?target.label+' · '+(status?.message||'Park inside the marked bay'):'');
 $('parking-status').hidden=!target;
 for(const button of document.querySelectorAll('[data-bathroom]')){
  const stop=parkingSites.find(item=>item.id===button.dataset.bathroom);
  button.disabled=!stop;
  if(stop){setTextIfChanged(button,stop.label+' · '+(stop.free?'FREE':'$'+money(bathroomQuote(stop)))+' · '+Math.round(Math.hypot(state.x-stop.x,state.z-stop.z))+' m');button.classList.toggle('active',stop.id===activeBathroomId);}
 }
}
function updateCareerHud(){
 for(const button of document.querySelectorAll('.car')){
  const ownedId=Object.keys(career.vehicles).find(id=>career.vehicles[id].vehicleId===button.dataset.car);
  button.hidden=!ownedId;button.dataset.ownedCar=ownedId||'';
 }
 fleetPhoneView.render(career,{atGarage:nearLocation('garage'),recovered:saveRecovered,raceActive:raceActive()});
 if(cityLedgerLength!==career.transactions.length){activeCityEffects=cityEffects(career);cityLedgerLength=career.transactions.length;}
 cityProjectView.set(map,activeCityEffects);graffitiView.set(map);world.setCityEffects(activeCityEffects);
 renderCityPhone(cityProjects(career).map(project=>({...project,unaffordable:saveRecovered||career.walletCents<Math.min(2500,project.targetCents-project.fundedCents)})));
 updateLifeHud();
 $('wallet').textContent=money(career.walletCents);
 const condition=conditionSummary(activeVehicle(career));
 const liters=activeVehicle(career).fuelLiters,capacity=fuelCapacity(selected),fuelPercent=Math.round(liters/capacity*100),quote=fuelFillQuote(selected,liters),atFuel=nearLocation('fuel');
 $('phone-clock').textContent=formatCityTime(cityHour(cityElapsed));
 $('dash-clock').textContent=formatCityTime(cityHour(cityElapsed));
 $('dash-car').textContent=cars[selected].name;
 const automatic=cars[selected].transmission==='automatic';
 setTextIfChanged($('vital-clutch').querySelector('span'),automatic?'TRANSMISSION':'CLUTCH');
 $('vital-clutch').setAttribute('aria-label',automatic?'TRANSMISSION':'CLUTCH');
 const vitals={fuel:fuelPercent/100,engine:condition.health.engine,oil:condition.oilCondition,clutch:automatic?condition.health.transmission:condition.health.clutch,brakes:Math.min(condition.health.brakePads,condition.health.brakeRotors),tires:condition.health.tires};
 for(const [key,value] of Object.entries(vitals)){
  const percent=Math.round(value*100),element=$('vital-'+key);
  setTextIfChanged($('vital-'+key+'-value'),percent+'%');
  $('vital-'+key+'-fill').style.width=percent+'%';
  element.classList.toggle('warning',value<=.4&&value>.15);
  element.classList.toggle('critical',value<=.15);
 }
 $('phone-fuel').textContent=`Fuel ${fuelPercent}% · ${liters.toFixed(1)} L`;
 $('phone-fuel').classList.toggle('low',fuelPercent<=15);
 $('fuel-detail').textContent=`${liters.toFixed(1)} / ${capacity} L · ${fuelPercent}% remaining`;
 $('fuel-fill').style.width=`${fuelPercent}%`;
 $('fuel-fill').parentElement.classList.toggle('low',fuelPercent<=15);
 $('fuel-location').textContent=atFuel?'At pump · stopped': 'Drive to the green F marker in Maps and stop';
 $('fuel-button').textContent=quote.liters?`FILL ${quote.liters.toFixed(1)} L · $${money(quote.totalCents)}`:'TANK FULL';
 $('fuel-button').disabled=!atFuel||!quote.liters||career.walletCents<quote.totalCents||saveRecovered;
 $('lube-location').textContent=nearLocation('shop')?'At Mini Lube · service available':'Drive to the blue service marker for repairs';
 const navStop=navigationKind==='rival'&&dragCourse?{...dragCourse.start,label:'Black-car race start'}:navigationKind==='park'?{...cityProjectPoint(map),label:'Community park'}:navigationKind==='bathroom'?currentBathroom():map.locations.find(location=>location.kind===navigationKind);
 if(navStop){const point=navStop.x!==undefined?navStop:gridPoint(map,navStop.col,navStop.row),distance=Math.round(Math.hypot(state.x-point.x,state.z-point.z));
  $('nav-status').textContent=`${['bathroom','park','rival'].includes(navigationKind)?navStop.label:navigationKind==='shop'?'Mini Lube':navigationKind==='fuel'?'Fuel station':'Garage'} · ${distance<19?'Arrived':`${distance} m away`}`;
  navigationMarker.position.set(point.x,3.4,point.z);navigationMarker.rotation.z=performance.now()*.001;navigationMarker.visible=true;
 }else{navigationMarker.visible=false;$('nav-status').textContent='Choose a stop to navigate.';}
 const power=Math.round(performanceModifiers(activeVehicle(career)).enginePower*100);
 $('condition-summary').textContent=`Engine ${Math.round(condition.health.engine*100)}% · Power ${power}% · Oil ${Math.round(condition.oilCondition*100)}% · Clutch ${Math.round(condition.health.clutch*100)}% · Bite ${Math.round(condition.clutchBitePoint*100)}% · Brakes ${Math.round(condition.health.brakePads*100)}% · Bumpers F${Math.round(condition.health.frontBumper*100)} / R${Math.round(condition.health.rearBumper*100)}%`;
 $('garage-condition').textContent=`${cars[selected].name} · engine ${Math.round(condition.health.engine*100)}% · clutch ${Math.round(condition.health.clutch*100)}% · bite ${Math.round(condition.clutchBitePoint*100)}% · fuel ${fuelPercent}%`;
 const remaining=resetsRemaining(career);
 $('garage-reset-button').textContent=remaining===Infinity?'FULL CAR RESET · UNLOCKED':remaining>0?`FULL CAR RESET · ${remaining} LEFT`:'FULL CAR RESET · LOCKED';
 $('garage-reset-button').disabled=remaining===0||Boolean(intro)||saveRecovered||raceActive();
 $('reset-allowance').textContent=remaining===Infinity?'Unlimited full resets unlocked.':`${remaining} of 3 starter resets remaining.`;
 $('reset-unlock').hidden=remaining===Infinity;
 $('condition-summary').classList.toggle('critical',condition.health.engine<.5);
 const nearbyEvent=roadEvents.filter(event=>event.caution).map(event=>({event,distance:Math.hypot(event.x-state.x,event.z-state.z)})).sort((a,b)=>a.distance-b.distance)[0];
 const eventNames={'stalled-car':'Stalled car','construction':'Roadwork','debris':'Debris','dog':'Dog near road','children':'Children near road'};
 $('road-alert').textContent=nearbyEvent?.distance<55?`${eventNames[nearbyEvent.event.type]} · ${Math.round(nearbyEvent.distance)} m away`:'Watch for road hazards.';
 $('police-status').textContent=latestCitation&&performance.now()-latestCitation.at<8500
  ?`${latestCitation.violation.reason} · $${money(latestCitation.violation.amountCents)} fine`
  :officers.some(officer=>Math.hypot(officer.x-state.x,officer.z-state.z)<85)?'POLICE NEARBY · 35 MPH LIMIT':'35 MPH CITY LIMIT';
 const job=career.jobs.active;
 const destination=currentDestination();
 const stopPoint=navStop?(navStop.x!==undefined?navStop:gridPoint(map,navStop.col,navStop.row)):null;
 const jobPoint=destination===null?null:job.status==='accepted'?(pickupParking()||nodePoint(destination)):nodePoint(destination);
 const objective=trackedObjective({job,destination:jobPoint,navigation:stopPoint?{...stopPoint,label:['bathroom','park','rival'].includes(navigationKind)?navStop.label:navigationKind==='shop'?'Visit Mini Lube':navigationKind==='fuel'?'Refuel':'Visit Garage'}:null,race:dragRace,raceProgress:raceProgress(),position:state});
 const gps=navigate(map,state,raceActive()?dragCourse?.finish:stopPoint||jobPoint);
 navigationPoints=gps.points;
 if(stopPoint||jobPoint){if(!raceActive())objective.detail=gps.detail;$('nav-status').textContent=objective.title+' · '+gps.detail;}
 phoneView.render(objective);
 if(sandboxMode){$('job-status').textContent='Healthy-car practice · no saves, wear, fines, or earnings';$('job-button').disabled=true;destinationMarker.visible=false;return;}
 if(saveRecovered){$('job-status').textContent='Saved career could not be read. Open Garage to recover.';$('job-button').disabled=true;destinationMarker.visible=false;return;}
 $('job-button').disabled=false;
 if(!job){$('job-status').textContent=activitySummary(activityMarket,'delivery',cityHour(cityElapsed));$('job-button').textContent='FIND DELIVERY';$('job-button').disabled=activityMarket.delivery.available===0;}
 else{
  const target=job.status==='accepted'?'pickup':'drop-off',id=currentDestination(),point=job.status==='accepted'?(pickupParking()||nodePoint(id)):nodePoint(id);
  $('job-status').textContent=`${target.toUpperCase()} · ${Math.round(Math.hypot(state.x-point.x,state.z-point.z))} m away · $${money(job.payoutCents)}`;
  $('job-button').textContent=job.status==='accepted'?'PICK UP':'DROP OFF';
 }
 const target=currentDestination();
 destinationMarker.visible=target!==null;
 if(target!==null){const point=career.jobs.active?.status==='accepted'?(pickupParking()||nodePoint(target)):nodePoint(target);destinationMarker.position.set(point.x,4,point.z);destinationMarker.rotation.z=performance.now()*.001;}
}
function raceIsNight(){return daylightAt(cityHour(cityElapsed))<.15;}
function raceAvailable(){return sandboxMode||life.rival.phase==='accepted'||activityMarket.race.available>0;}
function raceActive(){return dragRace?.phase==='countdown'||dragRace?.phase==='active';}
function raceDistance(){return dragCourse?Math.hypot(state.x-dragCourse.start.x,state.z-dragCourse.start.z):Infinity;}
function raceProgress(){return dragCourse?Math.max(0,Math.min(dragCourse.distanceMeters,
  (state.x-dragCourse.start.x)*dragCourse.forward.x+(state.z-dragCourse.start.z)*dragCourse.forward.z)):0;}
function updateRivalHud(){
 const known=career.fleet.drivers.kai.wins>0;
 const text=life.rival.phase==='invited'?(known?'Kai in the black car wants another race.':'A black car pulls up. Want to race?'):life.rival.phase==='accepted'?'Challenge accepted · head to the purple start line':life.rival.phase==='racing'?'Black-car challenge in progress':known?'Kai roams the city after dark.':'An unknown driver roams the city after dark.';
 setTextIfChanged($('rival-status'),text);
 $('rival-accept').hidden=life.rival.phase!=='invited';$('rival-decline').hidden=!['invited','accepted'].includes(life.rival.phase);
}
function showRespect(text,respect){const panel=$('respect-feedback');$('respect-text').textContent=text;$('respect-bar').style.width=Math.min(100,respect*10)+'%';panel.classList.toggle('loss',text.includes('↓'));panel.hidden=false;clearTimeout(respectTimer);respectTimer=setTimeout(()=>panel.hidden=true,4000);}
function updateRaceHud(){
 updateRivalHud();
 const status=$('race-status'),button=$('race-button');
 const countdown=$('race-countdown');
 const showingCount=dragRace?.phase==='countdown',showingGo=dragRace?.phase==='active'&&dragRace.elapsedSeconds<.8;
 countdown.hidden=!showingCount&&!showingGo;
 if(showingCount||showingGo){countdown.textContent=showingGo?'GO!':String(Math.max(1,Math.ceil(dragRace.countdownRemaining)));countdown.classList.toggle('go',showingGo);}
 if(!dragCourse){status.textContent='No straight 400 m course on this map.';button.disabled=true;return;}
 const distance=Math.round(raceDistance());
 if(dragRace?.phase==='countdown'){
  status.textContent=`Starting in ${Math.max(1,Math.ceil(dragRace.countdownRemaining))} · hold the line`;
  button.disabled=true;return;
 }
 if(dragRace?.phase==='active'){
  status.textContent=`${dragRace.elapsedSeconds.toFixed(1)} s · ${Math.round(raceProgress())} / 400 m · ${dragOpponent==='black'?'black car':'ghost'} ${Math.round(dragRace.rivalProgress)} m`;
  button.disabled=true;return;
 }
 if(dragRace?.phase==='finished'){
  const result=dragRace.result;
  status.textContent=result?.outcome==='win'?`WIN · ${result.elapsedSeconds.toFixed(2)} s${sandboxMode?' · practice':` · +$${money(DRAG_WIN_PAYOUT_CENTS)}`}`
   :result?.outcome==='loss'?`${dragOpponent==='black'?'Black car':'Ghost'} won · ${result.elapsedSeconds.toFixed(2)} s`
   :result?.outcome==='false-start'?'False start · no payout':'Race timed out · no payout';
  status.textContent+=` · ${activitySummary(activityMarket,'race',cityHour(cityElapsed))}`;
  button.textContent='RACE AGAIN';button.disabled=!raceAvailable()||distance>12||saveRecovered||state.blown;return;
 }
 status.textContent=state.blown?'Repair or reset the engine before racing'
  :!raceAvailable()?activitySummary(activityMarket,'race',cityHour(cityElapsed))
  :distance>12?`Start line ${distance} m away · purple map marker`
  :`Stop on stripe · beat ${(life.rival.phase==='accepted'?RIVAL.seconds[selected]:dragRace.rivalTimeSeconds).toFixed(1)} s${sandboxMode?' in practice':` for $${money(DRAG_WIN_PAYOUT_CENTS)}`}`;
 if(raceAvailable()&&!state.blown)status.textContent+=` · ${activitySummary(activityMarket,'race',cityHour(cityElapsed))}`;
 button.textContent='STAGE RACE';button.disabled=!raceAvailable()||distance>12||saveRecovered||state.blown;
}
function startDragRace(){
 if(intro)return;
 if(!dragCourse||!raceAvailable()||saveRecovered||state.blown){updateRaceHud();return;}
 const candidate=life.rival.phase==='accepted'?createDragRace(dragCourse,{rivalTimeSeconds:RIVAL.seconds[selected]}):dragRace?.phase==='finished'?createDragRace(dragCourse,{rivalTimeSeconds:rivalTimeForCar(selected)}):dragRace;
 const staged=stageRace(candidate,state);
 if(!staged.staged){notify({line:'Get within 1 m of the start stripe',moving:'Stop fully before staging',alignment:'Face the finish line', 'not-ready':'Finish or reset this race first'}[staged.reason]||'Race unavailable');updateRaceHud();return;}
 if(!sandboxMode&&life.rival.phase!=='accepted')consumeActivityOffer(activityMarket,'race');
 dragRace=staged.race;
 dragOpponent=life.rival.phase==='accepted'?'black':'ghost';
 dragRaceId=crypto.randomUUID();
 if(life.rival.phase==='accepted')life.rival=startRivalRace(life.rival,dragRaceId);
 updateRaceHud();notify('Staged · hold the line until GO');
}
function onRaceCourse(point,now){
 if((!raceActive()&&now>=raceTrafficClearUntil)||!dragCourse)return false;
 const dx=point.x-dragCourse.start.x,dz=point.z-dragCourse.start.z;
 const forward=dx*dragCourse.forward.x+dz*dragCourse.forward.z;
 const lateral=Math.abs(dx*dragCourse.forward.z-dz*dragCourse.forward.x);
 return forward>-32&&forward<dragCourse.distanceMeters+32&&lateral<map.roadWidth*1.3;
}
function nextDeliveryOffer(){
 const pickup=map.locations.find(location=>location.kind==='job')||map.locations.find(location=>location.kind==='spawn');
 const number=career.jobs.completedIds.length+career.jobs.cancelledIds.length+1;
 const drop={col:Math.min(map.size-1,Math.max(0,pickup.col+(number%2?3:-3))),row:Math.min(map.size-1,Math.max(0,pickup.row+(number%3?2:-2)))};
 const route=findRoute(map,pickup,drop);
 if(!route||route.length<2)throw new Error('No connected delivery route');
 return createDeliveryOffer(`delivery-${number}`,nodeId(pickup.col,pickup.row),nodeId(drop.col,drop.row),(route.length-1)*map.blockSize/1000);
}
function handleJobButton(){
 if(sandboxMode)return;
 try{
  const job=career.jobs.active;
  if(!job){if(!activityMarket.delivery.available){notify('No delivery requests yet · check the app countdown');return;}career=acceptDelivery(career,nextDeliveryOffer());consumeActivityOffer(activityMarket,'delivery');navigationKind=null;notify('Delivery accepted · follow the gold marker');}
  else if(job.status==='accepted'&&pickupParking()&&(!life.parking.get(pickupParking().id)?.ready||parkingCondition(state,pickupParking().bay))){notify('Park fully inside the gold pickup bay and hold still');return;}
  else if(job.status==='accepted'&&!pickupParking()&&!atNode(job.pickupNodeId)){notify('Reach the pickup marker and stop');return;}
  else if(job.status!=='accepted'&&!atNode(currentDestination())){notify('Reach the marker and slow down to stop');return;}
  else if(job.status==='accepted'){career=pickupDelivery(career,job.pickupNodeId);notify('Picked up · drive to drop-off');}
  else{career=completeDelivery(career,job.id,job.dropoffNodeId);notify(`Delivered · earned $${money(job.payoutCents)}`);}
  persistCareer();updateCareerHud();
 }catch(error){notify(error.message);}
}
function drawMiniMap(canvas=$('mini-map')){
 const ctx=canvas.getContext('2d'),near=nearestRoadPoint(map,state.x,state.z),unit=18,cx=canvas.width/2,cy=canvas.height/2;
 ctx.fillStyle='#dbe4d3';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#56685e';ctx.lineWidth=4;
 for(let row=near.row-5;row<=near.row+5;row++)for(let col=near.col-5;col<=near.col+5;col++){
  const x=cx+(col-near.col)*unit,y=cy+(row-near.row)*unit;
  if(roadOpen(map,col,row,'east')){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+unit,y);ctx.stroke();}
  if(roadOpen(map,col,row,'south')){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+unit);ctx.stroke();}
 }
 if(navigationPoints.length){ctx.strokeStyle='#e9b343';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx+(state.x-near.x)/map.blockSize*unit,cy-(state.z-near.z)/map.blockSize*unit);for(const point of navigationPoints)ctx.lineTo(cx+(point.x-near.x)/map.blockSize*unit,cy-(point.z-near.z)/map.blockSize*unit);ctx.stroke();}
 for(const location of map.locations){
  const x=cx+(location.col-near.col)*unit,y=cy+(location.row-near.row)*unit;
  if(x<0||x>canvas.width||y<0||y>canvas.height)continue;
  ctx.fillStyle=location.kind==='shop'?'#426aab':location.kind==='garage'?'#815f9b':location.kind==='fuel'?'#35865a':'#6e786d';
  ctx.beginPath();ctx.arc(x,y,location.kind==='shop'||location.kind==='fuel'?7:4,0,Math.PI*2);ctx.fill();
  if(location.kind==='fuel'){ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('F',x,y+.5);}
 }
 const parkPoint=cityProjectPoint(map),parkX=cx+(parkPoint.x-near.x)/map.blockSize*unit,parkY=cy-(parkPoint.z-near.z)/map.blockSize*unit;
 if(parkX>0&&parkX<canvas.width&&parkY>0&&parkY<canvas.height){ctx.fillStyle=activeCityEffects.park?'#4a985a':'#958975';ctx.fillRect(parkX-5,parkY-5,10,10);ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('C',parkX,parkY+.5);}
 for(const site of parkingSites){
  const x=cx+(site.x-near.x)/map.blockSize*unit,y=cy-(site.z-near.z)/map.blockSize*unit;
  if(x<0||x>canvas.width||y<0||y>canvas.height)continue;
  ctx.fillStyle=site.service==='bathroom'?'#219b96':'#dc992b';ctx.fillRect(x-5,y-5,10,10);
  ctx.fillStyle='#fff';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(site.service==='bathroom'?'B':'P',x,y+.5);
 }
 const target=currentDestination();
 if(target!==null){const x=cx+(target%50-near.col)*unit,y=cy+(Math.floor(target/50)-near.row)*unit;ctx.fillStyle='#e8a62e';ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();}
 if(dragCourse)for(const point of [dragCourse.start,dragCourse.finish]){
  const x=cx+(point.x-near.x)/map.blockSize*unit,y=cy-(point.z-near.z)/map.blockSize*unit;
  if(x<2||x>canvas.width-2||y<2||y>canvas.height-2)continue;
  ctx.fillStyle='#8f64bf';ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();
 }
 ctx.fillStyle='#354b56';
 for(const vehicle of trafficVehicles){
  const x=cx+(vehicle.x-near.x)/map.blockSize*unit,y=cy-(vehicle.z-near.z)/map.blockSize*unit;
  if(x<2||x>canvas.width-2||y<2||y>canvas.height-2)continue;
  ctx.fillRect(x-2,y-2,4,4);
 }
 for(const event of roadEvents){
  const x=cx+(event.x-near.x)/map.blockSize*unit,y=cy-(event.z-near.z)/map.blockSize*unit;
  if(x<2||x>canvas.width-2||y<2||y>canvas.height-2)continue;
  ctx.fillStyle=event.hardObstacle?'#c17b37':'#75966c';ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();
 }
 for(const officer of officers){
  const x=cx+(officer.x-near.x)/map.blockSize*unit,y=cy-(officer.z-near.z)/map.blockSize*unit;
  if(x<2||x>canvas.width-2||y<2||y>canvas.height-2)continue;
  ctx.fillStyle='#3e74b1';ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();
 }
 ctx.fillStyle='#d86a32';ctx.beginPath();ctx.arc(cx+(state.x-near.x)/map.blockSize*unit,cy-(state.z-near.z)/map.blockSize*unit,5,0,Math.PI*2);ctx.fill();
}
function renderShop(){
 const condition=activeVehicle(career),nearShop=nearLocation('shop');
 $('shop-balance').textContent=saveRecovered?'Unreadable save: use the recovery button below to start a new career.':`Wallet $${money(career.walletCents)} · ${nearShop?'At service bay':'Drive to the blue $ marker and stop to buy service'}`;
 const content=$('shop-content');content.replaceChildren();
 if(saveRecovered){const recover=document.createElement('button');recover.textContent='START NEW CAREER AND REPLACE UNREADABLE SAVE';recover.onclick=()=>{saveRecovered=false;career=createCareer(selected);persistCareer();renderShop();updateCareerHud();};content.append(recover);return;}
 const addService=(label,action,health)=>{
  let quote;try{quote=getServiceQuote(condition,action);}catch{return;}
  const row=document.createElement('div');row.className='service-row';
  const description=document.createElement('div');description.textContent=label;
  const small=document.createElement('small');small.textContent=`${health===null?'Oil':`${Math.round(health*100)}% health`} · ${quote.description}`;description.append(small);
  const button=document.createElement('button');button.textContent=`$${money(quote.totalCents)}`;button.disabled=!nearShop||career.walletCents<quote.totalCents||action.type==='repair'&&health>.98;
  button.onclick=()=>{try{career=purchaseService(career,action,`service:${crypto.randomUUID()}`);persistCareer();renderShop();updateCareerHud();notify(`${label} serviced`);}catch(error){notify(error.message);}};
  row.append(description,button);content.append(row);
 };
 addService('Oil + filter',{type:'oil-change'},null);
 for(const key of PART_KEYS){const name=key.replace(/([A-Z])/g,' $1').replace(/^./,letter=>letter.toUpperCase());
  addService(`${name} repair`,{type:'repair',partKey:key},condition.parts[key].health);
  addService(`${name} replacement`,{type:'replace',partKey:key},condition.parts[key].health);
  addService(`${name} upgrade`,{type:'upgrade',partKey:key},condition.parts[key].health);
 }
 for(const [kind,options] of Object.entries(CONTROL_OPTIONS)){
  const part=kind==='throttle'?'engine':'clutch',installed=condition.parts[part].sku.endsWith(':upgraded');
  const row=document.createElement('div');row.className='service-row';
  const label=document.createElement('label');label.textContent=kind==='throttle'?'Throttle response':'Clutch bite point';
  const select=document.createElement('select');select.setAttribute('aria-label',label.textContent);
  for(const value of options){const option=document.createElement('option');option.value=value;option.textContent=value;select.append(option);}
  select.value=condition.controlTune?.[kind]??(kind==='throttle'?'smooth':'standard');
  select.disabled=!nearShop||!installed;
  const detail=document.createElement('small');detail.textContent=installed?(kind==='throttle'?'Upgrade installed · faster buildup and less resistance':'Upgrade installed · faster buildup, gentler release'):`Buy the ${part} upgrade to unlock tuning`;
  label.append(detail);select.onchange=()=>{try{career=configurePedals(career,kind,select.value);persistCareer();renderShop();updateCareerHud();notify('Pedal tuning saved for this car');}catch(error){notify(error.message);}};
  row.append(label,select);content.append(row);
 }
}
$('job-button').onclick=handleJobButton;
$('race-button').onclick=startDragRace;
$('rival-accept').onclick=()=>{if(raceActive())return;life.rival=acceptRival(life.rival);navigationKind='rival';updateRaceHud();updateCareerHud();notify('Race the black car · head to the start line');};
$('rival-decline').onclick=()=>{life.rival=declineRival(life.rival);if(navigationKind==='rival')navigationKind=null;updateRaceHud();updateCareerHud();notify('Challenge declined · no penalty');};
$('garage-button').onclick=()=>{keys.clear();renderShop();$('shop-dialog').showModal();};
$('appearance-select').onchange=()=>{const choice=$('appearance-select').value;if(!APPEARANCES[choice]||saveRecovered)return;career=setVehicleAppearance(career,choice);persistCareer();makeCar(selected);notify('Appearance changed · driving setup preserved');};
$('garage-reset-button').onclick=()=>{
 if(intro||saveRecovered||raceActive()){notify('Finish the current drive or recover your save first');return;}
 try{career=fullCarReset(career);persistCareer();resetDrivingState();updateRaceHud();updateCareerHud();notify('Full car reset · upgrades kept');}catch(error){notify(error.message);}
};
$('reset-unlock-button').onclick=()=>{
 if(intro||saveRecovered)return;
 try{career=unlockFullResets(career,$('reset-password').value);persistCareer();$('reset-password').value='';$('reset-unlock-status').textContent='Unlimited full resets unlocked. Thank you for supporting CarPG!';updateCareerHud();}catch(error){$('reset-unlock-status').textContent=error.message;}
};
const supportUrl=donationUrl();
if(supportUrl){$('support-donation').href=supportUrl;$('support-donation').hidden=false;$('support-pending').hidden=true;}
$('map-button').onclick=()=>{keys.clear();editor.open();};
$('fuel-button').onclick=()=>{if(!nearLocation('fuel')){notify('Stop at the gas station first');return;}try{career=purchaseFuel(career,`fuel:${crypto.randomUUID()}`);persistCareer();updateCareerHud();notify('Tank filled');}catch(error){notify(error.message);}};
const phoneViews=[...document.querySelectorAll('[data-phone-view]')];
function openPhoneApp(name){phoneViews.forEach(view=>view.hidden=view.dataset.phoneView!==name);if(name==='maps')drawMiniMap();if(['lube','fuel','garage','bathroom','city','drivers','messages'].includes(name))updateCareerHud();}
document.querySelectorAll('[data-phone-app]').forEach(button=>button.addEventListener('click',()=>openPhoneApp(button.dataset.phoneApp)));
$('phone-home').onclick=()=>openPhoneApp('home');
$('city-track').onclick=()=>{navigationKind='park';updateCareerHud();drawMiniMap();notify('City project tracked');};
document.querySelectorAll('[data-bathroom]').forEach(button=>button.onclick=()=>{activeBathroomId=button.dataset.bathroom;navigationKind='bathroom';updateCareerHud();drawMiniMap();notify('Bathroom tracked · turquoise parking bay');});
$('bathroom-use').onclick=()=>{try{
 const site=currentBathroom(),parking=site?advanceParking(life.parking.get(site.id),state,site,0):null;
 const result=purchaseBathroom(career,life.needs,site,parking,'bathroom:'+crypto.randomUUID());
 career=result.career;life.needs=result.needs;needWarningShown=false;persistCareer();updateCareerHud();notify('Feeling better · need meter emptied');
}catch(error){notify(error.message);}};
document.querySelectorAll('[data-nav-kind]').forEach(button=>button.addEventListener('click',()=>{navigationKind=button.dataset.navKind;document.querySelectorAll('[data-nav-kind]').forEach(item=>item.classList.toggle('active',item===button));updateCareerHud();drawMiniMap();}));
window.addEventListener('pagehide',persistCareer);
window.addEventListener('pagehide',persistCityTime);
document.addEventListener('visibilitychange',()=>{previousTime=performance.now();if(document.visibilityState==='hidden'){persistCareer();persistCityTime();}});
updateCareerHud();updateRaceHud();drawMiniMap();
const keys=new Set();let clutchKey=0,throttleKey=0,previousTime=performance.now();
$('career-panel').addEventListener('pointerdown',()=>{keys.clear();throttleKey=0;releaseMouseShifter();});
$('career-panel').addEventListener('keydown',e=>{if(e.code==='Escape'){e.preventDefault();phoneView.toggle();document.activeElement?.blur();}});
const touchHeld=new Set(),touchClutch=$('touch-clutch');
document.querySelectorAll('[data-control]').forEach(button=>{
 const key=button.dataset.control;
 button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);touchHeld.add(key);});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>touchHeld.delete(key));
});
touchClutch.addEventListener('input',()=>{$('touch-clutch-label').textContent=`${touchClutch.value}%`;});
$('touch-down').onclick=()=>shiftBy(-1,Number(touchClutch.value)/100);
$('touch-up').onclick=()=>shiftBy(1,Number(touchClutch.value)/100);
const gamepad=()=>Array.from(navigator.getGamepads?.()||[]).find(p=>p&&p.connected);
function notify(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2200);}
function resetDrivingState(){
 state=createState();state.roadMode='grid';state.clutch=0;
 wearClock=0;clutchWearWorkJ=0;life.parking.clear();parkedContacts.clear();
 if(activeVehicle(career).fuelLiters<=0){state.running=false;state.rpm=0;}
 placeAtSpawn();
 dragRace=createDragRace(dragCourse,{rivalTimeSeconds:rivalTimeForCar(selected)});
 dragRaceId=null;resetLifeLocations(life);cameraPull=0;
 shifterPos=neutralPosition();mouseCursor=null;neutralX=0;
 neutralHoldUntil=0;centerDetentUntil=0;verticalRepeat=null;stickArmed=true;
 lastBlown=false;failureStart=0;$('engine-failure').hidden=true;
 clutchKey=0;throttleKey=0;touchClutch.value=100;$('touch-clutch-label').textContent='100%';
}
function useCar(key){
 if(testDrivingMustang())leaveIntro();
 if(intro){notify('Finish your first drive before changing cars');return;}
 if(raceActive()||saveRecovered){notify('Finish the race or recover the save before switching cars');return;}
 try{career=switchVehicle(career,key);}catch(error){notify(error.message);updateCareerHud();return;}
 selected=activeVehicle(career).vehicleId;persistCareer();
 resetDrivingState();makeCar(selected);
 if(osc)osc.type=selected==='civic'?'triangle':'sawtooth';
 document.querySelectorAll('.car').forEach(button=>button.classList.toggle('active',button.dataset.car===selected));
 updateCareerHud();updateRaceHud();notify(cars[selected].name);
}
document.querySelectorAll('.car').forEach(b=>b.addEventListener('click',()=>useCar(b.dataset.ownedCar||b.dataset.car)));
function beginIntro(testDrive=false){
 if(testDrive&&!developmentMode)return;
 if(intro||raceActive()||saveRecovered)return;
 introOriginalCareer=career;intro=createIntro({testDrive});career=createIntroCareer();selected='mustang';
 resetDrivingState();makeCar(selected);if(!phoneView.compact)phoneView.toggle();$('career-panel').hidden=!testDrive;
 $('dev-mustang').textContent=testDrive?'END MUSTANG TEST':'DEV · TEST MUSTANG';
 updateCareerHud();notify(testDrive?'DEV Mustang test drive · no scripted crash · temporary car, saves unchanged':'Your first drive · old automatic Mustang');
}
function leaveIntro(completed=false){
 if(!intro)return;
 $('intro-replacement').close();career=completed?replacementCareer(introOriginalCareer):introOriginalCareer;intro=null;introOriginalCareer=null;
 $('starter-choice').close();
 if(introImpactView){scene.remove(introImpactView.root);introImpactView.dispose();introImpactView=null;}
 selected=activeVehicle(career).vehicleId;resetDrivingState();makeCar(selected);$('career-panel').hidden=false;
 $('dev-mustang').textContent='DEV · TEST MUSTANG';
 if(completed){try{storage.setItem(introKey,'1');}catch{}persistCareer();}
 updateCareerHud();notify(completed?'Welcome to CarPG · learn the manual clutch and shifter':'Mustang test ended · original car restored');
 if(completed)$('controls').showModal();
 else if(!career.starterChoiceMade)$('starter-choice').showModal();
}
function toggleMustangTest(){
 if(!developmentMode||raceActive()||saveRecovered)return;
 if(testDrivingMustang()){leaveIntro();return;}
 if(intro)leaveIntro();
 $('controls').close();$('shop-dialog').close();releaseMouseShifter();keys.clear();beginIntro(true);
 $('starter-choice').close();
}
$('dev-mustang').onclick=toggleMustangTest;$('mustang-test-drive').onclick=toggleMustangTest;
$('intro-replay').onclick=()=>beginIntro();$('intro-continue').onclick=()=>leaveIntro(true);
$('intro-replacement').addEventListener('cancel',event=>event.preventDefault());
$('starter-choice').addEventListener('cancel',event=>event.preventDefault());
document.querySelectorAll('[data-starter]').forEach(button=>button.onclick=()=>{
 try{
  const chosen=chooseStarter(introOriginalCareer||career,button.dataset.starter);
  if(intro){introOriginalCareer=chosen;leaveIntro(true);}
  else{career=chosen;selected=activeVehicle(career).vehicleId;resetDrivingState();makeCar(selected);$('starter-choice').close();persistCareer();updateCareerHud();$('controls').showModal();}
 }catch(error){notify(error.message);}
});
function updateIntro(dt,now){
 if(!intro)return;
 const event=advanceIntro(intro,state,dt);
 if(event==='crash'){
  state.speed=0;state.running=false;state.rpm=0;state.blown=true;
  const car=activeVehicle(career);car.parts.engine.health=0;car.parts.frontBumper.health=0;car.parts.transmission.health=0;
  failureStart=now;lastBlown=true;playEngineBreak();impactRumbleUntil=now+650;
  $('impact-flash').classList.remove('active');void $('impact-flash').offsetWidth;$('impact-flash').classList.add('active');
  introImpactView=createVehicleView(THREE);introImpactView.setVehicle('eclipse');scene.add(introImpactView.root);
  updateCareerHud();notify('CRASH · the Mustang is finished');
 }
 if(introImpactView){
  const age=intro.crashSeconds,side=Math.max(.3,5-age*9),h=state.heading;
  introImpactView.update({x:state.x+side*Math.cos(h)-Math.sin(h)*1.7,z:state.z-side*Math.sin(h)-Math.cos(h)*1.7,heading:h+Math.PI/2,speed:age<.55?12:0,steer:0,shake:0,timeMs:now,failing:false},dt);
 }
 if(event==='replacement'){(introOriginalCareer.starterChoiceMade?$('intro-replacement'):$('starter-choice')).showModal();keys.clear();releaseMouseShifter();}
}
function selectGearWithWear(nextGear,clutch){
 if(cars[selected].transmission==='automatic')return 'This Mustang shifts automatically';
 const condition=activeVehicle(career);
 const {error,condition:worn}=changeGearWithWear(state,nextGear,clutch,tunedCarFor(condition),condition);
 if(error)return error;
 if(!sandboxMode&&worn!==condition){
  career=setVehicleCondition(career,worn);
  persistCareer();updateCareerHud();
 }
 return '';
}
function shiftBy(dir,clutch=state.clutch){
 const oldPosition=shifterPos,message=selectGearWithWear(clamp(state.gear+dir,0,6),clutch);
 if(message){notify(message);return;}
 shifterPos=state.gear===0&&oldPosition.row!==0?{lane:oldPosition.lane,row:0,gear:0}:positionForGear(state.gear);
 neutralX=shifterPos.lane;neutralHoldUntil=state.gear===0&&oldPosition.row!==0?performance.now()+SHIFTER.gearExitHoldMs:0;
 notify(state.gear===0?'Neutral':`Gear ${state.gear}`);
}
function throwShifter(direction,clutch){
 if(state.blown)return;
 if(state.gear===-1){notify('Select Neutral before a forward gear');return;}
 const wasInGear=shifterPos.row!==0;
 const next=throwLever(shifterPos,direction);
 if(!next){notify('Pull the shifter back to Neutral first');return;}
 if(next.gear!==state.gear){
  const message=selectGearWithWear(next.gear,clutch);
  if(message){notify(message);return;}
  notify(next.gear===0?'Neutral':`Gear ${next.gear}`);
 }
 shifterPos=next;
 neutralX=next.lane;
 neutralHoldUntil=wasInGear&&next.row===0?performance.now()+SHIFTER.gearExitHoldMs:0;
}
function startEngine(){if(activeVehicle(career).fuelLiters<=0){notify('Out of fuel · visit the gas station or check full resets in Garage');return;}notify(start(state,tunedCarFor(activeVehicle(career)))?'Engine started':state.blown?'Engine destroyed · reset the car':'Press the clutch or select neutral');}
function toggleReverse(clutch){
 if(cars[selected].transmission==='automatic'){
  const range=state.autoRange==='R'?'D':'R',error=selectAutomaticRange(state,range);
  notify(error|| (range==='R'?'Reverse':'Drive'));return;
 }
 if(state.gear!==0&&state.gear!==-1){notify('Select Neutral before Reverse');return;}
 const next=state.gear===-1?0:-1,message=selectGearWithWear(next,clutch);
 if(message){notify(message);return;}
 shifterPos=neutralPosition();neutralX=0;neutralHoldUntil=0;notify(next===-1?'Reverse':'Neutral');
}
function reset(){if(intro){if(intro.phase==='crash'||intro.phase==='replacement')return;intro=createIntro({testDrive:testDrivingMustang()});}resetDrivingState();updateRaceHud();notify('Car reset');}
$('help').onclick=()=>$('controls').showModal();$('restart').onclick=startEngine;$('reset').onclick=reset;$('reset-blown').onclick=reset;
function releaseMouseShifter(){
 mouseCursor=null;$('shift-knob').classList.remove('mouse-held');document.body.classList.remove('mouse-shifting');
 $('mouse-lock-prompt').hidden=true;
 mouseCaptureFallback=false;mouseLockAttempts=0;edgeX=edgeY=0;edgeXUntil=edgeYUntil=0;
 if(document.pointerLockElement===document.body)document.exitPointerLock();
}
document.addEventListener('pointerlockchange',()=>{
 const captured=document.pointerLockElement===document.body;
 const clutchHeld=pressed('ControlLeft','ControlRight');
 document.body.classList.toggle('mouse-shifting',captured);
 if(captured){$('mouse-lock-prompt').hidden=true;mouseCaptureFallback=false;edgeX=edgeY=0;edgeXUntil=edgeYUntil=0;}
 else if(clutchHeld)enableMouseEdgeAssist();
 if(captured&&!pressed('ControlLeft','ControlRight'))document.exitPointerLock();
});
document.addEventListener('pointerlockerror',()=>{if(pressed('ControlLeft','ControlRight'))enableMouseEdgeAssist();});
window.addEventListener('keydown',e=>{
 if(e.target instanceof Element&&e.target.closest('input, select, textarea, dialog'))return;
 if(e.code==='KeyP'){e.preventDefault();if(!playingIntro()&&!e.repeat&&!gamePaused())phoneView.toggle();return;}
 if(e.target instanceof Element&&e.target.closest('#career-panel'))return;
 if(e.code==='Enter'&&e.target instanceof Element&&e.target.closest('button'))return;
 if(['KeyA','KeyS','KeyD','KeyH','KeyV','KeyB','KeyN','KeyT','ControlLeft','ControlRight','AltLeft','AltRight','Space','Enter','KeyR','Digit1','Digit2','Digit3','Digit4'].includes(e.code))e.preventDefault();
 if(gamePaused())return;
 if(e.repeat)return;
 keys.add(e.code);
 if((e.code==='ControlLeft'||e.code==='ControlRight')&&!gamepad()&&cars[selected].transmission!=='automatic'){
  mouseCursor=createMouseShifter(shifterPos);mouseCaptureFallback=false;$('shift-knob').classList.add('mouse-held');
  requestMouseCapture();
 }
 if(e.code==='KeyB')toggleReverse(state.clutch);if(e.code==='Enter')startEngine();if(e.code==='KeyR')reset();
 if(e.code==='KeyN')jumpDayNight();
 if(e.code==='KeyT')startDragRace();
 const keyboardViews={Digit1:'hood',Digit2:'chase',Digit3:'left',Digit4:'right'};
 if(keyboardViews[e.code])setCameraView(keyboardViews[e.code]);
});
window.addEventListener('keyup',e=>{keys.delete(e.code);if((e.code==='ControlLeft'||e.code==='ControlRight')&&!pressed('ControlLeft','ControlRight')){releaseMouseShifter();if(shifterPos.row===0&&shifterPos.lane!==0)neutralHoldUntil=performance.now()+SHIFTER.gearExitHoldMs;}});
window.addEventListener('blur',()=>{keys.clear();throttleKey=0;releaseMouseShifter();});
const pressed=(...codes)=>codes.some(c=>keys.has(c));
let mouseCursor=null,mouseCaptureFallback=false,mouseLockWarned=false,mouseLockAttempts=0,edgeX=0,edgeY=0,edgeXUntil=0,edgeYUntil=0;
function enableMouseEdgeAssist(){
 mouseCaptureFallback=true;
 $('mouse-lock-prompt').hidden=false;
 const supported=typeof document.body.requestPointerLock==='function';
 $('mouse-lock-button').hidden=!supported;
 $('mouse-lock-prompt').querySelector('span').textContent=!supported?'This browser cannot lock the mouse. Open the game in Chrome or Edge for bound shifting.':mouseLockAttempts>1?'This browser blocked mouse lock. Try Chrome or Edge for bound shifting.':'Hold Ctrl and click to lock the mouse for shifting.';
 if(!mouseLockWarned){notify(supported?'Click Lock Mouse to keep the pointer in the game':'Mouse lock is unavailable in this browser');mouseLockWarned=true;}
}
function requestMouseCapture(){
 if(!pressed('ControlLeft','ControlRight')||document.pointerLockElement===document.body)return;
 if(!document.body.requestPointerLock){enableMouseEdgeAssist();return;}
 mouseLockAttempts++;
 try{Promise.resolve(document.body.requestPointerLock()).catch(()=>{if(pressed('ControlLeft','ControlRight'))enableMouseEdgeAssist();});}
 catch{enableMouseEdgeAssist();}
}
$('mouse-lock-button').addEventListener('click',requestMouseCapture);
function applyMouseThrow(dx,dy,now){
 if(cars[selected].transmission==='automatic')return;
 if(clutchKey<MIN_SHIFT_CLUTCH||state.clutch<MIN_SHIFT_CLUTCH)return;
 if(!mouseCursor)mouseCursor=createMouseShifter(shifterPos);
 const moved=moveMouseShifter(mouseCursor,shifterPos,dx,dy,now);
 if(!moved.changed){mouseCursor=moved.cursor;return;}
 if(moved.position.gear!==state.gear){const error=selectGearWithWear(moved.position.gear,state.clutch);if(error){notify(error);return;}}
 mouseCursor=moved.cursor;shifterPos=moved.position;neutralX=shifterPos.lane;neutralHoldUntil=0;
 if(shifterPos.gear!==0)notify(`Gear ${shifterPos.gear}`);
}
window.addEventListener('mousemove',e=>{
 if(!pressed('ControlLeft','ControlRight')||gamepad()||touchLayout.matches||gamePaused()||state.blown||e.target instanceof Element&&e.target.closest('#career-panel, #mouse-lock-prompt, dialog, .map-editor'))return;
 const now=performance.now();
 applyMouseThrow(e.movementX,e.movementY,now);
 if(mouseCaptureFallback&&document.pointerLockElement!==document.body){
  const edge=mouseEdgeDirections(e.clientX,e.clientY,innerWidth,innerHeight,e.movementX,e.movementY);
  if(edge.x){edgeX=edge.x;edgeXUntil=now+900;}else if(e.movementX)edgeX=0;
  if(edge.y){edgeY=edge.y;edgeYUntil=now+900;}else if(e.movementY)edgeY=0;
 }
});
function processShifterAxes(stickX,stickY,clutch){
 if(cars[selected].transmission==='automatic')return;
 const stick=readStick(shifterPos,stickX,stickY,stickArmed,neutralHoldUntil,performance.now(),centerDetentUntil,verticalRepeat);
 shifterPos=stick.position;neutralX=stick.neutralX;stickArmed=stick.armed;neutralHoldUntil=stick.holdUntil;centerDetentUntil=stick.centerDetentUntil;verticalRepeat=stick.verticalRepeat;
 if(stick.direction)throwShifter(stick.direction,clutch);
}
function processController(pad,clutch){
 const b=i=>pad.buttons[i]?.pressed||false,edge=i=>b(i)&&!previousButtons[i];
 const stickX=pad.axes[2]||0,stickY=pad.axes[3]||0;
 processShifterAxes(stickX,stickY,clutch);
 if(edge(9)&&!playingIntro())phoneView.toggle();
 if(edge(3)){state.clutch=clutch;startEngine();}
 if(edge(1))toggleReverse(clutch);
 if(edge(5))startDragRace();
 for(const [button,view] of Object.entries(views))if(edge(Number(button)))setCameraView(view);
 previousButtons=pad.buttons.map(x=>x.pressed);
}
function readInput(dt){
 const pad=gamepad();
 if(pad||touchLayout.matches)throttleKey=0;
 setTextIfChanged($('input-status'),pad?`Controller connected · ${pad.id.split(' (')[0]}`:'Ctrl + mouse shift · Space builds gas · V full gas · S / Alt brake');
 if(pad){
  if(pad.buttons[10]?.pressed&&!previousButtons[10]){
   controllerClutch=toggleClutchInput(controllerClutch);
   try{storage.setItem('dsl-clutch-mode',controllerClutch.mode);}catch{}
   notify(`Clutch · ${controllerClutch.mode==='pressure'?'pressure build':'direct trigger'}`);
  }
  controllerClutch=readClutchInput(controllerClutch,pad.buttons[6]?.value||0,dt,tunedCarFor(activeVehicle(career)).pedals.clutch);
  const clutch=controllerClutch.value;
  processController(pad,clutch);
  const b=i=>pad.buttons[i]?.pressed||false,axis=i=>Math.abs(pad.axes[i]||0)<.08?0:pad.axes[i];
  return {steer:axis(0),throttle:pad.buttons[7]?.value||0,clutch,brake:b(4)?1:0,handbrake:b(0)};
 }
 previousButtons=[];stickArmed=true;centerDetentUntil=0;verticalRepeat=null;
 if(touchLayout.matches){
  setTextIfChanged($('input-status'),'Touch controls ready');
  return {steer:(touchHeld.has('right')?1:0)-(touchHeld.has('left')?1:0),throttle:touchHeld.has('gas')?1:0,clutch:Number(touchClutch.value)/100,brake:touchHeld.has('brake')?1:0,handbrake:false};
 }
 const clutchTarget=pressed('ControlLeft','ControlRight')?1:0;
 const pedals=tunedCarFor(activeVehicle(career)).pedals;
 clutchKey=advanceKeyboardClutch(clutchKey,Boolean(clutchTarget),dt,pedals.clutch);
 throttleKey=advanceKeyboardThrottle(throttleKey,pressed('Space'),pressed('KeyV'),dt,pedals.throttle);
 return {steer:(pressed('KeyD')?1:0)-(pressed('KeyA')?1:0),throttle:throttleKey,clutch:clutchKey,brake:pressed('KeyS','AltLeft','AltRight')?1:0,handbrake:pressed('KeyH')};
}
function updateHud(dt){
 if(neutralHoldUntil&&performance.now()>=neutralHoldUntil&&!gamepad()&&!pressed('ControlLeft','ControlRight')){
  neutralHoldUntil=0;shifterPos=neutralPosition();neutralX=0;
 }
 const pad=gamepad();
 const mouseHeld=mouseCursor&&pressed('ControlLeft','ControlRight')&&!pad;
 const inputType=pad?'controller':touchLayout.matches?'touch':'keyboard';
 const candidate=drivingAdvice(state,cars[selected],{fuelLiters:activeVehicle(career).fuelLiters,bitePoint:tunedCarFor(activeVehicle(career)).clutchBitePoint,input:inputType})||(intro?introAdvice(intro,inputType):null);
 const advice=advanceCoachHint(coachHint,candidate,dt,{suppressed:state.blown&&!intro});
 $('hint').hidden=!advice;
 if(advice){setTextIfChanged($('hint-title'),advice.title);setTextIfChanged($('hint-text'),advice.text);}
 const mouseDisplay=mouseHeld?mouseShifterDisplay(mouseCursor,shifterPos):null;
 renderDrivingHud({state,car:cars[selected],fuelLiters:activeVehicle(career).fuelLiters,
  bitePoint:tunedCarFor(activeVehicle(career)).clutchBitePoint,
  clutchMode:pad?(controllerClutch.mode==='pressure'?'PRESSURE':'DIRECT'):'PRESSURE',
  knobX:mouseDisplay?.x??(shifterPos.row===0?neutralX:shifterPos.lane),knobY:mouseDisplay?.y??shifterPos.row});
 if(lastRunning&&!state.running&&!state.blown&&activeVehicle(career).fuelLiters>0){notify('Engine stalled · Clutch in, press Y / Enter');stallRumbleUntil=performance.now()+420;}
 lastRunning=state.running;lastBlown=state.blown;
 updateRaceHud();
}
let rumbleEnabled=true,hapticsFailed=false,lastPulse=0,stallRumbleUntil=0,impactRumbleUntil=0;
const hapticActuator=pad=>pad?.vibrationActuator||pad?.hapticActuators?.[0];
function updateRumble(now){
 const pad=gamepad(),actuator=hapticActuator(pad);
 setTextIfChanged($('rumble'),pad&&(!actuator||hapticsFailed)?'RUMBLE N/A':rumbleEnabled?'RUMBLE ON':'RUMBLE OFF');
 if(!rumbleEnabled||!actuator||hapticsFailed||document.visibilityState!=='visible'||now-lastPulse<120)return;
 lastPulse=now;
 const levels=now<impactRumbleUntil?{strong:.82,weak:.68}:now<stallRumbleUntil?{strong:.72,weak:.48}:rumbleLevels(state,cars[selected],now);
 if(levels.strong===0&&levels.weak===0)return;
 try{
  const result=actuator.playEffect&&(!actuator.effects||actuator.effects.includes('dual-rumble'))
   ?actuator.playEffect('dual-rumble',{duration:150,startDelay:0,strongMagnitude:levels.strong,weakMagnitude:levels.weak})
   :actuator.pulse?.(Math.max(levels.strong,levels.weak),150);
  if(result)Promise.resolve(result).catch(()=>{hapticsFailed=true;});
  else hapticsFailed=true;
 }catch{hapticsFailed=true;}
}
$('rumble').onclick=()=>{if(gamepad()&&(!hapticActuator(gamepad())||hapticsFailed)){notify('Rumble unavailable in this browser or controller');return;}rumbleEnabled=!rumbleEnabled;notify(rumbleEnabled?'Rumble on':'Rumble off');};
let soundEnabled=true;
let audioCtx,osc,volume,engineFilter,v6Body,v6BodyVolume,v6Pulse,v6Lfo,v6LfoDepth,whine,whineVolume,air,airVolume,noiseBuffer,lastBypass=0,lastThrottle=0,lastClutch=1;
function makeNoise(ctx){
 const buffer=ctx.createBuffer(1,Math.round(ctx.sampleRate),ctx.sampleRate),samples=buffer.getChannelData(0);
 for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
 return buffer;
}
function playBypass(now){
 if(!audioCtx||!noiseBuffer||now-lastBypass<650)return;
 lastBypass=now;
 const source=audioCtx.createBufferSource(),filter=audioCtx.createBiquadFilter(),gain=audioCtx.createGain(),t=audioCtx.currentTime;
 source.buffer=noiseBuffer;filter.type='bandpass';filter.frequency.setValueAtTime(2600,t);filter.frequency.exponentialRampToValueAtTime(780,t+.37);filter.Q.value=.65;
 gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(.065,t+.025);gain.gain.exponentialRampToValueAtTime(.001,t+.48);
 source.connect(filter).connect(gain).connect(audioCtx.destination);source.start(t);source.stop(t+.5);
}
function playEngineBreak(){
 if(!audioCtx||!noiseBuffer)return;
 const t=audioCtx.currentTime,pop=audioCtx.createOscillator(),popGain=audioCtx.createGain();
 pop.type='sawtooth';pop.frequency.setValueAtTime(130,t);pop.frequency.exponentialRampToValueAtTime(38,t+.35);
 popGain.gain.setValueAtTime(.001,t);popGain.gain.exponentialRampToValueAtTime(.2,t+.015);popGain.gain.exponentialRampToValueAtTime(.001,t+.4);
 pop.connect(popGain).connect(audioCtx.destination);pop.start(t);pop.stop(t+.41);
 const crackle=audioCtx.createBufferSource(),low=audioCtx.createBiquadFilter(),crackleGain=audioCtx.createGain();
 crackle.buffer=noiseBuffer;low.type='lowpass';low.frequency.value=1000;
 crackleGain.gain.setValueAtTime(.11,t);crackleGain.gain.exponentialRampToValueAtTime(.001,t+.55);
 crackle.connect(low).connect(crackleGain).connect(audioCtx.destination);crackle.start(t);crackle.stop(t+.56);
}
function playImpact(){
 if(!audioCtx||!noiseBuffer)return;
 const t=audioCtx.currentTime,source=audioCtx.createBufferSource(),filter=audioCtx.createBiquadFilter(),gain=audioCtx.createGain();
 source.buffer=noiseBuffer;filter.type='lowpass';filter.frequency.value=420;
 gain.gain.setValueAtTime(.12,t);gain.gain.exponentialRampToValueAtTime(.001,t+.23);
 source.connect(filter).connect(gain).connect(audioCtx.destination);source.start(t);source.stop(t+.24);
}
function startSound(){
 if(!soundEnabled)return;
 if(audioCtx){if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});return;}
 audioCtx=new AudioContext();osc=audioCtx.createOscillator();volume=audioCtx.createGain();engineFilter=audioCtx.createBiquadFilter();
 osc.type=selected==='civic'?'triangle':'sawtooth';engineFilter.type='lowpass';engineFilter.frequency.value=selected==='civic'?8000:280;
 volume.gain.value=0;osc.connect(engineFilter).connect(volume).connect(audioCtx.destination);osc.start();
 v6Body=audioCtx.createOscillator();v6Body.type='triangle';v6Pulse=audioCtx.createGain();v6Pulse.gain.value=.75;
 v6BodyVolume=audioCtx.createGain();v6BodyVolume.gain.value=0;
 v6Body.connect(v6Pulse).connect(v6BodyVolume).connect(audioCtx.destination);v6Body.start();
 v6Lfo=audioCtx.createOscillator();v6Lfo.type='sine';v6LfoDepth=audioCtx.createGain();v6LfoDepth.gain.value=0;
 v6Lfo.connect(v6LfoDepth).connect(v6Pulse.gain);v6Lfo.start();
 whine=audioCtx.createOscillator();whine.type='sine';whineVolume=audioCtx.createGain();whineVolume.gain.value=0;whine.connect(whineVolume).connect(audioCtx.destination);whine.start();
 noiseBuffer=makeNoise(audioCtx);air=audioCtx.createBufferSource();air.buffer=noiseBuffer;air.loop=true;
 const airFilter=audioCtx.createBiquadFilter();airFilter.type='bandpass';airFilter.frequency.value=1850;airFilter.Q.value=.8;
 airVolume=audioCtx.createGain();airVolume.gain.value=0;air.connect(airFilter).connect(airVolume).connect(audioCtx.destination);air.start();
 $('sound').textContent='SOUND ON';
 if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
}
function toggleSound(){
 soundEnabled=!soundEnabled;
 if(!soundEnabled){if(audioCtx){audioCtx.close().catch(()=>{});audioCtx=null;}$('sound').textContent='SOUND OFF';}
 else startSound();
}
$('sound').onclick=toggleSound;
// Browser audio unlocks on a gesture. Muting must remain respected afterward.
function unlockSound(event){if(event.target instanceof Element&&event.target.closest('#sound'))return;startSound();}
document.addEventListener('pointerdown',unlockSound);
document.addEventListener('keydown',unlockSound);
function beginEngineFailure(now){
 failureStart=now;stallRumbleUntil=now+850;playEngineBreak();
 if(!sandboxMode){
  const condition=activeVehicle(career);
  const damaged={...condition,parts:{...condition.parts,engine:{...condition.parts.engine,health:Math.max(0,condition.parts.engine.health-.35)}}};
  career=setVehicleCondition(career,damaged);persistCareer();updateCareerHud();
 }
 const flash=$('blow-flash');flash.classList.remove('active');void flash.offsetWidth;flash.classList.add('active');
 notify('ENGINE BLOWN');
}
const lastTrafficHits=new Map(),lastRoadEventHits=new Map();
function applyContact(impact,now,label){
 const before=activeVehicle(career),key=impact.end==='front'?'frontBumper':'rearBumper';
 const after=applyImpactDamage(before,{end:impact.end,impactSpeedMps:Math.min(150,impact.impactSpeedMps)});
 career=setVehicleCondition(career,after);
 persistCareer();updateCareerHud();
 state.speed*=Math.max(.12,1-impact.impactSpeedMps/28);
 impactRumbleUntil=now+500;playImpact();
 const flash=$('impact-flash');flash.classList.remove('active');void flash.offsetWidth;flash.classList.add('active');
 const damage=Math.max(1,Math.round((before.parts[key].health-after.parts[key].health)*100));
 notify(`${label} · ${impact.end==='front'?'front':'rear'} bumper −${damage}%`);
}
function handleParkedContact(previous,now){
 const contact=resolveParkedContact(parkedContacts,previous,state,parkedCars,parkedOverlapScratch);
 if(!contact)return null;
 if(contact.freshImpact&&Math.abs(state.speed)>.1&&!sandboxMode&&!profileEnabled)applyContact({...contact.freshImpact,impactSpeedMps:Math.max(.5,Math.abs(state.speed))},now,'Parked car contact');
 state.x=previous.x;state.z=previous.z;state.heading=previous.heading;state.speed=0;
 return contact.impact;
}
function handleTrafficImpact(vehicles,now){
 const eligible=vehicles.filter(vehicle=>now-(lastTrafficHits.get(vehicle.id)??-Infinity)>2200);
 const impact=findTrafficImpact(state,eligible);
 if(!impact||impact.impactSpeedMps<2)return null;
 lastTrafficHits.set(impact.vehicleId,now);
 applyContact(impact,now,'Traffic collision');
 return impact;
}
function handleRoadEventImpact(events,now){
 const eligible=events.filter(event=>now-(lastRoadEventHits.get(event.id)??-Infinity)>3000);
 const impact=findRoadEventImpact(state,eligible);
 if(!impact||impact.impactSpeedMps<2)return null;
 lastRoadEventHits.set(impact.eventId,now);
 applyContact(impact,now,{'stalled-car':'Stalled car','construction':'Roadwork','debris':'Debris'}[impact.type]);
 return impact;
}
function updateCityLighting(){
 const hour=cityHour(cityElapsed),daylight=daylightAt(hour),darkness=1-daylight;
 skyColor.copy(daySky).lerp(nightSky,darkness);
 scene.fog.color.copy(skyColor);
 ambient.intensity=.58+daylight*1.52;
 sun.intensity=.28+daylight*2.12;
 sun.castShadow=daylight>.35&&!profileNoShadows;
 sun.color.copy(nightSun).lerp(daySun,daylight);
 headlightRig.position.set(state.x,0,state.z);headlightRig.rotation.y=state.heading;
 headlightBeam.visible=darkness>.15&&!profileNoLocalLights&&!profileNoHeadlights;
 headlightBeam.intensity=profileNoLocalLights||profileNoHeadlights?0:darkness*26;
 const nearest=nearestRoadPoint(map,state.x,state.z),key=`${nearest.col}:${nearest.row}`;
 if(key!==streetLightGridKey){
  streetLightGridKey=key;
  const point=gridPoint(map,nearest.col,nearest.row),margin=map.roadWidth/2+1.4;
  nearbyStreetLight.position.set(point.x+margin,6,point.z-margin);
 }
 nearbyStreetLight.visible=darkness>.15&&!profileNoLocalLights&&!profileNoStreetLights;
 nearbyStreetLight.intensity=nearbyStreetLight.visible?darkness*5:0;
 const label=`${formatCityTime(hour)} · ${daylight<.25?'NIGHT':daylight<.85?'DUSK':'DAY'}`;
 if(label!==lastTimeLabel){$('time-button').textContent=label;lastTimeLabel=label;}
 return darkness;
}
function frame(now){
 if(document.visibilityState==='hidden'||!frameDue(now-previousTime)){
  if(document.visibilityState==='hidden')previousTime=now;
  requestAnimationFrame(frame);
  return;
 }
 const frameCpuStart=profileEnabled?performance.now():0;
 const dt=simulationDeltaSeconds(now-previousTime);previousTime=now;
 const paused=gamePaused();
 if(mouseCaptureFallback&&!paused&&!state.blown&&pressed('ControlLeft','ControlRight')&&!gamepad()){
  const dx=now<edgeXUntil?edgeX*dt*500:0,dy=now<edgeYUntil?edgeY*dt*500:0;
  if(dx||dy)applyMouseThrow(dx,dy,now);
 }
 const previousPose={x:state.x,z:state.z,heading:state.heading,speed:state.speed};
 if(paused)throttleKey=0;
 const input=paused?{clutch:state.clutch,throttle:0,brake:0,steer:0,handbrake:false}:readInput(dt);
 let parkedImpact=null;
 const oldBoost=state.boost;
 if(activeVehicle(career).fuelLiters<=0){state.running=false;state.rpm=0;state.boost=0;}
 const steps=paused?0:Math.max(1,Math.ceil(dt/RUNTIME.outerSimulationStepSeconds));
 const simInput=state.blown?{...input,steer:failureStart&&now-failureStart<2400?Math.sin((now-failureStart)*.008)*.95:0}:input;
 const tunedCar=tunedCarFor(activeVehicle(career));
 if(profileSpeed!==null&&Number.isFinite(profileSpeed)){
  state.speed=profileSpeed;state.x=map.roadWidth*.25;state.z-=profileSpeed*dt;
  state.rpm=4400;state.gear=3;state.clutch=0;state.throttle=.7;state.running=true;
 }else for(let n=0;n<steps;n++){const subPose={x:state.x,z:state.z,heading:state.heading,speed:state.speed};step(state,simInput,tunedCar,dt/steps);parkedImpact=handleParkedContact(subPose,now)||parkedImpact;}
 if(!paused){
  if(life.needs.poop>=NEEDS.warning&&!needWarningShown){notify('Bathroom needed soon · open Bathrooms');needWarningShown=true;}
  updateIntro(dt,now);
  if(!raceActive())cityElapsed+=dt;
  if(!intro)advanceActivityMarket(activityMarket,dt,cityHour(cityElapsed));
  const previousRivalPhase=life.rival.phase;
  const forceRival=sandboxMode&&profileParams.has('rival')&&!rivalPreviewUsed;
  if(!intro)advanceLifeSession(life,dt,{map,sites:parkingSites,car:state,eligible:(raceIsNight()||forceRival)&&!career.fleet.drivers.kai.vehicleId&&!career.jobs.active&&!raceActive()&&!state.blown&&Boolean(dragCourse)&&Math.abs(state.speed)<8,force:forceRival});
  if(life.rival.phase==='invited'&&previousRivalPhase!=='invited'){rivalPreviewUsed=true;notify('Black-car driver sent a challenge · Messages app');updateRivalHud();}
  const updatedRace=updateDragRace(dragRace,dt,state);
  dragRace=updatedRace.race;
  for(const event of updatedRace.events){
   if(event.type==='start')notify(`GO! · beat the ${life.rival.phase==='racing'?'black car':'violet ghost'} to the finish`);
   if(event.type==='result'){
    const result=settleRivalRace(life.rival,dragRaceId,event.outcome,life.needs);life.rival=result.rival;life.needs=result.needs;
    if(result.feedback){showRespect(result.feedback,life.rival.respect);if(event.outcome==='loss')needWarningShown=false;}
    if(navigationKind==='rival')navigationKind=null;
    raceTrafficClearUntil=now+5000;
    if(event.outcome==='win'){
     if(!sandboxMode){const askedBefore=driverAvailable(career,'kai');career=awardDragWin(career,dragRaceId,event.elapsedSeconds);if(dragOpponent==='black')career=recordDriverWin(career,'kai',dragRaceId);persistCareer();updateCareerHud();if(!askedBefore&&driverAvailable(career,'kai'))notify('Kai texted you about delivery work · open Messages');}
     notify(sandboxMode?`PRACTICE WIN · ${event.elapsedSeconds.toFixed(2)} s`:`DRAG WIN · ${event.elapsedSeconds.toFixed(2)} s · +$${money(DRAG_WIN_PAYOUT_CENTS)}`);
    }else notify(event.outcome==='false-start'?'FALSE START · try again':event.outcome==='loss'?`The ${result.feedback?'black car':'ghost'} won · line up for another run`:'Race timed out');
   }
  }
  if(!intro&&!profileEnabled&&(!sandboxMode||profileParams.has('fleet'))){fleetClock+=dt;if(fleetClock>=1){fleetClock-=1;const work=advanceFleet(career,1);career=work.career;if(work.events.length){persistCareer();updateCareerHud();notify(`Kai finished a delivery · your share $${money(work.events[0].ownerCents)}`);}}}
  trafficVehicles=playingIntro()?[]:updateTraffic(trafficSystem,dt,{x:state.x,z:state.z}).filter(vehicle=>!onRaceCourse(vehicle,now));
  roadEvents=playingIntro()?[]:updateRoadEvents(roadEventSystem,dt,{x:state.x,z:state.z}).filter(event=>!onRaceCourse(event,now)&&!(activeCityEffects.improvedRoads&&['construction','debris'].includes(event.type)));
  const trafficImpact=profileEnabled||sandboxMode?parkedImpact:handleTrafficImpact(trafficVehicles,now)||parkedImpact;
  const roadImpact=profileEnabled||sandboxMode||trafficImpact?null:handleRoadEventImpact(roadEvents,now);
  if(intro||sandboxMode||raceActive()||now<raceTrafficClearUntil)officers=[];
  else{
   const police=updatePolice(policeSystem,dt,{previous:previousPose,current:{x:state.x,z:state.z,heading:state.heading,speed:state.speed},impact:Boolean(trafficImpact||roadImpact),timeSeconds:trafficSystem.time});
   officers=police.officers;
   if(police.violation&&!profileEnabled){
    career=applyFine(career,police.violation);
    latestCitation={violation:police.violation,at:now};
    persistCareer();updateCareerHud();
    notify(`${police.violation.reason} · $${money(police.violation.amountCents)} fine`);
   }
  }
  const cameraViolation=updateSpeedCameras(speedCameras,state,dt,activeCityEffects.cameras&&!intro&&!sandboxMode&&!profileEnabled&&!raceActive());
  if(cameraViolation&&!saveRecovered){cameraViolation.id=cameraSession+':'+cameraViolation.id;career=applyFine(career,cameraViolation);latestCitation={violation:cameraViolation,at:now};persistCareer();updateCareerHud();notify('Speed camera · $45 fine');}
  clutchWearWorkJ+=clutchFrictionWork(selected,activeVehicle(career).parts.clutch.health,{dtSeconds:dt,clutchBitePoint:tunedCar.clutchBitePoint,clutchPosition:state.clutch,clutchReleasing:state.clutch<lastClutch,gear:state.gear,slipRadPerSecond:state.slip,clutchSlipping:state.clutchSlipping,throttle:state.throttle,engineRpm:state.rpm,running:state.running});
  wearClock+=dt;saveClock+=dt;mapClock+=dt;
 if(wearClock>=RUNTIME.wearIntervalSeconds){if(!sandboxMode&&!playingIntro())career=setVehicleCondition(career,applyDrivingWear(activeVehicle(career),{dtSeconds:wearClock,speedMps:Math.abs(state.speed),clutchPosition:state.clutch,clutchWorkJ:clutchWearWorkJ,throttle:state.throttle,brake:state.brake,engineRpm:state.rpm,running:state.running,elapsedGameDays:wearClock/600}));wearClock=0;clutchWearWorkJ=0;}
  if(activeVehicle(career).fuelLiters<=0){state.running=false;state.rpm=0;state.boost=0;if(!emptyTankReported){notify('Out of fuel · open Fuel at the gas station');emptyTankReported=true;}}else emptyTankReported=false;
  if(saveClock>=RUNTIME.saveIntervalSeconds){persistCareer();persistCityTime();saveClock=0;}
  if(mapClock>=RUNTIME.phoneIntervalSeconds){updateCareerHud();if(phoneView.compact)drawMiniMap($('watch-map'));else if(!document.querySelector('[data-phone-view="maps"]').hidden)drawMiniMap();mapClock=0;}
 }
 if(state.blown&&!lastBlown)beginEngineFailure(now);
 if(!intro&&failureStart&&now-failureStart>(reducedMotion.matches?900:2400)&&$('engine-failure').hidden){$('engine-failure').hidden=false;$('reset-blown').focus();}
 if(selected==='civic'&&oldBoost>.28&&((lastThrottle>.48&&input.throttle<.2)||(lastClutch<.3&&input.clutch>.72)))playBypass(now);
 lastThrottle=input.throttle;lastClutch=input.clutch;
 const shake=failureStart?Math.max(0,1-(now-failureStart)/2200):0;
 vehicleView.update({x:state.x,z:state.z,heading:state.heading,speed:state.speed,steer:simInput.steer,shake,timeMs:now,failing:!!failureStart},dt);
 const nightFactor=updateCityLighting();

 updateFailureFx(now);

 world.update(state.x,state.z);
 cityProjectView.update(trafficSystem.time);
 rivalView.update(life.rival,dragCourse,dragRace,dt);
 parkingView.update(life.parking.get(currentParkingSite()?.id)||{siteId:null,ready:false},state.x,state.z);
 trafficView.update(trafficVehicles,map,trafficSystem.time,state.x,state.z,nightFactor);
 roadEventView.update(roadEvents,map,trafficSystem.time,state.x,state.z);
 policeView.update(officers,map,trafficSystem.time,state.x,state.z);
 dragRaceView.update(dragCourse,dragRace,nightFactor,state.x,state.z);
 sun.position.set(state.x-35,80,state.z+45);sun.target.position.set(state.x,0,state.z);sun.target.updateMatrixWorld();
 const angle=state.heading;
 cameraPull=easeCameraPull(cameraPull,cameraView==='chase'&&!reducedMotion.matches?torqueCameraPull(state,cars[selected]):0,dt);
 const [side,height,behind]=CAMERA.poses[cameraView];
 const distance=behind+(cameraView==='chase'?cameraPull:0);
 targetOffset.set(side*Math.cos(angle)+distance*Math.sin(angle),height,-side*Math.sin(angle)+distance*Math.cos(angle));
 cameraOffset.lerp(targetOffset,1-Math.exp(-dt*6));
 camera.position.set(state.x+cameraOffset.x,cameraOffset.y,state.z+cameraOffset.z);
 if(shake){camera.position.x+=Math.sin(now*.061)*shake*.17;camera.position.y+=Math.cos(now*.049)*shake*.12;}
 const look=cameraView==='hood'?cameraLook.set(state.x-Math.sin(angle)*25,1.45,state.z-Math.cos(angle)*25):cameraLook.set(state.x,1.15,state.z);
 camera.lookAt(look);
 const mph=Math.abs(state.speed)*2.23694;
 camera.fov+=(55+(reducedMotion.matches?0:8*clamp(mph/150,0,1))-camera.fov)*clamp(dt*5,0,1);camera.updateProjectionMatrix();
 if(audioCtx){
  const tone=engineTone(state,cars[selected]),t=audioCtx.currentTime;
  osc.frequency.setTargetAtTime(tone.frequency,t,.07);volume.gain.setTargetAtTime(tone.mainGain,t,.09);
  engineFilter.frequency.setTargetAtTime(tone.cutoff,t,.09);
  v6Body.frequency.setTargetAtTime(tone.bodyFrequency,t,.07);v6BodyVolume.gain.setTargetAtTime(tone.bodyGain,t,.09);
  v6Lfo.frequency.setTargetAtTime(tone.pulseRate,t,.12);v6LfoDepth.gain.setTargetAtTime(tone.pulseDepth,t,.09);
  whine.frequency.setTargetAtTime(480+state.boost*1300+state.rpm*.085,t,.09);
  whineVolume.gain.setTargetAtTime(selected==='civic'&&state.running?state.boost*(.0025+state.throttle*.003):0,t,.09);
  airVolume.gain.setTargetAtTime(selected==='civic'&&state.running?state.boost*state.throttle*.0025:0,t,.09);
 }
 updateHud(paused?0:dt);updateRumble(now);
 const renderStart=profileEnabled?performance.now():0;
 if(!reducedMotion.matches&&mph>55&&!profileNoBlur){
  blurMaterial.uniforms.strength.value=clamp((mph-55)/110,0,1)*.085;
  carGroup.visible=false;failureFx.visible=false;
  renderer.setRenderTarget(blurTarget);renderer.render(scene,camera);renderer.setRenderTarget(null);
  carGroup.visible=true;failureFx.visible=!!failureStart&&now-failureStart<4_400;
  renderer.render(blurScene,blurCamera);
  const parkingVisible=parkingView.group.visible;parkingView.group.visible=false;cityProjectView.group.visible=false;const rivalVisible=rivalView.group.visible;rivalView.group.visible=false;
  world.group.visible=false;trafficView.group.visible=false;roadEventView.group.visible=false;policeView.group.visible=false;dragRaceView.group.visible=false;scene.background=null;
  renderer.autoClear=false;renderer.clearDepth();renderer.render(scene,camera);
  parkingView.group.visible=parkingVisible;cityProjectView.group.visible=true;rivalView.group.visible=rivalVisible;
  renderer.autoClear=true;scene.background=skyColor;world.group.visible=true;trafficView.group.visible=true;roadEventView.group.visible=true;policeView.group.visible=true;dragRaceView.group.visible=true;
 }else renderer.render(scene,camera);
 if(performanceMonitor)performanceMonitor.record(now,performance.now()-frameCpuStart,performance.now()-renderStart,renderer.info.render.calls,renderer.info.render.triangles,
  `speed ${profileSpeed===null?'play':Math.round(profileSpeed*2.23694)+' mph'} · ${profileParams.has('night')?'night':'day'} · DPR ${renderer.getPixelRatio()}${profileNoBlur?' · no blur':''}${profileNoShadows?' · no shadows':''}${profileNoLocalLights?' · no local lights':''}${profileNoStreetLights?' · no street lights':''}${profileNoHeadlights?' · no headlights':''}`);
 requestAnimationFrame(frame);
}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(profileDpr??scenePixelRatio(innerWidth,innerHeight,devicePixelRatio));renderer.setSize(innerWidth,innerHeight);blurTarget.setSize(...blurSize(innerWidth,innerHeight));});
try{if(developmentMode&&profileParams.get('testdrive')==='mustang')beginIntro(true);else if(profileParams.has('intro')||shouldPlayFirstDrive(loadedCareer,{profile:profileEnabled,sandbox:sandboxMode}))beginIntro();else if(!profileEnabled&&!saveRecovered&&!career.starterChoiceMade)$('starter-choice').showModal();}catch{}
requestAnimationFrame(frame);
