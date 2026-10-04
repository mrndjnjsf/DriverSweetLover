import test from 'node:test';
import assert from 'node:assert/strict';
import { createGridMap, gridPoint, roadOpen, setRoad } from '../src/grid-map.js';
import { createRoadEventSystem, findRoadEventImpact, setRoadEventMap, updateRoadEvents } from '../src/road-events.js';

test('seeded encounters are reproducible, bounded, and use open streets', () => {
 const map = createGridMap({ size: 12 });
 map.districts.fill('residential');
 const player = gridPoint(map, 6, 6);
 const one = createRoadEventSystem(map, { seed: 22, count: 4 });
 const two = createRoadEventSystem(map, { seed: 22, count: 4 });
 for (let i = 0; i < 200; i++) {
  const a = updateRoadEvents(one, .05, player);
  const b = updateRoadEvents(two, .05, player);
  assert.deepEqual(a, b);
  assert.ok(a.length <= 4);
  for (const event of one.events) {
   assert.equal(roadOpen(map, event.col, event.row, event.axis), true);
   const point = a.find(snapshot => snapshot.id === event.id);
   assert.ok(Math.hypot(point.x - player.x, point.z - player.z) <= one.radius + map.roadWidth);
  }
 }
 assert.ok(one.events.some(event => event.type === 'children'));
});

test('encounters spawn away from the car and recycle when the player moves', () => {
 const map = createGridMap();
 const center = gridPoint(map, 25, 25);
 const system = createRoadEventSystem(map, { seed: 2, count: 3 });
 const initial = updateRoadEvents(system, 0, center);
 assert.equal(initial.length, 3);
 for (const event of initial) assert.ok(Math.hypot(event.x - center.x, event.z - center.z) >= 35);
 for (const event of initial.filter(item => item.hardObstacle)) for (const location of map.locations) {
  const marker = gridPoint(map, location.col, location.row);
  assert.ok(Math.hypot(event.x - marker.x, event.z - marker.z) >= 22);
 }
 const edge = gridPoint(map, 3, 3);
 for (let i = 0; i < 180; i++) updateRoadEvents(system, .05, edge);
 const later = updateRoadEvents(system, 0, edge);
 assert.equal(later.length, 3);
 assert.ok(later.every(event => !initial.some(old => old.id === event.id)));
 assert.ok(later.every(event => Math.hypot(event.x - edge.x, event.z - edge.z) <= system.radius + map.roadWidth));
});

test('map edits remove encounters on closed roads', () => {
 const map = createGridMap({ size: 8 });
 const system = createRoadEventSystem(map, { seed: 11, count: 1 });
 const player = gridPoint(map, 4, 4);
 updateRoadEvents(system, 0, player);
 assert.equal(system.events.length, 1);
 const event = system.events[0];
 const edited = setRoad(map, event.col, event.row, event.axis, false);
 setRoadEventMap(system, edited);
 assert.equal(system.events.length, 0);
 updateRoadEvents(system, 1, player);
 assert.ok(system.events.every(candidate => roadOpen(edited, candidate.col, candidate.row, candidate.axis)));
});

test('living encounters remain safe; only hard obstacles report impacts', () => {
 const player = { x: 0, z: 0, heading: 0, speed: 15 };
 assert.equal(findRoadEventImpact(player, [
  { id: 1, type: 'dog', x: 0, z: 0, radius: 1 },
  { id: 2, type: 'children', x: 0, z: 0, radius: 1 }
 ]), null);
 assert.deepEqual(findRoadEventImpact(player, [
  { id: 7, type: 'stalled-car', x: .5, z: -2, radius: 1.35 }
 ]), { eventId: 7, type: 'stalled-car', end: 'front', impactSpeedMps: 15 });
 assert.equal(findRoadEventImpact(player, [
  { id: 8, type: 'construction', x: 7, z: -2, radius: 1.25 }
 ]), null);
 assert.deepEqual(findRoadEventImpact(player, [
  { id: 9, type: 'debris', x: 0, z: -2, radius: 1.1 }
 ]), { eventId: 9, type: 'debris', end: 'front', impactSpeedMps: 15 });
});

test('debris appears as a distinct seeded event', () => {
 const map = createGridMap({ size: 12 });
 map.districts.fill('residential');
 const system = createRoadEventSystem(map, { count: 5, seed: 8 });
 const player = gridPoint(map, 6, 6);
 let events = updateRoadEvents(system, 0, player);
 for (let i = 0; i < 300 && events.length < 5; i++) events = updateRoadEvents(system, .05, player);
 assert.ok(events.some(event => event.type === 'debris' && event.hardObstacle));
});

test('children stay on the sidewalk and a close dog retreats from the road', () => {
 const map = createGridMap({ size: 8 });
 map.districts.fill('residential');
 const system = createRoadEventSystem(map, { seed: 1, count: 4 });
 const player = gridPoint(map, 4, 4);
 let snapshots = updateRoadEvents(system, 0, player);
 for (let i = 0; i < 200 && snapshots.length < 4; i++) snapshots = updateRoadEvents(system, .05, player);
 const dog = system.events.find(event => event.type === 'dog');
 const kids = system.events.find(event => event.type === 'children');
 assert.ok(dog);
 assert.ok(kids);
 const dogCenter = snapshots.find(event => event.id === dog.id);
 const closer = updateRoadEvents(system, .05, { x: dogCenter.x, z: dogCenter.z })
  .find(event => event.id === dog.id);
 const road = gridPoint(map, dog.col, dog.row);
 const dogRoadCenter = dog.axis === 'south'
  ? { x: road.x, z: road.z - dog.fraction * map.blockSize }
  : { x: road.x + dog.fraction * map.blockSize, z: road.z };
 assert.ok(Math.hypot(closer.x - dogRoadCenter.x, closer.z - dogRoadCenter.z) > map.roadWidth / 2);
 const child = snapshots.find(event => event.id === kids.id);
 const childRoad = gridPoint(map, kids.col, kids.row);
 const childRoadCenter = kids.axis === 'south'
  ? { x: childRoad.x, z: childRoad.z - kids.fraction * map.blockSize }
  : { x: childRoad.x + kids.fraction * map.blockSize, z: childRoad.z };
 // Children must never be treated as a hard obstacle even if near the car.
 assert.equal(child.hardObstacle, false);
 assert.equal(findRoadEventImpact({ x: child.x, z: child.z, heading: 0, speed: 10 }, [child]), null);
 assert.ok(Math.hypot(child.x - childRoadCenter.x, child.z - childRoadCenter.z) > map.roadWidth / 2);
});
