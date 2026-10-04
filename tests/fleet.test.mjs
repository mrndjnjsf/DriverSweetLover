import { createLegacyCareer as createCareer } from './fixtures/legacy-career.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { donateToCity, awardDragWin, recordDriverWin, buyVehicle, switchVehicle, setVehicleCondition, setVehicleAppearance, assignDriver, reclaimDriverCar, advanceFleet, fundDriverReserve, serializeCareer, parseCareer, applyFine, purchaseFuel, loadCareer, saveCareer, SAVE_KEY } from '../src/career.js';
import { createVehicleCondition } from '../src/condition.js';
import { driverAvailable, activeVehicle, fleetJobQuote } from '../src/fleet.js';
import { FLEET } from '../src/config/fleet.js';

function unlocked(){
  let career=createCareer();
  for(let i=1;i<=3;i++){career=awardDragWin(career,`kai-${i}`,20);career=recordDriverWin(career,'kai',`kai-${i}`);}
  career=donateToCity(career,'community-park',10000,'park');
  career=donateToCity(career,'road-renewal',15000,'roads');
  return career;
}
const runJob=career=>{for(let i=0;i<FLEET.jobSeconds;i++)career=advanceFleet(career,1).career;return career;};

test('legacy migration preserves wallet, parts, fuel, jobs and both starter cars',()=>{
  const current=unlocked(),legacy=structuredClone(current);
  legacy.schemaVersion=1;delete legacy.fleet;delete legacy.vehicleMeta;
  legacy.vehicles.civic.parts.clutch.health=.4;legacy.vehicles.civic.fuelLiters=12;
  const loaded=parseCareer(JSON.stringify({version:1,career:legacy}));
  assert.equal(loaded.schemaVersion,2);assert.equal(loaded.walletCents,current.walletCents);
  assert.equal(loaded.vehicles.civic.parts.clutch.health,.4);assert.equal(loaded.vehicles.civic.fuelLiters,12);
  assert.equal(Object.keys(loaded.vehicles).length,2);assert.equal(loaded.fleet.drivers.kai.wins,0);
  assert.deepEqual(loaded.jobs,legacy.jobs);assert.deepEqual(loaded.transactions,legacy.transactions);
  const raw=JSON.stringify({version:1,career:legacy}),entries=new Map([[SAVE_KEY,raw]]);
  const storage={getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value)};
  assert.equal(loadCareer(storage).recovered,false);
  saveCareer(storage,loaded);
  assert.equal(entries.get(SAVE_KEY+':backup:v1'),raw);
  assert.equal(JSON.parse(entries.get(SAVE_KEY)).version,2);
  saveCareer(storage,loaded);assert.equal(entries.get(SAVE_KEY+':backup:v1'),raw);
});

test('duplicate cars have separate condition, fuel, paint and idempotent purchases',()=>{
  assert.throws(()=>buyVehicle(createCareer(),'civic','early'),/renewal/);
  const career=unlocked(),purchased=buyVehicle(career,'civic','purchase-1'),id='owned:purchase-1';
  assert.equal(purchased.walletCents,career.walletCents-35000);
  assert.equal(buyVehicle(purchased,'civic','purchase-1').walletCents,purchased.walletCents);
  assert.throws(()=>buyVehicle(purchased,'eclipse','purchase-1'),/already used/);
  assert.throws(()=>buyVehicle(purchased,'civic','fleet:kai:1'),/reserved/);
  let selected=switchVehicle(purchased,id),worn=createVehicleCondition('civic');
  worn.parts.clutch.health=.2;worn.fuelLiters=3;
  selected=setVehicleAppearance(setVehicleCondition(selected,worn),'template-race');
  assert.equal(selected.vehicles.civic.parts.clutch.health,1);
  assert.equal(selected.vehicles.civic.fuelLiters,47);
  assert.equal(activeVehicle(selected).parts.clutch.health,.2);
  assert.equal(selected.vehicleMeta.civic.appearance,'original');
  assert.equal(selected.vehicleMeta[id].appearance,'template-race');
  selected=purchaseFuel(selected,'fill-extra');assert.equal(activeVehicle(selected).fuelLiters,47);
  assert.equal(selected.transactions.at(-1).vehicleId,id);
  assert.deepEqual(parseCareer(serializeCareer(selected)),selected);
  assert.throws(()=>buyVehicle(applyFine(career,{id:'empty',reason:'Test',amountCents:100000}),'civic','poor'),/Not enough/);
  const forged=structuredClone(selected);forged.vehicles.fake=createVehicleCondition('civic');forged.vehicleMeta.fake={id:'fake',modelId:'civic',appearance:'original'};
  assert.throws(()=>serializeCareer(forged),/purchase/);
});

test('friendship requires unique paid wins plus city milestone, not repeated win events',()=>{
  let career=createCareer();
  assert.throws(()=>recordDriverWin(career,'kai','unpaid'),/completed paid/);
  for(let i=1;i<=3;i++){career=awardDragWin(career,`win-${i}`,20);career=recordDriverWin(career,'kai',`win-${i}`);career=recordDriverWin(career,'kai',`win-${i}`);}
  assert.equal(career.fleet.drivers.kai.wins,3);assert.equal(driverAvailable(career,'kai'),false);
  career=donateToCity(career,'community-park',10000,'park');assert.equal(driverAvailable(career,'kai'),true);
  assert.throws(()=>assignDriver(career,'kai','eclipse'),/spare car/);
  career=assignDriver(career,'kai','civic');
  assert.throws(()=>switchVehicle(career,'civic'),/reclaim/);
  assert.throws(()=>assignDriver(career,'kai','civic'),/Reclaim/);
  assert.throws(()=>setVehicleCondition(career,createVehicleCondition('civic')),/Reclaim/);
  assert.equal(switchVehicle(reclaimDriverCar(career,'kai'),'civic').activeVehicleId,'civic');
});

