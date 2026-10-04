import { buildEclipse } from '../eclipse-model.js';
import { buildCivic } from '../civic-model.js';
import { buildMustang } from '../mustang-model.js';
import { disposeModel } from '../scene-resources.js';
import { buildGenericCar } from '../generic-car-model.js';
import { APPEARANCES, BODY_FAMILIES } from '../config/appearance.js';

// Presentation-only registry. Builders own their materials and return wheel rigs.
// A future GLB loader should adapt to this contract, not change the simulation.
export const VEHICLE_ART = Object.freeze({
  mustang: Object.freeze({ build: buildMustang, paint: 0x777b76 }),
  eclipse: Object.freeze({ build: buildEclipse, paint: 0xd8642f }),
  civic: Object.freeze({ build: buildCivic, paint: 0xe3e7e3 }),
});

export function createVehicleView(THREE, registry = VEHICLE_ART) {
  const root = new THREE.Group();
  let wheels = [];
  return {
    root,
    setVehicle(id, {appearance='original',loadTexture=true}={}) {
      const asset = registry[id];
      if (!asset) throw new Error(`Missing vehicle art: ${id}`);
      const style=APPEARANCES[appearance];
      if(!style)throw new Error('Unknown appearance');
      disposeModel(root);
      wheels = style.generic?buildGenericCar(THREE,root,asset.paint,{bodyFamily:BODY_FAMILIES[id],skin:style.skin,loadTexture}):asset.build(THREE, root, asset.paint);
    },
    // Scalars in metres, seconds, radians. Never mutate game state here.
    update({ x, z, heading, speed, steer, shake, timeMs, failing }, dt) {
      root.position.set(x, 0, z);
      root.rotation.y = heading;
      root.rotation.x = Math.sin(timeMs * .033) * shake * .08;
      root.rotation.z = Math.sin(timeMs * .027) * shake * .13;
      for (const wheel of wheels) {
        wheel.tyre.rotation.x += speed * dt / .38;
        wheel.pivot.rotation.y = wheel.front ? -steer * (failing ? .65 : .4) : 0;
      }
    },
    dispose() { disposeModel(root); wheels = []; },
  };
}
