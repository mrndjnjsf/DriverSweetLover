import { districtAt, gridPoint, nearestRoadPoint, roadOpen } from './grid-map.js';

const TYPES = Object.freeze(['stalled-car', 'dog', 'construction', 'children', 'debris']);
const HARD_TYPES = new Set(['stalled-car', 'construction', 'debris']);

function random(system) {
 system.randomState = (Math.imul(system.randomState, 1664525) + 1013904223) >>> 0;
 return system.randomState / 4294967296;
}

function streetValid(map, event) {
 return event.col >= 0 && event.row >= 0 && event.col < map.size - 1 && event.row < map.size - 1
  && roadOpen(map, event.col, event.row, event.axis);
}

function streetPosition(map, col, row, axis, fraction) {
 const start = gridPoint(map, col, row);
 const lane = map.roadWidth * .25;
 return axis === 'south'
  ? { x: start.x + lane, z: start.z - fraction * map.blockSize, heading: 0 }
  : { x: start.x + fraction * map.blockSize, z: start.z + lane, heading: -Math.PI / 2 };
}

function eventPosition(map, event, player) {
 const center = streetPosition(map, event.col, event.row, event.axis, event.fraction);
 if (HARD_TYPES.has(event.type)) return center;
 const side = event.side;
 const margin = map.roadWidth / 2 + (event.type === 'children' ? 2.5 : 1.7);
 const close = Math.hypot(center.x - player.x, center.z - player.z) < 25;
 // Living creatures retreat toward the sidewalk as the player approaches.
 // Children never enter the road; a distant dog may cross only while clear.
 let lateral = side * margin;
 if (event.type === 'dog' && !close) lateral = side * margin * Math.cos(event.age * 1.6);
 if (close) lateral = side * (margin + 1.7);
 const lane = map.roadWidth * .25;
 return event.axis === 'south'
  ? { x: center.x - lane + lateral, z: center.z, heading: side > 0 ? -Math.PI / 2 : Math.PI / 2 }
  : { x: center.x, z: center.z - lane + lateral, heading: side > 0 ? 0 : Math.PI };
}

function snapshot(system, event, player) {
 const position = eventPosition(system.map, event, player);
 return {
  id: event.id, type: event.type, ...position,
  radius: event.type === 'stalled-car' ? 1.35 : event.type === 'construction' ? 1.25 : event.type === 'debris' ? 1.1 : .7,
  hardObstacle: HARD_TYPES.has(event.type), caution: true,
  age: event.age, remainingSeconds: Math.max(0, event.life - event.age)
 };
}

function spawn(system, player) {
 const map = system.map;
 const near = nearestRoadPoint(map, player.x, player.z);
 for (let attempt = 0; attempt < 110; attempt++) {
  const col = Math.max(0, Math.min(map.size - 2, near.col + Math.floor(random(system) * 9) - 4));
  const row = Math.max(0, Math.min(map.size - 2, near.row + Math.floor(random(system) * 9) - 4));
  const axis = random(system) < .5 ? 'south' : 'east';
  if (!roadOpen(map, col, row, axis)) continue;
  const fraction = .2 + random(system) * .6;
  const base = streetPosition(map, col, row, axis, fraction);
  const distance = Math.hypot(base.x - player.x, base.z - player.z);
  if (distance < system.safeDistance || distance > system.radius) continue;
  if (map.locations.some(location => {
   const marker = gridPoint(map, location.col, location.row);
   return Math.hypot(base.x - marker.x, base.z - marker.z) < 22;
  })) continue;
  let type = TYPES[system.nextType % TYPES.length];
  if (type === 'children' && !['residential', 'suburban'].includes(districtAt(map, col, row))) {
   // Keep children's play scenes in neighborhoods without starving the pool.
   type = 'construction';
  }
  if (system.events.some(other => {
   const point = streetPosition(map, other.col, other.row, other.axis, other.fraction);
   return Math.hypot(point.x - base.x, point.z - base.z) < map.blockSize * .7;
  })) continue;
  system.nextType++;
  return { id: system.nextId++, type, col, row, axis, fraction,
   side: random(system) < .5 ? -1 : 1, age: 0, life: 35 + random(system) * 30 };
 }
 return null;
}

export function createRoadEventSystem(map, { seed = 9172, count = 3 } = {}) {
 if (!map || !Number.isInteger(seed) || !Number.isInteger(count) || count < 0 || count > 12) {
  throw new RangeError('Invalid road event settings');
 }
 return { map, randomState: seed >>> 0, count, nextId: 1, nextType: 0,
  events: [], time: 0, radius: map.blockSize * 4.4,
  safeDistance: Math.max(42, map.blockSize * .75), recycleDelay: 0 };
}

export function setRoadEventMap(system, map) {
 if (!map) throw new RangeError('Invalid road event map');
 system.map = map;
 system.radius = map.blockSize * 4.4;
 system.safeDistance = Math.max(42, map.blockSize * .75);
 system.events = system.events.filter(event => streetValid(map, event)
  && (event.type !== 'children' || ['residential', 'suburban'].includes(districtAt(map, event.col, event.row))));
 system.recycleDelay = Math.max(system.recycleDelay, 1);
}

export function updateRoadEvents(system, dt, player = { x: 0, z: 0 }) {
 if (!Number.isFinite(dt) || dt < 0 || !Number.isFinite(player?.x) || !Number.isFinite(player?.z)) {
  throw new RangeError('Invalid road event update');
 }
 const elapsed = Math.min(dt, 1);
 system.time += elapsed;
 system.recycleDelay = Math.max(0, system.recycleDelay - elapsed);
 system.events = system.events.filter(event => {
  event.age += elapsed;
  if (event.age >= event.life || !streetValid(system.map, event)) return false;
  const point = streetPosition(system.map, event.col, event.row, event.axis, event.fraction);
  return Math.hypot(point.x - player.x, point.z - player.z) <= system.radius;
 });
 if (system.events.length < system.count && system.recycleDelay === 0) {
  // Initial fill is immediate; thereafter add one encounter every few seconds.
  const limit = system.time <= elapsed ? system.count : 1;
  for (let i = 0; i < limit && system.events.length < system.count; i++) {
   const event = spawn(system, player);
   if (!event) break;
   system.events.push(event);
   system.recycleDelay = 2.5;
  }
 }
 return system.events.map(event => snapshot(system, event, player));
}

// Living events are visual caution cues only. Damage is reserved for stationary
// objects, and each hard obstacle reports a stable ID for contact cooldowns.
export function findRoadEventImpact(player, events) {
 if (![player?.x, player?.z, player?.heading, player?.speed].every(Number.isFinite)) return null;
 let closest = null;
 for (const event of events ?? []) {
  if (!HARD_TYPES.has(event.type) || !Number.isFinite(event.x) || !Number.isFinite(event.z)) continue;
  const dx = event.x - player.x, dz = event.z - player.z;
  const forward = -dx * Math.sin(player.heading) - dz * Math.cos(player.heading);
  const across = dx * Math.cos(player.heading) - dz * Math.sin(player.heading);
  const radius = Number.isFinite(event.radius) ? Math.max(0, event.radius) : 1;
  if (Math.abs(forward) > 2.2 + radius || Math.abs(across) > .95 + radius) continue;
  const impact = { eventId: event.id, type: event.type,
   end: forward >= 0 ? 'front' : 'rear', impactSpeedMps: Math.abs(player.speed) };
  if (!closest || impact.impactSpeedMps > closest.impactSpeedMps) closest = impact;
 }
 return closest;
}
