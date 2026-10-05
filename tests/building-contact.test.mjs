import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveBuildingContact} from '../src/building-contact.js';
import {carsOverlap} from '../src/collision.js';
import * as THREE from '../vendor/three.module.js';
import {createGridMap} from '../src/grid-map.js';
import {createGridWorld} from '../src/grid-world.js';
const wall={id:'wall',x:0,z:0,heading:0,halfWidth:8,halfLength:8};
const car=(x,z,speed=20,heading=0)=>({x,z,speed,heading});

test('walls block forward, reverse, angled and high-speed passage',()=>{
 for(const [previous,current] of [[car(0,12),car(0,9)],[car(0,-12,-10),car(0,-9,-10)],[car(-15,0,20,-Math.PI/2),car(-6,0,20,-Math.PI/2)],[car(0,100,100),car(0,-100,100)]]){
  const hit=resolveBuildingContact(previous,current,[wall]);assert.ok(hit);assert.equal(carsOverlap(hit.pose,wall),false);
  assert.equal(hit.end,current.speed<0?'rear':'front');
 }
});
test('driving beside a building remains unobstructed',()=>{
 assert.equal(resolveBuildingContact(car(12,20),car(12,-20),[wall]),null);
});
test('map edits placing a building over the car recover to a clear face',()=>{
 const hit=resolveBuildingContact(car(0,0),car(0,0),[wall]);assert.ok(hit);assert.equal(carsOverlap(hit.pose,wall),false);
});
test('bounded city collision boxes exactly match rendered buildings and rebuild with map edits',()=>{
 const map=createGridMap(),world=createGridWorld(new THREE.Scene(),THREE,map,{radius:1});
 world.update(0,0);
 const rendered=world.group.children.find(mesh=>mesh.isInstancedMesh&&mesh.castShadow);
 assert.ok(world.buildingColliders.length>0);assert.equal(world.buildingColliders.length,rendered.count);
 const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();
 for(let i=0;i<rendered.count;i++){
  rendered.getMatrixAt(i,matrix);matrix.decompose(position,rotation,scale);
  const box=world.buildingColliders[i];assert.ok(Math.abs(box.x-position.x)<1e-4);assert.ok(Math.abs(box.z-position.z)<1e-4);assert.equal(box.halfWidth,scale.x/2);assert.equal(box.halfLength,scale.z/2);
 }
 world.setMap(createGridMap({blockSize:80}));world.update(0,0);
 assert.ok(world.buildingColliders.length<=36);world.dispose();
});
