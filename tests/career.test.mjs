import { createLegacyCareer } from './fixtures/legacy-career.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SAVE_KEY, STARTING_WALLET_CENTS, createCareer, switchVehicle,
  createDeliveryOffer, acceptDelivery, pickupDelivery, completeDelivery,
  purchaseService, applyFine, awardDragWin, DRAG_WIN_PAYOUT_CENTS,
  saveCareer, loadCareer, parseCareer,
} from '../src/career.js';
import { applyDrivingWear } from '../src/condition.js';
import { setVehicleCondition } from '../src/career.js';

const delivery = () => createDeliveryOffer('meal-1', 14, 68, 2.5);
const memoryStorage = () => {
  const entries = new Map();
  return { getItem: key => entries.has(key) ? entries.get(key) : null,
    setItem: (key, value) => entries.set(key, value), entries };
};

test('delivery requires pickup and drop-off, pays once, and survives reload', () => {
  const offer = delivery();
  let career = acceptDelivery(createCareer(), offer);
  assert.throws(() => completeDelivery(career, offer.id, offer.dropoffNodeId));
  assert.throws(() => pickupDelivery(career, offer.dropoffNodeId));
  career = pickupDelivery(career, offer.pickupNodeId);
  assert.throws(() => completeDelivery(career, offer.id, offer.pickupNodeId));
  career = completeDelivery(career, offer.id, offer.dropoffNodeId);
  assert.equal(career.walletCents, STARTING_WALLET_CENTS + offer.payoutCents);
  assert.equal(completeDelivery(career, offer.id, offer.dropoffNodeId).walletCents, career.walletCents);
  assert.throws(() => acceptDelivery(career, offer), /already been used/);
  const storage = memoryStorage();
  saveCareer(storage, career);
  const loaded = loadCareer(storage);
  assert.equal(loaded.recovered, false);
  assert.equal(loaded.career.walletCents, career.walletCents);
  assert.equal(completeDelivery(loaded.career, offer.id, offer.dropoffNodeId).walletCents, career.walletCents);
});

test('garage rejects unaffordable service and repeated transaction IDs do not charge twice', () => {
  const initial = createCareer();
  assert.throws(() => purchaseService(initial, { type: 'upgrade', partKey: 'engine' }, 'upgrade-engine'), /Insufficient/);
  const serviced = purchaseService(initial, { type: 'oil-change' }, 'oil-1');
  assert.equal(serviced.walletCents, STARTING_WALLET_CENTS - 7_500);
  assert.equal(purchaseService(serviced, { type: 'oil-change' }, 'oil-1').walletCents, serviced.walletCents);
  assert.throws(() => purchaseService(serviced, { type: 'repair', partKey: 'clutch' }, 'oil-1'), /another purchase/);
  assert.equal(serviced.transactions.length, 1);
  assert.equal(initial.transactions.length, 0);
});

test('an active pickup survives save/reload and remains payable once', () => {
  const offer = delivery();
  const storage = memoryStorage();
  saveCareer(storage, pickupDelivery(acceptDelivery(createCareer(), offer), offer.pickupNodeId));
  const loaded = loadCareer(storage).career;
  assert.equal(loaded.jobs.active.status, 'picked-up');
  const paid = completeDelivery(loaded, offer.id, offer.dropoffNodeId);
  assert.equal(paid.walletCents, STARTING_WALLET_CENTS + offer.payoutCents);
  assert.equal(paid.transactions.filter(item => item.type === 'job').length, 1);
});

test('vehicle wear remains attached to the car when switching', () => {
  let career = createLegacyCareer('eclipse');
  const wornEclipse = applyDrivingWear(career.vehicles.eclipse, {
    dtSeconds: 1, clutchPosition: .45, slipRadPerSecond: 200, clutchSlipping: true, throttle: 1,
  });
  career = switchVehicle(setVehicleCondition(career, wornEclipse), 'civic');
  assert.equal(career.activeVehicleId, 'civic');
  assert.equal(career.vehicles.civic.parts.clutch.health, 1);
  assert.ok(career.vehicles.eclipse.parts.clutch.health < 1);
});

test('invalid save falls back without overwriting the original data', () => {
  const storage = memoryStorage();
  storage.setItem(SAVE_KEY, '{not JSON');
  const loaded = loadCareer(storage);
  assert.equal(loaded.recovered, true);
  assert.equal(loaded.career.walletCents, STARTING_WALLET_CENTS);
  assert.equal(storage.getItem(SAVE_KEY), '{not JSON');
  const wrongVersion = JSON.stringify({ version: 99, career: createCareer() });
  assert.throws(() => parseCareer(wrongVersion), /version/);
});

test('fabricated payout and negative wallet edits are rejected', () => {
  const offer = { ...delivery(), payoutCents: 999_999_999 };
  assert.throws(() => acceptDelivery(createCareer(), offer), /payout/);
  const edited = createCareer();
  edited.walletCents = -1;
  assert.throws(() => saveCareer(memoryStorage(), edited), /Wallet/);
});

test('fines charge once, survive reload, and cannot overdraw the wallet', () => {
  const citation = { id: 'patrol-1', reason: 'Ran a red light', amountCents: 15_000 };
  const first = applyFine(createCareer(), citation);
  assert.equal(first.walletCents, STARTING_WALLET_CENTS - citation.amountCents);
  assert.equal(applyFine(first, citation).walletCents, first.walletCents);
  assert.equal(first.transactions.length, 1);
  assert.throws(() => applyFine(first, { ...citation, amountCents: 20_000 }), /another citation/);
  const empty = applyFine(first, { id: 'patrol-2', reason: 'Collision observed by police', amountCents: 100_000 });
  assert.equal(empty.walletCents, 0);
  const stillEmpty = applyFine(empty, { id: 'patrol-3', reason: 'Speeding', amountCents: 9_000 });
  assert.equal(stillEmpty.walletCents, 0);
  const storage = memoryStorage();
  saveCareer(storage, stillEmpty);
  assert.equal(loadCareer(storage).career.transactions.filter(item => item.type === 'fine').length, 3);
});

test('fine history is validated without changing old version-one saves', () => {
  const legacy=createCareer();legacy.schemaVersion=1;delete legacy.vehicleMeta;delete legacy.fleet;
  assert.equal(parseCareer(JSON.stringify({ version: 1, career: legacy })).walletCents, STARTING_WALLET_CENTS);
  const altered = applyFine(createCareer(), { id: 'patrol-4', reason: 'Speeding', amountCents: 9_000 });
  altered.transactions[0].amountCents = -1;
  assert.throws(() => saveCareer(memoryStorage(), altered), /fine transaction/);
});

test('a drag win pays once, persists, and rejects altered results', () => {
  const first = awardDragWin(createCareer(), 'night-1', 21.25);
  assert.equal(first.walletCents, STARTING_WALLET_CENTS + DRAG_WIN_PAYOUT_CENTS);
  assert.equal(awardDragWin(first, 'night-1', 21.25).walletCents, first.walletCents);
  assert.throws(() => awardDragWin(first, 'night-1', 18.1), /another result/);
  assert.throws(() => awardDragWin(first, 'night-2', 0), /race time/);
  const storage = memoryStorage();
  saveCareer(storage, first);
  assert.equal(loadCareer(storage).career.transactions.filter(item => item.type === 'race').length, 1);
  const altered = structuredClone(first);
  altered.transactions[0].amountCents = 99_999;
  assert.throws(() => saveCareer(storage, altered), /race transaction/);
});
