import { gridPoint, nearestRoadPoint, roadOpen } from './grid-map.js';
import { trafficSignalState } from './traffic.js';

// Traffic and roadside fixtures use fixed-size pools. Moving the city does not
// allocate new geometries or meshes as the player crosses intersections.
export function createTrafficView(scene, THREE, { maxVehicles = 12 } = {}) {
 if (!Number.isInteger(maxVehicles) || maxVehicles < 1 || maxVehicles > 32) {
  throw new RangeError('Traffic view capacity must be 1–32 vehicles');
 }

 const group = new THREE.Group();
 group.name = 'Traffic and streetlights';
 scene.add(group);
 const geometries = [];
 const materials = [];
 const box = (width, height, depth) => {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  geometries.push(geometry);
  return geometry;
 };
 const material = (color, extra = {}) => {
  const result = new THREE.MeshStandardMaterial({ color, roughness: .66, ...extra });
  materials.push(result);
  return result;
 };
 const black = material(0x252a2b);
 const glass = material(0x344b56, { metalness: .18, roughness: .2 });
 const bumper = material(0x454a49);
 const headlights = new THREE.MeshBasicMaterial({ color: 0xfff3cf });
 const taillights = new THREE.MeshBasicMaterial({ color: 0xf13526 });
 materials.push(headlights, taillights);
 const bodyGeo = box(1.86, .5, 4.16);
 const cabinGeo = box(1.52, .55, 2.04);
 const roofGeo = box(1.48, .08, 1.85);
 const bumperGeo = box(1.72, .17, .16);
 const lampGeo = box(.43, .15, .08);
 const tyreGeo = new THREE.CylinderGeometry(.38, .38, .23, 12);
 geometries.push(tyreGeo);

 function part(parent, geometry, surface, x, y, z) {
  const mesh = new THREE.Mesh(geometry, surface);
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
 }

 const cars = Array.from({ length: maxVehicles }, (_, index) => {
  const model = new THREE.Group();
  model.name = `Traffic car ${index + 1}`;
  model.visible = false;
  group.add(model);
  const paint = material(0x8aa1a7, { metalness: .13, roughness: .42 });
  part(model, bodyGeo, paint, 0, .69, 0);
  part(model, cabinGeo, glass, 0, 1.17, .13);
  part(model, roofGeo, paint, 0, 1.49, .17);
  part(model, bumperGeo, bumper, 0, .54, -2.09);
  part(model, bumperGeo, bumper, 0, .54, 2.09);
  for (const side of [-1, 1]) {
   part(model, lampGeo, headlights, side * .59, .80, -2.115);
   part(model, lampGeo, taillights, side * .59, .80, 2.115);
  }
  const wheels = [];
  for (const side of [-1, 1]) for (const z of [-1.29, 1.29]) {
   const wheel = part(model, tyreGeo, black, side * .95, .39, z);
   wheel.rotation.z = Math.PI / 2;
   wheels.push(wheel);
  }
  return { model, paint, wheels, color: null };
 });

 // Three instanced draw calls cover a five-intersection-wide neighborhood.
 // The warm emissive cap reads as a lamp without adding 25 shadow-casting lights.
 const fixtureCount = 25;
 const poleGeo = new THREE.CylinderGeometry(.065, .085, 6.1, 7);
 const armGeo = box(1.8, .08, .09);
 const glowGeo = box(.52, .13, .34);
 geometries.push(poleGeo);
 const poleMat = material(0x566064, { metalness: .28 });
 const glowMat = material(0xffdb8b, { emissive: 0xb48036, emissiveIntensity: .7 });
 const poles = new THREE.InstancedMesh(poleGeo, poleMat, fixtureCount);
 const arms = new THREE.InstancedMesh(armGeo, poleMat, fixtureCount);
 const glows = new THREE.InstancedMesh(glowGeo, glowMat, fixtureCount);
 for (const mesh of [poles, arms, glows]) {
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  group.add(mesh);
 }
 const signalCapacity = fixtureCount * 4;
 const signalPoleGeo = new THREE.CylinderGeometry(.055, .075, 5.8, 6);
 const signalArmGeo = box(1, .1, .12);
 const signalHeadGeo = box(.76, 1.25, .34);
 const signalLensGeo = box(.53, .46, .055);
 geometries.push(signalPoleGeo);
 const signalHousing = material(0x222927);
 const signalLensMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
 materials.push(signalLensMat);
 const signalPoles = new THREE.InstancedMesh(signalPoleGeo, poleMat, signalCapacity);
 const signalArms = new THREE.InstancedMesh(signalArmGeo, poleMat, signalCapacity);
 const signalHeads = new THREE.InstancedMesh(signalHeadGeo, signalHousing, signalCapacity);
 const redLenses = new THREE.InstancedMesh(signalLensGeo, signalLensMat, signalCapacity);
 const greenLenses = new THREE.InstancedMesh(signalLensGeo, signalLensMat, signalCapacity);
 signalPoles.name = 'Traffic signal poles';
 signalArms.name = 'Traffic signal arms';
 signalHeads.name = 'Traffic signal housings';
 redLenses.name = 'Traffic signal red lenses';
 greenLenses.name = 'Traffic signal green lenses';
 for (const mesh of [signalPoles, signalArms, signalHeads, redLenses, greenLenses]) {
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  group.add(mesh);
 }
 const activeRed = new THREE.Color(0xff3928);
 const darkRed = new THREE.Color(0x381915);
 const activeGreen = new THREE.Color(0x46f480);
 const darkGreen = new THREE.Color(0x123924);
 const marker = new THREE.Object3D();
 function place(mesh, index, x, y, z, angle = 0, length = 1) {
  marker.position.set(x, y, z);
  marker.rotation.set(0, angle, 0);
  marker.scale.set(length, 1, 1);
  marker.updateMatrix();
  mesh.setMatrixAt(index, marker.matrix);
 }
 let fixturesKey = '', fixturesMap = null, lastTime = null, signalSecond = null;
 let signalSpecs = [];
 function updateFixtures(map, playerX, playerZ) {
  const { col, row } = nearestRoadPoint(map, playerX, playerZ);
  const key = `${col}:${row}`;
  if (fixturesKey === key && fixturesMap === map) return;
  fixturesKey = key;
  fixturesMap = map;
  let used = 0;
  let signalUsed = 0;
  signalSpecs = [];
  signalSecond = null;
  const margin = map.roadWidth / 2 + 1.4;
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
   const c = col + dx, r = row + dy;
   if (c < 0 || r < 0 || c >= map.size - 1 || r >= map.size - 1) continue;
   const point = gridPoint(map, c, r);
   const x = point.x + margin, z = point.z - margin;
   place(poles, used, x, 3.05, z);
   place(arms, used, x - .86, 6.13, z);
   place(glows, used, x - 1.64, 6.06, z);
   used++;
   const lane = map.roadWidth * .25;
   // Heads hang above the incoming lane, making the correct signal readable
   // from the driving camera. Opposing approaches share one signal phase.
   // the cross street shows the opposite phase from the traffic model.
   for (const approach of [
    { direction: 'north', axis: 'northSouth', x: margin, z: margin, hx: lane, hz: margin, angle: 0 },
    { direction: 'south', axis: 'northSouth', x: -margin, z: -margin, hx: -lane, hz: -margin, angle: Math.PI },
    { direction: 'east', axis: 'eastWest', x: margin, z: -margin, hx: margin, hz: -lane, angle: Math.PI / 2 },
    { direction: 'west', axis: 'eastWest', x: -margin, z: margin, hx: -margin, hz: lane, angle: -Math.PI / 2 }
   ]) {
    if (!roadOpen(map, c, r, approach.direction)) continue;
    const sx = point.x + approach.x, sz = point.z + approach.z;
    const hx = point.x + approach.hx, hz = point.z + approach.hz;
    const faceX = hx + Math.sin(approach.angle) * .205;
    const faceZ = hz + Math.cos(approach.angle) * .205;
    const armLength = Math.hypot(hx - sx, hz - sz) + .1;
    place(signalPoles, signalUsed, sx, 2.9, sz);
    place(signalArms, signalUsed, (sx + hx) / 2, 5.75, (sz + hz) / 2, sx === hx ? Math.PI / 2 : 0, armLength);
    place(signalHeads, signalUsed, hx, 5.35, hz, approach.angle);
    place(redLenses, signalUsed, faceX, 5.59, faceZ, approach.angle);
    place(greenLenses, signalUsed, faceX, 5.09, faceZ, approach.angle);
    signalSpecs.push({ col: c, row: r, axis: approach.axis });
    signalUsed++;
   }
  }
  for (const mesh of [poles, arms, glows]) {
   mesh.count = used;
   mesh.instanceMatrix.needsUpdate = true;
  }
  for (const mesh of [signalPoles, signalArms, signalHeads, redLenses, greenLenses]) {
   mesh.count = signalUsed;
   mesh.instanceMatrix.needsUpdate = true;
  }
 }
 function updateSignals(now) {
  const second = Math.floor(now);
  if (second === signalSecond) return;
  signalSecond = second;
  for (let index = 0; index < signalSpecs.length; index++) {
   const spec = signalSpecs[index];
   const green = trafficSignalState(spec.col, spec.row, now)[spec.axis] === 'green';
   redLenses.setColorAt(index, green ? darkRed : activeRed);
   greenLenses.setColorAt(index, green ? activeGreen : darkGreen);
  }
  if (signalSpecs.length) {
   redLenses.instanceColor.needsUpdate = true;
   greenLenses.instanceColor.needsUpdate = true;
  }
 }

 return {
  group,
  update(vehicles, map, timeSeconds, playerX, playerZ, nightFactor = 0) {
   glowMat.emissiveIntensity = .25 + Math.max(0, Math.min(1, nightFactor)) * 2.3;
   updateFixtures(map, playerX, playerZ);
   const now = Number.isFinite(timeSeconds) ? timeSeconds : 0;
   updateSignals(now);
   const dt = lastTime === null ? 0 : Math.max(0, Math.min(.1, now - lastTime));
   lastTime = now;
   const visibleDistance = map.blockSize * 4.5;
   for (let index = 0; index < cars.length; index++) {
    const slot = cars[index], vehicle = vehicles?.[index];
    const visible = vehicle && Number.isFinite(vehicle.x) && Number.isFinite(vehicle.z)
     && Math.hypot(vehicle.x - playerX, vehicle.z - playerZ) < visibleDistance;
    slot.model.visible = Boolean(visible);
    if (!visible) continue;
    slot.model.position.set(vehicle.x, 0, vehicle.z);
    // The player car faces -Z at heading 0, so snapshots share that convention.
    slot.model.rotation.y = Number.isFinite(vehicle.heading) ? vehicle.heading : 0;
    if (slot.color !== vehicle.color) {
     slot.paint.color.set(vehicle.color ?? 0x8aa1a7);
     slot.color = vehicle.color;
    }
    const spin = (Number.isFinite(vehicle.speed) ? vehicle.speed : 0) * dt / .38;
    for (const wheel of slot.wheels) wheel.rotation.x += spin;
   }
  },
  dispose() {
   scene.remove(group);
   for (const geometry of geometries) geometry.dispose();
   for (const surface of materials) surface.dispose();
  }
 };
}
