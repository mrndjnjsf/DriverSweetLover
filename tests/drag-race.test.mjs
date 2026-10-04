import test from 'node:test';
import assert from 'node:assert/strict';
import { createGridMap, gridPoint, roadOpen, setRoad } from '../src/grid-map.js';
import {
  createDragRace, findDragCourse, stageRace, updateDragRace,
} from '../src/drag-race.js';

const pointAt = (course, progress, lateral = 0, speed = 0, heading = course.start.heading) => ({
  x: course.start.x + course.forward.x * progress - course.forward.z * lateral,
  z: course.start.z + course.forward.z * progress + course.forward.x * lateral,
  heading, speed,
});

function stagedRace(rivalTimeSeconds = 22) {
  const course = findDragCourse(createGridMap());
  const ready = createDragRace(course, { rivalTimeSeconds });
  const staged = stageRace(ready, pointAt(course, 0));
  assert.equal(staged.staged, true);
  return staged.race;
}

test('default strip starts at the actual spawn and follows seven open street sections', () => {
  const map = createGridMap();
  const course = findDragCourse(map);
  const spawn = gridPoint(map, 25, 25);
  assert.deepEqual(course.start, { x: spawn.x + map.roadWidth * .25, z: spawn.z + map.blockSize * .35, heading: 0 });
  assert.deepEqual(course.forward, { x: 0, z: -1 });
  assert.deepEqual(course.rivalStart, { x: spawn.x - map.roadWidth * .25, z: course.start.z });
  assert.equal(course.distanceMeters, 400);
  assert.equal(course.finish.z, course.start.z - 400);
  assert.equal(course.id, findDragCourse(map).id);
  for (let row = 24; row <= 30; row++) assert.equal(roadOpen(map, 25, row, 'south'), true);
});

test('a closed street makes the finder choose another open direction near spawn', () => {
  const map = setRoad(createGridMap(), 25, 28, 'south', false);
  const course = findDragCourse(map);
  assert.ok(course);
  assert.notEqual(course.id, 'drag-25-25-north');
  assert.equal(course.id, 'drag-25-25-south');
  assert.deepEqual(findDragCourse(map, { x: 0, z: 22.4 }).id, course.id);
  assert.equal(findDragCourse(createGridMap({ size: 5 })), null);
  assert.equal(createDragRace(null), null);
  assert.deepEqual(updateDragRace(null, .1, null), { race: null, events: [] });
});

test('staging requires the line, a stopped car, and matching heading', () => {
  const course = findDragCourse(createGridMap());
  const race = createDragRace(course);
  assert.equal(stageRace(race, pointAt(course, 2)).reason, 'line');
  assert.equal(stageRace(race, pointAt(course, 0, course.laneHalfWidth + .1)).reason, 'line');
  assert.equal(stageRace(race, pointAt(course, 0, 0, 1)).reason, 'moving');
  assert.equal(stageRace(race, pointAt(course, 0, 0, 0, .6)).reason, 'alignment');
  assert.equal(stageRace(race, pointAt(course, 0)).race.phase, 'countdown');
  assert.equal(race.phase, 'ready');
  assert.throws(() => stageRace(race, { x: 0, z: 0 }), /finite/);
});

test('countdown starts after three seconds and crossing a meter early is a false start', () => {
  const race = stagedRace();
  const waiting = updateDragRace(race, 2, pointAt(race.course, .8));
  assert.equal(waiting.race.phase, 'countdown');
  assert.equal(waiting.race.countdownRemaining, 1);
  const falseStart = updateDragRace(waiting.race, .1, pointAt(race.course, 1.01));
  assert.deepEqual(falseStart.events.map(event => event.type), ['result']);
  assert.equal(falseStart.race.result.outcome, 'false-start');
  assert.equal(updateDragRace(falseStart.race, 10, pointAt(race.course, 400)).events.length, 0);
  const start = updateDragRace(race, 3, pointAt(race.course, 0));
  assert.equal(start.race.phase, 'active');
  assert.deepEqual(start.events.map(event => event.type), ['start']);
  assert.equal(start.race.elapsedSeconds, 0);
});

test('a finish crossing in the player lane wins before the rival and emits once', () => {
  let race = updateDragRace(stagedRace(), 3, pointAt(findDragCourse(createGridMap()), 0)).race;
  const midpoint = updateDragRace(race, 8, pointAt(race.course, 200));
  race = midpoint.race;
  assert.ok(race.rivalProgress > 0 && race.rivalProgress < 400);
  assert.ok(race.rivalProgress < 400 * 8 / race.rivalTimeSeconds, 'rival starts slower than its average pace');
  const win = updateDragRace(race, 8, pointAt(race.course, 401));
  assert.equal(win.race.phase, 'finished');
  assert.equal(win.race.result.outcome, 'win');
  assert.ok(win.race.result.elapsedSeconds < 22);
  assert.deepEqual(win.events.map(event => event.type), ['result']);
  assert.equal(updateDragRace(win.race, 1, pointAt(race.course, 450)).events.length, 0);
});

test('rival finish, lane miss, and race timeout each finish without duplicate results', () => {
  const staged = stagedRace(10);
  const started = updateDragRace(staged, 3, pointAt(staged.course, 0)).race;
  const missed = updateDragRace(started, 9, pointAt(started.course, 401, started.course.laneHalfWidth + 1));
  assert.equal(missed.race.phase, 'active');
  const loss = updateDragRace(missed.race, 1, pointAt(started.course, 410, started.course.laneHalfWidth + 1));
  assert.equal(loss.race.result.outcome, 'loss');
  assert.equal(loss.race.rivalProgress, 400);
  assert.equal(updateDragRace(loss.race, 1, pointAt(started.course, 400)).events.length, 0);

  const longRival = stagedRace(120);
  const running = updateDragRace(longRival, 3, pointAt(longRival.course, 0)).race;
  const timeout = updateDragRace(running, 90, pointAt(longRival.course, 100));
  assert.equal(timeout.race.result.outcome, 'timeout');
  assert.equal(timeout.race.result.elapsedSeconds, 90);
});

test('race arguments are validated', () => {
  const course = findDragCourse(createGridMap());
  assert.throws(() => createDragRace(course, { rivalTimeSeconds: 0 }), /Rival time/);
  assert.throws(() => createDragRace({ ...course, distanceMeters: 300 }), /Invalid drag course/);
  const race = stagedRace();
  assert.throws(() => updateDragRace(race, -1, pointAt(course, 0)), /delta time/);
  assert.throws(() => updateDragRace(race, 1, { x: NaN, z: 0, heading: 0, speed: 0 }), /finite/);
});
