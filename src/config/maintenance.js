// Wear rates, service prices (integer cents), and upgrade strengths.
export const WEAR_CONFIG = Object.freeze({
  clutchLifeWorkJ: 18_000_000,
  earlyShiftHealthCost: 0.005,
  brakePadLifeWorkJ: 72_000_000,
  brakeRotorLifeWorkJ: 250_000_000,
  tireLifeKm: 2_000,
  transmissionLifeKm: 15_000,
  oilServiceKm: 450,
  oilServiceDays: 30,
  healthyEngineWearPerKm: 0.000004,
  neglectedEngineWearPerKm: 0.001,
});

// Upgrades change useful operating limits as well as price. They do not heal
// other parts, and their gains are reduced by their own current health.
export const PART_CATALOG = Object.freeze({
  clutch: { stock: { partsCents: 45_000, laborCents: 18_000, torqueCapacity: 1 }, upgraded: { partsCents: 110_000, laborCents: 22_000, torqueCapacity: 1.35 } },
  brakePads: { stock: { partsCents: 18_000, laborCents: 9_000, fadeResistance: 1 }, upgraded: { partsCents: 48_000, laborCents: 10_000, fadeResistance: 1.35 } },
  brakeRotors: { stock: { partsCents: 28_000, laborCents: 14_000, fadeResistance: 1 }, upgraded: { partsCents: 65_000, laborCents: 17_000, fadeResistance: 1.2 } },
  tires: { stock: { partsCents: 48_000, laborCents: 10_000, grip: 1 }, upgraded: { partsCents: 88_000, laborCents: 10_000, grip: 1.16 } },
  engine: { stock: { partsCents: 450_000, laborCents: 100_000, power: 1 }, upgraded: { partsCents: 700_000, laborCents: 120_000, power: 1.12 } },
  oilFilter: { stock: { partsCents: 3_500, laborCents: 0, oilInterval: 1 }, upgraded: { partsCents: 6_500, laborCents: 0, oilInterval: 1.2 } },
  transmission: { stock: { partsCents: 180_000, laborCents: 50_000, durability: 1 }, upgraded: { partsCents: 280_000, laborCents: 55_000, durability: 1.35 } },
  frontBumper: { stock: { partsCents: 40_000, laborCents: 12_000, impactResistance: 1 }, upgraded: { partsCents: 60_000, laborCents: 15_000, impactResistance: 1.4 } },
  rearBumper: { stock: { partsCents: 40_000, laborCents: 12_000, impactResistance: 1 }, upgraded: { partsCents: 60_000, laborCents: 15_000, impactResistance: 1.4 } },
});

