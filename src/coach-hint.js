import { COACH } from './config/gameplay.js';

const priority = advice => ({fuel:5, stall:4, 'money-shift':3, redline:2, bogging:1}[advice?.id] ?? 0);

export function createCoachHint(){return {advice:null, clearSeconds:0};}

// A recurring condition resets its clear timer. More urgent advice can replace
// an older tip immediately; less urgent tips wait for the clear interval.
export function advanceCoachHint(hint, candidate, dt, {suppressed=false}={}){
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Hint time must be nonnegative');
  if(suppressed){hint.advice=null;hint.clearSeconds=0;return null;}
  if(candidate&&(!hint.advice||candidate.id===hint.advice.id||priority(candidate)>=priority(hint.advice))){
    hint.advice=candidate;hint.clearSeconds=0;
  }else if(hint.advice){
    hint.clearSeconds+=dt;
    if(hint.clearSeconds>=COACH.clearSeconds){hint.advice=candidate;hint.clearSeconds=0;}
  }
  return hint.advice;
}
