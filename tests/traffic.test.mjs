import test from 'node:test';
import assert from 'node:assert/strict';
import { createGridMap, gridPoint, roadOpen, setRoad } from '../src/grid-map.js';
import { createTrafficSystem, setTrafficMap, trafficSignalState, updateTraffic } from '../src/traffic.js';
import { findTrafficImpact } from '../src/collision.js';

test('seeded traffic is reproducible, follows open roads, and stays in the right lane', () => {
 const map = createGridMap({ size: 12 });
 const one = createTrafficSystem(map, { count: 8, seed: 3 });
 const two = createTrafficSystem(map, { count: 8, seed: 3 });
 const player = gridPoint(map, 6, 6);
 assert.deepEqual(updateTraffic(one, 0, player), updateTraffic(two, 0, player));
 for (let i = 0; i < 250; i++) {
  const cars = updateTraffic(one, .05, player);
  assert.equal(cars.length, 8);
  for (const vehicle of one.vehicles) {
   const direction = vehicle.to.col > vehicle.from.col ? 'east' : vehicle.to.col < vehicle.from.col ? 'west' : vehicle.to.row > vehicle.from.row ? 'south' : 'north';
   assert.equal(roadOpen(map, vehicle.from.col, vehicle.from.row, direction), true);
  }
 }
 const eastbound = { id: 99, from: { col: 4, row: 4 }, to: { col: 5, row: 4 }, progress: 20, speed: 0, cruiseSpeed: 10, color: '#fff' };
 one.vehicles = [eastbound];
 one.count = 1;
 const [east] = updateTraffic(one, 0, player);
 assert.equal(east.z, gridPoint(map, 4, 4).z + map.roadWidth * .25);
 assert.ok(east.x > gridPoint(map, 4, 4).x);
});

test('the initial city drive has a visible car ahead without spawning on top of the player', () => {
 const map = createGridMap();
 const start = gridPoint(map, 25, 25);
 const player = { x: start.x + map.roadWidth * .25, z: start.z + map.blockSize * .35 };
 const system = createTrafficSystem(map, { count: 16 });
 const cars = updateTraffic(system, 0, player);
 assert.ok(cars.some(car => car.z < player.z - 35 && car.z > player.z - 100 && Math.abs(car.x - player.x) < 3));
});

test('traffic stops before a red light then drives on green', () => {
 const map = createGridMap({ size: 8 });
 const system = createTrafficSystem(map, { count: 1 });
 const player = gridPoint(map, 1, 1);
 const redTime = Array.from({ length: 28 }, (_, i) => i).find(t => trafficSignalState(1, 2, t).northSouth === 'red' && trafficSignalState(1, 2, t + 3).northSouth === 'red');
 assert.notEqual(redTime, undefined);
 system.time = redTime;
 system.vehicles = [{ id: 1, from: { col: 1, row: 1 }, to: { col: 1, row: 2 }, progress: 42, speed: 12, cruiseSpeed: 12, color: '#fff' }];
 for (let i = 0; i < 30; i++) updateTraffic(system, .05, player);
 assert.ok(system.vehicles[0].progress <= map.blockSize - 6);
 assert.ok(system.vehicles[0].speed < 12);
 const greenTime = Array.from({ length: 28 }, (_, i) => i).find(t => trafficSignalState(1, 2, t).northSouth === 'green' && trafficSignalState(1, 2, t + 3).northSouth === 'green');
 system.time = greenTime;
 for (let i = 0; i < 100; i++) updateTraffic(system, .05, player);
 assert.notDeepEqual(system.vehicles[0].from, { col: 1, row: 1 });
});

test('traffic yields behind a parked player in its lane', () => {
 const map = createGridMap({ size: 8 });
 const system = createTrafficSystem(map, { count: 1 });
 const start = gridPoint(map, 2, 2);
 const player = { x: start.x + map.roadWidth * .25, z: start.z - 46 };
 system.vehicles = [{ id: 1, from: { col: 2, row: 2 }, to: { col: 2, row: 3 }, progress: 18, speed: 10, cruiseSpeed: 12, color: '#fff' }];
 for (let i = 0; i < 100; i++) updateTraffic(system, .05, player);
 const car = updateTraffic(system, 0, player)[0];
 assert.ok(car.z > player.z + 5);
 assert.ok(car.speed < 1);
});

test('nearby seeded traffic does not repeatedly hit a parked car at spawn', () => {
 const map = createGridMap();
 const center = gridPoint(map, 25, 25);
 const player = { x: center.x + map.roadWidth * .25, z: center.z + map.blockSize * .35, heading: 0, speed: 0 };
 const system = createTrafficSystem(map, { count: 16 });
 for (let i = 0; i < 1200; i++) {
  const vehicles = updateTraffic(system, .05, player);
  assert.equal(findTrafficImpact(player, vehicles), null);
 }
});

test('pool is bounded and recycles cars around a moving player', () => {
 const map = createGridMap();
 const system = createTrafficSystem(map, { count: 12, seed: 7 });
 const origin = gridPoint(map, 25, 25);
 const first = updateTraffic(system, .05, origin);
 assert.equal(first.length, 12);
 const nearEdge = gridPoint(map, 4, 4);
 const second = updateTraffic(system, .05, nearEdge);
 assert.equal(second.length, 12);
 assert.ok(second.every(car => Math.hypot(car.x - nearEdge.x, car.z - nearEdge.z) <= system.radius));
 assert.ok(second.every(car => !first.some(old => old.id === car.id)));
 for (let i = 0; i < 30; i++) assert.ok(updateTraffic(system, .1, nearEdge).length <= 12);
});

test('deleted streets invalidate their cars after a map edit', () => {
 const map = createGridMap({ size: 8 });
 const system = createTrafficSystem(map, { count: 0 });
 system.vehicles = [{ id: 1, from: { col: 2, row: 2 }, to: { col: 3, row: 2 }, progress: 10, speed: 8, cruiseSpeed: 12, color: '#fff' }];
 const edited = setRoad(map, 2, 2, 'east', false);
 setTrafficMap(system, edited);
 assert.equal(system.vehicles.length, 0);
 assert.deepEqual(updateTraffic(system, .1, gridPoint(map, 2, 2)), []);
});

test('a turn connects lane positions without a visible jump', () => {
 const map = setRoad(createGridMap({ size: 8 }), 2, 2, 'south', false);
 const system = createTrafficSystem(map, { count: 1, seed: 1 });
 const player = gridPoint(map, 2, 2);
 system.time = Array.from({ length: 28 }, (_, i) => i).find(t => trafficSignalState(2, 2, t).northSouth === 'green' && trafficSignalState(2, 2, t + 1).northSouth === 'green');
 system.vehicles = [{ id: 1, from: { col: 2, row: 1 }, to: { col: 2, row: 2 }, progress: 63.9, speed: 8, cruiseSpeed: 8, color: '#fff' }];
 const [before] = updateTraffic(system, 0, player);
 const [after] = updateTraffic(system, .05, player);
 assert.notDeepEqual(system.vehicles[0].from, { col: 2, row: 1 });
 assert.ok(Math.hypot(after.x - before.x, after.z - before.z) < 2);
 assert.ok(Math.abs(after.heading - before.heading) < .3);
});
