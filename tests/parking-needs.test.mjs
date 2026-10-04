import test from 'node:test';
import assert from 'node:assert/strict';
import { createGridMap, setRoad } from '../src/grid-map.js';
import { createParkingSites, parkingCondition, advanceParking } from '../src/parking.js';
import { createNeeds, advanceNeeds } from '../src/needs.js';
import { createCareer, purchaseBathroom, serializeCareer, parseCareer, applyFine } from '../src/career.js';

const sites = createParkingSites(createGridMap());
const free = sites.find(site => site.free), paid = sites.find(site => site.free === false);
const pose = site => ({ x: site.x, z: site.z, heading: site.heading, speed: 0 });
const ready = site => advanceParking(null, pose(site), site, 1);

test('derived sites use open connected roads and always include a free bathroom', () => {
  assert.equal(sites.length, 3);
  assert.equal(free.service, 'bathroom');
  let map = createGridMap();
  map = setRoad(map, 25, 25, 'east', false);
  const relocated = createParkingSites(map).find(site => site.free);
  assert.notEqual(relocated.heading, free.heading);
  assert.ok(Number.isFinite(relocated.x));
  for (const size of [4, 5, 50]) assert.ok(createParkingSites(createGridMap({ size })).some(site => site.free));
});

test('parking requires the full footprint, alignment, stop and continuous settling in either direction', () => {
  for (const site of sites) {
    const car = pose(site);
    assert.equal(parkingCondition(car, site.bay), '');
    assert.equal(parkingCondition({ ...car, heading: car.heading + Math.PI }, site.bay), '');
    assert.match(parkingCondition({ ...car, speed: -.4 }, site.bay), /stop/);
    assert.match(parkingCondition({ ...car, x: car.x + Math.cos(car.heading), z: car.z - Math.sin(car.heading) }, site.bay), /whole car/);
    assert.ok(parkingCondition({ ...car, heading: car.heading + Math.PI / 3 }, site.bay));
    assert.ok(parkingCondition({ ...car, x: NaN }, site.bay));
    let parking = advanceParking(null, car, site, .6);
    assert.equal(parking.ready, false);
    parking = advanceParking(parking, { ...car, speed: 1 }, site, .1);
    assert.equal(parking.settled, 0);
    parking = advanceParking(parking, car, site, .6);
    assert.equal(parking.ready, false);
    assert.equal(advanceParking(parking, car, site, .4).ready, true);
  }
  assert.equal(advanceParking(ready(free), pose(paid), paid, .1).ready, false);
});

test('needs advance only by supplied active time and clamp at full', () => {
  const needs = createNeeds();
  assert.deepEqual(advanceNeeds(needs, 0), needs);
  assert.ok(advanceNeeds(needs, 60).poop > needs.poop);
  assert.equal(advanceNeeds(needs, 99999).poop, 1);
  assert.throws(() => advanceNeeds(needs, NaN));
  assert.equal(needs.poop, .15);
});

test('a paid bathroom visit is atomic, idempotent, serializable and cannot clear needs at the wrong bay', () => {
  const career = createCareer(), needs = createNeeds();
  assert.throws(() => purchaseBathroom(career, needs, paid, ready(free), 'bathroom:wrong'), /Park/);
  assert.equal(career.walletCents, 50000);
  const result = purchaseBathroom(career, needs, paid, ready(paid), 'bathroom:one');
  assert.equal(result.career.walletCents, 49800);
  assert.equal(result.needs.poop, 0);
  assert.equal(result.needs.visits, 1);
  const duplicate = purchaseBathroom(result.career, result.needs, paid, ready(paid), 'bathroom:one');
  assert.equal(duplicate.career.walletCents, 49800);
  assert.equal(duplicate.career.transactions.length, 1);
  assert.deepEqual(parseCareer(serializeCareer(result.career)), result.career);
  assert.throws(() => purchaseBathroom(result.career, result.needs, paid, ready(paid), 'bathroom:two'), /No need/);
});

test('an empty wallet cannot use paid facilities but can always use the free bathroom', () => {
  const empty = applyFine(createCareer(), { id: 'empty', reason: 'Test fine', amountCents: 50000 });
  const needs = createNeeds();
  assert.throws(() => purchaseBathroom(empty, needs, paid, ready(paid), 'bathroom:paid'), /Not enough/);
  assert.equal(needs.poop, .15);
  const result = purchaseBathroom(empty, needs, free, ready(free), 'bathroom:free');
  assert.equal(result.career.walletCents, 0);
  assert.equal(result.needs.poop, 0);
  assert.deepEqual(parseCareer(serializeCareer(result.career)), result.career);
});
