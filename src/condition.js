import { VEHICLES } from "./config/vehicles.js";
import { CLUTCH } from "./config/gameplay.js";
// Career vehicle condition. Health is 0..1; prices are integer US cents.
// Driving samples use seconds, metres/second, kilometres, radians/second and °C.
import { fuelCapacity, fuelUsed } from './fuel.js';
import { clutchBitePoint, clutchTorqueFactor } from './clutch-model.js';
export const VEHICLE_IDS = Object.freeze(Object.keys(VEHICLES));
export const PART_KEYS = Object.freeze([
  'clutch', 'brakePads', 'brakeRotors', 'tires', 'engine',
  'oilFilter', 'transmission', 'frontBumper', 'rearBumper',
]);

const VEHICLE_SPECS = Object.fromEntries(Object.entries(VEHICLES).map(([id, car]) => [id, {massKg: car.mass, peakTorqueNm: car.peakTorque}]));

import { WEAR_CONFIG, PART_CATALOG } from "./config/maintenance.js";
export { WEAR_CONFIG, PART_CATALOG };
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const validVehicle = id => VEHICLE_IDS.includes(id);
const finite = (value, name, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError(`${name} must be between ${min} and ${max}`);
  return value;
};
const catalogPart = (key, tier) => {
  const part = PART_CATALOG[key]?.[tier];
  if (!part) throw new RangeError('Unknown part or tier');
  return part;
};
const partTier = (vehicleId, key, part) => {
  if (part.sku === `${vehicleId}:${key}:stock`) return 'stock';
  if (part.sku === `${vehicleId}:${key}:upgraded`) return 'upgraded';
  throw new TypeError(`Incompatible ${key}`);
};

export function createVehicleCondition(vehicleId) {
  if (!validVehicle(vehicleId)) throw new RangeError('Unknown vehicle');
  return {
    vehicleId,
    odometerKm: 0,
    fuelLiters: fuelCapacity(vehicleId),
    parts: Object.fromEntries(PART_KEYS.map(key => [key, { sku: `${vehicleId}:${key}:stock`, health: 1 }])),
    oil: { distanceKm: 0, ageDays: 0, condition: 1 },
  };
}

export function validateVehicleCondition(condition) {
  if (!condition || !validVehicle(condition.vehicleId)) throw new TypeError('Invalid vehicle condition');
  finite(condition.odometerKm, 'odometerKm', 0, 10_000_000);
  finite(condition.fuelLiters, 'fuelLiters', 0, fuelCapacity(condition.vehicleId));
  if (!condition.parts || !condition.oil) throw new TypeError('Missing vehicle parts or oil');
  for (const key of PART_KEYS) {
    const part = condition.parts[key];
    if (!part) throw new TypeError(`Missing ${key}`);
    partTier(condition.vehicleId, key, part);
    finite(part.health, `${key} health`, 0, 1);
  }
  finite(condition.oil.distanceKm, 'oil distanceKm', 0, 10_000_000);
  finite(condition.oil.ageDays, 'oil ageDays', 0, 100_000);
  finite(condition.oil.condition, 'oil condition', 0, 1);
  return condition;
}

function copyCondition(condition) {
  validateVehicleCondition(condition);
  return {
    vehicleId: condition.vehicleId,
    odometerKm: condition.odometerKm,
    fuelLiters: condition.fuelLiters,
    parts: Object.fromEntries(PART_KEYS.map(key => [key, { ...condition.parts[key] }])),
    oil: { ...condition.oil },
  };
}

// Sample every frame so the short release through the bite window is not missed.
// This is forgiving game wear: clean grip below bite is free; actual slip still wears.
export function clutchFrictionWork(vehicleId, health, sample) {
  if (VEHICLES[vehicleId]?.transmission === 'automatic') return 0;
  const { clutchPosition: pedal = 1, throttle = 0, engineRpm = 0, dtSeconds: dt = 0 } = sample;
  if (pedal >= 1 || sample.gear === 0 || sample.running === false) return 0;
  const bite = clutchBitePoint(health);
  const windowTop = Math.max(CLUTCH.releaseWindowTop, bite + CLUTCH.wornReleaseWindowWidth);
  const inReleaseWindow = sample.clutchReleasing && pedal >= bite && pedal < windowTop;
  const hardThrottle = clamp((throttle - CLUTCH.hardThrottleThreshold) / (1 - CLUTCH.hardThrottleThreshold), 0, 1);
  const releaseScuff = inReleaseWindow && engineRpm > CLUTCH.releaseWearMinimumRpm
    ? hardThrottle * (windowTop - pedal) / (windowTop - bite) : 0;
  const actualSlip = sample.clutchSlipping === true ? sample.slipRadPerSecond ?? 0 : 0;
  const slip = Math.max(actualSlip, releaseScuff * engineRpm * Math.PI / 30);
  return VEHICLE_SPECS[vehicleId].peakTorqueNm * (.18 + .82 * throttle) * slip * dt;
}

