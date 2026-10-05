// A small closed-course presentation: starting beacons, finish stripe, and a
// translucent rival ghost. Race positions and timing come from drag-race.js.
export function createDragRaceView(scene, THREE) {
  const group = new THREE.Group();
  group.name = 'Drag course';
  scene.add(group);
  const geometries = [];
  const materials = [];
  const box = (width, height, depth) => {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    geometries.push(geometry);
    return geometry;
  };
  const surface = (color, extra = {}) => {
    const material = new THREE.MeshStandardMaterial({ color, roughness: .54, ...extra });
    materials.push(material);
    return material;
  };
  const chalk = surface(0xf0ebe1, { emissive: 0x686052, emissiveIntensity: .35 });
  const violet = surface(0x9e6ad4, { emissive: 0x7240b5, emissiveIntensity: 1.5 });
  const amber = surface(0xf4b247, { emissive: 0xe48318, emissiveIntensity: 1.25 });
  const ghostBody = surface(0x7c78dc, { emissive: 0x3935af, emissiveIntensity: .42, transparent: true, opacity: .75, depthWrite: false });
  const ghostGlass = surface(0x2f3c65, { transparent: true, opacity: .72, depthWrite: false });
  const dark = surface(0x27303e);
  function add(parent, geometry, material, x, y, z) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  const start = new THREE.Group();
  const finish = new THREE.Group();
  group.add(start, finish);
  const stripe = box(11, .035, .48), pylon = box(.28, 1.7, .28), lamp = box(.52, .38, .52);
  add(start, stripe, chalk, 0, .035, 0);
  add(finish, stripe, chalk, 0, .035, 0);
  for (const sign of [-1, 1]) {
    add(start, pylon, dark, sign * 5.45, .88, 0);
    add(start, lamp, amber, sign * 5.45, 1.9, 0);
    add(finish, pylon, dark, sign * 5.45, .88, 0);
    add(finish, lamp, violet, sign * 5.45, 1.9, 0);
  }
  const ghost = new THREE.Group();
  group.add(ghost);
  add(ghost, box(1.85, .47, 3.9), ghostBody, 0, .66, 0);
  add(ghost, box(1.4, .55, 1.9), ghostGlass, 0, 1.12, .1);
  for (const side of [-1, 1]) for (const z of [-1.2, 1.2]) {
    add(ghost, box(.24, .62, .55), dark, side * .96, .35, z);
  }
  return {
    group,
    update(course, race, darkness, playerX, playerZ) {
      group.visible = Boolean(course);
      if (!group.visible) return;
      const heading = course.start.heading;
      start.position.set(course.start.x, 0, course.start.z);
      start.rotation.y = heading;
      finish.position.set(course.finish.x, 0, course.finish.z);
      finish.rotation.y = heading;
      start.visible = Math.hypot(course.start.x - playerX, course.start.z - playerZ) < 190;
      finish.visible = Math.hypot(course.finish.x - playerX, course.finish.z - playerZ) < 190;
      const racing = race && ['countdown', 'active', 'finished'].includes(race.phase);
      ghost.visible = Boolean(racing);
      if (!racing) return;
      const progress = Math.max(0, Math.min(course.distanceMeters, race.rivalProgress ?? 0));
      ghost.position.set(course.rivalStart.x + course.forward.x * progress, 0,
        course.rivalStart.z + course.forward.z * progress);
      ghost.rotation.y = heading;
    },
    dispose() {
      scene.remove(group);
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
    },
  };
}
