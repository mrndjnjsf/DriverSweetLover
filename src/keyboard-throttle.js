import { THROTTLE } from './config/gameplay.js';

export function advanceKeyboardThrottle(value, buildHeld, reduceHeld, dt, settings=THROTTLE) {
  if (reduceHeld) return Math.max(0, value-settings.keyboardReducePerSecond*Math.max(0,dt));
  if (!buildHeld) return value;
  const rate = settings.keyboardBuildPerSecond;
  const taper = settings.keyboardPressureTaper;
  const elapsed = Math.max(0, dt);
  // Integrate pressure-dependent pedal speed exactly so input feel is the same
  // at different frame rates.
  const next = taper === 0 ? value + rate * elapsed
    : value + (1 - taper * value) * -Math.expm1(-rate * taper * elapsed) / taper;
  return Math.max(0, Math.min(1, next));
}

export function createKeyboardThrottle(){return {value:0,coastSeconds:0,emptyHeldSeconds:0,brake:0,quickRelease:false};}

export function advanceThrottlePressure(control,buildHeld,reduceHeld,dt,settings=THROTTLE,fullHeld=false){
  const elapsed=Math.max(0,dt);
  if(fullHeld&&!reduceHeld)return {...createKeyboardThrottle(),value:1,quickRelease:true};
  if(buildHeld||reduceHeld){
    const value=advanceKeyboardThrottle(control.value,buildHeld,reduceHeld,elapsed,settings);
    const emptyHeldSeconds=reduceHeld&&value===0?(control.emptyHeldSeconds||0)+Math.max(0,elapsed-control.value/settings.keyboardReducePerSecond):0;
    const brake=Math.max(0,Math.min(settings.keyboardGentleBrake,(emptyHeldSeconds-settings.keyboardBrakeDelaySeconds)*settings.keyboardBrakeRampPerSecond));
    return {value,coastSeconds:0,emptyHeldSeconds,brake};
  }
  if(control.quickRelease){
    const value=Math.max(0,control.value-settings.keyboardReducePerSecond*elapsed);
    return {...createKeyboardThrottle(),value,quickRelease:value>0};
  }
  const coastSeconds=control.coastSeconds+elapsed;
  const decaySeconds=Math.max(0,coastSeconds-settings.keyboardCoastSeconds)-Math.max(0,control.coastSeconds-settings.keyboardCoastSeconds);
  const value=control.value-settings.keyboardCoastDecayPerSecond*decaySeconds;
  return {value:Math.max(0,Math.min(1,value)),coastSeconds,emptyHeldSeconds:0,brake:0};
}
