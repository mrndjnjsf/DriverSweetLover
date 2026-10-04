import test from 'node:test';
import assert from 'node:assert/strict';
import { createLifeSession, advanceLifeSession, resetLifeLocations } from '../src/life-session.js';
import { createParkingSites } from '../src/parking.js';
import { createGridMap } from '../src/grid-map.js';
import { acceptRival, startRivalRace, settleRivalRace } from '../src/rival.js';

test('headless life session pauses all timers and clears only location state on reset',()=>{
  const map=createGridMap(),sites=createParkingSites(map),site=sites[0];
  const car={x:site.x,z:site.z,heading:site.heading,speed:0};
  const session=createLifeSession(),context={map,sites,car,eligible:true,force:true};
  const parking=session.parking;
  advanceLifeSession(session,1,context);
  assert.equal(session.parking.get(site.id).ready,true);
  assert.equal(session.rival.phase,'invited');
  const need=session.needs, invitation=session.rival;
  advanceLifeSession(session,999,{...context,paused:true});
  assert.equal(session.needs,need);
  assert.equal(session.rival,invitation);
  assert.equal(session.parking,parking);
  session.rival=startRivalRace(acceptRival(session.rival),'test-race');
  const settled=settleRivalRace(session.rival,'test-race','loss',session.needs);
  session.rival=settled.rival;session.needs=settled.needs;
  resetLifeLocations(session);
  assert.equal(session.needs.poop,1);
  assert.equal(session.rival.respect,4);
  assert.equal(session.rival.phase,'waiting');
  assert.equal(session.parking.size,0);
  advanceLifeSession(session,1,{...context,force:false,eligible:false});
  assert.equal(session.parking.get(site.id).ready,true);
});

test('invalid session time cannot partially advance needs or parking',()=>{
  const session=createLifeSession(),initial=JSON.stringify(session);
  for(const dt of [-1,NaN,Infinity])assert.throws(()=>advanceLifeSession(session,dt,{}),/nonnegative/);
  assert.equal(JSON.stringify(session),initial);
  assert.equal(session.parking.size,0);
});
