import test from 'node:test';
import assert from 'node:assert/strict';
import {neutralSlide,readStick,neutralPosition,throwLever,positionForGear} from '../src/shifter.js';
import {cars,createState,selectGear,step,start} from '../src/physics.js';

test('Neutral slides directly with horizontal stick travel, then a vertical stroke selects the lane gear',()=>{
 assert.equal(neutralSlide(0),0);
 assert.ok(neutralSlide(-.5)<0&&neutralSlide(-.5)>-1);
 assert.equal(neutralSlide(-1),-1);
 let lever=neutralPosition(),armed=true;
 let stick=readStick(lever,-1,0,armed);
 assert.deepEqual(stick.position,{lane:-1,row:0,gear:0});
 assert.equal(stick.neutralX,-1);
 lever=stick.position;armed=stick.armed;
 stick=readStick(lever,-1,-1,armed);
 assert.equal(stick.direction,'up');
 lever=throwLever(stick.position,stick.direction);armed=stick.armed;
 assert.equal(lever.gear,1);
 assert.equal(readStick(lever,1,-1,armed).direction,null);
 stick=readStick(lever,-1,0,armed);armed=stick.armed;
 stick=readStick(lever,-1,1,armed);
 lever=throwLever(stick.position,stick.direction);armed=stick.armed;
 assert.deepEqual(lever,{lane:-1,row:0,gear:0});
 stick=readStick(lever,1,0,armed);
 assert.deepEqual(stick.position,neutralPosition());
 assert.equal(stick.neutralX,0);
 const caught=readStick(stick.position,1,0,stick.armed,stick.holdUntil,200,stick.centerDetentUntil);
 assert.deepEqual(caught.position,neutralPosition());
 const recentered=readStick(caught.position,0,0,caught.armed,caught.holdUntil,300,caught.centerDetentUntil);
 stick=readStick(recentered.position,1,0,recentered.armed,recentered.holdUntil,320,recentered.centerDetentUntil);
 assert.deepEqual(stick.position,{lane:1,row:0,gear:0});
 assert.equal(stick.neutralX,1);
 lever=stick.position;armed=stick.armed;
 stick=readStick(lever,1,-1,armed);
 assert.equal(throwLever(stick.position,stick.direction).gear,5);
 assert.equal(throwLever({lane:0,row:0,gear:0},'up').gear,3);
 assert.deepEqual(positionForGear(6),{lane:1,row:1,gear:6});
 assert.equal(throwLever({lane:1,row:0,gear:0},'down').gear,6);
 const s=createState();s.clutch=1;
 assert.match(selectGear(s,-1,cars.eclipse),/No reverse/);
});

test('leaving a gear holds its Neutral lane for one second before centering',()=>{
 const leftNeutral=throwLever(positionForGear(1),'down');
 const held=readStick(leftNeutral,0,0,false,1000,400);
 assert.deepEqual(held.position,leftNeutral);
 assert.equal(held.neutralX,-1);
 assert.equal(held.holdUntil,1000);
 const returnToFirst=readStick(leftNeutral,0,-1,held.armed,held.holdUntil,500);
 assert.equal(throwLever(returnToFirst.position,returnToFirst.direction).gear,1);
 const centered=readStick(leftNeutral,0,0,true,1000,1001);
 assert.deepEqual(centered.position,neutralPosition());
 assert.equal(centered.neutralX,0);
 const deliberateRight=readStick(leftNeutral,1,0,true,1000,400);
 assert.deepEqual(deliberateRight.position,neutralPosition());
 assert.equal(deliberateRight.centerDetentUntil,850);
 assert.equal(deliberateRight.holdUntil,0);
});

test('side Neutral lane allows a vertical throw after the horizontal stick springs back',()=>{
 for(const x of [-1,1]){
  const side=readStick(neutralPosition(),x,0,true,0,100);
  const released=readStick(side.position,0,0,true,0,200);
  assert.equal(released.position.lane,x);
  assert.equal(released.holdUntil,800);
  const upward=readStick(released.position,0,-1,released.armed,released.holdUntil,500);
  assert.equal(throwLever(upward.position,upward.direction).gear,x<0?1:5);
  assert.deepEqual(readStick(released.position,0,0,true,released.holdUntil,801).position,neutralPosition());
  const opposite=readStick(released.position,-x,0,true,released.holdUntil,400);
  assert.equal(opposite.position.lane,0);
  assert.equal(opposite.centerDetentUntil,850);
 }
});

test('Neutral catches at center in both directions, then a held tilt reaches the other lane',()=>{
 for(const side of [-1,1]){
  const start=readStick(neutralPosition(),side,0,true,0,100);
  const center=readStick(start.position,-side,0,true,0,200);
  assert.deepEqual(center.position,neutralPosition());
  assert.equal(center.neutralX,0);
  const held=readStick(center.position,-side,0,true,0,649,center.centerDetentUntil);
  assert.deepEqual(held.position,neutralPosition());
  const other=readStick(held.position,-side,0,true,0,650,held.centerDetentUntil);
  assert.equal(other.position.lane,-side);
  const shortFlick=readStick(center.position,0,0,true,0,300,center.centerDetentUntil);
  assert.equal(shortFlick.centerDetentUntil,0);
  assert.deepEqual(shortFlick.position,neutralPosition());
 }
});

test('holding a vertical throw pauses in Neutral then enters the opposite slot',()=>{
 for(const [from,direction,to] of [[1,'down',2],[2,'up',1],[3,'down',4],[4,'up',3]]){
  const y=direction==='up'?-1:1;
  const first=readStick(positionForGear(from),0,y,true,0,100);
  assert.equal(first.direction,direction);
  const neutral=throwLever(first.position,first.direction);
  assert.equal(neutral.gear,0);
  const held=readStick(neutral,0,y,first.armed,0,549,first.centerDetentUntil,first.verticalRepeat);
  assert.equal(held.direction,null);
  const second=readStick(held.position,0,y,held.armed,0,550,held.centerDetentUntil,held.verticalRepeat);
  assert.equal(second.direction,direction);
  assert.equal(throwLever(second.position,second.direction).gear,to);
  const stopped=readStick(positionForGear(to),0,y,second.armed,0,600,second.centerDetentUntil,second.verticalRepeat);
  assert.equal(stopped.direction,null);
  const reversed=readStick(neutral,0,-y,first.armed,0,550,first.centerDetentUntil,first.verticalRepeat);
  assert.equal(reversed.direction,null);
  const flicked=readStick(neutral,0,0,first.armed,0,200,first.centerDetentUntil,first.verticalRepeat);
  assert.equal(readStick(flicked.position,0,0,flicked.armed,0,600,flicked.centerDetentUntil,flicked.verticalRepeat).direction,null);
 }
});

test('wrong downshift is accepted, then clutch release destroys the engine',()=>{
 const s=createState();s.clutch=0;
 assert.match(selectGear(s,1,cars.eclipse),/clutch/);
 s.clutch=1;s.speed=30;
 assert.equal(selectGear(s,1,cars.eclipse),'');assert.equal(s.gear,1);
 step(s,{clutch:1,throttle:0,brake:0,steer:0},cars.eclipse,.01);
 assert.equal(s.blown,false);
 step(s,{clutch:.6,throttle:0,brake:0,steer:0},cars.eclipse,.01);
 assert.equal(s.blown,true);assert.equal(s.running,false);assert.equal(s.rpm,0);
 assert.equal(start(s),false);
 assert.match(selectGear(s,0,cars.eclipse),/destroyed/);
 assert.equal(createState().blown,false);
});
