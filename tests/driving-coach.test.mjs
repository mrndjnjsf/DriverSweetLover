import test from 'node:test';
import assert from 'node:assert/strict';
import { drivingAdvice } from '../src/driving-coach.js';
import { cars, createState } from '../src/physics.js';

const options = { fuelLiters: 20, bitePoint: .72 };
test('coach stays quiet during ordinary driving and engine failure', () => {
  assert.equal(drivingAdvice(createState(), cars.civic, options), null);
  assert.equal(drivingAdvice({ ...createState(), blown: true, running: false }, cars.civic, options), null);
});
test('stall advice matches controls and distinguishes an empty tank', () => {
  const state = { ...createState(), running: false };
  assert.match(drivingAdvice(state, cars.civic, options).text, /Ctrl.*Enter/);
  assert.match(drivingAdvice(state, cars.civic, { ...options, input: 'controller' }).text, /LT.*Y/);
  assert.match(drivingAdvice(state, cars.civic, { ...options, input: 'touch' }).text, /slider.*Start Engine/);
  assert.equal(drivingAdvice(state, cars.civic, { ...options, fuelLiters: 0 }).id, 'fuel');
});
test('money shift is predicted with clutch depressed, ahead of redline advice', () => {
  const state = { ...createState(), gear: 1, speed: 40, clutch: 1, throttle: 1, rpm: 8000 };
  const before = structuredClone(state);
  assert.equal(drivingAdvice(state, cars.civic, options).id, 'money-shift');
  assert.deepEqual(state, before);
  assert.equal(drivingAdvice({ ...state, gear: 0 }, cars.civic, options).id, 'redline');
  assert.equal(drivingAdvice({ ...state, gear: 6, rpm: 3000 }, cars.civic, options), null);
});
test('redline respects each car and bogging suggests clutch recovery', () => {
  for (const car of Object.values(cars).filter(car=>car.transmission!=="automatic")) {
    assert.equal(drivingAdvice({ ...createState(), rpm: car.redline * .96, throttle: .5 }, car, options).id, 'redline');
    assert.equal(drivingAdvice({ ...createState(), rpm: car.redline * .85, throttle: .5 }, car, options), null);
  }
  assert.equal(drivingAdvice({ ...createState(), gear: 3, clutch: 0, rpm: 850 }, cars.civic, options).id, 'bogging');
});
