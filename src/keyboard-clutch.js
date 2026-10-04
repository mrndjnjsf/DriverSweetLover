import { CLUTCH } from "./config/gameplay.js";
export const KEYBOARD_CLUTCH_BUILD_RATE = CLUTCH.keyboardBuildPerSecond;
export const KEYBOARD_CLUTCH_RELEASE_RATE = CLUTCH.keyboardReleasePerSecond;

export function advanceKeyboardClutch(value, held, dt) {
 const rate = held ? KEYBOARD_CLUTCH_BUILD_RATE : -KEYBOARD_CLUTCH_RELEASE_RATE;
 return Math.max(0, Math.min(1, value + rate * Math.max(0, dt)));
}
