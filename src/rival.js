import { RIVAL } from './config/rival.js';
import { nearestRoadPoint, neighbors, gridPoint } from './grid-map.js';

export function createRival() { return { phase:'waiting', clock:0, invitationAge:0, respect:5, wins:0, losses:0, position:null, raceId:null, settledIds:[] }; }
export function advanceRival(rival, dt, {map,car,eligible,force=false}) {
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Rival time must be nonnegative');
  if(rival.phase==='accepted'||rival.phase==='racing')return rival;
  if(rival.phase==='invited'){
    const age=rival.invitationAge+dt;
    return age>=RIVAL.invitationSeconds?declineRival(rival):{...rival,invitationAge:age};
  }
  const clock=rival.clock+dt;
  if(!eligible||(!force&&clock<RIVAL.encounterSeconds))return {...rival,clock};
  const near=nearestRoadPoint(map,car.x,car.z),next=neighbors(map,near.col,near.row)[0];
  if(!next)return {...rival,clock};
  const end=gridPoint(map,next.col,next.row),fx=(end.x-near.x)/map.blockSize,fz=(end.z-near.z)/map.blockSize;
  const position={x:(near.x+end.x)/2-fz*(map.roadWidth/2+2),z:(near.z+end.z)/2+fx*(map.roadWidth/2+2),heading:Math.atan2(-fx,-fz)};
  if(Math.hypot(position.x-car.x,position.z-car.z)<14)return {...rival,clock};
  return {...rival,phase:'invited',position,clock:0,invitationAge:0};
}
export function acceptRival(rival) { if(rival.phase!=='invited')throw new Error('No rival invitation');return {...rival,phase:'accepted'}; }
export function declineRival(rival) { return {...rival,phase:'waiting',clock:0,position:null,raceId:null}; }
export function startRivalRace(rival,id) { if(rival.phase!=='accepted')throw new Error('Accept the rival challenge first');return {...rival,phase:'racing',raceId:id}; }
export function settleRivalRace(rival,id,outcome,needs) {
  if(rival.phase!=='racing'||rival.raceId!==id||rival.settledIds.includes(id))return {rival,needs,feedback:null};
  const win=outcome==='win',loss=outcome==='loss';
  const next={...declineRival(rival),respect:Math.max(0,rival.respect+(win?RIVAL.respectStep:loss?-RIVAL.respectStep:0)),wins:rival.wins+(win?1:0),losses:rival.losses+(loss?1:0),settledIds:[...rival.settledIds,id].slice(-64)};
  return {rival:next,needs:loss?{...needs,poop:1}:needs,feedback:win?'RESPECT ↑':loss?'RESPECT ↓ · NERVES GOT YOU':null};
}
