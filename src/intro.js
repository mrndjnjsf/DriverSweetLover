import { INTRO } from './config/intro.js';
import { createCareer } from './career.js';

// The career save is authoritative. An orphaned completion flag cannot skip onboarding.
export function shouldPlayFirstDrive(loaded,{sandbox=false,profile=false}={}) {
  return !sandbox&&!profile&&!loaded.recovered&&(!loaded.hasSave||!loaded.career.starterChoiceMade);
}

export function createIntroCareer() {
  const career=createCareer('mustang'),car=career.vehicles.mustang;
  car.parts.engine.health=INTRO.engineHealth;car.parts.transmission.health=INTRO.transmissionHealth;
  car.parts.brakePads.health=INTRO.brakeHealth;
  return career;
}
export function createIntro({testDrive=false}={}) { return {phase:testDrive?'test-drive':'drive',distance:0,stoppedSeconds:0,crashSeconds:0}; }
export function advanceIntro(intro,state,dt) {
  if(intro.phase==='test-drive')return null;
  let event=null;
  if(intro.phase==='drive'||intro.phase==='final-drive')intro.distance+=Math.max(0,state.speed)*dt;
  if(intro.phase==='drive'&&intro.distance>=INTRO.firstDriveMeters){intro.phase='brake';intro.distance=0;}
  else if(intro.phase==='brake') {
    intro.stoppedSeconds=Math.abs(state.speed)<.4&&state.brake>.2?intro.stoppedSeconds+dt:0;
    if(intro.stoppedSeconds>=INTRO.brakeHoldSeconds){intro.phase='final-drive';intro.distance=0;}
  }else if(intro.phase==='final-drive'&&intro.distance>=INTRO.finalDriveMeters){intro.phase='crash';event='crash';}
  else if(intro.phase==='crash') {
    intro.crashSeconds+=dt;
    if(intro.crashSeconds>=INTRO.crashSeconds){intro.phase='replacement';event='replacement';}
  }
  return event;
}
export function introAdvice(intro,input='keyboard') {
  if(intro.phase==='test-drive')return null;
  const gas=input==='controller'?'RT':input==='touch'?'GAS':'X to add gas; Space to release';
  const steer=input==='controller'?'left stick':input==='touch'?'steering arrows':'A / D';
  const brake=input==='controller'?'LB':input==='touch'?'BRAKE':'Alt (or hold Space after gas empties)';
  const text=intro.phase==='drive'?`Your old automatic Mustang is tired, but it still moves. Use ${gas} for gas and ${steer} to steer. Drive along the street.`
    :intro.phase==='brake'?`Ease off the gas and use ${brake} to stop completely. Hold the brake briefly once stopped.`
    :intro.phase==='final-drive'?`Good. Use ${gas} to drive another stretch. Keep your eyes on the road.`
    :'The Mustang is wrecked. Help is on the way…';
  return {id:'intro:'+intro.phase,title:intro.phase==='crash'?'ACCIDENT':'YOUR FIRST DRIVE',text};
}
export function replacementCareer(career) {
  // A replay never overwrites condition, money, jobs, or employee assignments.
  return career;
}
