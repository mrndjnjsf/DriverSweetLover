// Only use on an owned model being removed. Shared world assets stay alive.
export function disposeModel(group) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  group.traverse(child => {
    if(child.userData){child.userData.modelDisposed=true;for(const texture of child.userData.ownedTextures||[])textures.add(texture);}
    if (child.geometry) geometries.add(child.geometry);
    for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
      if (material) materials.add(material);
    }
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
  textures.forEach(texture=>texture.dispose());
  group.clear();
}
