import test from 'node:test';
import assert from 'node:assert/strict';
import { createCoachHint, advanceCoachHint as advance } from '../src/coach-hint.js';

const redline={id:'redline',title:'AT REDLINE',text:'Reduce throttle.'};
test('repeated redline stays visible until continuously clear for three seconds',()=>{
  const hint=createCoachHint();
  assert.equal(advance(hint,redline,0),redline);
  assert.equal(advance(hint,null,2.9),redline);
  assert.equal(advance(hint,redline,.1),redline);
  assert.equal(advance(hint,null,2.9),redline);
  assert.equal(advance(hint,null,.11),null);
});
test('urgent advice takes over immediately; lower priority waits',()=>{
  const hint=createCoachHint(),stall={id:'stall'},bogging={id:'bogging'};
  advance(hint,redline,0);
  assert.equal(advance(hint,stall,0),stall);
  assert.equal(advance(hint,bogging,2),stall);
  assert.equal(advance(hint,bogging,1),bogging);
});
test('paused time preserves advice and failure suppresses stale tips',()=>{
  const hint=createCoachHint();
  advance(hint,redline,0);
  for(let i=0;i<100;i++)assert.equal(advance(hint,null,0),redline);
  assert.equal(advance(hint,null,0,{suppressed:true}),null);
  assert.equal(hint.clearSeconds,0);
  assert.throws(()=>advance(hint,null,-1),RangeError);
});
test('ongoing advice updates control text without restarting the visible panel',()=>{
  const hint=createCoachHint(),controller={...redline,text:'Use LT.'};
  advance(hint,redline,0);
  assert.equal(advance(hint,controller,.1),controller);
});
