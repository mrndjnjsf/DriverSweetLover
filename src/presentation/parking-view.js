import { disposeModel } from '../scene-resources.js';

export function createParkingView(THREE, scene) {
  const group = new THREE.Group(); scene.add(group);
  let entries = [];
  function build(sites) {
    disposeModel(group); entries = [];
    for (const site of sites) {
      const root = new THREE.Group(); root.position.set(site.x, 0, site.z); root.rotation.y = site.heading; group.add(root);
      const line = new THREE.MeshBasicMaterial({ color: site.service === 'bathroom' ? 0x69d8d0 : 0xffd36a });
      const asphalt = new THREE.MeshStandardMaterial({ color: 0x3e4b4c, roughness: .95 });
      function box(parent, w, h, d, x, y, z, material) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
      }
      box(root, site.layout === 'lot' ? 12 : 3.8, .04, 22, 0, .025, 0, asphalt);
      const { halfWidth: w, halfLength: l } = site.bay;
      for (const sign of [-1, 1]) {
        box(root, .1, .025, l * 2, sign * w, .065, 0, line);
        box(root, w * 2, .025, .1, 0, .065, sign * l, line);
      }
      box(root, .15, 2.4, .15, site.layout === 'lot' ? 5.6 : 2.2, 1.2, -8, line);
      box(root, 1.3, .9, .12, site.layout === 'lot' ? 5.6 : 2.2, 2.4, -8, line);
      for (const car of site.parkedCars) {
        const parked = new THREE.Group(); parked.position.set(car.x, 0, car.z); parked.rotation.y = car.heading; group.add(parked);
        const paint = new THREE.MeshStandardMaterial({ color: car.id.endsWith('0') ? 0x788f9c : 0xac7860, roughness: .65 });
        box(parked, 1.9, .7, 4.5, 0, .6, 0, paint);
        box(parked, 1.65, .65, 2.4, 0, 1.2, 0, new THREE.MeshStandardMaterial({ color: 0x24393e }));
        const rubber = new THREE.MeshStandardMaterial({ color: 0x202323 });
        for (const x of [-.92, .92]) for (const z of [-1.45, 1.45]) box(parked, .2, .55, .6, x, .3, z, rubber);
      }
      entries.push({ site, root, line });
    }
  }
  return { group, build, update(parking, x, z) {
    // A handful of static fixtures; all assets allocated only when the map changes.
    for (const { site, line } of entries) line.color.setHex(parking.siteId === site.id && parking.ready ? 0x9bf283 : site.service === 'bathroom' ? 0x69d8d0 : 0xffd36a);
    group.visible = entries.some(({site}) => Math.hypot(site.x-x,site.z-z) < 350);
  } };
}
