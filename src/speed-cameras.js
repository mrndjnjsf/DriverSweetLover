import { gridPoint, neighbors } from './grid-map.js';

export function speedCameraLocations(map) {
  return map.locations.filter(location=>['spawn','shop','fuel'].includes(location.kind)).flatMap(location=>{
    const next=neighbors(map,location.col,location.row)[0];
    if(!next)return [];
    const start=gridPoint(map,location.col,location.row),end=gridPoint(map,next.col,next.row);
    const fx=(end.x-start.x)/map.blockSize,fz=(end.z-start.z)/map.blockSize;
    return [{id:`camera-${location.id}`,x:start.x+fx*map.blockSize*.72,z:start.z+fz*map.blockSize*.72,poleX:start.x+fx*map.blockSize*.72-fz*(map.roadWidth/2+1),poleZ:start.z+fz*map.blockSize*.72+fx*(map.roadWidth/2+1)}];
  });
}

export function createSpeedCameras(map) { return { cameras:speedCameraLocations(map), time:0, sequence:0, cooldowns:new Map() }; }
export function updateSpeedCameras(system, car, dt, enabled) {
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Camera time must be nonnegative');
  system.time+=dt;
  if(!enabled||Math.abs(car.speed)*2.23694<=38)return null;
  const camera=system.cameras.find(camera=>Math.hypot(camera.x-car.x,camera.z-car.z)<12&&system.time-(system.cooldowns.get(camera.id)??-Infinity)>20);
  if(!camera)return null;
  system.cooldowns.set(camera.id,system.time);
  return {id:`camera-${++system.sequence}`,amountCents:4500,reason:'Speed camera: above 35 MPH city limit'};
}
