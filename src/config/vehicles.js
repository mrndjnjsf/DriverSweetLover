// Vehicle tuning: kg, Nm, hp, RPM, kg m² inertia, gearbox ratios, metres.
// Values intentionally retain the current arcade driving feel.
export const VEHICLES = {
  mustang: {
    name: 'Ford Mustang V6', transmission: 'automatic', cylinders: 6, torqueCurve: 'mustang', tutorialOnly: true,
    mass: 1450, peakTorque: 305, horsepower: 190, redline: 5500,
    engineInertia: .24, final: 3.27, ratios: [2.84, 1.55, 1, .70], reverseRatio: 2.32,
    color: 0x777b76, wheelbase: 2.57, turbo: false, traction: 8,
    // Arcade converter/shift calibration, not an OEM transmission model.
    automatic: { lightShiftRpm: 2200, fullShiftRpm: 4900, downshiftRpm: 1200,
      kickdownRpm: 3000, shiftSeconds: .32, shiftCooldownSeconds: .75,
      idleCapacity: 32, loadCapacity: 580, couplingResponse: 5, torqueMultiplier: 1.45 },
  },
  eclipse: {
    name: 'Mitsubishi Eclipse V6',
    mass: 1510,
    peakTorque: 352,
    horsepower: 263,
    redline: 6500,
    engineInertia: .16, // lower = faster free revving
    final: 3.9,
    ratios: [3.3, 1.95, 1.37, 1.03, .82, .66], // gears 1–6
    color: 0xd8642f,
    wheelbase: 2.57,
    turbo: false,
    traction: 8.5,
  },
  civic: {
    name: 'Honda Civic Si',
    mass: 1340,
    peakTorque: 260,
    horsepower: 200,
    redline: 8000,
    engineInertia: .032,
    final: 4.35,
    ratios: [4.8, 3.2, 2.4, 1.8, 1.3, .92],
    color: 0xe3e7e3,
    wheelbase: 2.74,
    turbo: true,
    traction: 7.9,
  },
};

// Normalized torque multipliers [RPM, fraction of peak torque].
export const TORQUE_CURVES = {
  mustang: [[0,.45],[850,.62],[1800,.80],[3000,.95],[4000,1],[5250,.86],[6000,.70]],
  civicOffBoost: [[0,.28],[850,.38],[1800,.58],[3000,.45],[5000,.51],[6600,.40],[8000,.35]],
  civicOnBoost: [[0,.25],[850,.36],[1800,1],[3000,1],[5000,1],[8000,1]],
  eclipse: [[0,.35],[850,.62],[1800,.78],[3000,.93],[4500,1],[5750,.94],[6500,.68]],
};
