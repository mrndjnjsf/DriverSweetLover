import { CLUTCH } from "./config/gameplay.js";
import {clamp} from './physics.js';

export function createClutchInput(mode='direct',value=1){
 return {mode:mode==='pressure'?'pressure':'direct',value:clamp(value,0,1)};
}

export function toggleClutchInput(control){
 return {...control,mode:control.mode==='direct'?'pressure':'direct'};
}

export function readClutchInput(control,trigger,dt,settings=CLUTCH){
 const amount=clamp(trigger,0,1);
 if(control.mode==='direct')return {...control,value:amount};
 const time=clamp(dt,0,.05);
 let value=control.value;
 if(amount>settings.triggerBuildThreshold)value+=time*settings.controllerBuildPerSecond;
 else if(amount<settings.triggerReleaseThreshold)value-=time*settings.controllerReleasePerSecond;
 return {...control,value:clamp(value,0,1)};
}
