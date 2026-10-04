import { cityProjectPoint } from '../city-projects.js';
import { disposeModel } from '../scene-resources.js';
import { speedCameraLocations } from '../speed-cameras.js';

export function createCityProjectView(THREE, scene) {
  const group = new THREE.Group(); scene.add(group);
  let key='';
  let walkers=[];
  function set(map,effects){
    const point=cityProjectPoint(map),nextKey=JSON.stringify([point,effects]);
    if(key===nextKey)return;
    key=nextKey;disposeModel(group);walkers=[];group.position.set(point.x,0,point.z);
    const ground=new THREE.MeshStandardMaterial({color:effects.park?0x5c9a69:0x9c937f,roughness:1});
    function box(w,h,d,x,y,z,material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);group.add(mesh);return mesh;}
    box(22,.04,22,0,.01,0,ground);
    const trim=new THREE.MeshStandardMaterial({color:effects.park?0xdbd9bd:0x887d6b});
    if(effects.park){
      box(22,.025,2,0,.045,0,trim);box(2,.025,22,0,.045,0,trim);
      const trunk=new THREE.MeshStandardMaterial({color:0x715640}),leaves=new THREE.MeshStandardMaterial({color:0x3e8656});
      for(const x of [-7,7])for(const z of [-7,7]){
        box(.5,2.4,.5,x,1.2,z,trunk);
        const canopy=new THREE.Mesh(new THREE.SphereGeometry(2.4,8,6),leaves);canopy.position.set(x,3.2,z);group.add(canopy);
      }
      for(const x of [-5,5]){box(2.8,.18,.65,x,.55,3,trim);box(.18,.55,.6,x-1, .25,3,trim);box(.18,.55,.6,x+1,.25,3,trim);}
      for(const x of [-1,1]){const person=box(.35,.9,.25,x,1,0,new THREE.MeshStandardMaterial({color:x<0?0xd4a368:0x73a8c5}));const head=new THREE.Mesh(new THREE.SphereGeometry(.2,8,6),trim);head.position.y=.65;person.add(head);walkers.push(person);}
      if(effects.skyline){const art=new THREE.MeshStandardMaterial({color:0x91c6b6,metalness:.35,roughness:.4});box(1.5,5,1.5,0,2.5,0,art);}
    }else for(const x of [-7,0,7])box(.4,1.2,.4,x,.6,-9,trim);
    if(effects.cameras)for(const camera of speedCameraLocations(map)){
      box(.16,4,.16,camera.poleX-point.x,2,camera.poleZ-point.z,trim);
      box(.6,.5,.5,camera.poleX-point.x,4,camera.poleZ-point.z,new THREE.MeshStandardMaterial({color:0x354d56}));
    }
  }
  return {group,set,update(timeSeconds){for(let i=0;i<walkers.length;i++){walkers[i].position.x=Math.sin(timeSeconds*.3+i*Math.PI)*8;walkers[i].position.z=i?2:-2;}}};
}
