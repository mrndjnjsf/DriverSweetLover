import { tachPercent } from './tachometer.js';

// Owns display only. Shifting, stall feedback, and save state stay in main.
// Cache nodes once and write only changed values, including normalized styles.
export function createDrivingHud(document) {
  const nodes = new Map(), values = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, document.getElementById(id));
    return nodes.get(id);
  };
  const write = (id, property, value) => {
    const key = id + ':' + property;
    value = String(value);
    if (values.get(key) === value) return;
    const element = node(id);
    if (property.startsWith('style.')) element.style[property.slice(6)] = value;
    else element[property] = value;
    values.set(key, value);
  };
  const cells = [...document.querySelectorAll('.shift-grid span')];
  const panel = document.querySelector('.dashboard');
  let lastGear, lastSlip, lastAutomatic;
  return function render({ state, car, fuelLiters, bitePoint, clutchMode, knobX, knobY }) {
    const automatic=car.transmission==='automatic';
    if(lastAutomatic!==automatic){panel.classList.toggle('automatic',automatic);lastAutomatic=automatic;}
    write('speed', 'textContent', Math.round(Math.abs(state.speed) * 2.23694));
    write('gear', 'textContent', automatic?(state.autoRange==='R'?'R':state.autoRange==='N'?'N':`D${state.gear||1}`):state.gear === 0 ? 'N' : state.gear === -1 ? 'R' : state.gear);
    write('rpm', 'textContent', Math.round(state.rpm / 10) * 10);
    write('rpm-fill', 'style.width', `${tachPercent(state.rpm)}%`);
    write('rpm-fill', 'style.background', state.rpm > car.redline * .88 ? '#ff8d62' : '#a6f5c4');
    const bogging = !automatic && state.running && state.gear !== 0 && state.clutch < .65 && state.rpm < 1050;
    write('engine-state', 'textContent', state.blown ? 'ENGINE BLOWN' : fuelLiters <= 0 ? 'OUT OF FUEL' : !state.running ? 'STALLED' : bogging ? 'BOGGING' : state.clutchSlipping ? 'CLUTCH SLIP' : 'ENGINE ON');
    write('engine-state', 'style.color', state.blown || !state.running ? '#ff805e' : bogging || state.clutchSlipping ? '#efbd60' : '#a6f5c4');
    write('power-label', 'textContent', automatic?'OLD V6 · 4-SPEED AUTO':car.turbo ? `TURBO SPOOL ${Math.round(state.boost * 100)}%` : 'V6 · DIRECT RESPONSE');
    write('power-fill', 'style.width', `${Math.round((car.turbo ? state.boost : state.throttle) * 100)}%`);
    write('power-fill', 'style.background', car.turbo ? '#648cb4' : '#df894b');
    write('clutch-fill', 'style.width', `${state.clutch * 100}%`);
    write('clutch-value', 'textContent', `${Math.round(state.clutch * 100)}%`);
    write('gas-fill', 'style.width', `${state.throttle * 100}%`);
    const bitePercent = Math.round(bitePoint * 100);
    write('clutch-bite', 'style.left', `${bitePercent}%`);
    write('clutch-bite', 'title', `Bite point ${bitePercent}% · less shift wear past this point · full press gives a clean shift`);
    write('clutch-mode', 'textContent', clutchMode);
    if (lastGear !== state.gear) {
      cells.forEach(cell => cell.classList.toggle('active', Number(cell.dataset.gear) === state.gear));
      node('shift-neutral').classList.toggle('active', state.gear === 0);
      lastGear = state.gear;
    }
    if (lastSlip !== state.clutchSlipping) {
      panel.classList.toggle('slipping', state.clutchSlipping);
      lastSlip = state.clutchSlipping;
    }
    write('shift-neutral', 'textContent', automatic?'AUTO · B REVERSE':state.gear === 0 ? 'NEUTRAL RAIL' : state.gear === -1 ? 'REVERSE' : 'GEAR ' + state.gear);
    write('shift-knob', 'style.left', `${(knobX + 1) * 33.333 + 16.667}%`);
    write('shift-knob', 'style.top', `${33 + knobY * 22}px`);
  };
}
