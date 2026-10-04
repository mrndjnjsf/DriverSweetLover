import {clamp} from './physics.js';

// Six firing pulses per two crankshaft turns give a V6 a low base frequency.
// The second harmonic keeps its body audible on ordinary PC speakers.
export function engineTone(state,car){
 if(!state.running)return {frequency:35,bodyFrequency:70,mainGain:0,bodyGain:0,cutoff:300,pulseRate:7,pulseDepth:0};
 if(car.turbo)return {
  frequency:Math.max(40,state.rpm/17),bodyFrequency:70,
  mainGain:.005+state.throttle*.014,bodyGain:0,cutoff:8000,pulseRate:7,pulseDepth:0
 };
 const load=state.gear===0?.15:clamp((.85-state.clutch)/.7,0,1);
 return {
  frequency:Math.max(40,state.rpm/20),bodyFrequency:Math.max(80,state.rpm/10),
  mainGain:.007+state.throttle*.012,
  bodyGain:.008+load*.006+state.throttle*.018,
  cutoff:Math.min(760,210+state.rpm*.085),
  pulseRate:Math.min(24,Math.max(7,state.rpm/120)),
  pulseDepth:.16+load*.10
 };
}
