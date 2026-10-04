// An original, lightweight 4G Eclipse-inspired mesh built from the supplied
// reference collage. It deliberately avoids copying any photographed body kit.
import {modelBuilder} from './model-utils.js';
export function buildEclipse(THREE,parent,color){
 const materials={
   paint:new THREE.MeshStandardMaterial({color,roughness:.31,metalness:.34,side:THREE.DoubleSide}),
   dark:new THREE.MeshStandardMaterial({color:0x20282b,roughness:.8}),
   glass:new THREE.MeshStandardMaterial({color:0x233e49,roughness:.13,metalness:.2,side:THREE.DoubleSide}),
   lamp:new THREE.MeshStandardMaterial({color:0x94a9ac,roughness:.18,metalness:.2,side:THREE.DoubleSide}),
   red:new THREE.MeshBasicMaterial({color:0xb83331,side:THREE.DoubleSide}),
   silver:new THREE.MeshStandardMaterial({color:0xa9b2ad,roughness:.32,metalness:.7}),
   black:new THREE.MeshBasicMaterial({color:0x161b20,side:THREE.DoubleSide}),
   orangeTrim:new THREE.MeshStandardMaterial({color,roughness:.37,metalness:.26,side:THREE.DoubleSide}),
   white:new THREE.MeshStandardMaterial({color:0xe8e6d7,roughness:.3}),
   shadow:new THREE.MeshBasicMaterial({color:0x202820,transparent:true,opacity:.17,depthWrite:false})
  };
 materials.paint.color.setHex(color);materials.orangeTrim.color.setHex(color);
 const m=materials;
 const {add,box,panel,surface,loft}=modelBuilder(THREE,parent,m.paint);

 // Broad nose, tapering waist and the rounded, muscular rear shoulders.
 const body=[
  [-2.32,.63,.45,.68],[-2.18,.79,.43,.79],[-1.86,.89,.41,.91],
  [-1.49,.94,.40,.99],[-1.05,.94,.40,.98],[-.50,.92,.40,.94],
  [.10,.94,.40,.95],[.68,.98,.40,.98],[1.16,1.03,.42,1.00],
  [1.64,1.01,.42,.96],[2.08,.87,.43,.84],[2.31,.65,.46,.74]
 ];
 loft(body,([z,w,b,t])=>[
  [-w*.82,b,z],[-w,.61,z],[-w*.98,.83,z],[-w*.71,t,z],
  [w*.71,t,z],[w*.98,.83,z],[w,.61,z],[w*.82,b,z]
 ]);

 // Continuous fastback roof: short hood, low arch, long hatch glass.
 const roof=[
  [-.98,.79,.70,.97,1.00],[-.66,.75,.66,.97,1.27],
  [-.32,.70,.61,.97,1.46],[.10,.70,.60,.97,1.55],
  [.47,.72,.61,.97,1.55],[.78,.74,.63,.97,1.44],
  [1.53,.81,.74,.97,1.01]
 ];
 loft(roof,([z,baseW,topW,baseY,topY])=>[
  [-baseW,baseY,z],[-topW,topY,z],[topW,topY,z],[baseW,baseY,z]
 ]);
 surface([[-.96,1.045,.71],[-.66,1.315,.65],[-.32,1.505,.60]],m.glass);
 surface([[.47,1.595,.60],[.78,1.485,.62],[1.48,1.095,.72]],m.glass);
 for(const side of [-1,1]){
  panel([
   [side*.77,1.005,-.89],[side*.665,1.405,-.29],
   [side*.65,1.49,.18],[side*.79,1.01,.33]
  ],m.glass);
  panel([
   [side*.79,1.01,.39],[side*.65,1.49,.28],
   [side*.65,1.45,.73],[side*.79,1.015,1.39]
  ],m.glass);
  // B pillar and the strong rising side sill seen in the side references.
  const pillar=box([.035,.48,.06],[side*.765,1.235,.35],m.black);pillar.rotation.x=.18;
  const mirror=add(new THREE.SphereGeometry(.16,10,8),m.paint,[side*.89,1.015,-.68]);
  mirror.scale.set(1.12,.48,.73);
  panel([
   [side*.946,.76,-.73],[side*.957,.76,.89],
   [side*.987,.84,.95],[side*.927,.88,-.67]
  ],m.orangeTrim);
  const seamPoints=[new THREE.Vector3(side*.955,.96,-.58),new THREE.Vector3(side*.97,.66,-.55),new THREE.Vector3(side*.98,.62,.93)];
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seamPoints),16,.009,4,false),m.dark);
  box([.045,.035,.18],[side*.975,.88,.27],m.silver);
 }

 // Narrow swept lights and two-piece front intake distinguish the 4G nose.
 for(const side of [-1,1]){
  panel([
   [side*.18,.81,-2.25],[side*.61,.82,-2.26],
   [side*.85,.995,-1.66],[side*.47,1.006,-1.72]
  ],m.glass);
  panel([
   [side*.22,.817,-2.268],[side*.59,.827,-2.274],
   [side*.68,.906,-2.02],[side*.36,.895,-2.04]
  ],m.lamp);
  const fog=new THREE.Mesh(new THREE.SphereGeometry(.065,10,6),m.lamp);
  fog.scale.z=.18;fog.position.set(side*.62,.56,-2.334);parent.add(fog);
 }
 panel([[-.50,.68,-2.337],[.50,.68,-2.337],[.40,.80,-2.335],[-.40,.80,-2.335]],m.black);
 panel([[-.73,.46,-2.308],[.73,.46,-2.308],[.56,.57,-2.326],[-.56,.57,-2.326]],m.black);
 box([.052,.30,.035],[0,.67,-2.354],m.orangeTrim);
 for(const [x,y] of [[0,.84],[-.055,.78],[.055,.78]]){
  const badge=box([.048,.048,.024],[x,y,-2.347],m.silver);badge.rotation.z=Math.PI/4;
 }

 // Dark wraparound tail lamps, low bumper and a restrained hatch lip.
 box([.42,.17,.07],[0,.83,2.32],m.black);
 for(const side of [-1,1]){
  panel([
   [side*.15,.90,2.343],[side*.59,.90,2.345],
   [side*.79,.89,2.22],[side*.75,.78,2.25],[side*.18,.77,2.345]
  ],m.red);
  box([.13,.035,.028],[side*.47,.82,2.36],m.white);
  box([.22,.09,.09],[side*.58,.49,2.28],m.dark);
  const tip=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.10,12),m.silver);
  tip.rotation.x=Math.PI/2;tip.position.set(side*.53,.39,2.34);parent.add(tip);
 }
 box([.50,.19,.036],[0,.63,2.353],m.silver);
 const lip=box([1.50,.035,.15],[0,.92,2.04],m.paint);lip.rotation.x=-.09;

 const wheels=[];
 for(const side of [-1,1])for(const z of [-1.43,1.43]){
  const arch=[];
  for(let i=0;i<=14;i++){
   const a=Math.PI*i/14;
   arch.push(new THREE.Vector3(side*.963,.48+Math.sin(a)*.46,z-Math.cos(a)*.48));
  }
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arch),20,.016,5,false),m.dark);
  const pivot=new THREE.Group();pivot.position.set(side*.96,.46,z);parent.add(pivot);
  const spin=new THREE.Group();pivot.add(spin);
  const tyre=new THREE.Mesh(new THREE.CylinderGeometry(.39,.39,.26,24),m.dark);tyre.rotation.z=Math.PI/2;spin.add(tyre);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.255,.255,.272,20),m.dark);hub.rotation.z=Math.PI/2;spin.add(hub);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.255,.025,6,22),m.silver);rim.rotation.y=Math.PI/2;rim.position.x=side*.147;spin.add(rim);
  for(let i=0;i<5;i++){
   const a=i*Math.PI*2/5;
   const spoke=new THREE.Mesh(new THREE.BoxGeometry(.025,.045,.23),m.silver);
   spoke.position.set(side*.14,Math.sin(a)*.13,Math.cos(a)*.13);spoke.rotation.x=a;spin.add(spoke);
  }
  const center=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.28,12),m.dark);center.rotation.z=Math.PI/2;spin.add(center);
  wheels.push({pivot,tyre:spin,front:z<0});
 }
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(2.2,4.8),m.shadow);
 shadow.rotation.x=-Math.PI/2;shadow.position.y=.015;parent.add(shadow);
 return wheels;
}
