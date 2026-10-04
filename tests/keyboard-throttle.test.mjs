import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceKeyboardThrottle as advance } from '../src/keyboard-throttle.js';

test('Space builds progressively and clamps at full throttle', () => {
  assert.ok(Math.abs(advance(0, true, false, .2) - .3) < 1e-10);
  assert.equal(advance(.9, true, false, .2), 1);
  let value = 0;
  for (let i = 0; i < 60; i++) value = advance(value, true, false, 1 / 120);
  assert.ok(Math.abs(value - advance(0, true, false, .5)) < 1e-10);
});

test('V overrides instantly and releases from full without a jump', () => {
  assert.equal(advance(.2, false, true, 0), 1);
  assert.equal(advance(.2, true, true, .01), 1);
  assert.equal(advance(1, true, false, .01), 1);
  assert.equal(advance(1, false, false, .1), .7);
  assert.equal(advance(.1, false, false, .1), 0);
  assert.equal(advance(.4, true, false, -1), .4);
});
