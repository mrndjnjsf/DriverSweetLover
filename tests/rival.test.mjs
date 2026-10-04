import test from 'node:test';
import assert from 'node:assert/strict';
import { createRival, advanceRival, acceptRival, declineRival, startRivalRace, settleRivalRace } from '../src/rival.js';
import { createGridMap } from '../src/grid-map.js';
import { createNeeds } from '../src/needs.js';

const context={map:createGridMap(),car:{x:0,z:0},eligible:true};
test('rival appears on cooldown without interrupting jobs, and declined or expired challenges have no penalty',()=>{
  let rival=createRival();
  rival=advanceRival(rival,121,{...context,eligible:false});
  assert.equal(rival.phase,'waiting');
  rival=advanceRival(rival,0,context);
  assert.equal(rival.phase,'invited');
  assert.ok(Math.hypot(rival.position.x,rival.position.z)>14);
  assert.equal(advanceRival(rival,60,context).phase,'waiting');
  assert.equal(declineRival(rival).respect,5);
  assert.equal(advanceRival(declineRival(rival),1,context).phase,'waiting');
});
test('only a completed rival loss fills needs and changes respect, once',()=>{
  let rival=advanceRival(createRival(),0,{...context,force:true});
  rival=startRivalRace(acceptRival(rival),'race1');
  const needs=createNeeds();
  assert.equal(settleRivalRace(rival,'other','loss',needs).feedback,null);
  const result=settleRivalRace(rival,'race1','loss',needs);
  assert.equal(result.needs.poop,1);
  assert.equal(result.rival.respect,4);
  assert.equal(result.rival.losses,1);
  assert.equal(settleRivalRace(result.rival,'race1','loss',result.needs).feedback,null);
  assert.equal(needs.poop,.15);
  assert.equal(settleRivalRace(rival,'race1','false-start',needs).needs.poop,.15);
  const win=settleRivalRace(rival,'race1','win',needs);
  assert.equal(win.rival.respect,6);
  assert.equal(win.rival.wins,1);
  assert.equal(win.needs.poop,.15);
});
