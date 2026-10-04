import test from 'node:test';
import assert from 'node:assert/strict';
import { createGridMap, gridPoint } from '../src/grid-map.js';
import { trafficSignalState } from '../src/traffic.js';
import { createPoliceSystem, updatePolice, setPoliceMap } from '../src/police.js';

const pose = (x, z, speed = 0, heading = 0) => ({ x, z, speed, heading });

function patrolNearCenter(system) {
  const map = system.map;
  for (let row = 22; row <= 28; row++) for (let col = 22; col <= 28; col++) {
    const at = gridPoint(map, col, row);
    const result = updatePolice(system, 0, { previous: pose(at.x, at.z), current: pose(at.x, at.z) });
    if (result.officers.length) return result.officers[0];
  }
  throw new Error('Expected a nearby patrol');
}

function lightTime(col, row, color, axis = 'northSouth') {
  for (let second = 1; second < 28; second++) {
    if (trafficSignalState(col, row, second)[axis] === color
      && trafficSignalState(col, row, second - .1)[axis] === color) return second;
  }
  throw new Error(`Expected a ${color} signal`);
}

test('police pool stays bounded and map edits refresh officer positions', () => {
  const map = createGridMap();
  const system = createPoliceSystem(map, { seed: 9 });
  const first = patrolNearCenter(system);
  assert.ok(first.id.startsWith('officer:'));
  assert.ok(system.officers.length <= 2);
  const changed = createGridMap({ seed: 8 });
  setPoliceMap(system, changed);
  assert.equal(system.officers.length, 0);
  assert.ok(updatePolice(system, 0, { previous: pose(0, 0), current: pose(0, 0) }).officers.length <= 2);
});

test('red-light crossing is detected from each approach', () => {
  const map = createGridMap();
  for (const direction of ['north', 'south', 'east', 'west']) {
    const system = createPoliceSystem(map, { seed: 9, sessionId: `test-${direction}` });
    const officer = patrolNearCenter(system);
    const node = gridPoint(map, officer.col, officer.row);
    const lane = map.roadWidth * .25;
    const approach = {
      north: { previous: pose(node.x + lane, node.z + 7, 6, 0), current: pose(node.x + lane, node.z + 5, 6, 0) },
      south: { previous: pose(node.x - lane, node.z - 7, 6, Math.PI), current: pose(node.x - lane, node.z - 5, 6, Math.PI) },
      east: { previous: pose(node.x - 7, node.z + lane, 6, -Math.PI / 2), current: pose(node.x - 5, node.z + lane, 6, -Math.PI / 2) },
      west: { previous: pose(node.x + 7, node.z - lane, 6, Math.PI / 2), current: pose(node.x + 5, node.z - lane, 6, Math.PI / 2) },
    }[direction];
    const timeSeconds = lightTime(officer.col, officer.row, 'red',
      direction === 'north' || direction === 'south' ? 'northSouth' : 'eastWest');
    const result = updatePolice(system, .1, { ...approach, timeSeconds });
    assert.equal(result.violation?.reason, 'Ran a red light', direction);
  }
});

test('stopping before a red line is not a ticket; crossing it is', () => {
  const map = createGridMap();
  const system = createPoliceSystem(map, { seed: 9 });
  const officer = patrolNearCenter(system);
  const node = gridPoint(map, officer.col, officer.row);
  const laneX = node.x + map.roadWidth * .25;
  const red = lightTime(officer.col, officer.row, 'red');
  const wait = updatePolice(system, .1, {
    previous: pose(laneX, node.z + 8, 4), current: pose(laneX, node.z + 6.2, 0), timeSeconds: red,
  });
  assert.equal(wait.violation, null);
  const crossing = updatePolice(system, .1, {
    previous: pose(laneX, node.z + 6.2, 4), current: pose(laneX, node.z + 5.5, 4), timeSeconds: red,
  });
  assert.equal(crossing.violation?.reason, 'Ran a red light');
  assert.equal(crossing.violation?.amountCents, 15_000);
  const samePosition = updatePolice(system, .1, {
    previous: pose(laneX, node.z + 5.5, 0), current: pose(laneX, node.z + 5.5, 0), timeSeconds: red,
  });
  assert.equal(samePosition.violation, null);
});

test('green crossing does not cite and sustained observed speeding cites once', () => {
  const map = createGridMap();
  const system = createPoliceSystem(map, { seed: 9 });
  const officer = patrolNearCenter(system);
  const node = gridPoint(map, officer.col, officer.row);
  const laneX = node.x + map.roadWidth * .25;
  const green = lightTime(officer.col, officer.row, 'green');
  const crossing = updatePolice(system, .1, {
    previous: pose(laneX, node.z + 7, 5), current: pose(laneX, node.z + 5, 5), timeSeconds: green,
  });
  assert.equal(crossing.violation, null);
  let violation = null;
  for (let i = 0; i < 6; i++) {
    const result = updatePolice(system, .1, {
      previous: pose(laneX, node.z + 5, 22), current: pose(laneX, node.z + 5, 22), timeSeconds: green,
    });
    violation ??= result.violation;
  }
  assert.match(violation?.reason ?? '', /Speeding at/);
  assert.equal(updatePolice(system, .1, {
    previous: pose(laneX, node.z + 5, 22), current: pose(laneX, node.z + 5, 22), timeSeconds: green,
  }).violation, null);
});

test('a collision is only cited when seen; repeated impact frames do not repeat it', () => {
  const map = createGridMap();
  const system = createPoliceSystem(map, { seed: 9 });
  const officer = patrolNearCenter(system);
  const far = pose(1000, 1000, 0);
  assert.equal(updatePolice(system, .1, { previous: far, current: far, impact: true }).violation, null);
  const near = pose(officer.x, officer.z, 0);
  updatePolice(system, .1, { previous: near, current: near, impact: false });
  const cited = updatePolice(system, .1, { previous: near, current: near, impact: true });
  assert.equal(cited.violation?.reason, 'Collision observed by police');
  assert.equal(updatePolice(system, .1, { previous: near, current: near, impact: true }).violation, null);
});
