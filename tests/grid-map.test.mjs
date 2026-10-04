import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createGridMap, districtAt, exportGridMap, findRoute, gridPoint, importGridMap,
 nearestRoadPoint, roadOpen, setDistrict, setLocation, setRoad, validateGridMap
} from '../src/grid-map.js';

test('a seeded 50 by 50 city has stable districts, real coordinates, and connected roads', () => {
 const map = createGridMap({ seed: 77 });
 assert.equal(map.size, 50);
 assert.equal(map.districts.length, 49 * 49);
 assert.deepEqual(createGridMap({ seed: 77 }).districts, map.districts);
 assert.notDeepEqual(createGridMap({ seed: 78 }).districts, map.districts);
 assert.deepEqual(gridPoint(map, 25, 25), { x: 0, z: 0 });
 assert.deepEqual(gridPoint(map, 26, 26), { x: 64, z: -64 });
 assert.deepEqual(nearestRoadPoint(map, 62, -67), { col: 26, row: 26, x: 64, z: -64 });
 assert.deepEqual(validateGridMap(map), { valid: true, errors: [] });
 assert.equal(findRoute(map, { col: 0, row: 0 }, { col: 49, row: 49 }).length, 99);
});

test('edits are immutable, routes use open streets, and disconnection is rejected', () => {
 const original = createGridMap({ size: 5 });
 const edited = setRoad(original, 2, 2, 'south', false);
 assert.equal(roadOpen(original, 2, 2, 'south'), true);
 assert.equal(roadOpen(edited, 2, 2, 'south'), false);
 const route = findRoute(edited, { col: 2, row: 2 }, { col: 2, row: 3 });
 assert.ok(route.length > 2);
 for (const [a, b] of route.slice(0, -1).map((point, index) => [point, route[index + 1]])) {
  const direction = b.col > a.col ? 'east' : b.col < a.col ? 'west' : b.row > a.row ? 'south' : 'north';
  assert.equal(roadOpen(edited, a.col, a.row, direction), true);
 }
 const corner = setRoad(original, 0, 0, 'east', false);
 assert.throws(() => setRoad(corner, 0, 0, 'south', false), /connect every intersection/);
});

test('map import rejects invalid data and accepted edits survive export', () => {
 const original = createGridMap({ size: 8, seed: 12 });
 const changed = setLocation(setDistrict(original, 2, 3, 'downtown'), 'service', 'shop', 3, 4);
 const loaded = importGridMap(exportGridMap(changed));
 assert.equal(districtAt(loaded, 2, 3), 'downtown');
 assert.deepEqual(loaded.locations.find(location => location.id === 'service'), { id: 'service', kind: 'shop', col: 3, row: 4 });
 assert.throws(() => setLocation(original, 'start', 'job', 1, 1), /needs a spawn/);
 const invalid = JSON.parse(exportGridMap(changed));
 invalid.roads.east[0] = 7;
 assert.throws(() => importGridMap(JSON.stringify(invalid)), /roads are invalid/);
 assert.throws(() => importGridMap('{broken'), /could not be read/);
 assert.equal(districtAt(changed, 2, 3), 'downtown');
});
