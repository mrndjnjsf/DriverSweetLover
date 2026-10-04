export const MAP_VERSION = 1;
export const DISTRICTS = Object.freeze(['residential', 'commercial', 'industrial', 'downtown', 'suburban']);
export const LOCATION_KINDS = Object.freeze(['spawn', 'garage', 'shop', 'job', 'fuel']);
export const DEFAULT_MAP_SIZE = 50;
export const DEFAULT_BLOCK_SIZE = 64;
export const DEFAULT_ROAD_WIDTH = 14.4;

const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const eastIndex = (map, col, row) => row * (map.size - 1) + col;
const southIndex = (map, col, row) => row * map.size + col;
const clone = map => ({ ...map, districts: [...map.districts], roads: { east: [...map.roads.east], south: [...map.roads.south] }, locations: map.locations.map(location => ({ ...location })) });

function randomGenerator(seed) {
 let state = seed >>> 0;
 return () => {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state / 4294967296;
 };
}

export function createGridMap({ size = DEFAULT_MAP_SIZE, blockSize = DEFAULT_BLOCK_SIZE, roadWidth = DEFAULT_ROAD_WIDTH, seed = 2784 } = {}) {
 if (!integer(size, 4, 100) || !Number.isFinite(blockSize) || blockSize < 24 || blockSize > 200 || !Number.isFinite(roadWidth) || roadWidth < 6 || roadWidth >= blockSize / 2 || !integer(seed, 0, 4294967295)) throw new RangeError('Invalid grid map settings');
 const random = randomGenerator(seed);
 const side = size - 1;
 const districts = Array(side * side).fill('residential');
 // Variable rectangular neighborhoods make a stable city layout from the seed.
 for (let row = 0; row < side;) {
  const height = Math.min(side - row, 3 + Math.floor(random() * 7));
  for (let col = 0; col < side;) {
   const width = Math.min(side - col, 3 + Math.floor(random() * 7));
   const theme = DISTRICTS[Math.floor(random() * DISTRICTS.length)];
   for (let y = row; y < row + height; y++) for (let x = col; x < col + width; x++) districts[y * side + x] = theme;
   col += width;
  }
  row += height;
 }
 const center = Math.floor(size / 2);
 return {
  version: MAP_VERSION, size, blockSize, roadWidth, seed,
  districts,
  roads: { east: Array(size * side).fill(1), south: Array(side * size).fill(1) },
  locations: [
   { id: 'start', kind: 'spawn', col: center, row: center },
   { id: 'home', kind: 'garage', col: Math.max(0, center - 2), row: center },
   { id: 'service', kind: 'shop', col: Math.min(size - 1, center + 2), row: center },
   { id: 'delivery', kind: 'job', col: center, row: Math.min(size - 1, center + 3) },
   { id: 'gas-station', kind: 'fuel', col: Math.min(size - 1, center + 2), row: Math.min(size - 1, center + 2) }
  ]
 };
}

export function gridPoint(map, col, row) {
 if (!integer(col, 0, map.size - 1) || !integer(row, 0, map.size - 1)) throw new RangeError('Grid point outside map');
 const origin = Math.floor(map.size / 2);
 return { x: (col - origin) * map.blockSize, z: (origin - row) * map.blockSize };
}

export function nearestRoadPoint(map, x, z) {
 if (!Number.isFinite(x) || !Number.isFinite(z)) throw new RangeError('Position must be finite');
 const origin = Math.floor(map.size / 2);
 const col = Math.max(0, Math.min(map.size - 1, Math.round(x / map.blockSize + origin)));
 const row = Math.max(0, Math.min(map.size - 1, Math.round(-z / map.blockSize + origin)));
 return { col, row, ...gridPoint(map, col, row) };
}

export function districtAt(map, col, row) {
 const x = Math.max(0, Math.min(map.size - 2, Math.floor(col)));
 const y = Math.max(0, Math.min(map.size - 2, Math.floor(row)));
 return map.districts[y * (map.size - 1) + x];
}

export function roadOpen(map, col, row, direction) {
 if (direction === 'east') return integer(col, 0, map.size - 2) && integer(row, 0, map.size - 1) && map.roads.east[eastIndex(map, col, row)] === 1;
 if (direction === 'south') return integer(col, 0, map.size - 1) && integer(row, 0, map.size - 2) && map.roads.south[southIndex(map, col, row)] === 1;
 if (direction === 'west') return roadOpen(map, col - 1, row, 'east');
 if (direction === 'north') return roadOpen(map, col, row - 1, 'south');
 return false;
}

export function neighbors(map, col, row) {
 const adjacent = [];
 if (roadOpen(map, col, row, 'east')) adjacent.push({ col: col + 1, row });
 if (roadOpen(map, col, row, 'south')) adjacent.push({ col, row: row + 1 });
 if (roadOpen(map, col, row, 'west')) adjacent.push({ col: col - 1, row });
 if (roadOpen(map, col, row, 'north')) adjacent.push({ col, row: row - 1 });
 return adjacent;
}

