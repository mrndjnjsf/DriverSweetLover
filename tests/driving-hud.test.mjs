import test from 'node:test';
import assert from 'node:assert/strict';
import { createDrivingHud } from '../src/driving-hud.js';
import { createState, cars } from '../src/physics.js';

function fixture() {
  let writes = 0;
  const nodes = new Map();
  const make = () => new Proxy({
    style: new Proxy({}, {set(target, key, value) {writes++; target[key] = value; return true;}}),
    classList: {toggle() {writes++;}},
  }, {set(target, key, value) {writes++; target[key] = value; return true;}});
  const panel = make();
  const document = {
    getElementById(id) {if (!nodes.has(id)) nodes.set(id, make()); return nodes.get(id);},
    querySelector() {return panel;},
    querySelectorAll() {return Array.from({length:6}, (_, i) => ({...make(), dataset:{gear:String(i + 1)}}));},
  };
  return {document, nodes, count:() => writes};
}

test('steady driving instruments perform no redundant DOM writes', () => {
  const f = fixture(), render = createDrivingHud(f.document);
  const input = {state:createState(), car:cars.eclipse, fuelLiters:67, bitePoint:.84, clutchMode:'PRESSURE', knobX:0, knobY:0};
  render(input);
  const first = f.count();
  for (let i = 0; i < 100; i++) render(input);
  assert.equal(f.count(), first);
  input.state.speed = 10;
  render(input);
  assert.equal(f.nodes.get('speed').textContent, '22');
  assert.equal(f.count(), first + 1);
});

test('HUD updates clutch, gear, turbo and failure displays when state changes', () => {
  const f = fixture(), render = createDrivingHud(f.document);
  const state = {...createState(), gear:1, clutch:.9, boost:.5};
  render({state, car:cars.civic, fuelLiters:47, bitePoint:.92, clutchMode:'DIRECT', knobX:-1, knobY:-1});
  assert.equal(f.nodes.get('gear').textContent, '1');
  assert.equal(f.nodes.get('clutch-value').textContent, '90%');
  assert.equal(f.nodes.get('clutch-bite').style.left, '92%');
  assert.equal(f.nodes.get('power-label').textContent, 'TURBO SPOOL 50%');
  assert.equal(f.nodes.get('shift-knob').style.top, '11px');
  state.blown=true;
  render({state, car:cars.civic, fuelLiters:47, bitePoint:.92, clutchMode:'DIRECT', knobX:-1, knobY:-1});
  assert.equal(f.nodes.get('engine-state').textContent, 'ENGINE BLOWN');
});
