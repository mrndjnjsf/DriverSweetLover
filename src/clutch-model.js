import { CLUTCH } from "./config/gameplay.js";
export const HEALTHY_CLUTCH_BITE = CLUTCH.healthyBite;
export const MIN_SHIFT_CLUTCH = CLUTCH.minimumShiftPress;

// 1 is a fully depressed pedal. A worn clutch begins to grab closer to the top.
export function clutchBitePoint(health = 1) {
 const wear = Math.max(0, Math.min(1, 1 - health));
 return HEALTHY_CLUTCH_BITE + wear * CLUTCH.wornBiteRise;
}

// Lower torque capacity makes a worn clutch slip under load, even with the pedal up.
export function clutchTorqueFactor(health = 1) {
 const remaining = Math.max(0, Math.min(1, health));
 return CLUTCH.minimumGrip + (1 - CLUTCH.minimumGrip) * remaining ** CLUTCH.healthGripExponent;
}
