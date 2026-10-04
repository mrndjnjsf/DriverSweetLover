import { createVehicleView, VEHICLE_ART } from './vehicle-view.js';

export function createRivalView(THREE,scene) {
  const view=createVehicleView(THREE,{rival:{build:VEHICLE_ART.civic.build,paint:0x12181c}});view.setVehicle('rival');scene.add(view.root);
  return {group:view.root,update(rival,course,race,dt=0){
    view.root.visible=rival.phase!=='waiting'&&Boolean(rival.position);
    if(!view.root.visible)return;
    let pose=rival.position;
    if((rival.phase==='racing'||rival.phase==='accepted')&&course){
      const distance=rival.phase==='racing'?(race?.rivalProgress||0):0;
      pose={x:course.rivalStart.x+course.forward.x*distance,z:course.rivalStart.z+course.forward.z*distance,heading:course.start.heading};
    }
    const speed=rival.phase==='racing'&&race?.phase==='active'
      ?course.distanceMeters/race.rivalTimeSeconds*1.3*Math.pow(Math.min(1,race.elapsedSeconds/race.rivalTimeSeconds),.3):0;
    view.update({...pose,speed,steer:0,shake:0,timeMs:0,failing:false},dt);
  }};
}
