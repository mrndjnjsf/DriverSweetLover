import { carsOverlap } from './collision.js';

// Sweep the oriented car between simulation poses. The broad phase touches
// only boxes near its path; half-metre samples prevent crossing a wall at speed.
export function resolveBuildingContact(previous, current, buildings) {
 const radius=Math.hypot(current.halfLength??2.25,current.halfWidth??.95);
 const minX=Math.min(previous.x,current.x)-radius,maxX=Math.max(previous.x,current.x)+radius;
 const minZ=Math.min(previous.z,current.z)-radius,maxZ=Math.max(previous.z,current.z)+radius;
 const candidates=buildings.filter(b=>b.x+b.halfWidth>=minX&&b.x-b.halfWidth<=maxX&&b.z+b.halfLength>=minZ&&b.z-b.halfLength<=maxZ);
 if(!candidates.length)return null;
 const distance=Math.hypot(current.x-previous.x,current.z-previous.z);
 const angle=Math.atan2(Math.sin(current.heading-previous.heading),Math.cos(current.heading-previous.heading));
 const samples=Math.max(1,Math.ceil((distance+Math.abs(angle)*radius)/.5));
 let safe={...previous};
 for(let i=0;i<=samples;i++){
  const t=i/samples,pose={...current,x:previous.x+(current.x-previous.x)*t,z:previous.z+(current.z-previous.z)*t,heading:previous.heading+angle*t};
  const building=candidates.find(b=>carsOverlap(pose,b));
  if(building){
   if(i===0){
    // A map edit may put a wall around the player. Move to the nearest face.
    const halfLength=current.halfLength??2.25,halfWidth=current.halfWidth??.95;
    const rx=Math.abs(Math.sin(pose.heading))*halfLength+Math.abs(Math.cos(pose.heading))*halfWidth;
    const rz=Math.abs(Math.cos(pose.heading))*halfLength+Math.abs(Math.sin(pose.heading))*halfWidth;
    const faces=[{axis:'x',value:building.x-building.halfWidth-rx-.01},{axis:'x',value:building.x+building.halfWidth+rx+.01},{axis:'z',value:building.z-building.halfLength-rz-.01},{axis:'z',value:building.z+building.halfLength+rz+.01}];
    faces.sort((a,b)=>Math.abs(a.value-pose[a.axis])-Math.abs(b.value-pose[b.axis]));
    safe={...pose,[faces[0].axis]:faces[0].value};
   }
   return {pose:safe,buildingId:building.id,end:current.speed<0?'rear':'front',impactSpeedMps:Math.abs(current.speed)};
  }
  safe=pose;
 }
 return null;
}
