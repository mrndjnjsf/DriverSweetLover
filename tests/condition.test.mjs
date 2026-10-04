import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createVehicleCondition, applyDrivingWear, applyImpactDamage,
  applyShiftWear, clutchFrictionWork, getServiceQuote, applyService, conditionSummary, performanceModifiers,
} from '../src/condition.js';

const launch = clutchPosition => ({
  dtSeconds: 1, speedMps: 4, engineRpm: 2500, throttle: .8,
  clutchPosition, slipRadPerSecond: 180, brake: 0,
});

test('hard gas through the release window wears; fully open and clean grip do not', () => {
  const initial = createVehicleCondition('eclipse');
  const slipping = applyDrivingWear(initial, { ...launch(.87), clutchReleasing: true, gear: 1 });
  const open = applyDrivingWear(initial, launch(1));
  const locked = applyDrivingWear(initial, launch(0));
  assert.ok(slipping.parts.clutch.health < 1);
  assert.equal(open.parts.clutch.health, 1);
  assert.equal(locked.parts.clutch.health, 1);
  assert.equal(initial.parts.clutch.health, 1, 'a sample must not mutate the saved state');
});

test('gentle release, free revs, and throttle after bite avoid launch scuff',()=>{
 const initial=createVehicleCondition('civic');
 const sample={...launch(.87),gear:1,clutchReleasing:true};
 for(const change of [{throttle:.5},{gear:0},{running:false},{clutchPosition:.8},{clutchPosition:1},{clutchReleasing:false}]){
  assert.equal(applyDrivingWear(initial,{...sample,...change}).parts.clutch.health,1,JSON.stringify(change));
 }
});

test('frame accumulation catches a quick release and follows a worn bite point',()=>{
 let work=0;
 for(let i=0;i<30;i++)work+=clutchFrictionWork('civic',1,{...launch(1-i*.8/60),dtSeconds:1/60,gear:1,clutchReleasing:true,throttle:1});
 assert.ok(work>0);
 const initial=createVehicleCondition('civic');
 assert.ok(applyDrivingWear(initial,{dtSeconds:.5,clutchWorkJ:work}).parts.clutch.health<1);
 const worn=createVehicleCondition('civic');worn.parts.clutch.health=.4;
 const bite=performanceModifiers(worn).clutchBitePoint;
 assert.ok(clutchFrictionWork('civic',.4,{...launch(bite+.01),gear:1,clutchReleasing:true})>0);
 assert.equal(clutchFrictionWork('civic',.4,{...launch(bite-.01),gear:1,clutchReleasing:true}),0);
});

test('an early successful shift damages the clutch but a fully depressed shift does not', () => {
  const initial = createVehicleCondition('civic');
  const early = applyShiftWear(initial, .86);
  const almostFull = applyShiftWear(initial, .98);
  const full = applyShiftWear(initial, 1);
  assert.ok(early.parts.clutch.health < almostFull.parts.clutch.health);
  assert.ok(almostFull.parts.clutch.health < 1);
  assert.equal(full.parts.clutch.health, 1);
  assert.equal(initial.parts.clutch.health, 1);
});

test('clutch wear raises the bite point, weakens grip, and permits wear from engaged slip', () => {
  const healthy = createVehicleCondition('eclipse');
  const worn = createVehicleCondition('eclipse');
  worn.parts.clutch.health = .4;
  const healthyTuning = performanceModifiers(healthy), wornTuning = performanceModifiers(worn);
  assert.equal(healthyTuning.clutchBitePoint, .84);
  assert.ok(wornTuning.clutchBitePoint > .9);
  assert.ok(wornTuning.clutchCapacity < healthyTuning.clutchCapacity * .5);
  const slipping = applyDrivingWear(worn, { ...launch(0), clutchSlipping: true });
  assert.ok(slipping.parts.clutch.health < worn.parts.clutch.health);
  assert.equal(applyDrivingWear(worn, launch(0)).parts.clutch.health, worn.parts.clutch.health);
});

test('braking wears pads and rotors while coasting does not', () => {
  const initial = createVehicleCondition('civic');
  const sample = { dtSeconds: 1, speedMps: 20, brake: 1 };
  const braking = applyDrivingWear(initial, sample);
  const coasting = applyDrivingWear(initial, { ...sample, brake: 0 });
  assert.ok(braking.parts.brakePads.health < coasting.parts.brakePads.health);
  assert.ok(braking.parts.brakeRotors.health < coasting.parts.brakeRotors.health);
  assert.ok(braking.parts.brakePads.health < braking.parts.brakeRotors.health);
});

test('neglected oil increases engine wear; changing oil does not restore engine health', () => {
  let neglected = createVehicleCondition('civic');
  neglected.oil.distanceKm = 449;
  neglected.oil.condition = .002;
  const fresh = createVehicleCondition('civic');
  const sample = { dtSeconds: 1, distanceKm: .1, speedMps: 50, engineRpm: 4500, throttle: 1 };
  const oldOilDrive = applyDrivingWear(neglected, sample);
  const freshOilDrive = applyDrivingWear(fresh, sample);
  assert.ok(oldOilDrive.parts.engine.health < freshOilDrive.parts.engine.health);
  const serviced = applyService(oldOilDrive, { type: 'oil-change' });
  assert.equal(serviced.oil.condition, 1);
  assert.equal(serviced.parts.engine.health, oldOilDrive.parts.engine.health);
  assert.equal(conditionSummary(oldOilDrive).oilServiceDue, true);
});

test('service quotes determine cost, upgrades affect performance, and impact hits the correct bumper', () => {
  const initial = createVehicleCondition('eclipse');
  assert.equal(getServiceQuote(initial, { type: 'upgrade', partKey: 'clutch' }).totalCents, 132_000);
  const upgraded = applyService(initial, { type: 'upgrade', partKey: 'clutch' });
  assert.ok(performanceModifiers(upgraded).clutchCapacity > performanceModifiers(initial).clutchCapacity);
  assert.throws(() => getServiceQuote(upgraded, { type: 'upgrade', partKey: 'clutch' }));
  const crashed = applyImpactDamage(upgraded, { end: 'front', impactSpeedMps: 10 });
  assert.ok(crashed.parts.frontBumper.health < 1);
  assert.equal(crashed.parts.rearBumper.health, 1);
});
