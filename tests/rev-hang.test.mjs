import test from 'node:test';
import assert from 'node:assert/strict';
import {cars,createState,step} from '../src/physics.js';

test('Civic has a brief unloaded rev hang without applying throttle; Eclipse drops immediately',()=>{
 const input={throttle:0,clutch:1,brake:0,steer:0};
 const hang=createState(),direct=createState(),eclipse=createState();
 for(const state of [hang,direct,eclipse]){state.rpm=4000;state.throttle=.7;}
 step(hang,input,cars.civic,.01);
 step(direct,input,{...cars.civic,revHangSeconds:0},.01);
 step(eclipse,input,cars.eclipse,.01);
 assert.equal(hang.throttle,0);assert.ok(hang.rpm>direct.rpm);
 assert.ok(eclipse.rpm<4000);assert.equal(eclipse.revHangRemaining,0);
 step(hang,input,cars.civic,.25);assert.equal(hang.revHangRemaining,0);
 const before=hang.rpm;step(hang,input,cars.civic,.01);assert.ok(hang.rpm<before);
});
