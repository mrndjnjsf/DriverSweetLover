// Repeatable CPU microbenchmark, not a GPU/FPS measurement.
import { performance } from 'node:perf_hooks';
import { cars, createState, availableTorque, step } from '../src/physics.js';

export function drivingSnapshot() {
  return Object.fromEntries(Object.entries(cars).map(([id, car]) => {
    const state = createState();
    state.gear = 2; state.speed = 12; state.rpm = 3000; state.roadMode = 'grid';
    for (let i = 0; i < 1200; i++) step(state, {
      clutch: i % 180 < 20 ? 1 : 0, throttle: .75, brake: i > 1000 ? .2 : 0,
      steer: Math.sin(i / 100) * .1,
    }, car, 1 / 60);
    return [id, state];
  }));
}

const state = { rpm: 0, boost: .75 };
let checksum = 0;
const samples = [];
for (let run = 0; run < 9; run++) {
  const start = performance.now();
  for (let i = 0; i < 200_000; i++) {
    state.rpm = 850 + i % 7000;
    checksum += availableTorque(state, i % 2 ? cars.civic : cars.eclipse);
  }
  if (run > 1) samples.push(performance.now() - start);
}
samples.sort((a, b) => a - b);
console.log(JSON.stringify({ torqueCalls: 200_000, medianMs: samples[3], checksum, snapshot: drivingSnapshot() }, null, 2));
