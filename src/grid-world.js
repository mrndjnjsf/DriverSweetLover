import { districtAt, gridPoint, nearestRoadPoint, roadOpen } from './grid-map.js';
import { createParkingSites, parkingReservedAt } from './parking.js';
import { cityProjectPoint } from './city-projects.js';

const PALETTE = {
 residential: [0xb8c8bc, 0xd4bdb0, 0xaebbb8],
 commercial: [0x9eb8c3, 0xc9c2b6, 0x91a5ad],
 industrial: [0x9baba9, 0xb9aaa0, 0x8c9a9e],
 downtown: [0x8da6b0, 0x9badae, 0xb5b4ac],
 suburban: [0xc8bba7, 0xb8c9b4, 0xd2c2b6]
};
const HEIGHT = { residential: 13, commercial: 18, industrial: 12, downtown: 32, suburban: 9 };
const hash = (x, y, salt = 0) => {
 let n = Math.imul(x + 271, 374761393) + Math.imul(y + 127, 668265263) + Math.imul(salt + 17, 1442695041);
 n = Math.imul(n ^ n >>> 13, 1274126177);
 return (n ^ n >>> 16) >>> 0;
};

// One bounded pool is moved to the intersections near the car. Geometry stays
// at literal map coordinates, so speed, routing, and visible travel agree.
export function createGridWorld(scene, THREE, initialMap, { radius = 4 } = {}) {
 if (!Number.isInteger(radius) || radius < 1 || radius > 8) throw new RangeError('World radius must be 1–8 blocks');
 let map = initialMap;
 let parkingSites = createParkingSites(map);
 let cityEffects={park:false,skyline:false};
 const group = new THREE.Group();
 group.name = 'Grid city';
 scene.add(group);
 const count = (radius * 2 + 1) ** 2;
 const geometry = new THREE.BoxGeometry(1, 1, 1);
 const material = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .91, ...extra });
 const resources = [material(0x40474a), material(0xb5b4a7), material(0xe1ddd0), material(0xe7b94d), material(0xffffff), material(0xffffff, { roughness: .72 })];
 const [asphalt, sidewalk, curb, yellow, white, buildingsMaterial] = resources;
 const pool = (maximum, mat) => {
  const mesh = new THREE.InstancedMesh(geometry, mat, maximum);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.castShadow = mat === buildingsMaterial;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
 };
 const intersections = pool(count, asphalt);
 const eastRoads = pool(count, asphalt);
 const southRoads = pool(count, asphalt);
 const blocks = pool(count, sidewalk);
 const curbEdges = pool(count * 4, curb);
 const centerLines = pool(count * 2, yellow);
 const laneMarks = pool(count * 24, white);
 const buildings = pool(count * 4, buildingsMaterial);
 const meshes = [intersections, eastRoads, southRoads, blocks, curbEdges, centerLines, laneMarks, buildings];
 const used = new Map(meshes.map(mesh => [mesh, 0]));
 const marker = new THREE.Object3D();
 const tint = new THREE.Color();
 function add(mesh, x, y, z, width, height, depth, color) {
  const index = used.get(mesh);
  if (index >= mesh.instanceMatrix.count) return;
  marker.position.set(x, y, z);
  marker.scale.set(width, height, depth);
  marker.updateMatrix();
  mesh.setMatrixAt(index, marker.matrix);
  if (color !== undefined) mesh.setColorAt(index, tint.setHex(color));
  used.set(mesh, index + 1);
 }
 const ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material(0x879980));
 ground.rotation.x = -Math.PI / 2;
 ground.position.y = -.13;
 ground.receiveShadow = true;
 group.add(ground);
 let currentKey = '';
 function rebuild(centerCol, centerRow) {
  for (const mesh of meshes) used.set(mesh, 0);
  const width = map.roadWidth, length = map.blockSize, gap = length - width;
  const firstCol = Math.max(0, centerCol - radius), lastCol = Math.min(map.size - 1, centerCol + radius);
  const firstRow = Math.max(0, centerRow - radius), lastRow = Math.min(map.size - 1, centerRow + radius);
  for (let row = firstRow; row <= lastRow; row++) for (let col = firstCol; col <= lastCol; col++) {
   const { x, z } = gridPoint(map, col, row);
   add(intersections, x, .015, z, width, .08, width);
   if (roadOpen(map, col, row, 'east')) {
    add(eastRoads, x + length / 2, .014, z, gap, .07, width);
    add(centerLines, x + length / 2, .058, z, gap, .012, .13);
    for (let i = 0; i < 6; i++) for (const side of [-1, 1]) add(laneMarks, x + width / 2 + 2.5 + i * (gap - 5) / 6, .062, z + side * width / 4, 3.1, .013, .11);
    if(!parkingReservedAt(parkingSites,x+length/2,z+width/2))add(curbEdges, x + length / 2, .13, z + width / 2 + .13, gap, .26, .26);
    if(!parkingReservedAt(parkingSites,x+length/2,z-width/2))add(curbEdges, x + length / 2, .13, z - width / 2 - .13, gap, .26, .26);
   }
   if (roadOpen(map, col, row, 'south')) {
    add(southRoads, x, .014, z - length / 2, width, .07, gap);
    add(centerLines, x, .058, z - length / 2, .13, .012, gap);
    for (let i = 0; i < 6; i++) for (const side of [-1, 1]) add(laneMarks, x + side * width / 4, .062, z - width / 2 - 2.5 - i * (gap - 5) / 6, .11, .013, 3.1);
    if(!parkingReservedAt(parkingSites,x+width/2,z-length/2))add(curbEdges, x + width / 2 + .13, .13, z - length / 2, .26, .26, gap);
    if(!parkingReservedAt(parkingSites,x-width/2,z-length/2))add(curbEdges, x - width / 2 - .13, .13, z - length / 2, .26, .26, gap);
   }
   if (col >= map.size - 1 || row >= map.size - 1) continue;
   const district = districtAt(map, col, row);
   const reservedBlock=parkingSites.some(site=>site.x>x+width/2&&site.x<x+length-width/2&&site.z<z-width/2&&site.z>z-length+width/2);
   const project=cityProjectPoint(map),parkBlock=Math.abs(project.x-(x+length/2))<1&&Math.abs(project.z-(z-length/2))<1;
   if(!reservedBlock&&!parkBlock)add(blocks, x + length / 2, .08, z - length / 2, gap - 1.4, .15, gap - 1.4);
   const palette = PALETTE[district];
   for (let slot = 0; slot < 4; slot++) {
    const offsetX = slot % 2 ? .73 : .27;
    const offsetZ = slot > 1 ? .73 : .27;
    const id = hash(col, row, slot + map.seed);
    const height = HEIGHT[district] * (.65 + (id % 70) / 100)*(cityEffects.skyline&&Math.hypot(project.x-x,project.z-z)<length*2?1.35:1);
    const footprint = Math.min(18, length * .25);
    const bx = x + length * offsetX, bz = z - length * offsetZ;
    if(parkingReservedAt(parkingSites,bx,bz,footprint/2))continue;
    if(Math.abs(project.x-bx)<11+footprint/2&&Math.abs(project.z-bz)<11+footprint/2)continue;
    add(buildings, bx, height / 2 + .2, bz, footprint, height, footprint, palette[id % palette.length]);
   }
  }
  for (const mesh of meshes) {
   mesh.count = used.get(mesh);
   mesh.instanceMatrix.needsUpdate = true;
   if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
  const { x, z } = gridPoint(map, centerCol, centerRow);
  ground.position.set(x, -.13, z);
  ground.scale.set((radius * 2 + 3) * length, (radius * 2 + 3) * length, 1);
 }
 return {
  group,
  update(x, z) {
   const { col, row } = nearestRoadPoint(map, x, z);
   const key = `${col}:${row}`;
   if (key !== currentKey) { currentKey = key; rebuild(col, row); }
  },
  setMap(nextMap) { map = nextMap; parkingSites=createParkingSites(map); currentKey = ''; },
  setCityEffects(next) { if(cityEffects.skyline!==next.skyline){cityEffects=next;currentKey='';}else cityEffects=next; },
  dispose() {
   scene.remove(group);
   geometry.dispose();
   ground.geometry.dispose();
   ground.material.dispose();
   for (const resource of resources) resource.dispose();
  }
 };
}
