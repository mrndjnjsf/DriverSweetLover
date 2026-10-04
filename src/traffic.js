import { gridPoint, nearestRoadPoint, neighbors, roadOpen } from './grid-map.js';

const COLORS = Object.freeze(['#f3eee5', '#53616e', '#b9c3cb', '#c84938', '#283843', '#d7ad58']);
const SIGNAL_CYCLE = 28;
const STOP_DISTANCE = 6;

function random(system) {
 system.randomState = (Math.imul(system.randomState, 1664525) + 1013904223) >>> 0;
 return system.randomState / 4294967296;
}

function direction(from, to) {
 if (to.col > from.col) return 'east';
 if (to.col < from.col) return 'west';
 if (to.row > from.row) return 'south';
 return 'north';
}

function axis(from, to) {
 return from.col === to.col ? 'northSouth' : 'eastWest';
}

function connected(map, from, to) {
 if (!from || !to || Math.abs(from.col - to.col) + Math.abs(from.row - to.row) !== 1) return false;
 return roadOpen(map, from.col, from.row, direction(from, to));
}

// An intersection receives a fixed offset so the whole city does not change lights at once.
export function trafficSignalState(col, row, timeSeconds) {
 const offset = ((Math.imul(col + 1, 17) + Math.imul(row + 1, 31)) >>> 0) % SIGNAL_CYCLE;
 const phase = (((timeSeconds + offset) % SIGNAL_CYCLE) + SIGNAL_CYCLE) % SIGNAL_CYCLE;
 if (phase < 12) return { northSouth: 'green', eastWest: 'red' };
 if (phase < 14) return { northSouth: 'red', eastWest: 'red' };
 if (phase < 26) return { northSouth: 'red', eastWest: 'green' };
 return { northSouth: 'red', eastWest: 'red' };
}

function chooseNext(system, from, at) {
 const options = neighbors(system.map, at.col, at.row);
 if (!options.length) return null;
 const onward = options.filter(point => point.col !== from.col || point.row !== from.row);
 const choices = onward.length ? onward : options;
 // Continuing straight is common, while turns keep traffic from looping mechanically.
 const straight = choices.find(point => point.col - at.col === at.col - from.col && point.row - at.row === at.row - from.row);
 if (straight && random(system) < .64) return straight;
 return choices[Math.floor(random(system) * choices.length)];
}

function spawn(system, player) {
 const map = system.map;
 const center = nearestRoadPoint(map, player.x, player.z);
 // Place one readable first encounter down the starting street; the rest of
 // the bounded pool is seeded and scattered over nearby connected roads.
 if (!system.initialLeadSpawned && system.vehicles.length === 0) {
  const to = neighbors(map, center.col, center.row).find(point => point.row === center.row + 1);
  if (to) {
   const lead = { id: system.nextId++, from: { col: center.col, row: center.row }, to,
    progress: map.blockSize * .2, speed: 8.5, cruiseSpeed: 11, color: '#d7ad58' };
   const spot = position(map, lead);
   const distance = Math.hypot(spot.x - player.x, spot.z - player.z);
   if (distance >= 35 && distance <= system.radius) {
    system.initialLeadSpawned = true;
    return lead;
   }
  }
  system.initialLeadSpawned = true;
 }
 for (let attempt = 0; attempt < 100; attempt++) {
  const col = Math.max(0, Math.min(map.size - 1, center.col + Math.floor(random(system) * 17) - 8));
  const row = Math.max(0, Math.min(map.size - 1, center.row + Math.floor(random(system) * 17) - 8));
  const point = gridPoint(map, col, row);
  const distance = Math.hypot(point.x - player.x, point.z - player.z);
  if (distance < map.blockSize * .8 || distance > system.radius) continue;
  const options = neighbors(map, col, row);
  if (!options.length) continue;
  const to = options[Math.floor(random(system) * options.length)];
  const vehicle = {
   id: system.nextId++, from: { col, row }, to,
   progress: random(system) * map.blockSize * .7,
   speed: 7 + random(system) * 3,
   cruiseSpeed: 8 + random(system) * 7,
   color: COLORS[Math.floor(random(system) * COLORS.length)]
  };
  const candidate = position(map, vehicle);
  const candidateDistance = Math.hypot(candidate.x - player.x, candidate.z - player.z);
  if (candidateDistance < 35 || candidateDistance > system.radius) continue;
  if (system.vehicles.some(other => {
   const existing = position(map, other);
   return Math.hypot(candidate.x - existing.x, candidate.z - existing.z) < 11;
  })) continue;
  return vehicle;
 }
 return null;
}

function position(map, vehicle) {
 const from = gridPoint(map, vehicle.from.col, vehicle.from.row);
 const to = gridPoint(map, vehicle.to.col, vehicle.to.row);
 const length = Math.hypot(to.x - from.x, to.z - from.z);
 const dx = (to.x - from.x) / length;
 const dz = (to.z - from.z) / length;
 const lane = map.roadWidth * .25;
 const turnLength = Math.min(9, length * .2);
 const blend = vehicle.turnOffset && vehicle.progress < turnLength ? vehicle.progress / turnLength : 1;
 const laneX = vehicle.turnOffset ? vehicle.turnOffset.x * (1 - blend) - dz * lane * blend : -dz * lane;
 const laneZ = vehicle.turnOffset ? vehicle.turnOffset.z * (1 - blend) + dx * lane * blend : dx * lane;
 const targetHeading = Math.atan2(-dx, -dz);
 const headingDelta = vehicle.turnHeading === undefined ? 0 : Math.atan2(Math.sin(targetHeading - vehicle.turnHeading), Math.cos(targetHeading - vehicle.turnHeading));
 // With heading zero facing -Z, (-dz, dx) is the driver's right side.
 return {
  x: from.x + dx * vehicle.progress + laneX,
  z: from.z + dz * vehicle.progress + laneZ,
  heading: vehicle.turnHeading === undefined ? targetHeading : vehicle.turnHeading + headingDelta * blend
 };
}

