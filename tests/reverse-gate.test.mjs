import test from 'node:test';
import assert from 'node:assert/strict';
import { cars, createState, selectGear } from '../src/physics.js';
import { reverseGate, positionForGear, throwLever, readStick } from '../src/shifter.js';
import { createMouseShifter, moveMouseShifter, MOUSE_THROW_PX } from '../src/mouse-shifter.js';

for(const id of ['eclipse','civic'])test(`${id} reverse has an outer H-pattern lane and exits through neutral`,()=>{
 const gate=reverseGate(cars[id]),side=Math.sign(gate.lane),direction=gate.row<0?'up':'down';
 let position={lane:side,row:0,gear:0},cursor=createMouseShifter(position);
 let moved=moveMouseShifter(cursor,position,side*MOUSE_THROW_PX,0,0,gate);
 assert.equal(moved.position.lane,gate.lane);
 moved=moveMouseShifter(moved.cursor,moved.position,0,gate.row*MOUSE_THROW_PX,1,gate);
 assert.deepEqual(moved.position,positionForGear(-1,gate));
 assert.equal(throwLever({lane:gate.lane,row:0,gear:0},direction,gate).gear,-1);
 assert.equal(throwLever({lane:gate.lane,row:0,gear:0},direction==='up'?'down':'up',gate),null);
 assert.deepEqual(throwLever(moved.position,direction==='up'?'down':'up',gate),{lane:gate.lane,row:0,gear:0});
 const quick=readStick(position,side,0,true,0,100,0,null,gate);
 assert.equal(quick.position.lane,side);
 const held=readStick(quick.position,side,0,true,0,451,0,null,gate,quick.outerSince);
 assert.equal(held.position.lane,gate.lane);
 const stayed=readStick(held.position,side,0,true,0,452,0,null,gate,held.outerSince);
 assert.equal(stayed.position.lane,gate.lane);
});

test('reverse rejects any forward motion without changing gear and accepts stopped or backward movement',()=>{
 const state=createState();state.roadMode='grid';state.clutch=1;
 for(const speed of [.001,.4,30]){state.speed=speed;assert.match(selectGear(state,-1,cars.eclipse),/Stop/);assert.equal(state.gear,0);}
 state.speed=0;assert.equal(selectGear(state,-1,cars.eclipse),'');
 state.gear=0;state.speed=-.5;assert.equal(selectGear(state,-1,cars.civic),'');
});
