import { gridPoint, nearestRoadPoint, roadOpen } from './grid-map.js';

export const DRAG_DISTANCE_METERS = 400;
export const DRAG_COUNTDOWN_SECONDS = 3;
export const DRAG_TIMEOUT_SECONDS = 90;

const DIRECTIONS = [
  { name: 'north', roadDirection: 'south', dc: 0, dr: 1, x: 0, z: -1, heading: 0 },
  { name: 'south', roadDirection: 'north', dc: 0, dr: -1, x: 0, z: 1, heading: Math.PI },
  { name: 'east', roadDirection: 'east', dc: 1, dr: 0, x: 1, z: 0, heading: -Math.PI / 2 },
  { name: 'west', roadDirection: 'west', dc: -1, dr: 0, x: -1, z: 0, heading: Math.PI / 2 },
];

const finitePoint = point => point && Number.isFinite(point.x) && Number.isFinite(point.z);
const dot = (x, z, vector) => x * vector.x + z * vector.z;
const lateralOf = (course, pose) => dot(pose.x - course.start.x, pose.z - course.start.z, { x: -course.forward.z, z: course.forward.x });
const progressOf = (course, pose) => dot(pose.x - course.start.x, pose.z - course.start.z, course.forward);
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const rivalProgressAt = (elapsedSeconds, rivalTimeSeconds) => DRAG_DISTANCE_METERS
  * Math.pow(clamp(elapsedSeconds / rivalTimeSeconds, 0, 1), 1.3);

function requirePose(pose) {
  if (!finitePoint(pose) || !Number.isFinite(pose.heading) || !Number.isFinite(pose.speed)) {
    throw new TypeError('Race pose requires finite x, z, heading, and speed');
  }
}

function requireCourse(course) {
  if (!course || typeof course.id !== 'string' || !finitePoint(course.start)
    || !Number.isFinite(course.start.heading) || !finitePoint(course.finish)
    || !finitePoint(course.rivalStart) || !finitePoint(course.forward)
    || Math.abs(Math.hypot(course.forward.x, course.forward.z) - 1) > 1e-6
    || course.distanceMeters !== DRAG_DISTANCE_METERS
    || !Number.isFinite(course.laneHalfWidth) || course.laneHalfWidth <= 0) {
    throw new TypeError('Invalid drag course');
  }
}

function courseAt(map, col, row, direction) {
  const { dc, dr, x, z, heading } = direction;
  const behind = map.blockSize * .35;
  // The start lies behind its anchor intersection. The finish can lie between intersections.
  // Every street segment touched by that interval must remain open after map edits.
  const lastEdge = Math.floor((DRAG_DISTANCE_METERS - behind - 1e-9) / map.blockSize);
  if (lastEdge < 5) return null;
  for (let edge = -1; edge <= lastEdge; edge++) {
    if (!roadOpen(map, col + dc * edge, row + dr * edge, direction.roadDirection)) return null;
  }
  const center = gridPoint(map, col, row);
  const lane = map.roadWidth * .25;
  const rightX = -z, rightZ = x;
  const start = { x: center.x - x * behind + rightX * lane, z: center.z - z * behind + rightZ * lane, heading };
  return {
    id: `drag-${col}-${row}-${direction.name}`,
    start,
    finish: { x: start.x + x * DRAG_DISTANCE_METERS, z: start.z + z * DRAG_DISTANCE_METERS },
    forward: { x, z },
    distanceMeters: DRAG_DISTANCE_METERS,
    rivalStart: { x: center.x - x * behind - rightX * lane, z: center.z - z * behind - rightZ * lane },
    laneHalfWidth: map.roadWidth * .25,
  };
}

/** Find a straight, connected quarter mile near the player (or the map spawn). */
export function findDragCourse(map, nearPose = null) {
  if (!map || !Number.isInteger(map.size) || map.size < 2
    || !Number.isFinite(map.blockSize) || map.blockSize <= 0
    || !Number.isFinite(map.roadWidth) || map.roadWidth <= 0) return null;
  const spawn = map.locations?.find(location => location.kind === 'spawn');
  const spawnPoint = spawn ? gridPoint(map, spawn.col, spawn.row) : null;
  const reference = nearPose ?? (spawnPoint && { x: spawnPoint.x + map.roadWidth * .25, z: spawnPoint.z + map.blockSize * .35 });
  if (!finitePoint(reference)) return null;
  const near = nearestRoadPoint(map, reference.x, reference.z);
  const candidates = [];
  for (let row = 0; row < map.size; row++) for (let col = 0; col < map.size; col++) {
    const node = gridPoint(map, col, row);
    const distance = Math.hypot(node.x - near.x, node.z - near.z);
    if (distance <= map.blockSize * 3 + 1e-6) candidates.push({ col, row, distance });
  }
  candidates.sort((a, b) => a.distance - b.distance || a.row - b.row || a.col - b.col);
  for (const candidate of candidates) {
    for (const direction of DIRECTIONS) {
      const course = courseAt(map, candidate.col, candidate.row, direction);
      if (course) return course;
    }
  }
  return null;
}

