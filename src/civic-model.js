// Original low-poly 2023 Civic Si sedan inspired by the supplied white-car
// references. The four-door greenhouse and short trunk distinguish it from
// the Eclipse coupe while keeping the same miniature-game visual language.
import {modelBuilder} from './model-utils.js';

export function buildCivic(THREE,parent,color){
 const materials={
   paint:new THREE.MeshStandardMaterial({color,roughness:.29,metalness:.17,side:THREE.DoubleSide}),
   glass:new THREE.MeshStandardMaterial({color:0x263943,roughness:.16,metalness:.16,side:THREE.DoubleSide}),
   black:new THREE.MeshBasicMaterial({color:0x1a2024,side:THREE.DoubleSide}),
   grille:new THREE.MeshStandardMaterial({color:0x263035,roughness:.84,side:THREE.DoubleSide}),
   lamp:new THREE.MeshBasicMaterial({color:0xb9cccf,side:THREE.DoubleSide}),
   red:new THREE.MeshBasicMaterial({color:0xb93439,side:THREE.DoubleSide}),
   silver:new THREE.MeshStandardMaterial({color:0xaab3b5,roughness:.38,metalness:.52}),
   wheel:new THREE.MeshStandardMaterial({color:0x303a3f,roughness:.56,metalness:.24}),
   seam:new THREE.MeshStandardMaterial({color:0xb4bcba,roughness:.85}),
   shadow:new THREE.MeshBasicMaterial({color:0x202820,transparent:true,opacity:.16,depthWrite:false})
  };
 materials.paint.color.setHex(color);
 const m=materials;
 const {add,box,panel,surface,loft}=modelBuilder(THREE,parent,m.paint);

 // Straight shoulder line, long cabin and a distinct sedan trunk deck.
 const body=[
  [-2.38,.65,.44,.70],[-2.24,.78,.42,.78],[-1.92,.88,.41,.90],
  [-1.48,.93,.40,.99],[-.94,.94,.40,1.02],[-.25,.95,.40,1.03],
  [.48,.96,.40,1.03],[1.12,.97,.41,1.04],[1.60,.96,.41,1.00],
  [2.04,.90,.42,.94],[2.35,.77,.43,.85],[2.40,.70,.44,.81]
 ];
 loft(body,([z,w,b,t])=>[
  [-w*.84,b,z],[-w,.62,z],[-w*.99,.86,z],[-w*.76,t,z],
  [w*.76,t,z],[w*.99,.86,z],[w,.62,z],[w*.84,b,z]
 ]);

 const cabin=[
  [-1.08,.77,.72,1.02,1.05],[-.70,.75,.66,1.02,1.43],
  [-.36,.73,.63,1.02,1.58],[.20,.73,.62,1.02,1.64],
  [.55,.74,.63,1.02,1.64],[.82,.75,.65,1.02,1.57],
  [1.34,.80,.72,1.02,1.12]
 ];
 loft(cabin,([z,baseW,topW,baseY,topY])=>[
  [-baseW,baseY,z],[-topW,topY,z],[topW,topY,z],[baseW,baseY,z]
 ]);
 surface([[-1.06,1.09,.73],[-.70,1.475,.65],[-.36,1.62,.62]],m.glass);
 surface([[.80,1.61,.64],[1.33,1.16,.71]],m.glass);
 for(const side of [-1,1]){
  panel([
   [side*.77,1.065,-.99],[side*.67,1.47,-.66],
   [side*.65,1.60,-.34],[side*.77,1.07,-.045]
  ],m.glass);
  panel([
   [side*.78,1.07,.025],[side*.645,1.655,.04],
   [side*.67,1.585,.76],[side*.79,1.08,1.20]
  ],m.glass);
  const pillar=box([.045,.56,.08],[side*.755,1.34,.015],m.black);pillar.rotation.x=-.10;
  const mirror=add(new THREE.SphereGeometry(.15,10,8),m.paint,[side*.89,1.075,-.89]);mirror.scale.set(1.18,.48,.75);
  for(const z of [-.47,.71]){
   const seam=[new THREE.Vector3(side*.965,1.0,z-.16),new THREE.Vector3(side*.974,.68,z-.10),new THREE.Vector3(side*.965,.48,z)];
   add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seam),10,.008,4,false),m.seam);
   box([.035,.028,.15],[side*.982,.94,z],m.paint);
  }
  box([.045,.05,2.40],[side*.95,.51,.01],m.grille);
  // Crisp shoulder crease, visible in the long side profile.
  const crease=[new THREE.Vector3(side*.94,.94,-1.50),new THREE.Vector3(side*.965,.94,-.25),new THREE.Vector3(side*.97,.95,1.70)];
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(crease),20,.012,4,false),m.seam);
 }

 // 11th-generation-style slim headlamps and broad two-tier black grille.
 for(const side of [-1,1]){
  panel([
   [side*.32,.805,-2.30],[side*.77,.805,-2.25],
   [side*.82,.865,-2.00],[side*.40,.865,-2.04]
  ],m.glass);
  panel([
   [side*.37,.81,-2.305],[side*.73,.81,-2.265],
   [side*.76,.84,-2.13],[side*.42,.84,-2.16]
  ],m.lamp);
  panel([
   [side*.63,.48,-2.365],[side*.83,.49,-2.33],
   [side*.84,.69,-2.31],[side*.72,.70,-2.35]
  ],m.black);
 }
 panel([[-.66,.76,-2.402],[.66,.76,-2.402],[.57,.88,-2.39],[-.57,.88,-2.39]],m.grille);
 panel([[-.71,.43,-2.38],[.71,.43,-2.38],[.60,.72,-2.405],[-.60,.72,-2.405]],m.black);
 box([1.56,.035,.18],[0,.43,-2.29],m.grille);
 for(const x of [-.035,.035])box([.025,.08,.022],[x,.83,-2.422],m.silver);
 box([.085,.023,.022],[0,.83,-2.423],m.silver);

 // Separate trunk, dark lip spoiler, wraparound red lamps and Si trim.
 const lip=box([1.64,.035,.17],[0,1.025,2.17],m.black);lip.rotation.x=-.04;
 for(const side of [-1,1]){
  panel([
   [side*.18,.92,2.432],[side*.76,.92,2.432],
   [side*.78,.83,2.432],[side*.19,.83,2.432]
  ],m.red);
  panel([
   [side*.24,.86,2.438],[side*.67,.86,2.438],
   [side*.67,.845,2.438],[side*.24,.845,2.438]
  ],m.glass);
  box([.035,.075,.18],[side*.82,.865,2.30],m.red);
  const tip=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.10,12),m.silver);
  tip.rotation.x=Math.PI/2;tip.position.set(side*.55,.40,2.39);parent.add(tip);
 }
 box([.55,.19,.035],[0,.66,2.42],m.silver);
 box([1.42,.11,.06],[0,.47,2.37],m.grille);
 const badge=box([.12,.055,.027],[0,.91,2.42],m.silver);
 badge.rotation.z=.03;

 const wheels=[];
 for(const side of [-1,1])for(const z of [-1.47,1.47]){
  const arch=[];
  for(let i=0;i<=14;i++){
   const a=Math.PI*i/14;
   arch.push(new THREE.Vector3(side*.963,.47+Math.sin(a)*.45,z-Math.cos(a)*.47));
  }
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arch),20,.012,5,false),m.seam);
  const pivot=new THREE.Group();pivot.position.set(side*.95,.46,z);parent.add(pivot);
  const spin=new THREE.Group();pivot.add(spin);
  const tyre=new THREE.Mesh(new THREE.CylinderGeometry(.39,.39,.25,24),m.black);tyre.rotation.z=Math.PI/2;spin.add(tyre);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.265,.265,.26,20),m.wheel);hub.rotation.z=Math.PI/2;spin.add(hub);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.26,.016,6,22),m.grille);rim.rotation.y=Math.PI/2;rim.position.x=side*.138;spin.add(rim);
  for(let i=0;i<5;i++){
   const a=i*Math.PI*2/5;
   const spoke=new THREE.Mesh(new THREE.BoxGeometry(.025,.047,.23),m.black);
   spoke.position.set(side*.135,Math.sin(a)*.13,Math.cos(a)*.13);spoke.rotation.x=a;spin.add(spoke);
  }
  const center=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.27,12),m.silver);center.rotation.z=Math.PI/2;spin.add(center);
  wheels.push({pivot,tyre:spin,front:z<0});
 }
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(2.2,5),m.shadow);
 shadow.rotation.x=-Math.PI/2;shadow.position.y=.015;parent.add(shadow);
 return wheels;
}
