import test from 'node:test';
import assert from 'node:assert/strict';
import { trackedObjective } from '../src/objective.js';

test('service detours preserve the job and switching back restores its stage', () => {
  const job = Object.freeze({ status: 'accepted' });
  const context = { job, destination: { x: 30, z: 40 }, position: { x: 0, z: 0 } };
  assert.deepEqual(trackedObjective(context), { title: 'Pick up delivery', detail: '50 m away', progress: null });
  assert.equal(trackedObjective({ ...context, navigation: { x: 0, z: 0, label: 'Refuel' } }).title, 'Refuel');
  assert.equal(trackedObjective(context).title, 'Pick up delivery');
  assert.equal(trackedObjective({ ...context, job: { status: 'picked-up' } }).title, 'Drop off delivery');
});

test('watch handles idle, arriving, countdown and active race without inventing jobs', () => {
  const context = { position: { x: 0, z: 0 } };
  assert.equal(trackedObjective(context).title, 'No tracked objective');
  assert.equal(trackedObjective({ ...context, navigation: { x: 1, z: 1, label: 'Garage' } }).detail, 'Stop and open the app');
  assert.equal(trackedObjective({ ...context, race: { phase: 'countdown' } }).title, 'Hold the start line');
  assert.equal(trackedObjective({ ...context, race: { phase: 'active' }, raceProgress: 200 }).progress, .5);
});
