import { WORLD } from "./config/gameplay.js";
const HOURS_PER_SECOND = WORLD.cityHoursPerSecond;
const wrap = hour => ((hour % 24) + 24) % 24;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

// One real minute is one city hour. Time advances only while gameplay runs.
export function cityHour(elapsedSeconds) {
 if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) throw new RangeError('Invalid city time');
 return wrap(WORLD.cityStartHour + elapsedSeconds * HOURS_PER_SECOND);
}

export function daylightAt(hour) {
 if (!Number.isFinite(hour)) throw new RangeError('Invalid hour');
 const h = wrap(hour);
 if (h < 6 || h >= 20) return 0;
 if (h < 8) return clamp((h - 6) / 2, 0, 1);
 if (h < 17) return 1;
 return clamp((20 - h) / 3, 0, 1);
}

export function formatCityTime(hour) {
 const h = wrap(hour);
 const rounded = Math.floor(h * 60 + .5) % (24 * 60);
 const displayHour = Math.floor(rounded / 60) % 12 || 12;
 const minutes = String(rounded % 60).padStart(2, '0');
 return `${displayHour}:${minutes} ${Math.floor(rounded / 60) < 12 ? 'AM' : 'PM'}`;
}

export function advanceToHour(elapsedSeconds, targetHour) {
 if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0 || !Number.isFinite(targetHour)) throw new RangeError('Invalid city time');
 const deltaHours = wrap(targetHour - cityHour(elapsedSeconds));
 return elapsedSeconds + deltaHours / HOURS_PER_SECOND;
}
