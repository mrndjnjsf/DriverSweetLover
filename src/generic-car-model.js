import { BODY_UV_TILES, ROOF_UV_TILE } from './config/appearance.js';

export function atlasBox(THREE,w,h,d,roof=false) {
  const geometry=new THREE.BoxGeometry(w,h,d),uv=geometry.getAttribute('uv');
  // BoxGeometry stores four separate vertices per face; guide tiles match that order.
  for(let face=0;face<6;face++){
    const [x,y]=roof&&face===2?ROOF_UV_TILE:BODY_UV_TILES[face];
    for(let i=face*4;i<face*4+4;i++)uv.setXY(i,(x+uv.getX(i)*512)/1024,1-(y+(1-uv.getY(i))*256)/1024);
  }
  return geometry;
}

// Original generic toy-car bodies. A fixed atlas makes skins editable without code.
export function buildGenericCar(THREE,parent,color,{bodyFamily='coupe-v1',skin='solid',loadTexture=true}={}) {
  const model=new THREE.Group();parent.add(model);
  const paint=new THREE.MeshStandardMaterial({color,metalness:.2,roughness:.35});
  const glass=new THREE.MeshStandardMaterial({color:0x243d47,metalness:.2,roughness:.2});
  const rubber=new THREE.MeshStandardMaterial({color:0x1b2225}),rim=new THREE.MeshStandardMaterial({color:0xa8b5b5,metalness:.6});
  const add=(geometry,material,x,y,z,target=model)=>{const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;target.add(mesh);return mesh;};
  const sedan=bodyFamily==='sedan-v1';
  add(atlasBox(THREE,1.98,.62,4.6),paint,0,.66,0);
  add(new THREE.BoxGeometry(1.7,.65,sedan?2.5:2.05),glass,0,1.21,sedan?.05:.25);
  add(atlasBox(THREE,1.72,.09,sedan?2.5:2.05,true),paint,0,1.57,sedan?.05:.25);
  // Narrow pillars split four-door and coupe profiles without changing the physics.
  const trim=new THREE.MeshStandardMaterial({color:0x283135});
  for(const x of [-.86,.86])add(new THREE.BoxGeometry(.045,.65,.1),trim,x,1.21,sedan?.15:-.15);
  const headlights=new THREE.MeshBasicMaterial({color:0xe4f2e5}),taillights=new THREE.MeshBasicMaterial({color:0xc5463e});
  for(const x of [-.68,.68]){add(new THREE.BoxGeometry(.42,.13,.06),headlights,x,.8,-2.32);add(new THREE.BoxGeometry(.42,.13,.06),taillights,x,.8,2.32);}
  add(new THREE.BoxGeometry(1.3,.18,.05),trim,0,.51,-2.33);
  const wheels=[];
  for(const x of [-1,1])for(const z of [-1.45,1.45]){
    const pivot=new THREE.Group(),spin=new THREE.Group();pivot.position.set(x,.4,z);pivot.add(spin);model.add(pivot);
    const tyre=add(new THREE.CylinderGeometry(.38,.38,.24,14),rubber,0,0,0,spin);tyre.rotation.z=Math.PI/2;
    const hub=add(new THREE.CylinderGeometry(.23,.23,.26,10),rim,0,0,0,spin);hub.rotation.z=Math.PI/2;
    wheels.push({pivot,tyre:spin,front:z<0});
  }
  if(loadTexture){
    const texture=new THREE.TextureLoader().load(`assets/skins/${bodyFamily}-${skin}.svg`,loaded=>{
      if(model.userData.modelDisposed){loaded.dispose();return;}
      loaded.colorSpace=THREE.SRGBColorSpace;paint.color.setHex(0xffffff);paint.map=loaded;paint.needsUpdate=true;
    },undefined,()=>{model.userData.skinFailed=true;});
    model.userData.ownedTextures=[texture];
  }
  return wheels;
}
