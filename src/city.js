import {ROAD_HALF_WIDTH} from './physics.js';

const LENGTH=96;
// Arcade scale: exaggerate scenery motion without changing car physics or MPH.
export const SCENERY_SPEED=1.6;
export const sceneryTravel=z=>z*SCENERY_SPEED;
const OFFSETS=[-3,-2,-1,0,1,2];
const palette=[0xb9cbd0,0xd7b9a3,0xc9d0ba,0xd7c5bd,0xa9bac0,0xd8c9a8];
const pick=(seed,n)=>((seed*73+seed*seed*19)%n+n)%n;

export function createCity(scene,THREE){
 const material=(color)=>new THREE.MeshStandardMaterial({color,roughness:.9});
 const asphalt=material(0x414a4d),sidewalk=material(0xb9b8ab),curb=material(0xe4ded0);
 const white=material(0xf2eee0),yellow=material(0xe6b94f),joint=material(0x687074);
 const windowMat=new THREE.MeshStandardMaterial({color:0x54737b,roughness:.23,metalness:.15});
 const storefront=material(0x4c6571),pole=material(0x58646a),lamp=material(0xffe7a4);
 const trunk=material(0x665d4a),leaves=material(0x62866b);
 const box=(parent,size,pos,mat)=>{
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);
  mesh.position.set(...pos);mesh.receiveShadow=true;parent.add(mesh);return mesh;
 };
 const geometry=(size)=>new THREE.BoxGeometry(...size);
 const segments=OFFSETS.map((_,segmentNumber)=>{
  const group=new THREE.Group();scene.add(group);
  box(group,[ROAD_HALF_WIDTH*2,.08,LENGTH],[0,.015,0],asphalt);
  for(const side of [-1,1]){
   box(group,[3.8,.19,LENGTH],[side*9.1,.1,0],sidewalk);
   box(group,[.28,.26,LENGTH],[side*(ROAD_HALF_WIDTH+.13),.13,0],curb);
   box(group,[.14,.012,LENGTH],[side*(ROAD_HALF_WIDTH-.37),.065,0],white);
  }
  // Two lanes each way, with a double yellow center line.
  for(const x of [-.13,.13])box(group,[.09,.012,LENGTH],[x,.065,0],yellow);
  const dashPositions=[];
  for(const x of [-3.6,3.6])for(let z=-45;z<=45;z+=10)dashPositions.push([x,.068,z]);
  const dashes=new THREE.InstancedMesh(geometry([.11,.012,4.2]),white,dashPositions.length);
  const marker=new THREE.Object3D();dashPositions.forEach((p,i)=>{marker.position.set(...p);marker.updateMatrix();dashes.setMatrixAt(i,marker.matrix);});
  dashes.instanceMatrix.needsUpdate=true;group.add(dashes);
  // Expansion seams and regular crosswalks give motion a readable scale.
  for(let z=-45;z<=45;z+=12)box(group,[ROAD_HALF_WIDTH*2,.006,.055],[0,.062,z],joint);
  if(segmentNumber%2===0)for(let x=-6.5;x<=6.5;x+=1.15)box(group,[.62,.014,2.1],[x,.073,-35],white);

  const windows=[];
  for(const side of [-1,1])for(let slot=0;slot<3;slot++){
   const seed=segmentNumber*17+slot*7+(side+1)*13;
   const height=11+pick(seed,4)*4,depth=7.5+pick(seed+5,3),z=-32+slot*32;
   const building=box(group,[depth,height,22],[side*(10.7+depth/2),height/2+.21,z],material(palette[pick(seed+2,palette.length)]));
   building.castShadow=true;
   box(group,[.13,2.7,20],[side*10.64,1.62,z],storefront);
   box(group,[1.5,2.25,.08],[side*10.54,1.4,z-4],windowMat);
   box(group,[1.1,.15,19],[side*10.2,3.0,z],material(palette[pick(seed+4,palette.length)]));
   for(let floor=0;floor<Math.floor((height-3)/2.4);floor++)for(let pane=-2;pane<=2;pane++){
    const wx=side*10.62,wy=4.3+floor*2.4,wz=z+pane*3.65;
    if(pick(seed+floor*5+pane+22,7)!==0)windows.push([wx,wy,wz]);
   }
   // Lamp posts and trees alternate at sidewalk intervals.
   const streetZ=z-10;
   if(slot%2===0){
    box(group,[.11,5.2,.11],[side*8.8,2.7,streetZ],pole);
    box(group,[1.0,.12,.17],[side*8.35,5.26,streetZ],pole);
    box(group,[.5,.08,.27],[side*7.96,5.18,streetZ],lamp);
   }else{
    const wood=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,2.2,7),trunk);wood.position.set(side*9.1,1.3,streetZ);group.add(wood);
    const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.3,0),leaves);crown.position.set(side*9.1,3.0,streetZ);group.add(crown);
   }
  }
  const panes=new THREE.InstancedMesh(geometry([.09,.93,1.58]),windowMat,windows.length);
  windows.forEach((p,i)=>{marker.position.set(...p);marker.updateMatrix();panes.setMatrixAt(i,marker.matrix);});
  panes.instanceMatrix.needsUpdate=true;group.add(panes);
  return group;
 });
 return {
  setVisible(visible){for(const segment of segments)segment.visible=visible;},
  update(z){
   const travel=sceneryTravel(z);
   const middle=Math.round(travel/LENGTH);
   const offsetFromCar=z-travel;
   for(const offset of OFFSETS){
    const index=middle+offset;
    const slot=((index%segments.length)+segments.length)%segments.length;
    segments[slot].position.z=index*LENGTH+offsetFromCar;
   }
  }
 };
}
