import assert from 'node:assert/strict';
import test from 'node:test';
import {advanceToHour,cityHour,daylightAt,formatCityTime} from '../src/time-of-day.js';

test('city clock moves from afternoon into night and wraps',()=>{
 assert.equal(cityHour(0),15);
 assert.equal(cityHour(60*5),20);
 assert.equal(cityHour(60*9),0);
 assert.equal(formatCityTime(cityHour(60*5)),'8:00 PM');
});

test('sunrise and sunset ease into daylight',()=>{
 assert.equal(daylightAt(5),0);
 assert.equal(daylightAt(7),.5);
 assert.equal(daylightAt(12),1);
 assert.equal(daylightAt(18.5),.5);
 assert.equal(daylightAt(21),0);
});

test('jump control advances to next day or night without reversing time',()=>{
 const night=advanceToHour(0,20);
 assert.equal(cityHour(night),20);
 const day=advanceToHour(night,9);
 assert.equal(cityHour(day),9);
 assert.ok(day>night);
});
