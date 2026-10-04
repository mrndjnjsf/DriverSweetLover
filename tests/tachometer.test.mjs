import test from 'node:test';
import assert from 'node:assert/strict';
import {cars} from '../src/physics.js';
import {TACH_MAX_RPM,tachPercent} from '../src/tachometer.js';

test('tach fill agrees with the printed zero-to-eight-thousand scale and each redline',()=>{
 assert.equal(TACH_MAX_RPM,8000);
 assert.equal(tachPercent(2000),25);
 assert.equal(tachPercent(4000),50);
 assert.equal(tachPercent(6000),75);
 assert.equal(tachPercent(8000),100);
 assert.equal(tachPercent(9000),100);
 assert.equal(tachPercent(cars.civic.redline),100);
 assert.equal(tachPercent(cars.eclipse.redline),81.25);
});
