import { DRIVING } from './config/driving.js';

const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
export function selectAutomaticRange(state, range) {
  if (!['D', 'N', 'R'].includes(range)) return 'Invalid automatic range';
  if (state.blown) return 'Engine destroyed · reset the car';
  if (range === state.autoRange) return '';
  if (Math.abs(state.speed) > .5 && (range === 'R' || state.autoRange === 'R')) return 'Stop before changing between Drive and Reverse';
  state.autoRange = range;
  state.gear = range === 'N' ? 0 : range === 'R' ? -1 : 1;
  state.autoShiftTime = 0; state.autoShiftCooldown = .75;
  return '';
}

// Called at the same small fixed substeps as the rest of the drivetrain.
export function advanceAutomatic(state, car, throttle, dt) {
  const tune = car.automatic;
  if (!state.autoRange) { state.autoRange = 'D'; state.gear = 1; }
  state.autoShiftTime = Math.max(0, (state.autoShiftTime || 0) - dt);
  state.autoShiftCooldown = Math.max(0, (state.autoShiftCooldown || 0) - dt);
  if (state.autoRange !== 'D' || !state.running || state.autoShiftCooldown > 0) return;
  const gear = state.gear;
  const wheelRpm = ratio => Math.abs(state.speed) / DRIVING.wheelRadiusMeters * ratio * car.final * 30 / Math.PI;
  const shiftRpm = tune.lightShiftRpm + (tune.fullShiftRpm - tune.lightShiftRpm) * throttle;
  let next = gear;
  // Road speed must support the next gear: converter revs alone must not
  // shift a brake-held car all the way to fourth.
  if (gear < car.ratios.length && state.rpm > shiftRpm && wheelRpm(car.ratios[gear]) > 1200) next++;
  else if (gear > 1 && (wheelRpm(car.ratios[gear - 1]) < tune.downshiftRpm || throttle > .75 && wheelRpm(car.ratios[gear - 1]) < tune.kickdownRpm)
    && wheelRpm(car.ratios[gear - 2]) < car.redline * .85) next--;
  if (next !== gear) {
    state.gear = next; state.autoShiftTime = tune.shiftSeconds; state.autoShiftCooldown = tune.shiftCooldownSeconds;
  }
}

export function converterTorque(state, car, wheelOmega, engineOmega) {
  if (!state.gear || !state.running || state.blown) return 0;
  const tune = car.automatic;
  const capacity = tune.idleCapacity + state.throttle * tune.loadCapacity;
  const shifting = state.autoShiftTime > 0 ? .2 : 1;
  return clamp((engineOmega - wheelOmega) * tune.couplingResponse, -capacity * .3, capacity) * shifting;
}
