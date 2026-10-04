import { NEEDS } from './config/life.js';

export function createNeeds() { return { poop: NEEDS.initialPoop, visits: 0 }; }
export function advanceNeeds(needs, dt) {
  if (!Number.isFinite(dt) || dt < 0) throw new RangeError('Needs time must be nonnegative');
  return { ...needs, poop: Math.min(1, needs.poop + Math.max(0, dt) / NEEDS.fillSeconds) };
}
export function bathroomQuote(site) {
  if (site?.service !== 'bathroom') throw new Error('Choose a bathroom');
  return site.free ? 0 : NEEDS.paidBathroomCents;
}
// Keep state changes atomic at the application boundary: validate before paying.
export function useBathroom(needs, site, parking) {
  if (site?.service !== 'bathroom' || parking?.siteId !== site.id || !parking.ready) throw new Error('Park inside this bathroom’s marked bay first');
  if (needs.poop < NEEDS.minimumUse) throw new Error('No need to go yet');
  return { ...needs, poop: 0, visits: needs.visits + 1 };
}
