import test from 'node:test';
import assert from 'node:assert/strict';
import {createCareer, configurePedals, purchaseService, setVehicleCondition, saveCareer,loadCareer} from '../src/career.js';
import {createVehicleCondition,applyDrivingWear,performanceModifiers,resetVehicleCondition} from '../src/condition.js';
import {controlSettings} from '../src/control-tuning.js';
import {advanceKeyboardThrottle} from '../src/keyboard-throttle.js';
import {advanceKeyboardClutch} from '../src/keyboard-clutch.js';
import {readClutchInput,createClutchInput} from '../src/clutch-input.js';
import {cars,createState,step,availableTorque} from '../src/physics.js';

function upgraded(){const car=createVehicleCondition('civic');for(const part of ['engine','clutch'])car.parts[part].sku=`civic:${part}:upgraded`;return car;}
test('upgrades improve pedal response without repairing or eliminating wear',()=>{
 const stock=createVehicleCondition('civic'),car=upgraded(),a=controlSettings(stock),b=controlSettings(car);
 assert.ok(advanceKeyboardThrottle(0,true,false,.3,b.throttle)>advanceKeyboardThrottle(0,true,false,.3,a.throttle));
 assert.ok(b.throttle.keyboardPressureTaper<a.throttle.keyboardPressureTaper);
 assert.ok(advanceKeyboardClutch(0,true,.3,b.clutch)>advanceKeyboardClutch(0,true,.3,a.clutch));
 assert.ok(advanceKeyboardClutch(1,false,.3,b.clutch)>advanceKeyboardClutch(1,false,.3,a.clutch));
 assert.ok(readClutchInput(createClutchInput('pressure',0),1,.05,b.clutch).value>readClutchInput(createClutchInput('pressure',0),1,.05,a.clutch).value);
 assert.equal(readClutchInput(createClutchInput('direct',0),.6,.05,b.clutch).value,.6);
 const worn=applyDrivingWear(car,{dtSeconds:1,clutchWorkJ:10000});assert.ok(worn.parts.clutch.health<1);
});
test('per-car tuning is gated, changes bite point, and survives wear and saves',()=>{
 let career=createCareer('civic');assert.throws(()=>configurePedals(career,'clutch','low'),/Upgrade/);
 career=setVehicleCondition(career,upgraded());career=configurePedals(career,'clutch','low');
 const low=performanceModifiers(career.vehicles.civic).clutchBitePoint;
 career=configurePedals(career,'clutch','high');assert.ok(performanceModifiers(career.vehicles.civic).clutchBitePoint>low);
 career=configurePedals(career,'throttle','responsive');
 const worn=applyDrivingWear(career.vehicles.civic,{dtSeconds:1,clutchWorkJ:100});assert.deepEqual(worn.controlTune,career.vehicles.civic.controlTune);
 const entries=new Map(),storage={getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value)};
 saveCareer(storage,career);assert.deepEqual(loadCareer(storage).career.vehicles.civic.controlTune,{clutch:'high',throttle:'responsive'});
 assert.throws(()=>configurePedals(career,'clutch','unsafe'));
 const reset=resetVehicleCondition(worn);assert.deepEqual(reset.controlTune,worn.controlTune);assert.equal(reset.parts.clutch.health,1);assert.equal(reset.parts.clutch.sku,'civic:clutch:upgraded');
});

test('stock manual neutral RPM rise is scaled to 75 percent without lowering redline',()=>{
 const car=cars.eclipse,state={...createState(),rpm:1500,gear:0},dt=.0025;
 const expected=availableTorque(state,car)/car.engineInertia*dt*30/Math.PI*.75;
 step(state,{throttle:1,clutch:1,brake:0,steer:0,handbrake:false},car,dt);
 assert.ok(Math.abs(state.rpm-1500-expected)<1e-8);
 assert.equal(car.redline,6500);
});
