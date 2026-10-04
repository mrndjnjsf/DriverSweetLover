import { THROTTLE } from './config/gameplay.js';

export function advanceKeyboardThrottle(value, buildHeld, fullHeld, dt) {
  if (fullHeld) return 1;
  const rate = buildHeld ? THROTTLE.keyboardBuildPerSecond : -THROTTLE.keyboardReleasePerSecond;
  return Math.max(0, Math.min(1, value + rate * Math.max(0, dt)));
}
