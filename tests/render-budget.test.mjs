import test from 'node:test';
import assert from 'node:assert/strict';
import { frameDue, scenePixelRatio, simulationDeltaSeconds, MAX_SCENE_PIXELS } from '../src/render-budget.js';
import {cars,createState,step} from '../src/physics.js';

test('render scale caps high-density desktops without enlarging low-density screens', () => {
  assert.equal(scenePixelRatio(1280, 720, 1), 1);
  const ratio = scenePixelRatio(1920, 1080, 2);
  assert.ok(ratio < 1.5 && ratio > 1);
  assert.ok(1920 * 1080 * ratio * ratio <= MAX_SCENE_PIXELS + 1);
  assert.ok(scenePixelRatio(3840, 2160, 2) < 1);
  const ultraWideRatio = scenePixelRatio(7680, 4320, 2);
  assert.ok(7680 * 4320 * ultraWideRatio * ultraWideRatio <= MAX_SCENE_PIXELS + 1);
  assert.throws(() => scenePixelRatio(0, 1080, 2), /Invalid/);
});

test('frame budget preserves 60 Hz frames while skipping excess high-refresh work', () => {
  assert.equal(frameDue(16.6), true);
  assert.equal(frameDue(10), true);
  assert.equal(frameDue(6.9), false);
  assert.equal(frameDue(13.8), true);
  assert.equal(frameDue(NaN), false);
});

test('a low frame rate does not make the Civic engine rev in slow motion', () => {
  const revAfterHalfSecond = (frameMs, frames) => {
    const state = createState();
    for (let frame = 0; frame < frames; frame++) {
      const dt = simulationDeltaSeconds(frameMs);
      const steps = Math.ceil(dt / .01);
      for (let n = 0; n < steps; n++) step(state,{clutch:1,throttle:1,brake:0,steer:0},cars.civic,dt / steps);
    }
    return state.rpm;
  };
  const regular = revAfterHalfSecond(20,25);
  const slow = revAfterHalfSecond(125,4);
  assert.ok(Math.abs(regular-slow)<50,`regular ${regular} RPM, slow ${slow} RPM`);
  assert.equal(simulationDeltaSeconds(300),.2);
});
