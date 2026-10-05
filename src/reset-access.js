import { SUPPORT } from './config/support.js';

export function resetAccess(career) {
  return career.resetAccess || { used: 0, unlocked: false };
}

export function validateResetAccess(access) {
  if (access === undefined) return; // Existing saves receive the starter allowance.
  if (!access || !Number.isInteger(access.used) || access.used < 0
      || access.used > SUPPORT.starterResets || typeof access.unlocked !== 'boolean') {
    throw new TypeError('Invalid full-reset allowance');
  }
}

export function resetsRemaining(career) {
  const access = resetAccess(career);
  return access.unlocked ? Infinity : SUPPORT.starterResets - access.used;
}

export function matchesGraffiti(value) {
  return typeof value === 'string' && value.trim().toUpperCase() === SUPPORT.graffitiCode;
}

export function donationUrl(value = SUPPORT.donationUrl) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}

export function graffitiLocation(map) {
  // Three blocks west of the central intersection, at a roadside wall.
  const center = Math.floor(map.size / 2);
  return { col: Math.max(0, center - 3), row: center };
}
