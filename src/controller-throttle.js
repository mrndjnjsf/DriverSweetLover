import { THROTTLE } from './config/gameplay.js';
import { advanceThrottlePressure } from './keyboard-throttle.js';

// RT adjusts a remembered pressure rather than being a direct pedal position.
// Light pulls build proportionally; full pulls use the same slam/release as C.
export function advanceControllerThrottle(control, trigger, releaseHeld, slamBrakeHeld, dt, settings=THROTTLE){
 const pull=Math.max(0,Math.min(1,trigger||0));
 const full=pull>=.95;
 const liftingFull=control.quickRelease&&pull<=(control.previousPull??1);
 const build=pull>.05&&!full&&!liftingFull;
 const response={...settings,keyboardBuildPerSecond:settings.keyboardBuildPerSecond*Math.max(0,(pull-.05)/.9),keyboardReducePerSecond:releaseHeld?settings.controllerReducePerSecond:settings.keyboardReducePerSecond};
 return {...advanceThrottlePressure(control,build,releaseHeld,dt,response,full,slamBrakeHeld),previousPull:pull};
}
