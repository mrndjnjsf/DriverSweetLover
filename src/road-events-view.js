// Small reusable models keep encounters visible without adding per-frame meshes.
export function createRoadEventView(scene, THREE, { maxEvents = 3 } = {}) {
 if (!Number.isInteger(maxEvents) || maxEvents < 1 || maxEvents > 12) {
  throw new RangeError('Road event view capacity must be 1–12');
 }
 const group = new THREE.Group();
 group.name = 'Road events';
 scene.add(group);
 const geometries = [];
 const materials = [];
 const box = (w, h, d) => {
  const geometry = new THREE.BoxGeometry(w, h, d);
  geometries.push(geometry);
  return geometry;
 };
 const ball = radius => {
  const geometry = new THREE.SphereGeometry(radius, 8, 6);
  geometries.push(geometry);
  return geometry;
 };
 const cone = (r, h) => {
  const geometry = new THREE.ConeGeometry(r, h, 8);
  geometries.push(geometry);
  return geometry;
 };
 const mat = (color, extra = {}) => {
  const surface = new THREE.MeshStandardMaterial({ color, roughness: .72, ...extra });
  materials.push(surface);
  return surface;
 };
 const asphalt = mat(0x333d43);
 const windowMat = mat(0x506675, { metalness: .2, roughness: .3 });
 const tire = mat(0x24292d);
 const amber = mat(0xffb53a, { emissive: 0xe87815, emissiveIntensity: .85 });
 const orange = mat(0xef642c);
 const white = mat(0xf7e5c1);
 const brown = mat(0x956542);
 const darkBrown = mat(0x47362e);
 const blue = mat(0x528ca5);
 const red = mat(0xc45e47);
 const skin = mat(0xc99372);
 const shared = {
  carBody: box(1.9, .52, 4.1), carCabin: box(1.52, .6, 2),
  carWheel: box(.28, .67, .7), lamp: box(.38, .16, .08),
  barrier: box(3.3, .9, .22), stripe: box(.6, .15, .24),
  rubble: box(.75, .4, .68), bentPanel: box(1.35, .16, .75),
  cone: cone(.34, .9), body: box(.7, .43, 1.13),
  head: ball(.28), leg: box(.13, .48, .13), smallBody: box(.43, .64, .24),
  smallHead: ball(.23), ball: ball(.18)
 };
 function part(parent, geometry, surface, x, y, z) {
  const mesh = new THREE.Mesh(geometry, surface);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
 }
 function stalled(parent) {
  part(parent, shared.carBody, red, 0, .65, 0);
  part(parent, shared.carCabin, windowMat, 0, 1.2, .12);
  for (const side of [-1, 1]) for (const z of [-1.28, 1.28]) {
   part(parent, shared.carWheel, tire, side * .97, .38, z);
  }
  const hazardLamps = [];
  for (const side of [-1, 1]) for (const z of [-2.07, 2.07]) {
   hazardLamps.push(part(parent, shared.lamp, amber, side * .59, .79, z));
  }
  return hazardLamps;
 }
 function construction(parent) {
  part(parent, shared.barrier, orange, 0, .8, 0);
  for (const x of [-1, 0, 1]) part(parent, shared.stripe, white, x, .82, -.15);
  for (const x of [-1.35, 1.35]) {
   part(parent, shared.cone, orange, x, .47, -1.25);
   part(parent, shared.cone, orange, x, .47, 1.25);
  }
  return [part(parent, shared.ball, amber, 0, 1.55, 0)];
 }
 function debris(parent) {
  const chunks = [[-.55, -.33, .45], [.42, .48, -.28], [-.23, .9, -.48]];
  for (const [x, z, angle] of chunks) {
   const chunk = part(parent, shared.rubble, tire, x, .23, z);
   chunk.rotation.y = angle;
  }
  const panel = part(parent, shared.bentPanel, asphalt, .28, .19, -.1);
  panel.rotation.y = -.45;
  part(parent, shared.cone, orange, -1.35, .47, -1.25);
  return [part(parent, shared.ball, amber, -1.35, 1.06, -1.25)];
 }
 function dog(parent) {
  part(parent, shared.body, brown, 0, .6, 0);
  part(parent, shared.head, darkBrown, 0, .76, -.68);
  for (const x of [-.24, .24]) for (const z of [-.38, .38]) {
   part(parent, shared.leg, darkBrown, x, .27, z);
  }
  return [];
 }
 function children(parent) {
  for (const [x, z, shirt] of [[-.56, -.33, blue], [.56, .32, red]]) {
   part(parent, shared.smallBody, shirt, x, .8, z);
   part(parent, shared.smallHead, skin, x, 1.31, z);
   for (const side of [-1, 1]) part(parent, shared.leg, tire, x + side * .13, .29, z);
  }
  part(parent, shared.ball, orange, 0, .2, 0);
  return [];
 }
 const models = Array.from({ length: maxEvents }, () => {
  const root = new THREE.Group();
  root.visible = false;
  group.add(root);
  const variants = {};
  const lamps = {};
  for (const type of ['stalled-car', 'construction', 'debris', 'dog', 'children']) {
   const variant = new THREE.Group();
   variant.visible = false;
   root.add(variant);
   variants[type] = variant;
   lamps[type] = type === 'stalled-car' ? stalled(variant)
    : type === 'construction' ? construction(variant)
    : type === 'debris' ? debris(variant)
    : type === 'dog' ? dog(variant) : children(variant);
  }
  return { root, variants, lamps, type: null };
 });
 return {
  group,
  update(events, map, timeSeconds, playerX, playerZ) {
   const range = (map?.blockSize ?? 64) * 4.5;
   for (let index = 0; index < models.length; index++) {
    const slot = models[index], event = events?.[index];
    const visible = event && Number.isFinite(event.x) && Number.isFinite(event.z)
     && Math.hypot(event.x - playerX, event.z - playerZ) < range;
    slot.root.visible = Boolean(visible);
    if (!visible) continue;
    slot.root.position.set(event.x, 0, event.z);
    slot.root.rotation.y = Number.isFinite(event.heading) ? event.heading : 0;
    if (slot.type !== event.type) {
     for (const [type, variant] of Object.entries(slot.variants)) variant.visible = type === event.type;
     slot.type = event.type;
    }
    const pulse = Math.floor((Number.isFinite(timeSeconds) ? timeSeconds : 0) * 2) % 2 === 0;
    for (const lamp of slot.lamps[event.type] ?? []) lamp.visible = pulse;
    if (event.type === 'dog') slot.variants.dog.position.y = Math.sin(timeSeconds * 5) * .025;
    if (event.type === 'children') slot.variants.children.rotation.y = Math.sin(timeSeconds * 2) * .08;
   }
  },
  dispose() {
   scene.remove(group);
   for (const geometry of geometries) geometry.dispose();
   for (const surface of materials) surface.dispose();
  }
 };
}
