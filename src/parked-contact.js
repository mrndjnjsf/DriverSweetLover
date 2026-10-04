import { carsOverlap, findTrafficImpact } from './collision.js';

// Headless contact latch. Reuse the scratch array in the physics substeps.
// A rollback can separate the current pose slightly; the previous pose keeps
// that same sustained contact latched until the car actually backs away.
export function resolveParkedContact(contacts, previous, current, obstacles, scratch = []) {
  scratch.length = 0;
  for (const obstacle of obstacles) {
    const dx = current.x - obstacle.x, dz = current.z - obstacle.z;
    const touching = dx * dx + dz * dz < 36 && carsOverlap(current, obstacle);
    if (!touching && contacts.has(obstacle.id) && !carsOverlap(previous, obstacle)) contacts.delete(obstacle.id);
    if (touching) scratch.push(obstacle);
  }
  if (!scratch.length) return null;
  const impact = findTrafficImpact(current, scratch);
  // Charge only a newly touched obstacle, even if an older contact is stronger.
  let freshImpact = null;
  for (const obstacle of scratch) {
    if (!contacts.has(obstacle.id)) {
      const candidate = findTrafficImpact(current, [obstacle]);
      if (!freshImpact || candidate.impactSpeedMps > freshImpact.impactSpeedMps) freshImpact = candidate;
    }
    contacts.add(obstacle.id);
  }
  return { impact, freshImpact };
}
