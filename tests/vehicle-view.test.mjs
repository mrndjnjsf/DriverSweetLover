import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import { createVehicleView, VEHICLE_ART } from '../src/presentation/vehicle-view.js';

const materials = root => {
  const result = new Set();
  root.traverse(node => { if (node.material) result.add(node.material); });
  return result;
};

test('vehicle instances own independent materials and replacement releases old resources', () => {
  for (const id of Object.keys(VEHICLE_ART)) {
    const a = createVehicleView(THREE), b = createVehicleView(THREE);
    a.setVehicle(id); b.setVehicle(id);
    const owned = materials(a.root), other = materials(b.root);
    assert.ok(owned.size > 0);
    assert.ok([...owned].every(material => !other.has(material)));
    let released = 0;
    for (const material of owned) material.addEventListener('dispose', () => released++);
    a.setVehicle(id);
    assert.equal(released, owned.size);
    assert.ok([...materials(a.root)].every(material => !owned.has(material)));
    a.dispose(); b.dispose();
    assert.equal(a.root.children.length, 0);
  }
});

test('replacement art consumes the same immutable driving snapshot', () => {
  const wheel = { pivot: new THREE.Group(), tyre: new THREE.Group(), front: true };
  const view = createVehicleView(THREE, { custom: { paint: 0xffffff, build: () => [wheel] } });
  view.setVehicle('custom');
  const snapshot = Object.freeze({ x: 2, z: 3, heading: .5, speed: 10, steer: .5, shake: 0, timeMs: 100, failing: false });
  view.update(snapshot, .1);
  assert.deepEqual(view.root.position.toArray(), [2, 0, 3]);
  assert.equal(view.root.rotation.y, .5);
  assert.equal(wheel.pivot.rotation.y, -.2);
  assert.equal(wheel.tyre.rotation.x, 1 / .38);
  assert.throws(() => view.setVehicle('missing'), /Missing vehicle art/);
  view.dispose();
});
