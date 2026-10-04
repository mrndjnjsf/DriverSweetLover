import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveParkedContact } from '../src/parked-contact.js';

const obstacle = {id:'parked',x:0,z:-5,heading:0,speed:0};
const clear = {x:0,z:0,heading:0,speed:1};
const touching = {...clear,z:-1};

test('sustained parked contact blocks each step but charges once until backing away',()=>{
  const contacts=new Set(),scratch=[];
  assert.equal(resolveParkedContact(contacts,clear,clear,[obstacle],scratch),null);
  const first=resolveParkedContact(contacts,clear,touching,[obstacle],scratch);
  assert.equal(first.freshImpact.vehicleId,'parked');
  assert.equal(resolveParkedContact(contacts,clear,touching,[obstacle],scratch).freshImpact,null);
  assert.equal(resolveParkedContact(contacts,touching,clear,[obstacle],scratch),null);
  assert.equal(contacts.has('parked'),true);
  resolveParkedContact(contacts,clear,clear,[obstacle],scratch);
  assert.equal(contacts.size,0);
  assert.equal(resolveParkedContact(contacts,clear,touching,[obstacle],scratch).freshImpact.vehicleId,'parked');
  assert.equal(touching.z,-1);
});

test('a fresh second obstacle gets its own receipt instead of recharging an old contact',()=>{
  const contacts=new Set(['parked']);
  const second={...obstacle,id:'second',x:1.5};
  const result=resolveParkedContact(contacts,clear,touching,[obstacle,second]);
  assert.equal(result.impact.vehicleId,'parked');
  assert.equal(result.freshImpact.vehicleId,'second');
  assert.equal(contacts.size,2);
});
