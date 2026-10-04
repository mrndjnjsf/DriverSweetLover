import test from 'node:test';
import assert from 'node:assert/strict';
import { disposeModel } from '../src/scene-resources.js';

test('model removal disposes shared geometry and materials once, then clears children', () => {
  const released = [];
  const resource = id => ({dispose() {released.push(id);}});
  const geometry=resource('geometry'), paint=resource('paint'), glass=resource('glass');
  const children=[{geometry,material:paint},{geometry,material:[paint,glass]},{}];
  const group={traverse(fn) {children.forEach(fn);},clear() {released.push('clear');children.length=0;}};
  disposeModel(group);
  assert.deepEqual(released,['geometry','paint','glass','clear']);
  assert.equal(children.length,0);
});
