import test from 'node:test';
import assert from 'node:assert/strict';
import {cars,createState} from '../src/physics.js';
import {torqueCameraPull,easeCameraPull} from '../src/camera-response.js';

test('chase pull follows the strong torque band and catches up afterward',()=>{
 const s=createState();s.gear=2;s.clutch=0;s.throttle=1;s.accel=3.5;
 s.rpm=1500;const low=torqueCameraPull(s,cars.eclipse);
 s.rpm=4000;const peak=torqueCameraPull(s,cars.eclipse);
 s.rpm=6500;const pastPeak=torqueCameraPull(s,cars.eclipse);
 assert.ok(peak>low+1.5);
 assert.ok(peak>3.6);
 assert.ok(pastPeak<peak*.25);
 let pull=0;for(let i=0;i<30;i++)pull=easeCameraPull(pull,peak,.01);
 assert.ok(pull>peak*.9);
 for(let i=0;i<100;i++)pull=easeCameraPull(pull,pastPeak,.01);
 assert.ok(pull<peak*.3);
});

test('camera stays close while coasting or clutching, and Civic waits for boost',()=>{
 const s=createState();s.gear=2;s.clutch=0;s.throttle=1;s.accel=3.5;s.rpm=4000;
 const unboosted=torqueCameraPull(s,cars.civic);
 s.boost=1;const boosted=torqueCameraPull(s,cars.civic);
 assert.ok(boosted>unboosted+1);
 s.throttle=0;assert.equal(torqueCameraPull(s,cars.civic),0);
 s.throttle=1;s.clutch=1;assert.equal(torqueCameraPull(s,cars.civic),0);
 s.clutch=0;s.gear=0;assert.equal(torqueCameraPull(s,cars.civic),0);
});