export function findRoute(map, from, to) {
 if (![from?.col, from?.row, to?.col, to?.row].every(value => integer(value, 0, map.size - 1))) return null;
 const start = from.row * map.size + from.col;
 const goal = to.row * map.size + to.col;
 const previous = new Int32Array(map.size * map.size).fill(-1);
 const queue = new Int32Array(map.size * map.size);
 let head = 0, tail = 1;
 queue[0] = start;
 previous[start] = start;
 while (head < tail && previous[goal] === -1) {
  const point = queue[head++], col = point % map.size, row = Math.floor(point / map.size);
  for (const next of neighbors(map, col, row)) {
   const index = next.row * map.size + next.col;
   if (previous[index] !== -1) continue;
   previous[index] = point;
   queue[tail++] = index;
  }
 }
 if (previous[goal] === -1) return null;
 const route = [];
 for (let point = goal; point !== start; point = previous[point]) route.push({ col: point % map.size, row: Math.floor(point / map.size) });
 route.push({ col: from.col, row: from.row });
 return route.reverse();
}

export function setRoad(map, col, row, direction, open) {
 if (!['east', 'south'].includes(direction) || !integer(col, 0, direction === 'east' ? map.size - 2 : map.size - 1) || !integer(row, 0, direction === 'south' ? map.size - 2 : map.size - 1)) throw new RangeError('Road outside map');
 const updated = clone(map);
 updated.roads[direction][direction === 'east' ? eastIndex(map, col, row) : southIndex(map, col, row)] = open ? 1 : 0;
 const validation = validateGridMap(updated);
 if (!validation.valid) throw new Error(validation.errors.join('; '));
 return updated;
}

export function setDistrict(map, col, row, district) {
 if (!integer(col, 0, map.size - 2) || !integer(row, 0, map.size - 2) || !DISTRICTS.includes(district)) throw new RangeError('Invalid district edit');
 const updated = clone(map);
 updated.districts[row * (map.size - 1) + col] = district;
 return updated;
}

export function setLocation(map, id, kind, col, row) {
 if (typeof id !== 'string' || !/^[a-z0-9_-]{1,32}$/i.test(id) || !LOCATION_KINDS.includes(kind) || !integer(col, 0, map.size - 1) || !integer(row, 0, map.size - 1)) throw new RangeError('Invalid location');
 const updated = clone(map);
 const index = updated.locations.findIndex(location => location.id === id);
 const location = { id, kind, col, row };
 if (index < 0) updated.locations.push(location);
 else updated.locations[index] = location;
 const validation = validateGridMap(updated);
 if (!validation.valid) throw new Error(validation.errors.join('; '));
 return updated;
}

export function validateGridMap(map) {
 const errors = [];
 if (!map || typeof map !== 'object' || Array.isArray(map)) return { valid: false, errors: ['Map must be an object'] };
 if (map.version !== MAP_VERSION) errors.push('Unsupported map version');
 if (!integer(map.size, 4, 100)) errors.push('Size must be an integer from 4 to 100');
 if (!Number.isFinite(map.blockSize) || map.blockSize < 24 || map.blockSize > 200) errors.push('Block length is invalid');
 if (!Number.isFinite(map.roadWidth) || map.roadWidth < 6 || map.roadWidth >= map.blockSize / 2) errors.push('Road width is invalid');
 if (!integer(map.seed, 0, 4294967295)) errors.push('Seed is invalid');
 if (errors.length) return { valid: false, errors };
 const side = map.size - 1;
 if (!Array.isArray(map.districts) || map.districts.length !== side * side || !map.districts.every(value => DISTRICTS.includes(value))) errors.push('District data is invalid');
 for (const [key, length] of [['east', map.size * side], ['south', side * map.size]]) {
  if (!Array.isArray(map.roads?.[key]) || map.roads[key].length !== length || !map.roads[key].every(value => value === 0 || value === 1)) errors.push(`${key} roads are invalid`);
 }
 if (!Array.isArray(map.locations) || map.locations.length > 256 || !map.locations.every(location => location && typeof location.id === 'string' && /^[a-z0-9_-]{1,32}$/i.test(location.id) && LOCATION_KINDS.includes(location.kind) && integer(location.col, 0, side) && integer(location.row, 0, side)) || new Set(map.locations?.map(location => location?.id)).size !== map.locations?.length) errors.push('Locations are invalid');
 if (!errors.length) {
  for (const kind of ['spawn', 'garage', 'shop', 'job']) if (!map.locations.some(location => location.kind === kind)) errors.push(`Map needs a ${kind}`);
  const visited = new Uint8Array(map.size * map.size), queue = new Int32Array(map.size * map.size);
  let head = 0, tail = 1;
  visited[0] = 1;
  while (head < tail) {
   const point = queue[head++], col = point % map.size, row = Math.floor(point / map.size);
   for (const next of neighbors(map, col, row)) {
    const index = next.row * map.size + next.col;
    if (!visited[index]) { visited[index] = 1; queue[tail++] = index; }
   }
  }
  if (tail !== visited.length) errors.push('Road network must connect every intersection');
 }
 return { valid: errors.length === 0, errors };
}

export function exportGridMap(map) {
 const validation = validateGridMap(map);
 if (!validation.valid) throw new Error(validation.errors.join('; '));
 return JSON.stringify(map, null, 2);
}

export function importGridMap(json) {
 if (typeof json !== 'string' || json.length > 250000) throw new Error('Map file is too large or invalid');
 let parsed;
 try { parsed = JSON.parse(json); } catch { throw new Error('Map JSON could not be read'); }
 const validation = validateGridMap(parsed);
 if (!validation.valid) throw new Error(validation.errors.join('; '));
 const imported = clone(parsed);
 if (!imported.locations.some(location => location.kind === 'fuel')) {
  const center = Math.floor(imported.size / 2);
  imported.locations.push({ id: 'gas-station', kind: 'fuel', col: Math.min(imported.size - 1, center + 2), row: Math.min(imported.size - 1, center + 2) });
 }
 return imported;
}
