import test from 'node:test';
import assert from 'node:assert/strict';
import {cars,createState} from '../src/physics.js';
import {rumbleLevels} from '../src/feedback.js';

test('rumble is faint at idle, grows under load, and warns before stall',()=>{
 const s=createState();
 const neutral=rumbleLevels(s,cars.eclipse,0);
 assert.ok(neutral.strong<.03&&neutral.weak<.04);
 s.gear=2;s.clutch=0;s.rpm=1800;s.throttle=.4;
 const lowGear=rumbleLevels(s,cars.eclipse,0);
 s.rpm=5000;s.throttle=.9;
 const highGear=rumbleLevels(s,cars.eclipse,0);
 assert.ok(lowGear.strong>neutral.strong);
 assert.ok(highGear.strong>lowGear.strong+.1);
 const civicBase=rumbleLevels(s,cars.civic,0);
 assert.ok(highGear.strong>civicBase.strong);
 s.boost=1;
 assert.ok(rumbleLevels(s,cars.civic,0).weak>civicBase.weak+.1);
 s.rpm=500;
 assert.ok(rumbleLevels(s,cars.civic,0).strong>.5);
 s.running=false;
 assert.deepEqual(rumbleLevels(s,cars.civic,0),{strong:0,weak:0});
});

test('Eclipse vibration climbs evenly with revs; Civic gains a boost hit',()=>{
 const s=createState();s.gear=2;s.clutch=0;s.throttle=1;
 const v6=[2000,3500,5000].map(rpm=>{s.rpm=rpm;return rumbleLevels(s,cars.eclipse,0).strong;});
 assert.ok(Math.abs((v6[1]-v6[0])-(v6[2]-v6[1]))<.001);
 s.rpm=3500;s.boost=.3;const before=rumbleLevels(s,cars.civic,0);
 s.boost=.7;const after=rumbleLevels(s,cars.civic,0);
 assert.ok(after.strong>before.strong+.12);
 assert.ok(after.weak>before.weak+.17);
});
