// Shared drivetrain/handling tuning. Keep physics step size in gameplay.js.
export const DRIVING = Object.freeze({
  rpmRiseMultiplier: .75,
  wheelRadiusMeters: .315,
  initialIdleRpm: 850,
  idleGovernorRpm: 920,
  clutchEngagementTravel: .72,
  clutchTorqueMultiplier: 1.55,
  couplingResponse: 9,
  overRevRedlineMultiplier: 1.1,
  stallRpm: 560,
  immediateStallRpm: 300,
  stallDelaySeconds: .10,
  luggingDelaySeconds: .38,
  luggingWheelRpm: 1100,
  luggingEngineRpm: 1200,
  brakeDeceleration: 10, // metres/second squared
  handbrakeDeceleration: 7,
  rollingResistance: .13,
  aeroDrag: .42,
  gridSteerResponse: .16,
  maxTurnRate: 1.25, // radians/second
});
