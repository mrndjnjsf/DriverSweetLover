// Small, pooled roadside cruisers. The logic owns positions; this module owns only visuals.
export function createPoliceView(scene, THREE) {
  const group = new THREE.Group();
  group.name = 'Police patrols';
  scene.add(group);
  const geometries = [];
  const materials = [];
  const box = (w, h, d) => {
    const geometry = new THREE.BoxGeometry(w, h, d);
    geometries.push(geometry);
    return geometry;
  };
  const surface = (color, extra = {}) => {
    const material = new THREE.MeshStandardMaterial({ color, roughness: .55, ...extra });
    materials.push(material);
    return material;
  };
  const white = surface(0xe7e8e0);
  const dark = surface(0x202932);
  const glass = surface(0x354957, { metalness: .2, roughness: .18 });
  const red = surface(0xe93635, { emissive: 0xbf1515, emissiveIntensity: .15 });
  const blue = surface(0x2677df, { emissive: 0x154da4, emissiveIntensity: .15 });
  const bodyGeometry = box(1.9, .5, 4.15);
  const doorGeometry = box(1.94, .32, 1.7);
  const cabinGeometry = box(1.55, .55, 2.12);
  const barGeometry = box(1.35, .1, .3);
  const lightGeometry = box(.6, .17, .33);
  const wheelGeometry = new THREE.CylinderGeometry(.36, .36, .23, 10);
  geometries.push(wheelGeometry);
  function add(parent, geometry, material, x, y, z) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }
  const cars = Array.from({ length: 2 }, () => {
    const model = new THREE.Group();
    model.visible = false;
    group.add(model);
    add(model, bodyGeometry, white, 0, .69, 0);
    add(model, doorGeometry, dark, 0, .8, 0);
    add(model, cabinGeometry, glass, 0, 1.17, .1);
    add(model, barGeometry, dark, 0, 1.55, 0);
    const redLight = add(model, lightGeometry, red, -.34, 1.65, 0);
    const blueLight = add(model, lightGeometry, blue, .34, 1.65, 0);
    for (const side of [-1, 1]) for (const z of [-1.25, 1.25]) {
      const wheel = add(model, wheelGeometry, dark, side * .96, .37, z);
      wheel.rotation.z = Math.PI / 2;
    }
    return { model, redLight, blueLight };
  });
  return {
    group,
    update(officers, map, timeSeconds, playerX, playerZ) {
      const flash = Math.floor((Number.isFinite(timeSeconds) ? timeSeconds : 0) * 3) % 2 === 0;
      for (let index = 0; index < cars.length; index++) {
        const slot = cars[index], officer = officers?.[index];
        const visible = officer && Number.isFinite(officer.x) && Number.isFinite(officer.z)
          && Math.hypot(officer.x - playerX, officer.z - playerZ) < map.blockSize * 4;
        slot.model.visible = Boolean(visible);
        if (!visible) continue;
        slot.model.position.set(officer.x, 0, officer.z);
        slot.model.rotation.y = Number.isFinite(officer.heading) ? officer.heading : 0;
        slot.redLight.material = flash ? red : dark;
        slot.blueLight.material = flash ? dark : blue;
      }
    },
    dispose() {
      scene.remove(group);
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
    },
  };
}