export function createTrafficSystem(map, { count = 12, seed = 6142 } = {}) {
 if (!map || !Number.isInteger(count) || count < 0 || count > 100 || !Number.isInteger(seed)) throw new RangeError('Invalid traffic settings');
 return { map, count, randomState: seed >>> 0, nextId: 1, time: 0, radius: map.blockSize * 4.5, vehicles: [], initialLeadSpawned: false };
}

// Call this after map edits. Existing cars on deleted streets are replaced on the next update.
export function setTrafficMap(system, map) {
 system.map = map;
 system.radius = map.blockSize * 4.5;
 system.vehicles = system.vehicles.filter(vehicle => connected(map, vehicle.from, vehicle.to));
}

function advance(system, vehicle, dt, player) {
 const length = system.map.blockSize;
 const light = trafficSignalState(vehicle.to.col, vehicle.to.row, system.time);
 const red = light[axis(vehicle.from, vehicle.to)] !== 'green';
 const stopAt = length - STOP_DISTANCE;
 // A car already inside an intersection clears it when the signal changes.
 const mustStop = red && vehicle.progress <= stopAt + .001;
 const remaining = Math.max(0, stopAt - vehicle.progress);
 let desired = mustStop
  ? Math.min(vehicle.cruiseSpeed, Math.sqrt(2 * 5 * remaining))
  : vehicle.cruiseSpeed;
 // Yield to a player car stopped or moving slowly in the same lane.
 const spot = position(system.map, vehicle);
 const aheadX = player.x - spot.x, aheadZ = player.z - spot.z;
 const forwardX = -Math.sin(spot.heading), forwardZ = -Math.cos(spot.heading);
 const ahead = aheadX * forwardX + aheadZ * forwardZ;
 const across = Math.abs(aheadX * forwardZ - aheadZ * forwardX);
 if (ahead > 0 && ahead < 32 && across < 2.7) {
  desired = Math.min(desired, Math.sqrt(2 * 5 * Math.max(0, ahead - 6)));
 }
 const change = (desired > vehicle.speed ? 2.8 : 5.5) * dt;
 vehicle.speed += Math.max(-change, Math.min(change, desired - vehicle.speed));
 vehicle.progress += Math.max(0, vehicle.speed) * dt;
 if (mustStop && vehicle.progress >= stopAt) {
  vehicle.progress = stopAt;
  vehicle.speed = 0;
 }
 if (vehicle.progress < length) return true;
 const next = chooseNext(system, vehicle.from, vehicle.to);
 if (!next) return false;
 const oldFrom = gridPoint(system.map, vehicle.from.col, vehicle.from.row);
 const oldTo = gridPoint(system.map, vehicle.to.col, vehicle.to.row);
 const oldDx = (oldTo.x - oldFrom.x) / length;
 const oldDz = (oldTo.z - oldFrom.z) / length;
 vehicle.turnOffset = { x: -oldDz * system.map.roadWidth * .25, z: oldDx * system.map.roadWidth * .25 };
 vehicle.turnHeading = Math.atan2(-oldDx, -oldDz);
 vehicle.progress = Math.min(vehicle.progress - length, system.map.blockSize * .25);
 vehicle.from = vehicle.to;
 vehicle.to = next;
 return true;
}

export function updateTraffic(system, dt, playerPosition = { x: 0, z: 0 }) {
 if (!Number.isFinite(dt) || dt < 0 || !Number.isFinite(playerPosition?.x) || !Number.isFinite(playerPosition?.z)) throw new RangeError('Invalid traffic update');
 const player = playerPosition;
 system.vehicles = system.vehicles.filter(vehicle => {
  if (!connected(system.map, vehicle.from, vehicle.to)) return false;
  const point = position(system.map, vehicle);
  return Math.hypot(point.x - player.x, point.z - player.z) <= system.radius;
 }).slice(0, system.count);
 while (system.vehicles.length < system.count) {
  const vehicle = spawn(system, player);
  if (!vehicle) break;
  system.vehicles.push(vehicle);
 }
 // Substeps prevent cars jumping a stop line when a frame takes longer than usual.
 const steps = Math.max(1, Math.ceil(Math.min(dt, 1) / .05));
 const step = Math.min(dt, 1) / steps;
 for (let i = 0; i < steps; i++) {
  system.time += step;
  system.vehicles = system.vehicles.filter(vehicle => advance(system, vehicle, step, player));
 }
 system.vehicles = system.vehicles.filter(vehicle => {
  const point = position(system.map, vehicle);
  return Math.hypot(point.x - player.x, point.z - player.z) <= system.radius;
 });
 while (system.vehicles.length < system.count) {
  const vehicle = spawn(system, player);
  if (!vehicle) break;
  system.vehicles.push(vehicle);
 }
 return system.vehicles.map(vehicle => ({ id: vehicle.id, ...position(system.map, vehicle), speed: vehicle.speed, color: vehicle.color }));
}
