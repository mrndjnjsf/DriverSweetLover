import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceKeyboardThrottle as advance } from '../src/keyboard-throttle.js';

test('Space builds slower near full pressure and still reaches full throttle', () => {
  const lowGain=advance(0,true,false,.2);
  const highGain=advance(.8,true,false,.2)-.8;
  assert.ok(lowGain>highGain*2);
  assert.equal(advance(0, true, false, 2), 1);
  let value = 0;
  for (let i = 0; i < 60; i++) value = advance(value, true, false, 1 / 120);
  assert.ok(Math.abs(value - advance(0, true, false, .5)) < 1e-10);
});

test('V overrides instantly and releases from full without a jump', () => {
  assert.equal(advance(.2, false, true, 0), 1);
  assert.equal(advance(.2, true, true, .01), 1);
  assert.equal(advance(1, true, false, .01), 1);
  assert.ok(advance(1, false, false, .1)>.98);
  assert.equal(advance(.1, false, false, .2), 0);
  assert.equal(advance(.4, true, false, -1), .4);
});

test('release takes twice as long to retrace the pressure buildup curve',()=>{
  for(const start of [0,.3,.7]){
    const built=advance(start,true,false,.15);
    const released=advance(built,false,false,.3);
    assert.ok(Math.abs(released-start)<1e-10);
  }
  let released=1;
  for(let i=0;i<120;i++)released=advance(released,false,false,1/120);
  assert.ok(Math.abs(released-advance(1,false,false,1))<1e-10);
  assert.equal(advance(1,false,false,3),0);
});
