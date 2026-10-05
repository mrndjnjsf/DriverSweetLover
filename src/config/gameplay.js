// Edit these values, save, then reload the game. Units are in the names/comments.
export const CLUTCH = Object.freeze({
  healthyBite: .84, wornBiteRise: .12, minimumShiftPress: .02,
  minimumGrip: .22, healthGripExponent: 1.5,
  keyboardBuildPerSecond: 1.5, keyboardReleasePerSecond: .8,
  controllerBuildPerSecond: 1.75, controllerReleasePerSecond: .9,
  triggerBuildThreshold: .65, triggerReleaseThreshold: .25,
  releaseWindowTop: .9, wornReleaseWindowWidth: .03,
  hardThrottleThreshold: .65, releaseWearMinimumRpm: 1500,
  afterBiteShiftWear: .3, beforeBiteExtraShiftWear: 1.7,
});

export const THROTTLE = Object.freeze({
  keyboardReducePerSecond: 2.5, keyboardCoastSeconds: 2,
  keyboardBuildPerSecond: 1.1, keyboardReleasePerSecond: .55,
  keyboardPressureTaper: .85,
});

export const COACH = Object.freeze({clearSeconds:3});

export const SHIFTER = Object.freeze({
  mouseTravelPx: 150, mouseHorizontalNotchPx: 120, mouseVerticalNotchPx: 120,
  mouseCenterCatchMs: 240, mouseEdgeMarginPx: 18,
  stickDetentMs: 450, stickNeutralGraceMs: 600, gearExitHoldMs: 1000,
});

export const TURBO = Object.freeze({
  boostOnset: .28, boostRange: .52,
  spoolStartRpm: 1000, spoolRpmRange: 2800,
  spoolThrottleStart: .12, spoolThrottleRange: .58, spoolEngagement: .35,
  spoolSeconds: .25, retainedSpoolSeconds: .8, ventSeconds: .35,
  retainThrottle: .25, stoppedDecaySeconds: .16,
});

export const CAMERA = Object.freeze({
  maximumTorquePull: 4.2, pullResponse: 9, recoveryResponse: 2.8,
  poses: Object.freeze({chase: [0, 5.1, 8], hood: [0, 1.46, -1.03], left: [-9, 3.8, 3.5], right: [9, 3.8, 3.5]}),
});

export const WORLD = Object.freeze({
  trafficCount: 16, roadEventCount: 3,
  cityStartHour: 15, cityHoursPerSecond: 1 / 60,
  rivalSeconds: Object.freeze({eclipse: 21.5, civic: 29}),
});

export const RUNTIME = Object.freeze({
  maxScenePixels: 2_500_000, maxPixelRatio: 1.5, maxRenderHz: 100,
  maxSimulationGapMs: 200, physicsStepSeconds: .0025,
  outerSimulationStepSeconds: .01,
  wearIntervalSeconds: .25, phoneIntervalSeconds: .3, saveIntervalSeconds: 5,
});
