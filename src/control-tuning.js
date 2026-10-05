import { CLUTCH, THROTTLE } from './config/gameplay.js';

export const CONTROL_OPTIONS=Object.freeze({throttle:['smooth','responsive'],clutch:['low','standard','high']});
const upgraded=(condition,key)=>condition.parts[key].sku.endsWith(':upgraded');

export function validateControlTune(condition){
  if(condition.controlTune===undefined)return;
  const tune=condition.controlTune;
  if(!tune||typeof tune!=='object'||Array.isArray(tune))throw new TypeError('Invalid pedal tuning');
  for(const [key,value] of Object.entries(tune)){
    if(!Object.hasOwn(CONTROL_OPTIONS,key)||!CONTROL_OPTIONS[key].includes(value))throw new TypeError('Invalid pedal tuning');
    if(!upgraded(condition,key==='throttle'?'engine':'clutch'))throw new Error('Upgrade required for pedal tuning');
  }
}

export function controlSettings(condition){
  const engineUpgrade=upgraded(condition,'engine'),clutchUpgrade=upgraded(condition,'clutch');
  const response=condition.controlTune?.throttle??'smooth';
  const bite=condition.controlTune?.clutch??'standard';
  const engineQuality=condition.parts.engine.health;
  const clutchQuality=condition.parts.clutch.health;
  const throttleGain=engineUpgrade?(response==='responsive'?2:1.4)*engineQuality:0;
  const clutchGain=clutchUpgrade?clutchQuality:0;
  return {
    throttle:{...THROTTLE,
      keyboardBuildPerSecond:THROTTLE.keyboardBuildPerSecond*(1+throttleGain),
      keyboardPressureTaper:THROTTLE.keyboardPressureTaper-(engineUpgrade?(response==='responsive'?.5:.25)*engineQuality:0)},
    clutch:{...CLUTCH,
      keyboardBuildPerSecond:CLUTCH.keyboardBuildPerSecond*(1+.5*clutchGain),
      keyboardReleasePerSecond:CLUTCH.keyboardReleasePerSecond*(1-.35*clutchGain),
      controllerBuildPerSecond:CLUTCH.controllerBuildPerSecond*(1+.5*clutchGain),
      controllerReleasePerSecond:CLUTCH.controllerReleasePerSecond*(1-.35*clutchGain)},
    biteOffset:clutchUpgrade?({low:-.12,standard:0,high:.06}[bite])*clutchQuality:0,
    rpmResponse:1+.25*throttleGain,
  };
}
