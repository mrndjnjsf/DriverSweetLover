import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import { atlasBox } from '../src/generic-car-model.js';
import { createVehicleView } from '../src/presentation/vehicle-view.js';
import { disposeModel } from '../src/scene-resources.js';

test('generic bodies have usable atlas coordinates, four wheels, and can be swapped independently of physics',()=>{
  const geometry=atlasBox(THREE,2,.6,4.6),uv=geometry.getAttribute('uv');
  assert.equal(uv.count,24);
  for(let i=0;i<uv.count;i++){assert.ok(uv.getX(i)>=0&&uv.getX(i)<=1);assert.ok(uv.getY(i)>=0&&uv.getY(i)<=1);}
  geometry.dispose();
  for(const id of ['eclipse','civic']){
    const view=createVehicleView(THREE);
    view.setVehicle(id,{appearance:'template-solid',loadTexture:false});
    assert.equal(view.root.children.length,1);
    const materials=new Set();view.root.traverse(node=>{if(node.material)materials.add(node.material);});
    let released=0;for(const material of materials)material.addEventListener('dispose',()=>released++);
    view.setVehicle(id,{appearance:'template-race',loadTexture:false});
    assert.equal(released,materials.size);
    assert.throws(()=>view.setVehicle(id,{appearance:'unsupported'}),/Unknown appearance/);
    assert.equal(view.root.children.length,1);
    view.dispose();
  }
});

test('owned skin textures are released once and late load owners are marked disposed',()=>{
  const group=new THREE.Group(),child=new THREE.Group();group.add(child);
  let releases=0;const texture={dispose(){releases++;}};
  group.userData.ownedTextures=[texture];child.userData.ownedTextures=[texture];
  disposeModel(group);
  assert.equal(releases,1);
  assert.equal(child.userData.modelDisposed,true);
});
