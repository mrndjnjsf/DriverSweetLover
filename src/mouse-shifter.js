import { SHIFTER } from "./config/gameplay.js";
import { neutralPosition, throwLever } from './shifter.js';

export const MOUSE_THROW_PX = SHIFTER.mouseTravelPx;
const HORIZONTAL_NOTCH_PX = SHIFTER.mouseHorizontalNotchPx;
const VERTICAL_NOTCH_PX = SHIFTER.mouseVerticalNotchPx;
const CENTER_CATCH_MS = SHIFTER.mouseCenterCatchMs;
const LIMIT = MOUSE_THROW_PX;
export function createMouseShifter(position = neutralPosition()) {
 return { x: position.lane * MOUSE_THROW_PX, y: position.row * MOUSE_THROW_PX, centerCatchUntil: 0 };
}

// Mouse movement is a virtual hand on the knob while the clutch is down.
// Crossing the center catches briefly, then continued movement can reach the far lane.
export function moveMouseShifter(cursor, position, dx, dy, now = 0) {
 if (![dx, dy].every(Number.isFinite)) return { cursor, position, changed: false };
 const centerCaught = position.lane === 0 && now < cursor.centerCatchUntil;
 let x = Math.max(-LIMIT, Math.min(LIMIT, centerCaught ? 0 : cursor.x + dx));
 let y = Math.max(-LIMIT, Math.min(LIMIT, cursor.y + dy));
 if (position.row !== 0) {
  const leaving = position.row < 0 ? y > -MOUSE_THROW_PX + VERTICAL_NOTCH_PX : y < MOUSE_THROW_PX - VERTICAL_NOTCH_PX;
  if (!leaving) return { cursor: { ...cursor, x: position.lane * MOUSE_THROW_PX, y }, position, changed: false };
  const direction = position.row < 0 ? 'down' : 'up';
  return { cursor: { x: position.lane * MOUSE_THROW_PX, y: 0, centerCatchUntil: 0 }, position: throwLever(position, direction), changed: true };
 }
 if (x < position.lane * MOUSE_THROW_PX - HORIZONTAL_NOTCH_PX && position.lane > -1)
  return { cursor: { x: (position.lane - 1) * MOUSE_THROW_PX, y: 0, centerCatchUntil: position.lane === 1 ? now + CENTER_CATCH_MS : 0 }, position: { lane: position.lane - 1, row: 0, gear: 0 }, changed: true };
 if (x > position.lane * MOUSE_THROW_PX + HORIZONTAL_NOTCH_PX && position.lane < 1)
  return { cursor: { x: (position.lane + 1) * MOUSE_THROW_PX, y: 0, centerCatchUntil: position.lane === -1 ? now + CENTER_CATCH_MS : 0 }, position: { lane: position.lane + 1, row: 0, gear: 0 }, changed: true };
 x = Math.max(-LIMIT, Math.min(LIMIT, x));
 if (y < -VERTICAL_NOTCH_PX || y > VERTICAL_NOTCH_PX) {
  const next = throwLever(position, y < 0 ? 'up' : 'down');
  return { cursor: { x: position.lane * MOUSE_THROW_PX, y: next.row * MOUSE_THROW_PX, centerCatchUntil: 0 }, position: next, changed: true };
 }
 return { cursor: { x, y, centerCatchUntil: cursor.centerCatchUntil }, position, changed: false };
}

// The on-screen knob resists movement near a notch, then snaps to the lane.
export function mouseShifterDisplay(cursor, position) {
 const elastic = value => Math.max(-.7, Math.min(.7, value / MOUSE_THROW_PX * .8));
 return {
  x: position.lane + elastic(cursor.x - position.lane * MOUSE_THROW_PX),
  y: position.row + elastic(cursor.y - position.row * MOUSE_THROW_PX),
 };
}

// When an embedded browser refuses pointer lock, pressure at a window edge
// keeps the virtual hand moving until the player reverses or releases Ctrl.
export function mouseEdgeDirections(x, y, width, height, dx, dy) {
 const margin = SHIFTER.mouseEdgeMarginPx;
 return {
  x: x <= margin && dx < 0 ? -1 : x >= width - margin && dx > 0 ? 1 : 0,
  y: y <= margin && dy < 0 ? -1 : y >= height - margin && dy > 0 ? 1 : 0,
 };
}
