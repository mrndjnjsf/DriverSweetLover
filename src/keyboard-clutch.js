import { CLUTCH } from "./config/gameplay.js";
export const KEYBOARD_CLUTCH_BUILD_RATE = CLUTCH.keyboardBuildPerSecond;
export const KEYBOARD_CLUTCH_RELEASE_RATE = CLUTCH.keyboardReleasePerSecond;

export function advanceKeyboardClutch(value, held, dt, settings=CLUTCH) {
 const rate = held ? settings.keyboardBuildPerSecond : -settings.keyboardReleasePerSecond;
 return Math.max(0, Math.min(1, value + rate * Math.max(0, dt)));
}