/** Apply one simulation sample. `clutchPosition`: 1 = pedal down, 0 = released. */
export function applyDrivingWear(condition, sample) {
  const next = copyCondition(condition);
  if (!sample || typeof sample !== 'object') throw new TypeError('Driving sample required');
  const dt = finite(sample.dtSeconds, 'dtSeconds', 0, 1);
  const speed = finite(sample.speedMps ?? 0, 'speedMps', 0, 150);
  const distanceKm = finite(sample.distanceKm ?? speed * dt / 1000, 'distanceKm', 0, .15);
  const clutchPosition = finite(sample.clutchPosition ?? 1, 'clutchPosition', 0, 1);
  const slip = finite(sample.slipRadPerSecond ?? 0, 'slipRadPerSecond', 0, 10_000);
  const throttle = finite(sample.throttle ?? 0, 'throttle', 0, 1);
  const brake = finite(sample.brake ?? 0, 'brake', 0, 1);
  const engineRpm = finite(sample.engineRpm ?? 0, 'engineRpm', 0, 20_000);
  const engineTempC = finite(sample.engineTempC ?? 90, 'engineTempC', -40, 250);
  const elapsedGameDays = finite(sample.elapsedGameDays ?? 0, 'elapsedGameDays', 0, 1);
  const specs = VEHICLE_SPECS[next.vehicleId];
  const upgraded = key => partTier(next.vehicleId, key, next.parts[key]) === 'upgraded';

  const clutchWorkJ = finite(sample.clutchWorkJ ?? clutchFrictionWork(next.vehicleId, next.parts.clutch.health,
    { ...sample, clutchPosition, slipRadPerSecond: slip, throttle, engineRpm, dtSeconds: dt }), 'clutchWorkJ');
  next.parts.clutch.health = clamp(next.parts.clutch.health - clutchWorkJ / (WEAR_CONFIG.clutchLifeWorkJ * (upgraded('clutch') ? 1.25 : 1)), 0, 1);

  const brakeWorkJ = brake * specs.massKg * 10 * speed * dt;
  next.parts.brakePads.health = clamp(next.parts.brakePads.health - brakeWorkJ / (WEAR_CONFIG.brakePadLifeWorkJ * (upgraded('brakePads') ? 1.15 : 1)), 0, 1);
  next.parts.brakeRotors.health = clamp(next.parts.brakeRotors.health - brakeWorkJ / WEAR_CONFIG.brakeRotorLifeWorkJ, 0, 1);
  next.parts.tires.health = clamp(next.parts.tires.health - distanceKm / (WEAR_CONFIG.tireLifeKm * (upgraded('tires') ? .9 : 1)), 0, 1);
  next.parts.transmission.health = clamp(next.parts.transmission.health - distanceKm / (WEAR_CONFIG.transmissionLifeKm * (upgraded('transmission') ? 1.35 : 1)), 0, 1);

  next.odometerKm += distanceKm;
  next.fuelLiters = Math.max(0, next.fuelLiters - fuelUsed({ vehicleId: next.vehicleId, dtSeconds: dt, speedMps: speed, throttle, engineRpm, running: sample.running ?? true }));
  next.oil.distanceKm += distanceKm;
  next.oil.ageDays += elapsedGameDays;
  next.oil.condition = clamp(1 - Math.max(
    next.oil.distanceKm / (WEAR_CONFIG.oilServiceKm * (upgraded('oilFilter') ? 1.2 : 1)),
    next.oil.ageDays / (WEAR_CONFIG.oilServiceDays * (upgraded('oilFilter') ? 1.2 : 1)),
  ), 0, 1);
  const neglect = clamp((.35 - next.oil.condition) / .35, 0, 1);
  const hotPenalty = clamp((engineTempC - 110) / 50, 0, 2) * .000002 * dt;
  const load = engineRpm > 0 ? .35 + throttle * .65 : 0;
  const engineWear = distanceKm * load * (upgraded('engine') ? 1.12 : 1) * (
    WEAR_CONFIG.healthyEngineWearPerKm + neglect * WEAR_CONFIG.neglectedEngineWearPerKm
  ) + hotPenalty;
  next.parts.engine.health = clamp(next.parts.engine.health - engineWear, 0, 1);
  return next;
}

