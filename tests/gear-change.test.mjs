import test from 'node:test';
import assert from 'node:assert/strict';
import { cars, createState } from '../src/physics.js';
import { createVehicleCondition, performanceModifiers } from '../src/condition.js';
import { changeGearWithWear } from '../src/gear-change.js';

test('past-bite shifts into and out of gear succeed and wear the clutch', () => {
 const state = createState();
 let condition = createVehicleCondition('eclipse');
 const car = { ...cars.eclipse, ...performanceModifiers(condition) };
 let result = changeGearWithWear(state, 1, .85, car, condition);
 assert.equal(result.error, '');
 assert.equal(state.gear, 1);
 assert.ok(result.condition.parts.clutch.health < 1);
 condition = result.condition;
 result = changeGearWithWear(state, 0, .85, { ...cars.eclipse, ...performanceModifiers(condition) }, condition);
 assert.equal(result.error, '');
 assert.equal(state.gear, 0);
 assert.ok(result.condition.parts.clutch.health < condition.parts.clutch.health);
});

test('blocked shifts and fully depressed shifts do not add early wear', () => {
 const state = createState();
 const condition = createVehicleCondition('civic');
 const car = { ...cars.civic, ...performanceModifiers(condition) };
 const blocked = changeGearWithWear(state, 1, 0, car, condition);
 assert.match(blocked.error, /clutch/);
 assert.equal(state.gear, 0);
 assert.equal(blocked.condition, condition);
 const full = changeGearWithWear(state, 1, 1, car, condition);
 assert.equal(full.error, '');
 assert.equal(full.condition, condition);
});

test('early shifts work both into and out of gear and cost more below bite',()=>{
 const initial=createVehicleCondition('civic');
 const car={...cars.civic,...performanceModifiers(initial)};
 const shiftAt=clutch=>changeGearWithWear(createState(),1,clutch,car,initial);
 const before=shiftAt(.3),after=shiftAt(.9),full=shiftAt(1);
 assert.equal(before.error,'');
 assert.equal(after.error,'');
 assert.ok(before.condition.parts.clutch.health<after.condition.parts.clutch.health);
 assert.ok(after.condition.parts.clutch.health<full.condition.parts.clutch.health);
 const state={...createState(),gear:1};
 const out=changeGearWithWear(state,0,.3,car,initial);
 assert.equal(out.error,'');assert.equal(state.gear,0);
 assert.ok(out.condition.parts.clutch.health<1);
 const same=changeGearWithWear(state,0,.3,car,initial);
 assert.equal(same.condition,initial,'wiggling Neutral must not count as another gear change');
});
