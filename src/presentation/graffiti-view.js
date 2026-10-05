import { gridPoint } from '../grid-map.js';
import { graffitiLocation } from '../reset-access.js';
import { SUPPORT } from '../config/support.js';

export function createGraffitiView(THREE, scene) {
  const group = new THREE.Group();
  group.name = 'Supporter graffiti wall';
  const wallGeometry = new THREE.BoxGeometry(8, 3.5, .3);
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x666568, roughness: 1 });
  const wall = new THREE.Mesh(wallGeometry, wallMaterial);
  wall.position.y = 1.75;
  group.add(wall);
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#666568'; ctx.fillRect(0, 0, 512, 192);
  ctx.font = 'italic bold 84px sans-serif'; ctx.textAlign = 'center';
  ctx.lineWidth = 9; ctx.strokeStyle = '#23232d'; ctx.strokeText(SUPPORT.graffitiCode, 256, 111);
  ctx.fillStyle = '#b9ee6e'; ctx.fillText(SUPPORT.graffitiCode, 256, 111);
  ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#dedad2'; ctx.fillText('KEEP THE CITY DRIVING', 256, 161);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const paintGeometry = new THREE.PlaneGeometry(7.6, 2.85);
  const paintMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  const paint = new THREE.Mesh(paintGeometry, paintMaterial); paint.position.set(0, 1.85, .16); group.add(paint);
  scene.add(group);
  return {
    set(map) { const { col, row } = graffitiLocation(map); const point = gridPoint(map, col, row); group.position.set(point.x, 0, point.z - map.roadWidth / 2 - 1); },
    dispose() { scene.remove(group); wallGeometry.dispose(); wallMaterial.dispose(); paintGeometry.dispose(); paintMaterial.dispose(); texture.dispose(); },
  };
}
