import {boostResponse,clamp} from './physics.js';

export function rumbleLevels(state,car,now){
 if(!state.running)return {strong:0,weak:0};
 const revs=clamp((state.rpm-850)/(car.redline-850),0,1);
 const engaged=state.gear!==0?clamp((.85-state.clutch)/.7,0,1):0;
 const pulling=engaged*(.25+.75*state.throttle);
 // The V6 follows revs smoothly. The Si's extra pulse arrives with its
 // delayed torque, so the controller and acceleration crest together.
 let strong=(car.turbo?.006:.012)+engaged*(car.turbo?.035:.06)+pulling*revs*(car.turbo?.12:.25);
 let weak=.018+revs*.025+engaged*.025+pulling*revs*.09;
 if(car.turbo){const hit=boostResponse(state.boost)*engaged*state.throttle;strong+=hit*.16;weak+=hit*.20;}
 if(car.transmission!=='automatic'&&state.gear!==0&&state.clutch<.65&&state.rpm<1100){
  const urgency=clamp((1100-state.rpm)/600,0,1);
  if(Math.floor(now/150)%2===0){strong=Math.max(strong,.2+urgency*.5);weak=Math.max(weak,.12+urgency*.25);}
 }
 return {strong:clamp(strong,0,1),weak:clamp(weak,0,1)};
}
