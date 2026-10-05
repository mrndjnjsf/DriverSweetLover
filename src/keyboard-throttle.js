import { THROTTLE } from './config/gameplay.js';

export function advanceKeyboardThrottle(value, buildHeld, reduceHeld, dt, settings=THROTTLE) {
  if (reduceHeld) return Math.max(0, value-settings.keyboardReducePerSecond*Math.max(0,dt));
  if (!buildHeld) return value;
  const rate = settings.keyboardBuildPerSecond;
  const taper = settings.keyboardPressureTaper;
  const elapsed = Math.max(0, dt);
  // Integrate pressure-dependent pedal speed exactly so input feel is the same
  // at different frame rates.
  const next = taper === 0 ? value + rate * elapsed
    : value + (1 - taper * value) * -Math.expm1(-rate * taper * elapsed) / taper;
  return Math.max(0, Math.min(1, next));
}

export function createKeyboardThrottle(){return {value:0,coastSeconds:0};}

export function advanceThrottlePressure(control,buildHeld,reduceHeld,dt,settings=THROTTLE){
  const elapsed=Math.max(0,dt);
  if(buildHeld||reduceHeld)return {value:advanceKeyboardThrottle(control.value,buildHeld,reduceHeld,elapsed,settings),coastSeconds:0};
  const coastSeconds=control.coastSeconds+elapsed;
  const decaySeconds=Math.max(0,coastSeconds-settings.keyboardCoastSeconds)-Math.max(0,control.coastSeconds-settings.keyboardCoastSeconds);
  const value=control.value-settings.keyboardCoastDecayPerSecond*decaySeconds;
  return {value:Math.max(0,Math.min(1,value)),coastSeconds};
}
