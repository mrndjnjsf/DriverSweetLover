import { DRIVING } from "./config/driving.js";
import { TORQUE_CURVES } from "./config/vehicles.js";
import { TURBO, RUNTIME } from "./config/gameplay.js";
import { HEALTHY_CLUTCH_BITE, MIN_SHIFT_CLUTCH } from './clutch-model.js';
import { advanceAutomatic, converterTorque } from './automatic-transmission.js';

// Factory power figures guide these curves; drivability is tuned for the game.
// Eclipse GT coupe: 263 hp / 260 lb-ft. Civic Si: 200 hp / 192 lb-ft.
export { VEHICLES as cars } from "./config/vehicles.js";
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const ROAD_HALF_WIDTH=7.2;
export function boostResponse(boost){const t=clamp((boost-TURBO.boostOnset)/TURBO.boostRange,0,1);return t*t*(3-2*t);}
const lerp=(a,b,t)=>a+(b-a)*t;
function curve(rpm,points){
 for(let i=1;i<points.length;i++)if(rpm<points[i][0])return lerp(points[i-1][1],points[i][1],clamp((rpm-points[i-1][0])/(points[i][0]-points[i-1][0]),0,1));
 return points.at(-1)[1];
}
export function createState(){return {x:1.8,z:0,heading:0,speed:0,rpm:DRIVING.initialIdleRpm,gear:0,running:true,blown:false,clutch:1,throttle:0,brake:0,stallTime:0,distance:0,slip:0,clutchSlipping:false,boost:0,accel:0,roadMode:'straight'};}
export function selectGear(s,next,car){
 if(car?.transmission==='automatic')return 'This car shifts automatically';
 if(s.blown)return 'Engine destroyed · reset the car';
 if(s.clutch<MIN_SHIFT_CLUTCH)return 'Press the clutch to shift';
 if(next===-1&&s.roadMode!=='grid')return 'No reverse on this road';
 if(!Number.isInteger(next)||next< -1||next>6)return 'Invalid gear';
 if(next===-1&&s.speed>.5)return 'Stop before selecting reverse';
 if(next===s.gear)return '';
 s.gear=next;return '';
}
export function shift(s,direction,car){return selectGear(s,clamp(s.gear+direction,0,6),car);}
export function start(s,car){if(s.blown||car?.transmission!=='automatic'&&s.gear!==0&&s.clutch<(car?.clutchBitePoint??HEALTHY_CLUTCH_BITE))return false;s.running=true;s.rpm=DRIVING.initialIdleRpm;s.stallTime=0;return true;}
export function availableTorque(s,car){
 let torque;
 if(car.turbo){
  const offBoost=curve(s.rpm,TORQUE_CURVES.civicOffBoost);
  // Hold the advertised 200 hp above the midrange instead of creating a
  // pronounced 6-7k power dip before the 8k redline.
  const onBoost=curve(s.rpm,TORQUE_CURVES.civicOnBoost);
  torque=car.peakTorque*lerp(offBoost,onBoost,boostResponse(s.boost));
 }else{
  torque=car.peakTorque*curve(s.rpm,TORQUE_CURVES[car.torqueCurve || 'eclipse']);
 }
 // The torque plateau cannot exceed the car's advertised peak power.
 const powerCeiling=car.horsepower*745.7/Math.max(1,s.rpm*Math.PI/30);
 return Math.min(torque,powerCeiling);
}
function stepSingle(s,input,car,dt){
 s.clutch=clamp(input.clutch,0,1);s.throttle=clamp(input.throttle,0,1);s.brake=clamp(input.brake,0,1);
 const automatic=car.transmission==='automatic';
 if(automatic){s.clutch=0;advanceAutomatic(s,car,s.throttle,dt);}
 const ratio=s.gear===0?0:s.gear===-1?-(car.reverseRatio||3.3)*car.final:car.ratios[s.gear-1]*car.final;
 const engagement=clamp(((car.clutchBitePoint??HEALTHY_CLUTCH_BITE)-s.clutch)/DRIVING.clutchEngagementTravel,0,1);
 const forcedRpm=Math.abs(s.speed/DRIVING.wheelRadiusMeters*ratio)*30/Math.PI;
 if(!automatic&&!s.blown&&ratio&&engagement>.22&&forcedRpm>car.redline*DRIVING.overRevRedlineMultiplier){s.blown=true;s.running=false;s.rpm=0;s.boost=0;}
 if(car.turbo&&s.running){
  const target=clamp((s.rpm-TURBO.spoolStartRpm)/TURBO.spoolRpmRange,0,1)*clamp((s.throttle-TURBO.spoolThrottleStart)/TURBO.spoolThrottleRange,0,1)*clamp(engagement/TURBO.spoolEngagement,0,1)*(ratio?1:0);
  // Turbo speed survives a quick clutch-in upshift; lifting the pedal vents
  // pressure, but does not spin the turbo all the way down in a few frames.
  const response=target>s.boost?TURBO.spoolSeconds:s.throttle>TURBO.retainThrottle?TURBO.retainedSpoolSeconds:TURBO.ventSeconds;
  s.boost+=(target-s.boost)*(1-Math.exp(-dt/response));
 }else s.boost*=Math.exp(-dt/TURBO.stoppedDecaySeconds);
 const omega=s.rpm*Math.PI/30,wheelOmega=s.speed/DRIVING.wheelRadiusMeters*ratio;
 const capacity=engagement*car.peakTorque*DRIVING.clutchTorqueMultiplier*(car.clutchCapacity||1);
 const requestedCoupling=(omega-wheelOmega)*DRIVING.couplingResponse;
 const coupling=automatic?converterTorque(s,car,wheelOmega,omega):ratio&&!s.blown?clamp(requestedCoupling,-capacity,capacity):0;
 s.clutchSlipping=Boolean(!automatic&&ratio&&!s.blown&&engagement>.6&&Math.abs(requestedCoupling)>capacity*1.02&&Math.abs(omega-wheelOmega)>8);
 s.slip=!automatic&&ratio?Math.abs(omega-wheelOmega)*engagement:0;
 const idle=s.running?clamp((DRIVING.idleGovernorRpm-s.rpm)*.30,0,90):0;
 const combustion=s.running&&s.rpm<car.redline?availableTorque(s,car)*s.throttle:0;
 // Advertised torque is brake (net crank) torque. Subtracting full internal
 // friction again at wide-open throttle erased much of the Si's high-rpm power.
 const friction=s.running?(19+s.rpm*.003)*(1-s.throttle):42;
 const engineAcceleration=(combustion+idle-friction-coupling)/(car.engineInertia||.32);
 s.rpm=s.blown?0:Math.max(0,(omega+engineAcceleration*(engineAcceleration>0&&!automatic?DRIVING.rpmRiseMultiplier:1)*dt)*30/Math.PI);
 if(automatic&&s.running)s.rpm=clamp(s.rpm,DRIVING.initialIdleRpm,car.redline);
 if(s.running&&(!ratio||engagement<.22))s.rpm=Math.min(s.rpm,car.redline);
 if(s.running&&!automatic){
  // A high gear can hold the engine near idle while the wheels are asking it
  // to turn slower. Count that sustained lugging even if idle control bounces.
  const launchAssist=s.gear===1&&s.throttle>.25&&s.speed<4;
  const lugging=ratio&&engagement>.65&&forcedRpm<DRIVING.luggingWheelRpm&&s.rpm<DRIVING.luggingEngineRpm&&!launchAssist;
  if(s.rpm<DRIVING.stallRpm||lugging)s.stallTime+=dt;
  else s.stallTime=Math.max(0,s.stallTime-dt*2);
  if(s.rpm<DRIVING.immediateStallRpm||s.stallTime>(lugging?DRIVING.luggingDelaySeconds:DRIVING.stallDelaySeconds)){s.running=false;s.rpm=0;s.boost=0;}
 }
 if(!s.running)s.rpm=0;
 const converterGain=automatic&&omega>0?1+(car.automatic.torqueMultiplier-1)*clamp(1-Math.abs(wheelOmega)/omega,0,1):1;
 const drive=clamp(coupling*ratio*converterGain/DRIVING.wheelRadiusMeters,-car.mass*car.traction,car.mass*car.traction);
 const rolling=Math.abs(s.speed)>.015?Math.sign(s.speed)*(car.mass*DRIVING.rollingResistance+DRIVING.aeroDrag*s.speed*s.speed):0;
 let next=s.speed+(drive-rolling)/car.mass*dt;
 const braking=(s.brake*DRIVING.brakeDeceleration*(car.brakeEffectiveness||1)+(input.handbrake?DRIVING.handbrakeDeceleration:0))*dt;
 if(braking)next=s.speed>=0?Math.max(0,next-braking):Math.min(0,next+braking);
 if(Math.abs(next)<.02&&Math.abs(drive)<car.mass*DRIVING.rollingResistance)next=0;
 s.accel=lerp(s.accel,(next-s.speed)/Math.max(dt,.001),clamp(dt*8,0,1));
 s.speed=next;
 const steer=clamp(input.steer,-1,1),moving=clamp(s.speed/10,0,1);
 if(s.roadMode==='grid'){
  // Arcade steering: the turn radius broadens at speed so junctions are usable.
  s.heading-=steer*Math.min(s.speed*DRIVING.gridSteerResponse,DRIVING.maxTurnRate)*dt;
  s.x-=Math.sin(s.heading)*s.speed*dt;
  s.z-=Math.cos(s.heading)*s.speed*dt;
 }else{
  s.heading=lerp(s.heading,-steer*.12*moving,clamp(dt*8,0,1));
  s.x=clamp(s.x+steer*(1.5+s.speed*.14)*moving*dt,-(ROAD_HALF_WIDTH-1.05),ROAD_HALF_WIDTH-1.05);
  s.z-=s.speed*dt;
 }
 s.distance+=s.speed*dt;
}

export function step(s,input,car,dt){
 const count=Math.max(1,Math.ceil(dt/RUNTIME.physicsStepSeconds));
 for(let n=0;n<count;n++)stepSingle(s,input,car,dt/count);
}
