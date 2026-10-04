import { DRIVING } from './config/driving.js';

// Advice only: never blocks a shift or changes drivetrain behavior.
export function drivingAdvice(state, car, { fuelLiters, bitePoint, input = 'keyboard' }) {
  if (state.blown) return null; // The failure screen already explains the reset.
  const automatic=car.transmission==='automatic';
  const clutch = input === 'controller' ? 'Hold LT' : input === 'touch' ? 'Raise the clutch slider' : 'Hold Ctrl';
  const starter = input === 'controller' ? 'press Y' : input === 'touch' ? 'tap Start Engine' : 'press Enter';
  if (!state.running) return fuelLiters <= 0
    ? { id: 'fuel', title: 'OUT OF FUEL', text: 'Refill at a gas station using the Fuel app before restarting.' }
    : { id: 'stall', title: 'ENGINE STALLED', text: automatic?`Hold the brake, then ${starter}.`:`${clutch} past the bite point (or select Neutral), then ${starter}. Ease the clutch out with a little throttle.` };
  if(automatic)return null;
  const ratio = state.gear === -1 ? car.reverseRatio || 3.3 : car.ratios[state.gear - 1];
  const forcedRpm = ratio ? Math.abs(state.speed) / DRIVING.wheelRadiusMeters * ratio * car.final * 30 / Math.PI : 0;
  if (forcedRpm >= car.redline * .98 && (state.clutch >= bitePoint || forcedRpm > car.redline * DRIVING.overRevRedlineMultiplier)) return {
    id: 'money-shift', title: 'MONEY SHIFT RISK',
    text: `${clutch} and keep it depressed. This gear would force the engine near or beyond redline. Select a higher gear or brake before releasing the clutch.`,
  };
  if (state.rpm >= car.redline * .95 && state.throttle > .15) return {
    id: 'redline', title: 'AT REDLINE', text: 'Reduce throttle. If accelerating, clutch in and shift up before adding throttle again.',
  };
  if (state.gear !== 0 && state.clutch < bitePoint && state.rpm < 1050) return {
    id: 'bogging', title: 'ENGINE BOGGING', text: `${clutch} to prevent a stall. Choose a lower gear, then ease the clutch out with a little throttle.`,
  };
  return null;
}
