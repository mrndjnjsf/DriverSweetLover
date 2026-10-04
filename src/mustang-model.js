import { modelBuilder } from './model-utils.js';

// Original miniature New Edge coupe, shaped from the supplied reference.
export function buildMustang(THREE, parent, color) {
  const material = (color, roughness=.4, metalness=.15) => new THREE.MeshStandardMaterial({color,roughness,metalness,side:THREE.DoubleSide});
  const paint=material(color,.32,.4),glass=material(0x202d34,.2,.2),black=material(0x181c1e,.9),silver=material(0xb7babb,.3,.65);
  const red=new THREE.MeshBasicMaterial({color:0xa92b30,side:THREE.DoubleSide});
  const lamp=new THREE.MeshBasicMaterial({color:0xc6d0ca,side:THREE.DoubleSide});
  const amber=new THREE.MeshBasicMaterial({color:0xb98030,side:THREE.DoubleSide});
  const {add,box,panel,surface,loft}=modelBuilder(THREE,parent,paint);
  loft([[-2.30,.76,.43,.87],[-1.85,.89,.40,1.02],[-1.25,.94,.39,1.06],[0,.94,.39,1.06],[1.35,.96,.40,1.05],[2.25,.83,.43,.99]],
    ([z,w,b,t])=>[[-w*.85,b,z],[-w,.64,z],[-w,.90,z],[-w*.75,t,z],[w*.75,t,z],[w,.90,z],[w,.64,z],[w*.85,b,z]]);
  loft([[-.92,.76,.65,1.06,1.13],[-.45,.74,.60,1.06,1.61],[.55,.74,.59,1.06,1.62],[1.35,.78,.70,1.06,1.16]],
    ([z,bw,tw,b,t])=>[[-bw,b,z],[-tw,t,z],[tw,t,z],[bw,b,z]]);
  surface([[-.90,1.15,.73],[-.45,1.63,.59]],glass);
  surface([[.60,1.64,.59],[1.33,1.19,.69]],glass);
  for(const side of [-1,1]) {
    panel([[side*.77,1.10,-.85],[side*.62,1.59,-.43],[side*.61,1.60,.38],[side*.78,1.10,.43]],glass);
    panel([[side*.78,1.10,.49],[side*.61,1.60,.48],[side*.69,1.23,1.18],[side*.79,1.10,1.22]],glass);
    box([.045,.08,1.7],[side*.93,.48,.2],black);
    box([.025,.025,.15],[side*.952,.98,.45],silver);
    // Mustang's angular side scoop behind its long doors.
    panel([[side*.958,.67,.69],[side*.961,.96,.71],[side*.963,.88,1.06],[side*.961,.66,1.05]],black);
    const mirror=add(new THREE.SphereGeometry(.14,10,6),paint,[side*.88,1.14,-.75]);mirror.scale.set(1,.5,.8);
    box([.047,.6,.04],[side*.94,.74,.56],black);
    box([.51,.17,.04],[side*.55,.90,-2.26],black);
    box([.37,.11,.046],[side*.49,.91,-2.284],lamp);
    box([.085,.11,.047],[side*.73,.91,-2.285],amber);
    // Three vertical tail-light segments on each side.
    for(let i=0;i<3;i++)box([.115,.23,.047],[side*(.37+i*.15),.83,2.26],red);
    const tip=add(new THREE.CylinderGeometry(.045,.045,.16,10),silver,[side*.55,.43,2.30]);tip.rotation.x=Math.PI/2;
    box([.055,.16,.15],[side*.63,1.14,1.96],paint);
  }
  panel([[-.27,.83,-2.31],[.27,.83,-2.31],[.23,1.01,-2.29],[-.23,1.01,-2.29]],black);
  // Small neutral emblem silhouette, rather than a copied texture asset.
  box([.12,.045,.025],[0,.92,-2.33],silver);
  box([1.10,.13,.025],[0,.55,-2.30],black);
  box([.50,.18,.027],[0,.76,2.29],silver);
  box([1.62,.055,.26],[0,1.25,1.99],paint);
  const wheels=[];
  for(const side of [-1,1])for(const z of [-1.35,1.22]) {
    const pivot=new THREE.Group();pivot.position.set(side*.94,.42,z);parent.add(pivot);
    const spin=new THREE.Group();pivot.add(spin);
    const tyre=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.24,20),black);tyre.rotation.z=Math.PI/2;spin.add(tyre);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.26,.26,.26,16),silver);hub.rotation.z=Math.PI/2;spin.add(hub);
    const face=new THREE.Mesh(new THREE.CylinderGeometry(.23,.23,.27,16),black);face.rotation.z=Math.PI/2;spin.add(face);
    for(let i=0;i<5;i++) {
      const a=i*Math.PI*2/5,spoke=new THREE.Mesh(new THREE.BoxGeometry(.025,.065,.23),silver);
      spoke.position.set(side*.145,Math.sin(a)*.115,Math.cos(a)*.115);spoke.rotation.x=a;spin.add(spoke);
    }
    wheels.push({pivot,tyre:spin,front:z<0});
  }
  return wheels;
}
