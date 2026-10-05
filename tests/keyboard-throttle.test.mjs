import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceKeyboardThrottle as advance,createKeyboardThrottle,advanceThrottlePressure as pressure} from '../src/keyboard-throttle.js';

test('X builds more slowly near full and preserves frame-rate independence',()=>{
 assert.ok(advance(0,true,false,.2)>(advance(.8,true,false,.2)-.8)*2);
 assert.equal(advance(0,true,false,2.1),1);
 let value=0;for(let i=0;i<60;i++)value=advance(value,true,false,1/120);
 assert.ok(Math.abs(value-advance(0,true,false,.5))<1e-10);
});
test('Space reduces immediately, overrides X, and never goes below zero',()=>{
 assert.ok(Math.abs(advance(.7,false,true,.1)-.45)<1e-10);
 assert.ok(Math.abs(advance(.7,true,true,.1)-.45)<1e-10);
 assert.equal(advance(.2,false,true,.1),0);
 assert.equal(advance(.4,false,false,1),.4);
 assert.equal(advance(.4,true,false,-1),.4);
});
test('selected pressure loses one percentage point per second with frame-rate independence',()=>{
 let control=pressure(createKeyboardThrottle(),true,false,.4);
 const value=control.value;
 control=pressure(control,false,false,2);assert.ok(Math.abs(control.value-(value-.02))<1e-10);
 control=pressure(control,false,false,.1);assert.ok(control.value<value);
 control=pressure(control,true,false,.05);assert.equal(control.coastSeconds,0);
 let split={value:.8,coastSeconds:0};for(let i=0;i<360;i++)split=pressure(split,false,false,1/120);
 const whole=pressure({value:.8,coastSeconds:0},false,false,3);
 assert.ok(Math.abs(split.value-whole.value)<1e-10);
 assert.equal(pressure({value:1,coastSeconds:0},false,false,100).value,0);
 for(const value of [.3,.7,1])assert.ok(Math.abs(pressure({value,coastSeconds:0},false,false,1).value-(value-.01))<1e-10);
});
test('continued Space holding gently brakes only after throttle empties plus a two-second delay',()=>{
 let control={...createKeyboardThrottle(),value:1};
 control=pressure(control,false,true,.4);assert.equal(control.value,0);assert.equal(control.brake,0);
 control=pressure(control,false,true,2);assert.equal(control.brake,0);
 control=pressure(control,false,true,.5);assert.ok(Math.abs(control.brake-.175)<1e-10);
 control=pressure(control,false,true,1);assert.equal(control.brake,.35);
 control=pressure(control,false,false,.01);assert.equal(control.brake,0);assert.equal(control.emptyHeldSeconds,0);
 control=pressure(control,false,true,1);assert.equal(control.brake,0);
 control=pressure(control,true,false,.1);assert.ok(control.value>0);assert.equal(control.brake,0);
 let split={...createKeyboardThrottle(),value:1};for(let i=0;i<360;i++)split=pressure(split,false,true,1/120);
 const whole=pressure({...createKeyboardThrottle(),value:1},false,true,3);
 assert.ok(Math.abs(split.brake-whole.brake)<1e-10);
});
