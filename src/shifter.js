import { SHIFTER } from "./config/gameplay.js";
// Crossing Neutral pauses the lever; a held stick completes the move after
// the pause, while a short flick leaves it in Neutral.
const DETENT_MS=SHIFTER.stickDetentMs;
export function neutralSlide(x){
 if(Math.abs(x)<.1)return 0;
 return Math.sign(x)*Math.min(1,(Math.abs(x)-.1)/.9);
}
export function neutralLane(x){return x<-.42?-1:x>.42?1:0;}
export function reverseGate(car){return car?.reverseGate||null;}
export function readStick(position,x,y,armed,holdUntil=0,now=0,centerDetentUntil=0,verticalRepeat=null,gate=null,outerSince=null){
 let lane=neutralLane(x),nextOuterSince=null;
 if(gate&&position.row===0&&lane===Math.sign(gate.lane)&&Math.abs(x)>.94){
  if(position.lane===gate.lane)lane=gate.lane;
  else if(position.lane===Math.sign(gate.lane)){
   nextOuterSince=outerSince??now;
   if(now-nextOuterSince>=350)lane=gate.lane;
  }
 }
 const crossing=position.row===0&&position.lane!==0&&lane!==0&&Math.sign(lane)===-Math.sign(position.lane);
 const caught=crossing||position.row===0&&centerDetentUntil>now&&Math.abs(x)>=.28;
 const nextDetentUntil=crossing?now+DETENT_MS:caught?centerDetentUntil:0;
 // A brief grace period lets the player slide sideways, release the stick,
 // and still push vertically into that lane's gear.
 const graceUntil=!caught&&position.row===0&&position.lane!==0&&lane===0&&holdUntil===0?now+SHIFTER.stickNeutralGraceMs:holdUntil;
 const holding=!caught&&position.row===0&&position.lane!==0&&now<graceUntil&&(lane===0||lane===position.lane);
 const neutralX=position.row===0?(caught?0:holding?position.lane:Math.abs(lane)===2?lane:neutralSlide(x)):position.lane;
 const nextPosition=position.row===0?(caught?{lane:0,row:0,gear:0}:holding?position:{lane,row:0,gear:0}):position;
 const remainingHold=holding?graceUntil:0;
 let direction=null,nextArmed=armed,nextRepeat=verticalRepeat;
 if(Math.abs(y)<.28){nextArmed=true;nextRepeat=null;}
 else if(Math.abs(y)>.72){
  const heldDirection=y<0?'up':'down';
  if(armed){direction=heldDirection;nextArmed=false;nextRepeat={at:now+DETENT_MS,direction:heldDirection};}
  else if(verticalRepeat&&now>=verticalRepeat.at){
   if(nextPosition.row===0&&verticalRepeat.direction===heldDirection)direction=heldDirection;
   nextRepeat=null;
  }
 }
 return {position:nextPosition,neutralX,direction,armed:nextArmed,holdUntil:remainingHold,centerDetentUntil:nextDetentUntil,verticalRepeat:nextRepeat,outerSince:nextOuterSince};
}
export const neutralPosition=()=>({lane:0,row:0,gear:0});
export function positionForGear(gear,gate=null){
 if(gear===0)return neutralPosition();
 if(gear===-1)return gate?{...gate,gear:-1}:neutralPosition();
 return {lane:Math.floor((gear-1)/2)-1,row:gear%2===1?-1:1,gear};
}
export function throwLever(position,direction,gate=null){
 const {lane,row}=position;
 if(row!==0){
  if(row===-1&&direction==='down'||row===1&&direction==='up')return {lane,row:0,gear:0};
  return null;
 }
 if(gate&&lane===gate.lane)return (direction==='up'&&gate.row===-1||direction==='down'&&gate.row===1)?{...gate,gear:-1}:null;
 if(lane< -1||lane>1)return null;
 if(direction==='up')return {lane,row:-1,gear:[1,3,5][lane+1]};
 if(direction==='down')return {lane,row:1,gear:[2,4,6][lane+1]};
 return null;
}
