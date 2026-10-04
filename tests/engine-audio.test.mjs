import test from 'node:test';
import assert from 'node:assert/strict';
import {cars,createState} from '../src/physics.js';
import {engineTone} from '../src/engine-audio.js';

test('Eclipse adds low V6 body and firing pulses as RPM and load rise',()=>{
 const s=createState(),idle=engineTone(s,cars.eclipse);
 assert.ok(idle.bodyGain>0&&idle.pulseDepth>0);
 s.gear=3;s.clutch=0;s.throttle=.8;s.rpm=4500;
 const loaded=engineTone(s,cars.eclipse);
 assert.ok(loaded.bodyFrequency>idle.bodyFrequency);
 assert.ok(loaded.bodyGain>idle.bodyGain);
 assert.ok(loaded.mainGain>idle.mainGain);
 assert.ok(loaded.cutoff>idle.cutoff);
});

test('Civic keeps its lighter tone and stalled engines fall silent',()=>{
 const s=createState(),civic=engineTone(s,cars.civic),eclipse=engineTone(s,cars.eclipse);
 assert.equal(civic.bodyGain,0);
 assert.ok(civic.cutoff>eclipse.cutoff);
 s.running=false;
 for(const car of Object.values(cars)){
  const stopped=engineTone(s,car);
  assert.equal(stopped.mainGain,0);
  assert.equal(stopped.bodyGain,0);
 }
});
