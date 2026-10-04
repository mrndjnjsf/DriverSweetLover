import { gridPoint, nearestRoadPoint, roadOpen } from './grid-map.js';
import { trafficSignalState } from './traffic.js';

const OBSERVATION_RADIUS = 70;
const SPEED_LIMIT_MPS = 15.65; // 35 mph city limit
const SPEED_CITATION_MPS = 19.7; // allow a visible margin above the limit
const CITATION_COOLDOWN = 12;
const STOP_LINE_DISTANCE = 6;

const finitePose = pose => pose && ['x', 'z', 'heading', 'speed'].every(key => Number.isFinite(pose[key]));

function hashNode(col, row, seed) {
  let value = (Math.imul(col + 1, 73856093) ^ Math.imul(row + 1, 19349663) ^ seed) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 2246822519) >>> 0;
  return (value ^ (value >>> 13)) >>> 0;
}

function policeAt(map, col, row) {
  if (col < 0 || row < 0 || col >= map.size || row >= map.size) return null;
  if (!['north', 'south', 'east', 'west'].some(direction => roadOpen(map, col, row, direction))) return null;
  const point = gridPoint(map, col, row);
  const shoulder = map.roadWidth / 2 + 2;
  return { id: `officer:${col}:${row}`, x: point.x + shoulder, z: point.z + shoulder,
    heading: -Math.PI / 2, col, row };
}

function nearbyOfficers(system, player) {
  const center = nearestRoadPoint(system.map, player.x, player.z);
  const candidates = [];
  for (let row = Math.max(0, center.row - 3); row <= Math.min(system.map.size - 1, center.row + 3); row++) {
    for (let col = Math.max(0, center.col - 3); col <= Math.min(system.map.size - 1, center.col + 3); col++) {
      if (hashNode(col, row, system.seed) % 7 !== 0) continue;
      const officer = policeAt(system.map, col, row);
      if (!officer) continue;
      const distance = Math.hypot(officer.x - player.x, officer.z - player.z);
      if (distance <= system.map.blockSize * 3.5) candidates.push({ officer, distance });
    }
  }
  candidates.sort((a, b) => a.distance - b.distance || a.officer.id.localeCompare(b.officer.id));
  return candidates.slice(0, 2).map(item => item.officer);
}

function observed(officers, point) {
  return officers.some(officer => Math.hypot(officer.x - point.x, officer.z - point.z) <= OBSERVATION_RADIUS);
}

function redLightCrossing(system, previous, current, signalTime, officers) {
  const deltaX = current.x - previous.x, deltaZ = current.z - previous.z;
  const distance = Math.hypot(deltaX, deltaZ);
  if (distance < .35 || Math.abs(current.speed) < 2.5) return null;
  const alongX = Math.abs(deltaX) > Math.abs(deltaZ);
  const direction = alongX ? (deltaX > 0 ? 'east' : 'west') : (deltaZ > 0 ? 'south' : 'north');
  const headingX = -Math.sin(current.heading), headingZ = -Math.cos(current.heading);
  if ((deltaX * headingX + deltaZ * headingZ) / distance < .65) return null;
  const map = system.map;
  const origin = Math.floor(map.size / 2);
  const minCol = Math.max(0, Math.floor(Math.min(previous.x, current.x) / map.blockSize + origin) - 1);
  const maxCol = Math.min(map.size - 1, Math.ceil(Math.max(previous.x, current.x) / map.blockSize + origin) + 1);
  const minRow = Math.max(0, Math.floor(-Math.max(previous.z, current.z) / map.blockSize + origin) - 1);
  const maxRow = Math.min(map.size - 1, Math.ceil(-Math.min(previous.z, current.z) / map.blockSize + origin) + 1);
  const lane = map.roadWidth * .25;
  for (let row = minRow; row <= maxRow; row++) for (let col = minCol; col <= maxCol; col++) {
    if (!roadOpen(map, col, row, direction === 'north' ? 'south' : direction === 'south' ? 'north' : direction === 'east' ? 'west' : 'east')) continue;
    const node = gridPoint(map, col, row);
    const line = direction === 'north' ? node.z + STOP_LINE_DISTANCE
      : direction === 'south' ? node.z - STOP_LINE_DISTANCE
      : direction === 'east' ? node.x - STOP_LINE_DISTANCE : node.x + STOP_LINE_DISTANCE;
    const before = alongX ? previous.x : previous.z;
    const after = alongX ? current.x : current.z;
    const forward = direction === 'south' || direction === 'east' ? 1 : -1;
    if (forward * (before - line) > .05 || forward * (after - line) < .05) continue;
    const fraction = (line - before) / (after - before);
    if (fraction < 0 || fraction > 1) continue;
    const lateral = alongX ? previous.z + deltaZ * fraction : previous.x + deltaX * fraction;
    const expectedLane = alongX ? node.z + (direction === 'east' ? lane : -lane)
      : node.x + (direction === 'south' ? -lane : lane);
    if (Math.abs(lateral - expectedLane) > map.roadWidth * .45) continue;
    const crossing = { x: previous.x + deltaX * fraction, z: previous.z + deltaZ * fraction };
    if (!observed(officers, crossing)) continue;
    const axis = alongX ? 'eastWest' : 'northSouth';
    const crossingTime = signalTime - system.lastDt * (1 - fraction);
    if (trafficSignalState(col, row, crossingTime)[axis] !== 'green') {
      return { reason: 'Ran a red light', amountCents: 15_000 };
    }
  }
  return null;
}

