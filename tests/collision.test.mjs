import assert from 'node:assert/strict';
import test from 'node:test';
import { carsOverlap, findTrafficImpact } from '../src/collision.js';

test('lane-separated cars pass without contact', () => {
  const player = { x: 3.6, z: 0, heading: 0, speed: 10 };
  const traffic = { id: 1, x: -3.6, z: 0, heading: Math.PI, speed: 10 };
  assert.equal(carsOverlap(player, traffic), false);
  assert.equal(findTrafficImpact(player, [traffic]), null);
});

test('a front strike finds closing speed and front bumper', () => {
  const player = { x: 0, z: 0, heading: 0, speed: 18 };
  const traffic = { id: 7, x: 0, z: -3.5, heading: 0, speed: 4 };
  assert.equal(carsOverlap(player, traffic), true);
  assert.deepEqual(findTrafficImpact(player, [traffic]), { vehicleId: 7, end: 'front', impactSpeedMps: 14 });
});

test('a rear-end strike damages the rear bumper', () => {
  const player = { x: 0, z: 0, heading: 0, speed: 1 };
  const traffic = { id: 2, x: 0, z: 3.5, heading: 0, speed: 12 };
  assert.equal(findTrafficImpact(player, [traffic])?.end, 'rear');
  assert.equal(findTrafficImpact(player, [traffic])?.impactSpeedMps, 11);
});

test('a perpendicular crossing can hit the car side without a false bumper flip', () => {
  const player = { x: 0, z: 0, heading: 0, speed: 0 };
  const traffic = { id: 3, x: 1.8, z: 0, heading: Math.PI / 2, speed: 9 };
  assert.equal(carsOverlap(player, traffic), true);
  assert.equal(findTrafficImpact(player, [traffic])?.impactSpeedMps, 9);
});
