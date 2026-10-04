import { createLegacyCareer as createCareer } from './fixtures/legacy-career.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {fuelCapacity,fuelUsed,fuelFillQuote} from '../src/fuel.js';
import {purchaseFuel,setVehicleCondition,serializeCareer,parseCareer} from '../src/career.js';
import {applyDrivingWear,createVehicleCondition} from '../src/condition.js';
import {createGridMap,importGridMap} from '../src/grid-map.js';

test('hard, fast driving burns more fuel and an idle engine still consumes a little',()=>{
 const base={vehicleId:'civic',dtSeconds:1,running:true};
 const idle=fuelUsed(base);
 const cruise=fuelUsed({...base,speedMps:25,throttle:.2,engineRpm:2500});
 const hard=fuelUsed({...base,speedMps:45,throttle:1,engineRpm:6500});
 assert.ok(idle>0&&cruise>idle&&hard>cruise);
 assert.equal(fuelUsed({...base,running:false,speedMps:20}),0);
});

test('fuel purchase fills only the selected car, charges once, and survives reload',()=>{
 let career=createCareer();
 const worn=applyDrivingWear(career.vehicles.eclipse,{dtSeconds:1,speedMps:45,throttle:1,engineRpm:6000});
 career=setVehicleCondition(career,worn);
 const quote=fuelFillQuote('eclipse',worn.fuelLiters);
 assert.ok(quote.liters>0);
 const paid=purchaseFuel(career,'fuel:test');
 assert.equal(paid.vehicles.eclipse.fuelLiters,fuelCapacity('eclipse'));
 assert.equal(paid.vehicles.civic.fuelLiters,fuelCapacity('civic'));
 assert.equal(paid.walletCents,career.walletCents-quote.totalCents);
 assert.equal(purchaseFuel(paid,'fuel:test').transactions.length,1);
 assert.equal(parseCareer(serializeCareer(paid)).vehicles.eclipse.fuelLiters,fuelCapacity('eclipse'));
});

test('older saves without tanks load with full tanks',()=>{
 const envelope=JSON.parse(serializeCareer(createCareer()));
 envelope.version=1;envelope.career.schemaVersion=1;delete envelope.career.vehicleMeta;delete envelope.career.fleet;
 delete envelope.career.vehicles.eclipse.fuelLiters;
 delete envelope.career.vehicles.civic.fuelLiters;
 const loaded=parseCareer(JSON.stringify(envelope));
 assert.equal(loaded.vehicles.eclipse.fuelLiters,67);
 assert.equal(loaded.vehicles.civic.fuelLiters,47);
 const condition=createVehicleCondition('civic');condition.fuelLiters=40;
 const paid=purchaseFuel(setVehicleCondition(createCareer(),condition),'old-fill','civic');
 const oldReceipt=JSON.parse(serializeCareer(paid));oldReceipt.version=1;oldReceipt.career.schemaVersion=1;
 delete oldReceipt.career.vehicleMeta;delete oldReceipt.career.fleet;delete oldReceipt.career.transactions[0].unitPriceCents;
 const migrated=parseCareer(JSON.stringify(oldReceipt));
 assert.equal(migrated.walletCents,paid.walletCents);
 assert.equal(migrated.transactions[0].unitPriceCents,110);
 assert.equal(migrated.transactions[0].amountCents,-770);
});

test('free reset restores one car without changing money or the other car',()=>{
 let career=createCareer();
 const worn=applyDrivingWear(career.vehicles.eclipse,{dtSeconds:1,speedMps:45,throttle:1,engineRpm:6000});
 career=setVehicleCondition(career,worn);
 const restored=setVehicleCondition(career,createVehicleCondition('eclipse'));
 assert.equal(restored.vehicles.eclipse.fuelLiters,67);
 assert.equal(restored.vehicles.eclipse.parts.engine.health,1);
 assert.equal(restored.walletCents,career.walletCents);
 assert.deepEqual(restored.vehicles.civic,career.vehicles.civic);
});

test('old edited maps gain a gas station on import',()=>{
 const old=createGridMap();
 old.locations=old.locations.filter(location=>location.kind!=='fuel');
 const imported=importGridMap(JSON.stringify(old));
 assert.ok(imported.locations.some(location=>location.kind==='fuel'));
});
