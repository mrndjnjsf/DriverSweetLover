import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceKeyboardClutch} from '../src/keyboard-clutch.js';

test('holding Ctrl builds clutch pressure over about two-thirds of a second',()=>{
 let pressure=0;
 for(let i=0;i<30;i++)pressure=advanceKeyboardClutch(pressure,true,1/60);
 assert.ok(Math.abs(pressure-.75)<1e-10);
 for(let i=0;i<10;i++)pressure=advanceKeyboardClutch(pressure,true,1/60);
 assert.equal(pressure,1);
});

test('releasing Ctrl engages the clutch gradually over about 1.25 seconds',()=>{
 let pressure=1;
 for(let i=0;i<60;i++)pressure=advanceKeyboardClutch(pressure,false,1/60);
 assert.ok(Math.abs(pressure-.2)<1e-10);
 for(let i=0;i<15;i++)pressure=advanceKeyboardClutch(pressure,false,1/60);
 assert.ok(pressure<=1e-10);
});
