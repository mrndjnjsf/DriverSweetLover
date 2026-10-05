import { THROTTLE } from './config/gameplay.js';

export function advanceKeyboardThrottle(value, buildHeld, fullHeld, dt, settings=THROTTLE) {
  if (fullHeld) return 1;
  const rate = buildHeld ? settings.keyboardBuildPerSecond : -settings.keyboardReleasePerSecond;
  const taper = settings.keyboardPressureTaper;
  const elapsed = Math.max(0, dt);
  // Integrate pressure-dependent pedal speed exactly so input feel is the same
  // at different frame rates. Release retraces the same curve at half speed.
  const next = taper === 0 ? value + rate * elapsed
    : value + (1 - taper * value) * -Math.expm1(-rate * taper * elapsed) / taper;
  return Math.max(0, Math.min(1, next));
}
