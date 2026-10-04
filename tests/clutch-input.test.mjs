import test from 'node:test';
import assert from 'node:assert/strict';
import {createClutchInput,toggleClutchInput,readClutchInput} from '../src/clutch-input.js';

test('pressure clutch builds, holds at bite, and releases gradually',()=>{
 let clutch=createClutchInput('pressure',0);
 clutch=readClutchInput(clutch,1,.2);
 assert.ok(Math.abs(clutch.value-.0875)<1e-9); // A single long frame is capped.
 for(let i=0;i<6;i++)clutch=readClutchInput(clutch,1,.05);
 assert.ok(clutch.value>.5&&clutch.value<.7);
 const bite=readClutchInput(clutch,.45,.05);
 assert.equal(bite.value,clutch.value);
 const released=readClutchInput(bite,0,.05);
 assert.ok(released.value<bite.value&&released.value>0);
});

test('L3 mode change preserves effective clutch position',()=>{
 const direct=createClutchInput('direct',.54);
 const pressure=toggleClutchInput(direct);
 assert.equal(pressure.mode,'pressure');
 assert.equal(pressure.value,.54);
 assert.equal(readClutchInput(pressure,.45,.016).value,.54);
 assert.equal(toggleClutchInput(pressure).value,.54);
});
