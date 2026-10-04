import { RUNTIME } from "./config/gameplay.js";
export const MAX_SCENE_PIXELS = RUNTIME.maxScenePixels;
export const MAX_RENDER_HZ = RUNTIME.maxRenderHz;
export const MAX_SIMULATION_GAP_MS = RUNTIME.maxSimulationGapMs;

export function scenePixelRatio(width, height, deviceRatio, maxPixels = MAX_SCENE_PIXELS) {
  if (![width, height, deviceRatio, maxPixels].every(value => Number.isFinite(value) && value > 0)) {
    throw new RangeError('Invalid render dimensions');
  }
  return Math.min(deviceRatio, RUNTIME.maxPixelRatio, Math.sqrt(maxPixels / (width * height)));
}

// A small tolerance lets 60/120/144 Hz displays keep a steady cadence.
export function frameDue(elapsedMs, maxHz = MAX_RENDER_HZ) {
  if (!Number.isFinite(elapsedMs) || !Number.isFinite(maxHz) || maxHz <= 0) return false;
  return elapsedMs >= 1000 / maxHz - 1;
}

// Keep real-time engine response through slow frames, but never try to catch up
// an entire suspended tab in one update.
export function simulationDeltaSeconds(elapsedMs) {
  if (!Number.isFinite(elapsedMs)) return 0;
  return Math.min(Math.max(0, elapsedMs), MAX_SIMULATION_GAP_MS) / 1000;
}