export function createPoliceSystem(map, { seed = 9713, sessionId } = {}) {
  if (!map || !Number.isInteger(seed)) throw new RangeError('Invalid police settings');
  const identity = sessionId ?? (globalThis.crypto?.randomUUID?.().replaceAll('-', '')
    ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`);
  if (typeof identity !== 'string' || !/^[A-Za-z0-9_-]{1,32}$/.test(identity)) {
    throw new RangeError('Invalid police session ID');
  }
  return { map, seed: seed >>> 0, sessionId: identity, time: 0, lastDt: 0, nextCitation: 1,
    lastCitationAt: -Infinity, speedingSeconds: 0, speedingLatched: false,
    lastImpact: false, officers: [] };
}

export function setPoliceMap(system, map) {
  if (!map) throw new RangeError('Police map is required');
  system.map = map;
  system.officers = [];
  system.speedingSeconds = 0;
  system.speedingLatched = false;
}

export function updatePolice(system, dt, { previous, current, impact = false, timeSeconds } = {}) {
  if (!Number.isFinite(dt) || dt < 0 || dt > 1 || !finitePose(previous) || !finitePose(current)
    || (timeSeconds !== undefined && (!Number.isFinite(timeSeconds) || timeSeconds < 0))) {
    throw new RangeError('Invalid police update');
  }
  system.time += dt;
  system.lastDt = dt;
  system.officers = nearbyOfficers(system, current);
  const inSight = observed(system.officers, current);
  const hitNow = Boolean(impact) && !system.lastImpact;
  system.lastImpact = Boolean(impact);
  const fast = Math.abs(current.speed) >= SPEED_CITATION_MPS && inSight;
  system.speedingSeconds = fast ? system.speedingSeconds + dt : 0;
  if (!fast && Math.abs(current.speed) < SPEED_LIMIT_MPS) system.speedingLatched = false;
  let finding = null;
  if (hitNow && inSight) finding = { reason: 'Collision observed by police', amountCents: 12_500 };
  else finding = redLightCrossing(system, previous, current, timeSeconds ?? system.time, system.officers);
  if (!finding && system.speedingSeconds >= .45 && !system.speedingLatched) {
    finding = { reason: `Speeding at ${Math.round(Math.abs(current.speed) * 2.23694)} mph in a 35 mph zone`, amountCents: 9_000 };
  }
  if (!finding || system.time - system.lastCitationAt < CITATION_COOLDOWN) return { officers: system.officers, violation: null };
  if (finding.reason.startsWith('Speeding at ')) system.speedingLatched = true;
  system.lastCitationAt = system.time;
  return { officers: system.officers,
    violation: { id: `police-${system.sessionId}-${system.nextCitation++}`, ...finding } };
}
