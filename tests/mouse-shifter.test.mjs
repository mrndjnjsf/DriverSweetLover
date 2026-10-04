import test from 'node:test';
import assert from 'node:assert/strict';
import {createMouseShifter,moveMouseShifter,mouseShifterDisplay,mouseEdgeDirections} from '../src/mouse-shifter.js';
import {neutralPosition} from '../src/shifter.js';

test('the longer gate requires a deliberate throw and catches each lane',()=>{
 let position=neutralPosition(),cursor=createMouseShifter(position);
 ({position,cursor}=moveMouseShifter(cursor,position,-90,0,0));
 assert.equal(position.gear,0);
 assert.equal(position.lane,0);
 assert.ok(mouseShifterDisplay(cursor,position).x<-.4,'the knob visibly follows a partial throw');
 ({position,cursor}=moveMouseShifter(cursor,position,-35,0,20));
 assert.equal(position.lane,-1);
 assert.equal(mouseShifterDisplay(cursor,position).x,-1);
 ({position,cursor}=moveMouseShifter(cursor,position,0,-125,40));
 assert.equal(position.gear,1);
 ({position,cursor}=moveMouseShifter(cursor,position,0,95,70));
 assert.equal(position.gear,1);
 ({position,cursor}=moveMouseShifter(cursor,position,0,30,100));
 assert.equal(position.gear,0);
 ({position,cursor}=moveMouseShifter(cursor,position,125,0,140));
 assert.equal(position.lane,0);
 ({position,cursor}=moveMouseShifter(cursor,position,0,-125,160));
 assert.equal(position.gear,3);
});

test('a continuous sideways sweep catches in center Neutral, then reaches the far lane',()=>{
 let position=neutralPosition(),cursor=createMouseShifter(position);
 ({position,cursor}=moveMouseShifter(cursor,position,-125,0,0));
 ({position,cursor}=moveMouseShifter(cursor,position,125,0,40));
 assert.equal(position.lane,0);
 for(let now=80;now<=240;now+=40)({position,cursor}=moveMouseShifter(cursor,position,220,0,now));
 assert.equal(position.lane,0);
 ({position,cursor}=moveMouseShifter(cursor,position,60,0,300));
 assert.equal(position.lane,0);
 ({position,cursor}=moveMouseShifter(cursor,position,65,0,340));
 assert.equal(position.lane,1);
});

test('a quick flick stops at center Neutral and can enter its gear immediately',()=>{
 let position=neutralPosition(),cursor=createMouseShifter(position);
 ({position,cursor}=moveMouseShifter(cursor,position,-125,0,0));
 ({position,cursor}=moveMouseShifter(cursor,position,400,0,20));
 assert.equal(position.lane,0);
 ({position,cursor}=moveMouseShifter(cursor,position,0,-125,40));
 assert.equal(position.gear,3);
});

test('a side notch permits an immediate vertical throw and a new sideways stroke after leaving gear',()=>{
 let position=neutralPosition(),cursor=createMouseShifter(position);
 ({position,cursor}=moveMouseShifter(cursor,position,125,0,0));
 assert.equal(position.lane,1);
 ({position,cursor}=moveMouseShifter(cursor,position,90,125,40));
 assert.equal(position.gear,6);
 ({position,cursor}=moveMouseShifter(cursor,position,0,-125,80));
 assert.equal(position.gear,0);
 ({position,cursor}=moveMouseShifter(cursor,position,-100,0,120));
 assert.equal(position.lane,1);
 ({position,cursor}=moveMouseShifter(cursor,position,-25,0,140));
 assert.equal(position.lane,0);
});

test('edge assistance only continues movement pushing into a window edge',()=>{
 assert.deepEqual(mouseEdgeDirections(4,600,1000,700,-5,0),{x:-1,y:0});
 assert.deepEqual(mouseEdgeDirections(996,3,1000,700,5,-4),{x:1,y:-1});
 assert.deepEqual(mouseEdgeDirections(996,697,1000,700,-5,-4),{x:0,y:0});
 assert.deepEqual(mouseEdgeDirections(500,350,1000,700,5,4),{x:0,y:0});
});