/** Race updates are immutable. A null course means the current map has no usable strip. */
export function createDragRace(course, { rivalTimeSeconds = 22 } = {}) {
  if (course === null) return null;
  requireCourse(course);
  if (!Number.isFinite(rivalTimeSeconds) || rivalTimeSeconds <= 0) throw new RangeError('Rival time must be positive and finite');
  return {
    course, phase: 'ready', countdownRemaining: DRAG_COUNTDOWN_SECONDS,
    elapsedSeconds: 0, rivalTimeSeconds, rivalProgress: 0,
    previousProgress: null, previousLateral: null, result: null,
  };
}

/** Stage only when stopped, aligned, and within one meter of the line. */
export function stageRace(race, pose) {
  if (race === null) return { race: null, staged: false, reason: 'unavailable' };
  requirePose(pose);
  if (race.phase !== 'ready') return { race, staged: false, reason: 'not-ready' };
  const course = race.course;
  const progress = progressOf(course, pose), lateral = lateralOf(course, pose);
  if (Math.abs(progress) > 1 || Math.abs(lateral) > course.laneHalfWidth) return { race, staged: false, reason: 'line' };
  if (Math.abs(pose.speed) > .5) return { race, staged: false, reason: 'moving' };
  const angle = Math.atan2(Math.sin(pose.heading - course.start.heading), Math.cos(pose.heading - course.start.heading));
  if (Math.abs(angle) > Math.PI / 9) return { race, staged: false, reason: 'alignment' };
  return {
    race: { ...race, phase: 'countdown', countdownRemaining: DRAG_COUNTDOWN_SECONDS, previousProgress: progress, previousLateral: lateral },
    staged: true, reason: null,
  };
}

function finish(race, outcome, reason, elapsedSeconds) {
  const result = { outcome, reason, elapsedSeconds };
  return {
    race: { ...race, phase: 'finished', elapsedSeconds, rivalProgress: rivalProgressAt(elapsedSeconds, race.rivalTimeSeconds), result },
    events: [{ type: 'result', raceId: race.course.id, ...result }],
  };
}

/** Advance countdown and race clock. Result events are emitted exactly once. */
export function updateDragRace(race, dt, pose) {
  if (race === null) return { race: null, events: [] };
  if (!Number.isFinite(dt) || dt < 0) throw new RangeError('Race delta time must be nonnegative and finite');
  requirePose(pose);
  if (race.phase === 'ready' || race.phase === 'finished') return { race, events: [] };
  const course = race.course;
  const progress = progressOf(course, pose), lateral = lateralOf(course, pose);
  if (race.phase === 'countdown') {
    if (progress > 1) return finish(race, 'false-start', 'crossed-line-during-countdown', 0);
    const remaining = Math.max(0, race.countdownRemaining - dt);
    if (remaining > 0) return { race: { ...race, countdownRemaining: remaining, previousProgress: progress, previousLateral: lateral }, events: [] };
    const activeTime = dt - race.countdownRemaining;
    const started = { ...race, phase: 'active', countdownRemaining: 0, previousProgress: progress, previousLateral: lateral };
    if (activeTime === 0) return { race: started, events: [{ type: 'start', raceId: course.id }] };
    const updated = updateDragRace(started, activeTime, pose);
    return { race: updated.race, events: [{ type: 'start', raceId: course.id }, ...updated.events] };
  }
  if (race.phase !== 'active') throw new TypeError('Invalid race phase');

  const previous = race.previousProgress ?? progress;
  const crossingFraction = previous < DRAG_DISTANCE_METERS && progress >= DRAG_DISTANCE_METERS && progress > previous
    ? (DRAG_DISTANCE_METERS - previous) / (progress - previous) : null;
  const crossingLateral = crossingFraction === null ? Infinity
    : (race.previousLateral ?? lateral) + (lateral - (race.previousLateral ?? lateral)) * crossingFraction;
  const crossingTime = crossingFraction !== null && Math.abs(crossingLateral) <= course.laneHalfWidth
    ? race.elapsedSeconds + dt * crossingFraction : Infinity;
  const rivalTime = race.rivalTimeSeconds;
  const deadline = Math.min(rivalTime, DRAG_TIMEOUT_SECONDS);
  if (crossingTime < rivalTime && crossingTime <= DRAG_TIMEOUT_SECONDS) return finish(race, 'win', 'finish', crossingTime);
  if (race.elapsedSeconds + dt >= deadline) {
    const timedOut = DRAG_TIMEOUT_SECONDS < rivalTime;
    return finish(race, timedOut ? 'timeout' : 'loss', timedOut ? 'timeout' : 'rival-finished', deadline);
  }
  const elapsedSeconds = race.elapsedSeconds + dt;
  return {
    race: { ...race, elapsedSeconds, rivalProgress: rivalProgressAt(elapsedSeconds, rivalTime), previousProgress: progress, previousLateral: lateral },
    events: [],
  };
}
