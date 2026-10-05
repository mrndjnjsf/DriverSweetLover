import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceControllerThrottle as advance} from '../src/controller-throttle.js';
import {createKeyboardThrottle} from '../src/keyboard-throttle.js';

test('light RT builds proportionally and full RT slams with quick lift-off',()=>{
 const initial=createKeyboardThrottle();
 const light=advance(initial,.3,false,false,.2),heavy=advance(initial,.8,false,false,.2);
 assert.ok(light.value>0&&heavy.value>light.value);
 assert.equal(advance(initial,.04,false,false,1).value,0);
 const full=advance(initial,1,false,false,.01);assert.equal(full.value,1);
 const partialLift=advance(full,.7,false,false,.1);assert.equal(partialLift.value,.75);assert.equal(partialLift.quickRelease,true);
 assert.equal(advance(full,0,false,false,.4).value,0);
 assert.ok(Math.abs(advance(light,0,false,false,1).value-(light.value-.01))<1e-10);
});
test('RB reduces pressure and delays gentle brakes; LB overrides all throttle',()=>{
 let full=advance(createKeyboardThrottle(),1,false,false,.01);
 let release=advance(full,1,true,false,.1);assert.equal(release.value,.94);assert.equal(release.brake,0);
 release=advance(release,0,true,false,.94/.6);assert.equal(release.value,0);
 release=advance(release,0,true,false,2);assert.ok(release.brake<1e-9);
 release=advance(release,0,true,false,1);assert.equal(release.brake,.35);
 assert.equal(advance(release,0,false,false,.01).brake,0);
 const slammed=advance(full,1,true,true,.01);assert.equal(slammed.value,0);assert.equal(slammed.brake,0);
});
