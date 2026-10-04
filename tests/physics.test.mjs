import test from 'node:test';
import assert from 'node:assert/strict';
import {cars,createState,selectGear,shift,start,step,availableTorque} from '../src/physics.js';
import {createVehicleCondition,performanceModifiers} from '../src/condition.js';
import {sceneryTravel} from '../src/city.js';
const car=cars.civic;
const tick=(s,input,seconds)=>{for(let i=0;i<seconds*100;i++)step(s,input,car,.01);};
test('manual shifts allow any deliberate clutch press, while engine start still needs disengagement',()=>{
 const s=createState();s.clutch=0;
 assert.match(shift(s,1,car),/clutch/);assert.equal(s.gear,0);
 s.clutch=.03;assert.equal(shift(s,1,car),'');assert.equal(s.gear,1);
 const condition=createVehicleCondition('civic');condition.parts.clutch.health=.4;
 const wornCar={...car,...performanceModifiers(condition)};
 s.clutch=.4;assert.equal(selectGear(s,2,wornCar),'');assert.equal(s.gear,2);
 s.running=false;s.clutch=.9;assert.equal(start(s,wornCar),false);
 s.clutch=1;assert.equal(start(s,wornCar),true);
});

test('a worn clutch slips under strong acceleration and transfers less drive',()=>{
 const run=health=>{
  const condition=createVehicleCondition('eclipse');condition.parts.clutch.health=health;
  const tuned={...cars.eclipse,...performanceModifiers(condition)};
  const s=createState();s.gear=2;s.rpm=3500;s.speed=s.rpm*Math.PI/30*.315/(tuned.ratios[1]*tuned.final);
  const startSpeed=s.speed;let slippingFrames=0;
  for(let i=0;i<100;i++){
   step(s,{clutch:0,throttle:1,brake:0,steer:0},tuned,.01);
   if(s.clutchSlipping)slippingFrames++;
  }
  return {gain:s.speed-startSpeed,slippingFrames};
 };
 const healthy=run(1),worn=run(.4);
 assert.equal(healthy.slippingFrames,0);
 assert.ok(worn.slippingFrames>50);
 assert.ok(worn.gain<healthy.gain*.8,`healthy gain ${healthy.gain}, worn gain ${worn.gain}`);
});
test('both cars settle near the displayed 850 RPM idle',()=>{
 for(const car of Object.values(cars).filter(car=>car.transmission!=="automatic")){
  const s=createState();
  for(let i=0;i<300;i++)step(s,{clutch:1,throttle:0,brake:0,steer:0},car,.01);
  assert.ok(s.rpm>=830&&s.rpm<=870,`${car.name} idled at ${s.rpm} RPM`);
 }
});
test('a careful launch moves the car and does not stall',()=>{
 const s=createState();s.clutch=1;shift(s,1,car);
 tick(s,{clutch:1,throttle:.45,brake:0,steer:0},.6);
 for(let i=0;i<220;i++)step(s,{clutch:Math.max(.18,1-i/250),throttle:.45,brake:0,steer:0},car,.01);
 assert.equal(s.running,true);assert.ok(s.speed>1.5,`speed ${s.speed}`);
});
test('dumping clutch in first with no throttle stalls',()=>{
 const s=createState();s.clutch=1;shift(s,1,car);
 tick(s,{clutch:0,throttle:0,brake:0,steer:0},.8);
 assert.equal(s.running,false);
 assert.equal(s.rpm,0);
 assert.equal(start(s),false);
 s.clutch=1;assert.equal(start(s),true);
});
test('braking and neutral stop the car',()=>{
 const s=createState();s.speed=8;s.gear=0;
 tick(s,{clutch:1,throttle:0,brake:1,steer:0},2);
 assert.equal(s.speed,0);
});
test('steering changes lanes while forward travel stays straight and inside the road',()=>{
 const s=createState();s.gear=0;s.speed=20;
 const originalZ=s.z;
 for(let i=0;i<300;i++)step(s,{clutch:1,throttle:0,brake:0,steer:1},car,.01);
 assert.ok(s.x>5.9&&s.x<=6.15);
 assert.ok(s.z<originalZ-40);
 assert.ok(Math.abs(s.heading)<.13);
 assert.ok(s.speed>=0);
 s.clutch=1;assert.equal(shift(s,-1,car),'');assert.equal(s.gear,0);
});
test('grid driving turns the car onto a perpendicular street',()=>{
 const s=createState();s.roadMode='grid';s.x=0;s.z=32;s.speed=8;
 for(let i=0;i<110;i++)step(s,{clutch:1,throttle:0,brake:0,steer:1},car,.01);
 assert.ok(s.heading<-.8&&s.heading>-1.6,`heading ${s.heading}`);
 assert.ok(s.x>3&&s.z<30,`position ${s.x},${s.z}`);
});
test('grid driving can reverse from a stop and brake back to zero',()=>{
 const s=createState();s.roadMode='grid';s.clutch=1;
 assert.equal(selectGear(s,-1,car),'');
 for(let i=0;i<50;i++)step(s,{clutch:1,throttle:.55,brake:0,steer:0},car,.01);
 for(let i=0;i<120;i++)step(s,{clutch:Math.max(.25,1-i/140),throttle:.55,brake:0,steer:0},car,.01);
 assert.ok(s.speed<-.2,`reverse speed ${s.speed}`);
 for(let i=0;i<180;i++)step(s,{clutch:1,throttle:0,brake:1,steer:0},car,.01);
 assert.equal(s.speed,0);
});
test('city travel scales with road speed',()=>{
 const travel=mph=>{
  const s=createState();s.speed=mph/2.23694;
  const before=sceneryTravel(s.z);
  step(s,{clutch:1,throttle:0,brake:0,steer:0},car,.01);
  return before-sceneryTravel(s.z);
 };
 const at50=travel(50),at150=travel(150);
 assert.ok(at150>at50*2.9&&at150<at50*3.1,`50 mph: ${at50}; 150 mph: ${at150}`);
 assert.ok(at50>50/2.23694*.01*1.5,`scenery should outpace physical travel: ${at50}`);
});
test('V6 responds immediately; Civic builds power as boost spools under load',()=>{
 const pull=(car,boost=0)=>{
  const s=createState();s.rpm=3000;s.gear=2;s.clutch=0;s.boost=boost;
  s.speed=s.rpm*Math.PI/30*.315/(car.ratios[1]*car.final);
  const initial=s.speed;
  for(let i=0;i<20;i++)step(s,{clutch:0,throttle:1,brake:0,steer:0},car,.01);
  return {gain:s.speed-initial,boost:s.boost};
 };
 const v6=pull(cars.eclipse),fresh=pull(cars.civic),spooled=pull(cars.civic,1);
 assert.ok(v6.gain>fresh.gain+.08,`V6 ${v6.gain}; Civic ${fresh.gain}`);
 assert.ok(spooled.gain>fresh.gain+.3,`spooled ${spooled.gain}; fresh ${fresh.gain}`);
 assert.ok(fresh.boost>0&&fresh.boost<.6);
 const neutral=createState();neutral.rpm=3000;
 tick(neutral,{clutch:1,throttle:1,brake:0,steer:0},.5);
 assert.equal(neutral.boost,0);
});
test('Civic free-revs roughly twice as fast as the V6 without building boost in neutral',()=>{
 const timeToSixThousand=car=>{
  const s=createState();let elapsed=0;
  while(s.rpm<6000&&elapsed<3){step(s,{clutch:1,throttle:1,brake:0,steer:0},car,.01);elapsed+=.01;}
  return {elapsed,boost:s.boost};
 };
 const civic=timeToSixThousand(cars.civic),eclipse=timeToSixThousand(cars.eclipse);
 assert.ok(civic.elapsed<eclipse.elapsed*.6,`Civic ${civic.elapsed}, Eclipse ${eclipse.elapsed}`);
 assert.equal(civic.boost,0);
});
test('both engines gain RPM about twice as quickly under throttle',()=>{
 const timeToFiveThousand=car=>{
  const s=createState();let elapsed=0;
  while(s.rpm<5000&&elapsed<3){step(s,{clutch:1,throttle:1,brake:0,steer:0},car,.01);elapsed+=.01;}
  return elapsed;
 };
 for(const car of Object.values(cars).filter(car=>car.transmission!=="automatic")){
  const previous={...car,engineInertia:car.engineInertia*2};
  const ratio=timeToFiveThousand(previous)/timeToFiveThousand(car);
  assert.ok(ratio>1.8&&ratio<2.2,`${car.name} response ratio ${ratio.toFixed(2)}`);
 }
});
test('Civic close ratios sweep third gear to redline about twice as fast as the V6',()=>{
 const timeToRedline=car=>{
  const s=createState();s.gear=3;s.clutch=0;s.rpm=2500;
  s.speed=s.rpm*Math.PI/30*.315/(car.ratios[2]*car.final);
  let elapsed=0,maxClutchMismatch=0;
  while(s.rpm<car.redline&&elapsed<20){
   step(s,{clutch:0,throttle:1,brake:0,steer:0},car,.01);elapsed+=.01;
   const lockedRpm=Math.abs(s.speed/.315*car.ratios[2]*car.final*30/Math.PI);
   maxClutchMismatch=Math.max(maxClutchMismatch,Math.abs(s.rpm-lockedRpm));
  }
  return {elapsed,maxClutchMismatch};
 };
 const civic=timeToRedline(cars.civic),eclipse=timeToRedline(cars.eclipse);
 const ratio=eclipse.elapsed/civic.elapsed;
 assert.ok(ratio>1.8&&ratio<2.2,`Civic ${civic.elapsed.toFixed(2)} s, V6 ${eclipse.elapsed.toFixed(2)} s`);
 assert.ok(civic.maxClutchMismatch<350,`Civic clutch mismatch ${civic.maxClutchMismatch.toFixed(0)} RPM`);
});
test('the Civic reaches 8000 RPM and the Eclipse remains at 6500 without unloaded overshoot',()=>{
 assert.equal(cars.civic.redline,8000);
 assert.equal(cars.eclipse.redline,6500);
 for(const car of Object.values(cars).filter(car=>car.transmission!=="automatic")){
  const s=createState();
  for(let i=0;i<100;i++)step(s,{clutch:1,throttle:1,brake:0,steer:0},car,.01);
  assert.ok(s.rpm>car.redline-50&&s.rpm<=car.redline,`${car.name} held ${s.rpm} RPM`);
 }
});
test('Civic gains partial boost before 3000 RPM and reaches its strong pull near 4000',()=>{
 const s=createState();s.gear=3;s.clutch=0;s.rpm=2500;
 s.speed=s.rpm*Math.PI/30*.315/(car.ratios[2]*car.final);
 let elapsed=0,atThree=null,atFour=null;
 while(s.rpm<4000&&elapsed<4){
  step(s,{clutch:0,throttle:1,brake:0,steer:0},car,.01);elapsed+=.01;
  if(atThree===null&&s.rpm>=3000)atThree={elapsed,boost:s.boost};
  if(atFour===null&&s.rpm>=4000)atFour={elapsed,boost:s.boost};
 }
 assert.ok(atThree&&atThree.elapsed<1&&atThree.boost>.45&&atThree.boost<.85,JSON.stringify(atThree));
 assert.ok(atFour&&atFour.elapsed<3&&atFour.boost>.88,JSON.stringify(atFour));
});
test('the Si gains speed faster once turbo boost crosses its torque onset',()=>{
 const gain=boost=>{
  const s=createState();s.gear=2;s.clutch=0;s.rpm=3000;s.boost=boost;
  s.speed=s.rpm*Math.PI/30*.315/(car.ratios[1]*car.final);
  const initial=s.speed;
  for(let i=0;i<12;i++)step(s,{clutch:0,throttle:1,brake:0,steer:0},car,.01);
  return s.speed-initial;
 };
 assert.ok(gain(.7)>gain(.3)*1.7);
});
test('a quick manual upshift retains turbo speed and regains boost promptly',()=>{
 const s=createState();s.gear=4;s.clutch=0;s.rpm=6200;s.boost=1;
 s.speed=s.rpm*Math.PI/30*.315/(car.ratios[3]*car.final);
 for(let i=0;i<30;i++)step(s,{clutch:1,throttle:0,brake:0,steer:0},car,.01);
 assert.ok(s.boost>.4&&s.boost<.6,`shift retained ${s.boost.toFixed(2)} boost`);
 assert.equal(selectGear(s,5,car),'');
 for(let i=0;i<30;i++)step(s,{clutch:0,throttle:1,brake:0,steer:0},car,.01);
 assert.ok(s.boost>.8,`post-shift boost ${s.boost.toFixed(2)}`);
});
test('a spooled Civic keeps its 200 hp pull through the upper rev range',()=>{
 const state=createState();state.boost=1;
 for(const rpm of [6000,6600,7200,7900]){
  state.rpm=rpm;
  const power=availableTorque(state,cars.civic)*rpm*Math.PI/30/745.7;
  assert.ok(power>195&&power<=200.01,`${rpm} RPM: ${power.toFixed(1)} hp`);
 }
});
test('a healthy Civic keeps accelerating at highway speed when held in the power band',()=>{
 const s=createState();s.speed=90/2.23694;s.gear=5;s.clutch=0;s.boost=1;
 s.rpm=s.speed/.315*car.ratios[4]*car.final*30/Math.PI;
 const initial=s.speed;
 for(let i=0;i<200;i++)step(s,{clutch:0,throttle:1,brake:0,steer:0},car,.01);
 assert.ok((s.speed-initial)*2.23694>7.5,`90 mph gain ${((s.speed-initial)*2.23694).toFixed(1)} mph`);
 assert.ok(s.rpm<car.redline&&!s.blown);
});
test('braking in gear without clutch stalls at low RPM; clutch in prevents it',()=>{
 for(const car of Object.values(cars).filter(car=>car.transmission!=="automatic")){
  const make=clutch=>{const s=createState();s.gear=3;s.clutch=clutch;s.speed=12;s.rpm=3200;for(let i=0;i<160;i++)step(s,{clutch,throttle:0,brake:1,steer:0},car,.01);return s;};
  assert.equal(make(0).running,false,`${car.name} should stall`);
  assert.equal(make(1).running,true,`${car.name} should keep idling`);
 }
});
test('sustained bogging stalls in every gear without pressing the clutch',()=>{
 for(const car of Object.values(cars).filter(car=>car.transmission!=="automatic"))for(let gear=1;gear<=6;gear++){
  const s=createState();s.gear=gear;s.clutch=0;s.rpm=900;
  s.speed=s.rpm*Math.PI/30*.315/(car.ratios[gear-1]*car.final);
  for(let i=0;i<80;i++)step(s,{clutch:0,throttle:0,brake:0,steer:0},car,.01);
  assert.equal(s.running,false,`${car.name} gear ${gear} should stall`);
  assert.equal(s.rpm,0);
 }
});
test('third-gear low-speed bog stalls both cars, while clutching in protects the engine',()=>{
 for(const car of Object.values(cars).filter(car=>car.transmission!=="automatic"))for(const clutch of [0,1]){
  const s=createState();s.gear=3;s.rpm=950;
  s.speed=s.rpm*Math.PI/30*.315/(car.ratios[2]*car.final);
  for(let i=0;i<100;i++)step(s,{clutch,throttle:.1,brake:0,steer:0},car,.01);
  assert.equal(s.running,clutch===1,`${car.name}, clutch ${clutch}`);
 }
});