test('fleet jobs pay once with seeded fuel, reserve and owner accounting, preserving the driven car',()=>{
  const original=assignDriver(unlocked(),'kai','civic'),before=structuredClone(original.vehicles.eclipse);
  const result=runJob(original),driver=result.fleet.drivers.kai,receipt=result.transactions.at(-1);
  assert.equal(receipt.type,'fleet');assert.equal(receipt.jobNumber,1);
  assert.equal(receipt.amountCents,Math.floor(receipt.netCents*.1));
  assert.equal(receipt.grossCents,receipt.fuelCents+receipt.reserveCents+receipt.ownerCents+receipt.driverCents);
  assert.equal(result.walletCents,original.walletCents+receipt.ownerCents);
  assert.equal(driver.reserveCents,receipt.reserveCents-receipt.maintenanceCents);
  assert.ok(Math.abs(result.vehicles.civic.odometerKm-1)<1e-10);
  assert.ok(result.vehicles.civic.parts.clutch.health<1);
  assert.equal(result.vehicles.civic.fuelLiters,47);
  assert.deepEqual(result.vehicles.eclipse,before);
  assert.deepEqual(runJob(original),result);
  assert.deepEqual(advanceFleet(result,0).career,result);
  assert.deepEqual(parseCareer(serializeCareer(result)),result);
  const next=runJob(parseCareer(serializeCareer(result)));assert.equal(next.fleet.drivers.kai.jobNumber,2);
  assert.deepEqual(next.transactions.filter(item=>item.type==='fleet').map(item=>item.id),['fleet:kai:1','fleet:kai:2']);
  const partial=advanceFleet(original,1).career,reassigned=assignDriver(reclaimDriverCar(partial,'kai'),'kai','civic');
  assert.equal(reassigned.fleet.drivers.kai.elapsedSeconds,0);
  const bad=structuredClone(result);bad.fleet.drivers.kai.reserveCents++;assert.throws(()=>serializeCareer(bad),/reserve/);
});

test('unsafe cars pause work; maintenance uses a reserve and cannot silently drain the wallet',()=>{
  let career=unlocked(),worn=createVehicleCondition('civic');worn.oil.condition=.4;
  career=setVehicleCondition(career,worn);career=assignDriver(career,'kai','civic');
  const paused=advanceFleet(career,1).career;
  assert.match(paused.fleet.drivers.kai.pausedReason,/reserve/);
  assert.equal(paused.walletCents,career.walletCents);assert.equal(paused.vehicles.civic.odometerKm,0);
  const funded=fundDriverReserve(paused,'kai',10000,'reserve-1');
  assert.equal(fundDriverReserve(funded,'kai',10000,'reserve-1').walletCents,funded.walletCents);
  const finished=runJob(funded);
  assert.ok(finished.vehicles.civic.oil.condition>.9);
  assert.ok(finished.transactions.at(-1).maintenanceCents>0);
  assert.equal(finished.walletCents,funded.walletCents+finished.transactions.at(-1).ownerCents);
  assert.deepEqual(parseCareer(serializeCareer(finished)),finished);
  const empty=createVehicleCondition('civic');empty.fuelLiters=0;
  const noFuel=setVehicleCondition(unlocked(),empty);assert.throws(()=>assignDriver(noFuel,'kai','civic'),/Refuel/);
  assert.match(fleetJobQuote(empty,finished.fleet.drivers.kai).problem,/Refuel/);
  assert.throws(()=>advanceFleet(career,60),/one second/);
  assert.throws(()=>fundDriverReserve(paused,'kai',100,'fleet:kai:1'),/reserved/);
});

test('garage capacity and reload validation prevent duplicate or fabricated ownership and payouts',()=>{
  let career=unlocked();for(let i=0;i<20;i++)career=awardDragWin(career,`budget-${i}`,20);
  for(let i=0;i<6;i++)career=buyVehicle(career,'eclipse',`extra-${i}`);
  assert.equal(Object.keys(career.vehicles).length,8);
  assert.throws(()=>buyVehicle(career,'civic','over-capacity'),/full/);
  const modern=JSON.parse(serializeCareer(career));delete modern.career.vehicles.eclipse.fuelLiters;
  assert.throws(()=>parseCareer(JSON.stringify(modern)),/fuelLiters/);
  const job=runJob(assignDriver(unlocked(),'kai','civic'));
  const tampered=structuredClone(job);tampered.transactions.at(-1).driverCents++;
  assert.throws(()=>serializeCareer(tampered),/fleet payout/);
  const inactive=structuredClone(job);inactive.activeVehicleId='civic';assert.throws(()=>serializeCareer(inactive),/assignment/);
  assert.throws(()=>switchVehicle(career,'__proto__'),/Unknown/);
});
