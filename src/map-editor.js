import { createGridMap, districtAt, DISTRICTS, exportGridMap, importGridMap, roadOpen, setDistrict, setLocation, setRoad } from './grid-map.js';

const COLORS = { residential: '#a8c7ab', commercial: '#83a9bd', industrial: '#a99b91', downtown: '#8b8fb6', suburban: '#caba99' };
const ICONS = { spawn: 'S', garage: 'G', shop: '$', job: 'J', fuel: 'F' };
export const MAP_STORAGE_KEY = 'driver-sweet-lover-grid-map-v1';

export function createMapEditor({ map, storage = window.localStorage, onChange = () => {}, onClose = () => {} }) {
 let current = map;
 let zoom = 1;
 let mode = 'road';
 const past = [], future = [];
 const root = document.createElement('section');
 root.className = 'map-editor';
 root.setAttribute('role', 'dialog');
 root.setAttribute('aria-modal', 'true');
 root.setAttribute('aria-label', 'City map editor');
 root.hidden = true;
 root.innerHTML = `<div class="map-editor-panel"><header><div><strong>CITY MAP EDITOR</strong><small>50 × 50 intersections · select a tool, then click the map</small></div><button type="button" data-action="close" aria-label="Close map editor">×</button></header><div class="map-editor-tools"><label>Tool <select data-field="mode"><option value="road">Road</option><option value="district">District</option><option value="location">Location</option></select></label><label>District <select data-field="district"></select></label><label>Location <select data-field="location"><option value="spawn">Start</option><option value="garage">Garage</option><option value="shop">Shop</option><option value="job">Job</option><option value="fuel">Gas station</option></select></label><label>Zoom <input data-field="zoom" type="range" min="1" max="4" step="1" value="1"></label><button type="button" data-action="undo">Undo</button><button type="button" data-action="redo">Redo</button></div><div class="map-editor-scroll"><canvas aria-label="Editable overhead city map"></canvas></div><div class="map-editor-actions"><span class="map-editor-message" role="status"></span><button type="button" data-action="regenerate">New seed</button><button type="button" data-action="save">Save here</button><button type="button" data-action="load">Load saved</button><button type="button" data-action="export">Export JSON</button><button type="button" data-action="import">Import JSON</button><input data-field="file" type="file" accept=".json,application/json" hidden></div></div>`;
 const get = selector => root.querySelector(selector);
 const canvas = get('canvas'), context = canvas.getContext('2d');
 const modeField = get('[data-field="mode"]');
 const districtField = get('[data-field="district"]');
 const locationField = get('[data-field="location"]');
 const zoomField = get('[data-field="zoom"]');
 const fileField = get('[data-field="file"]');
 const message = text => { get('.map-editor-message').textContent = text; };
 for (const district of DISTRICTS) {
  const option = document.createElement('option');
  option.value = district;
  option.textContent = district[0].toUpperCase() + district.slice(1);
  districtField.append(option);
 }
 function render() {
  const unit = 12 * zoom;
  const extent = current.size * unit;
  canvas.width = extent;
  canvas.height = extent;
  canvas.style.width = `${extent}px`;
  canvas.style.height = `${extent}px`;
  context.fillStyle = '#68816d';
  context.fillRect(0, 0, extent, extent);
  for (let row = 0; row < current.size - 1; row++) for (let col = 0; col < current.size - 1; col++) {
   context.fillStyle = COLORS[districtAt(current, col, row)];
   context.fillRect((col + .5) * unit, (row + .5) * unit, unit, unit);
  }
  context.lineWidth = Math.max(2, unit * .33);
  context.strokeStyle = '#475157';
  context.beginPath();
  for (let row = 0; row < current.size; row++) for (let col = 0; col < current.size; col++) {
   const x = (col + .5) * unit, y = (row + .5) * unit;
   if (roadOpen(current, col, row, 'east')) { context.moveTo(x, y); context.lineTo(x + unit, y); }
   if (roadOpen(current, col, row, 'south')) { context.moveTo(x, y); context.lineTo(x, y + unit); }
  }
  context.stroke();
  context.fillStyle = '#e7e3d5';
  for (let row = 0; row < current.size; row++) for (let col = 0; col < current.size; col++) context.fillRect((col + .5) * unit - 1, (row + .5) * unit - 1, 2, 2);
  context.font = `bold ${Math.max(9, unit * .65)}px sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  for (const location of current.locations) {
   context.beginPath();
   context.arc((location.col + .5) * unit, (location.row + .5) * unit, Math.max(7, unit * .43), 0, Math.PI * 2);
   context.fillStyle = '#17262d';
   context.fill();
   context.fillStyle = '#ffffff';
   context.fillText(ICONS[location.kind], (location.col + .5) * unit, (location.row + .5) * unit + .5);
  }
  get('[data-action="undo"]').disabled = past.length === 0;
  get('[data-action="redo"]').disabled = future.length === 0;
 }
 function commit(next, announcement) {
  if (next === current) return;
  past.push(current);
  if (past.length > 30) past.shift();
  future.length = 0;
  current = next;
  onChange(current);
  render();
  message(announcement);
 }
 function editorClick(event) {
  const rectangle = canvas.getBoundingClientRect();
  const unit = 12 * zoom;
  const fx = (event.clientX - rectangle.left) / unit - .5;
  const fy = (event.clientY - rectangle.top) / unit - .5;
  try {
   if (mode === 'district') {
    const col = Math.floor(fx), row = Math.floor(fy);
    commit(setDistrict(current, col, row, districtField.value), `${districtField.value} block set`);
   } else if (mode === 'location') {
    const col = Math.round(fx), row = Math.round(fy), kind = locationField.value;
    const id = current.locations.find(location => location.kind === kind)?.id || kind;
    commit(setLocation(current, id, kind, col, row), `${kind} moved to ${col}, ${row}`);
   } else {
    const hCol = Math.floor(fx), hRow = Math.round(fy);
    const vCol = Math.round(fx), vRow = Math.floor(fy);
    const horizontalDistance = Math.hypot(fx - hCol - .5, fy - hRow);
    const verticalDistance = Math.hypot(fx - vCol, fy - vRow - .5);
    const direction = horizontalDistance < verticalDistance ? 'east' : 'south';
    const col = direction === 'east' ? hCol : vCol, row = direction === 'east' ? hRow : vRow;
    const open = !roadOpen(current, col, row, direction);
    commit(setRoad(current, col, row, direction, open), `${open ? 'Opened' : 'Closed'} ${direction} road`);
   }
  } catch (error) { message(error.message); }
 }
 function undo() {
  if (!past.length) return;
  future.push(current);
  current = past.pop();
  onChange(current);
  render();
  message('Undo');
 }
 function redo() {
  if (!future.length) return;
  past.push(current);
  current = future.pop();
  onChange(current);
  render();
  message('Redo');
 }
 function close() { root.hidden = true; onClose(); }
 function clickAction(event) {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  try {
   if (action === 'close') close();
   else if (action === 'undo') undo();
   else if (action === 'redo') redo();
   else if (action === 'regenerate') commit(createGridMap({ size: current.size, blockSize: current.blockSize, roadWidth: current.roadWidth, seed: (current.seed + 1) >>> 0 }), 'New city generated');
   else if (action === 'save') { storage.setItem(MAP_STORAGE_KEY, exportGridMap(current)); message('Map saved on this device'); }
   else if (action === 'load') {
    const saved = storage.getItem(MAP_STORAGE_KEY);
    if (!saved) throw new Error('No saved map found');
    const loaded = importGridMap(saved);
    if (loaded.size !== 50) throw new Error('This career needs a 50 × 50 map');
    commit(loaded, 'Saved map loaded');
   } else if (action === 'export') {
    const blob = new Blob([exportGridMap(current)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `driver-sweet-lover-map-${current.seed}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message('Map exported');
   } else if (action === 'import') fileField.click();
  } catch (error) { message(error.message); }
 }
 async function importFile() {
  const file = fileField.files?.[0];
  if (!file) return;
  try { if(file.size>250000)throw new Error('Map file is too large'); const imported = importGridMap(await file.text()); if (imported.size !== 50) throw new Error('This career needs a 50 × 50 map'); commit(imported, 'Map imported'); }
  catch (error) { message(error.message); }
  fileField.value = '';
 }
 function keydown(event) {
  if (root.hidden) return;
  if (event.key === 'Escape') close();
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); }
 }
 function modeChange() { mode = modeField.value; message(`${mode} tool selected`); }
 function zoomChange() { zoom = Number(zoomField.value); render(); }
 canvas.addEventListener('click', editorClick);
 root.addEventListener('click', clickAction);
 modeField.addEventListener('change', modeChange);
 zoomField.addEventListener('input', zoomChange);
 fileField.addEventListener('change', importFile);
 document.addEventListener('keydown', keydown);
 render();
 return {
  element: root,
  getMap: () => current,
  open() { root.hidden = false; render(); },
  close,
  setMap(next) { current = next; past.length = 0; future.length = 0; render(); },
  destroy() { document.removeEventListener('keydown', keydown); root.remove(); }
 };
}
