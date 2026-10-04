import test from 'node:test';
import assert from 'node:assert/strict';
import { cars,createState,step,selectGear,start } from '../src/physics.js';
import { selectAutomaticRange } from '../src/automatic-transmission.js';
import { createIntro,createIntroCareer,advanceIntro,replacementCareer,introAdvice } from '../src/intro.js';
import { createCareer,serializeCareer,parseCareer,donateToCity,buyVehicle } from '../src/career.js';
import { DEALERSHIP } from '../src/config/fleet.js';
import { clutchFrictionWork } from '../src/condition.js';
import { drivingAdvice } from '../src/driving-coach.js';

const input={clutch:0,throttle:1,brake:0,steer:0};
const run=(s,seconds,overrides={})=>{for(let i=0;i<seconds*100;i++)step(s,{...input,...overrides},cars.mustang,.01);};
test('automatic launches without clutch, shifts through four gears and kicks down safely',()=>{
  const s=createState(),gears=new Set();
  for(let i=0;i<5000;i++){step(s,input,cars.mustang,.01);gears.add(s.gear);}
  assert.deepEqual([...gears],[1,2,3,4]);assert.ok(s.speed>40);assert.equal(s.blown,false);
  s.autoRange='D';s.gear=4;s.speed=20;s.rpm=1400;s.autoShiftCooldown=0;
  run(s,.01);assert.equal(s.gear,3);assert.ok(s.rpm<cars.mustang.redline);
});
test('brakes hold converter creep, full brake-held gas does not upshift or stall',()=>{
  const s=createState();run(s,3,{throttle:0});assert.ok(s.speed>0);
  run(s,3,{throttle:0,brake:1});assert.equal(s.speed,0);assert.equal(s.running,true);
  run(s,4,{throttle:1,brake:1});assert.equal(s.gear,1);assert.equal(s.running,true);assert.equal(s.speed,0);
  assert.ok(s.rpm<=cars.mustang.redline);
  assert.equal(clutchFrictionWork('mustang',1,{...input,clutchPosition:.5,gear:1,engineRpm:3000,dtSeconds:.1,clutchSlipping:true,slipRadPerSecond:100}),0);
});
test('automatic reverse requires stopping, neutral removes drive and engine can restart without clutch',()=>{
  const s=createState();run(s,2);
  assert.match(selectAutomaticRange(s,'R'),/Stop/);run(s,4,{throttle:0,brake:1});
  assert.equal(selectAutomaticRange(s,'R'),'');run(s,2,{throttle:.3});assert.ok(s.speed<0);
  assert.match(selectAutomaticRange(s,'D'),/Stop/);run(s,3,{throttle:0,brake:1});
  assert.equal(selectAutomaticRange(s,'N'),'');run(s,1,{throttle:0});assert.equal(s.gear,0);
  assert.match(selectGear(s,5,cars.mustang),/automatically/);
  s.running=false;s.clutch=0;s.gear=1;assert.equal(start(s,cars.mustang),true);
  assert.equal(drivingAdvice(s,cars.mustang,{fuelLiters:20,bitePoint:.84}),null);
});
test('tutorial progresses by driving and a deliberate stop, then emits crash and replacement once',()=>{
  const intro=createIntro(),s={speed:10,brake:0};
  for(let i=0;i<50;i++)advanceIntro(intro,s,.1);
  assert.equal(intro.phase,'brake');assert.match(introAdvice(intro,'controller').text,/LB/);
  for(let i=0;i<10;i++)advanceIntro(intro,{speed:0,brake:0},.1);assert.equal(intro.phase,'brake');
  for(let i=0;i<7;i++)advanceIntro(intro,{speed:0,brake:1},.1);assert.equal(intro.phase,'final-drive');
  const events=[];for(let i=0;i<100;i++){const event=advanceIntro(intro,s,.1);if(event)events.push(event);}
  assert.deepEqual(events,['crash','replacement']);assert.equal(intro.phase,'replacement');
});
test('worn tutorial car is separate from career and never sold; replacement preserves progression',()=>{
  const career=createCareer('civic'),before=serializeCareer(career),temporary=createIntroCareer();
  assert.equal(temporary.activeVehicleId,'mustang');assert.ok(temporary.vehicles.mustang.parts.engine.health<.5);
  temporary.vehicles.mustang.parts.engine.health=0;
  assert.equal(serializeCareer(career),before);assert.equal(career.vehicles.mustang,undefined);
  assert.equal(DEALERSHIP.pricesCents.mustang,undefined);
  let unlocked=donateToCity(career,'community-park',10000,'park');unlocked=donateToCity(unlocked,'road-renewal',15000,'roads');
  assert.throws(()=>buyVehicle(unlocked,'mustang','tutorial-purchase'),/tutorial-only/);
  const restored=replacementCareer(career);assert.equal(restored.activeVehicleId,'civic');
  assert.deepEqual(restored.vehicles,career.vehicles);assert.deepEqual(restored.transactions,career.transactions);
  assert.deepEqual(parseCareer(before),career);
});
test('worn automatic drivetrain can complete the playable drive-stop-drive sequence',()=>{
  const intro=createIntro(),career=createIntroCareer(),s=createState();s.roadMode='grid';
  const car={...cars.mustang,peakTorque:cars.mustang.peakTorque*(.35+.65*career.vehicles.mustang.parts.engine.health),horsepower:cars.mustang.horsepower*(.35+.65*career.vehicles.mustang.parts.engine.health)};
  const events=[];
  for(let i=0;i<8000&&intro.phase!=='replacement';i++){
    const brake=intro.phase==='brake'?1:0;
    step(s,{...input,throttle:brake?0:.65,brake},car,.01);
    const event=advanceIntro(intro,s,.01);if(event){events.push(event);if(event==='crash'){s.speed=0;s.running=false;s.blown=true;}}
  }
  assert.equal(intro.phase,'replacement');assert.deepEqual(events,['crash','replacement']);
});