/** A successful shift before fully depressing the pedal scuffs the clutch. */
export function applyShiftWear(condition, clutchPosition) {
  validateVehicleCondition(condition);
  const position = finite(clutchPosition, 'clutchPosition', 0, 1);
  if (position >= 1) return condition;
  const next = copyCondition(condition);
  const bite = clutchBitePoint(next.parts.clutch.health);
  const early = CLUTCH.afterBiteShiftWear * clamp((1 - position) / (1 - bite), 0, 1)
    + CLUTCH.beforeBiteExtraShiftWear *((bite - position) / bite, 0, 1);
  const upgraded = partTier(next.vehicleId, 'clutch', next.parts.clutch) === 'upgraded';
  next.parts.clutch.health = clamp(next.parts.clutch.health
    - WEAR_CONFIG.earlyShiftHealthCost * early / (upgraded ? 1.25 : 1), 0, 1);
  return next;
}

export function applyImpactDamage(condition, { end, impactSpeedMps }) {
  const next = copyCondition(condition);
  if (end !== 'front' && end !== 'rear') throw new RangeError('Impact end must be front or rear');
  const speed = finite(impactSpeedMps, 'impactSpeedMps', 0, 150);
  const key = end === 'front' ? 'frontBumper' : 'rearBumper';
  const resistance = partTier(next.vehicleId, key, next.parts[key]) === 'upgraded' ? 1.4 : 1;
  next.parts[key].health = clamp(next.parts[key].health - Math.min(.9, (speed / 20) ** 2 * .3 / resistance), 0, 1);
  return next;
}

export function conditionSummary(condition) {
  validateVehicleCondition(condition);
  const health = Object.fromEntries(PART_KEYS.map(key => [key, condition.parts[key].health]));
  return {
    vehicleId: condition.vehicleId,
    odometerKm: condition.odometerKm,
    health,
    clutchBitePoint: clutchBitePoint(health.clutch),
    oilCondition: condition.oil.condition,
    oilServiceDue: condition.oil.condition <= .2,
    warnings: [
      ...PART_KEYS.filter(key => health[key] <= .25).map(key => `${key} needs service`),
      ...(condition.oil.condition <= .2 ? ['Oil change due'] : []),
    ],
  };
}

export function performanceModifiers(condition) {
  validateVehicleCondition(condition);
  const { parts } = condition;
  const tier = key => partTier(condition.vehicleId, key, parts[key]);
  const quality = key => .35 + .65 * parts[key].health;
  const spec = key => PART_CATALOG[key][tier(key)];
  return {
    clutchCapacity: spec('clutch').torqueCapacity * clutchTorqueFactor(parts.clutch.health),
    clutchBitePoint: clutchBitePoint(parts.clutch.health),
    brakeEffectiveness: Math.min(quality('brakePads'), quality('brakeRotors')),
    brakeFadeResistance: spec('brakePads').fadeResistance
      * spec('brakeRotors').fadeResistance,
    tireGrip: spec('tires').grip * quality('tires'),
    enginePower: spec('engine').power * quality('engine'),
  };
}

/** `action`: {type:'oil-change'} or {type:'repair'|'replace'|'upgrade', partKey}. */
export function getServiceQuote(condition, action) {
  validateVehicleCondition(condition);
  if (!action || typeof action !== 'object') throw new TypeError('Service action required');
  if (action.type === 'oil-change') {
    const tier = partTier(condition.vehicleId, 'oilFilter', condition.parts.oilFilter);
    const partsCents = catalogPart('oilFilter', tier).partsCents;
    return { action: { type: 'oil-change' }, partsCents, laborCents: 4_000, totalCents: partsCents + 4_000,
      description: 'Fresh oil and filter; existing engine wear remains' };
  }
  const key = action.partKey;
  if (!PART_KEYS.includes(key)) throw new RangeError('Unknown part');
  const oldTier = partTier(condition.vehicleId, key, condition.parts[key]);
  let tier = oldTier;
  if (action.type === 'upgrade') {
    if (oldTier === 'upgraded') throw new RangeError('Part is already upgraded');
    tier = 'upgraded';
  } else if (action.type !== 'repair' && action.type !== 'replace') {
    throw new RangeError('Unknown service action');
  }
  const part = catalogPart(key, tier);
  const partsCents = action.type === 'repair'
    ? Math.ceil(part.partsCents * (1 - condition.parts[key].health) * .7)
    : part.partsCents;
  const laborCents = action.type === 'repair' ? Math.ceil(part.laborCents * .6) : part.laborCents;
  return {
    action: { type: action.type, partKey: key },
    partsCents, laborCents, totalCents: partsCents + laborCents,
    description: `${action.type} ${key} (${tier})`,
  };
}

export function applyService(condition, action) {
  const next = copyCondition(condition);
  const quote = getServiceQuote(next, action);
  if (quote.action.type === 'oil-change') {
    next.oil = { distanceKm: 0, ageDays: 0, condition: 1 };
    next.parts.oilFilter.health = 1;
  } else {
    const { partKey, type } = quote.action;
    next.parts[partKey].health = 1;
    if (type === 'upgrade') next.parts[partKey].sku = `${next.vehicleId}:${partKey}:upgraded`;
  }
  return next;
}
