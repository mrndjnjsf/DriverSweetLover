import test from 'node:test';
import assert from 'node:assert/strict';
import { createCareer, fullCarReset, unlockFullResets, serializeCareer, parseCareer, setVehicleCondition } from '../src/career.js';
import { resetsRemaining, donationUrl, graffitiLocation } from '../src/reset-access.js';
import { createGridMap } from '../src/grid-map.js';

test('three starter resets persist, restore the active car and then lock without mutating the save', () => {
  let career = createCareer();
  const worn = structuredClone(career.vehicles.eclipse);
  worn.parts.clutch.health = .1; worn.fuelLiters = 0;
  career = setVehicleCondition(career, worn);
  const original = serializeCareer(career);
  for (let i = 0; i < 3; i++) {
    career = parseCareer(serializeCareer(fullCarReset(career)));
    assert.equal(resetsRemaining(career), 2 - i);
    assert.equal(career.vehicles.eclipse.parts.clutch.health, 1);
    assert.ok(career.vehicles.eclipse.fuelLiters > 0);
  }
  assert.equal(career.walletCents, createCareer().walletCents);
  const locked = serializeCareer(career);
  assert.throws(() => fullCarReset(career), /locked/);
  assert.equal(serializeCareer(career), locked);
  assert.equal(resetsRemaining(parseCareer(original)), 3);
});

test('graffiti unlock persists, rejects incorrect codes, and supports legacy saves', () => {
  const legacy = createCareer(); delete legacy.resetAccess;
  let career = parseCareer(serializeCareer(legacy));
  assert.equal(resetsRemaining(career), 3);
  assert.throws(() => unlockFullResets(career, 'wrong'), /password/);
  career = parseCareer(serializeCareer(unlockFullResets(career, ' shift3 ')));
  for (let i = 0; i < 6; i++) career = fullCarReset(career);
  assert.equal(resetsRemaining(career), Infinity);
  career.resetAccess.used = -1;
  assert.throws(() => serializeCareer(career), /allowance/);
});

test('donation URLs accept only HTTPS without credentials and clue wall stays on the map', () => {
  for (const value of ['', 'javascript:alert(1)', 'http://example.com', 'https://user:pass@example.com']) assert.equal(donationUrl(value), null);
  assert.equal(donationUrl('https://example.com/donate'), 'https://example.com/donate');
  const point = graffitiLocation(createGridMap()); assert.deepEqual(point, { col: 22, row: 25 });
  assert.deepEqual(graffitiLocation(createGridMap({size:4})), {col:0,row:2});
});
