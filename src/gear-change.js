import { selectGear } from './physics.js';
import { applyShiftWear } from './condition.js';

// The caller persists the returned condition only after a successful change.
export function changeGearWithWear(state, nextGear, clutch, car, condition) {
 const previousGear = state.gear;
 state.clutch = clutch;
 const error = selectGear(state, nextGear, car);
 return {
  error,
  condition: !error && state.gear !== previousGear ? applyShiftWear(condition, clutch) : condition,
 };
}
