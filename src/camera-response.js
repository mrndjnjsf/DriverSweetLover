import { CAMERA } from "./config/gameplay.js";
import {availableTorque,clamp} from './physics.js';

// A short chase-camera pull accompanies the useful torque band, not road speed.
export function torqueCameraPull(state,car){
 if(!state.running||state.blown||state.gear===0)return 0;
 const engagement=clamp((.84-state.clutch)/.72,0,1);
 const torque=availableTorque(state,car)/car.peakTorque;
 const peak=clamp((torque-.70)/.26,0,1);
 const acceleration=clamp((state.accel-1)/2.6,0,1);
 return CAMERA.maximumTorquePull*peak*acceleration*state.throttle*engagement;
}

export function easeCameraPull(current,target,dt){
 const rate=target>current?CAMERA.pullResponse:CAMERA.recoveryResponse;
 return current+(target-current)*(1-Math.exp(-dt*rate));
}
