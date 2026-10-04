import { PARKING } from './config/life.js';
import { gridPoint, neighbors } from './grid-map.js';

// Derived from existing map locations, so older maps need no migration.
export function createParkingSites(map) {
  const definitions = [
    { kind: 'spawn', id: 'public-bathroom', label: 'Community bathroom', service: 'bathroom', layout: 'lot', free: true },
    { kind: 'fuel', id: 'cafe-bathroom', label: 'Cafe bathroom', service: 'bathroom', layout: 'parallel', free: false },
    { kind: 'job', id: 'delivery-parking', label: 'Delivery pickup', service: 'delivery', layout: 'lot' },
  ];
  return definitions.flatMap(definition => {
    const location = map.locations.find(item => item.kind === definition.kind);
    if (!location) return [];
    const next = neighbors(map, location.col, location.row)[0];
    if (!next) return [];
    const start = gridPoint(map, location.col, location.row), end = gridPoint(map, next.col, next.row);
    const fx = (end.x - start.x) / map.blockSize, fz = (end.z - start.z) / map.blockSize;
    const heading = Math.atan2(-fx, -fz), rx = -fz, rz = fx;
    const offset = definition.layout === 'lot' ? map.roadWidth / 2 + 8 : map.roadWidth / 2 + 1.8;
    const x = (start.x + end.x) / 2 + rx * offset, z = (start.z + end.z) / 2 + rz * offset;
    const bay = { x, z, heading, halfWidth: 1.7, halfLength: definition.layout === 'parallel' ? 3.8 : 3.4 };
    const parkedCars = [-1, 1].map((sign, i) => ({ id: `${definition.id}-parked-${i}`, x: x + (definition.layout === 'lot' ? rx * sign * 3.7 : fx * sign * 6.3), z: z + (definition.layout === 'lot' ? rz * sign * 3.7 : fz * sign * 6.3), heading, speed: 0, halfWidth: .95, halfLength: 2.25 }));
    return [{ ...definition, ...location, id: definition.id, label: definition.label, x, z, bay, parkedCars, heading, reserveRadius: definition.layout === 'lot' ? 14 : 10 }];
  });
}

export function parkingCondition(car, bay) {
  if (![car.x, car.z, car.heading, car.speed, bay.x, bay.z, bay.heading].every(Number.isFinite)) return 'Car position is unavailable';
  const angle = car.heading - bay.heading;
  const headingError = Math.acos(Math.min(1, Math.abs(Math.cos(angle))));
  const dx = car.x - bay.x, dz = car.z - bay.z;
  const lateral = dx * Math.cos(bay.heading) - dz * Math.sin(bay.heading);
  const longitudinal = -dx * Math.sin(bay.heading) - dz * Math.cos(bay.heading);
  const width = Math.abs(Math.cos(angle)) * PARKING.carHalfWidth + Math.abs(Math.sin(angle)) * PARKING.carHalfLength;
  const length = Math.abs(Math.cos(angle)) * PARKING.carHalfLength + Math.abs(Math.sin(angle)) * PARKING.carHalfWidth;
  if (Math.abs(lateral) + width > bay.halfWidth || Math.abs(longitudinal) + length > bay.halfLength) return 'Fit the whole car inside the marked bay';
  if (headingError > PARKING.headingTolerance) return 'Straighten the car inside the bay';
  if (Math.abs(car.speed) > PARKING.maxSpeed) return 'Brake to a complete stop';
  return '';
}

export function advanceParking(previous, car, site, dt) {
  if (!Number.isFinite(dt) || dt < 0) throw new RangeError('Parking time must be nonnegative');
  if (!site) return { siteId: null, settled: 0, ready: false, message: 'Choose a destination' };
  const reason = parkingCondition(car, site.bay);
  const settled = reason ? 0 : Math.min(PARKING.settleSeconds, (previous?.siteId === site.id ? previous.settled : 0) + Math.max(0, dt));
  const ready = !reason && settled >= PARKING.settleSeconds;
  return { siteId: site.id, settled, ready, message: reason || (ready ? 'Parked · ready to interact' : 'Hold still for a moment') };
}

export function parkingReservedAt(sites, x, z, padding = 0) {
  return sites.some(site => Math.abs(site.x - x) < site.reserveRadius + padding && Math.abs(site.z - z) < site.reserveRadius + padding);
}
