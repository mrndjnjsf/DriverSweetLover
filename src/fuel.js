import { FUEL } from "./config/economy.js";
// Fuel is measured in litres. A short idle burn keeps an empty tank meaningful
// even when the car is stopped, while load and speed make hard driving costly.
export const FUEL_CAPACITY_LITERS = FUEL.capacityLiters;
export const FUEL_PRICE_CENTS_PER_LITER = FUEL.priceCentsPerLiter;
// The city is compact, so a trip represents more fuel use than its raw metres.
export const FUEL_GAMEPLAY_SCALE = FUEL.gameplayScale;

export function fuelCapacity(vehicleId) {
 const capacity = FUEL_CAPACITY_LITERS[vehicleId];
 if (!capacity) throw new RangeError('Unknown vehicle');
 return capacity;
}

export function fuelUsed({ vehicleId, dtSeconds, speedMps = 0, throttle = 0, engineRpm = 0, running = true }) {
 fuelCapacity(vehicleId);
 if (![dtSeconds, speedMps, throttle, engineRpm].every(Number.isFinite)
   || dtSeconds < 0 || dtSeconds > 1 || speedMps < 0 || speedMps > 150
   || throttle < 0 || throttle > 1 || engineRpm < 0 || engineRpm > 20000) throw new RangeError('Invalid fuel sample');
 if (!running) return 0;
 const km = speedMps * dtSeconds / 1000;
 const baseLitersPerKm = FUEL.litersPerKm[vehicleId];
 const load = 1 + throttle * 1.25 + Math.max(0, engineRpm - 3500) / 6000 * .55;
 const idleLiters = dtSeconds / 3600 * FUEL.idleLitersPerHour[vehicleId] * (.8 + throttle * .8);
 return (km * baseLitersPerKm * load + idleLiters) * FUEL_GAMEPLAY_SCALE;
}

export function fuelFillQuote(vehicleId, currentLiters) {
 const capacity = fuelCapacity(vehicleId);
 if (!Number.isFinite(currentLiters) || currentLiters < 0 || currentLiters > capacity) throw new RangeError('Invalid fuel level');
 const liters = Math.max(0, Math.round((capacity - currentLiters) * 1000) / 1000);
 return { liters, totalCents: Math.round(liters * FUEL_PRICE_CENTS_PER_LITER) };
}
