import test from 'node:test';
import assert from 'node:assert/strict';
import { activityDemand, createActivityMarket, advanceActivityMarket, consumeActivityOffer, activitySummary } from '../src/activity-market.js';

function emptyMarket(hour){
  const market=createActivityMarket(hour);
  for(const kind of ['delivery','race'])while(consumeActivityOffer(market,kind)){}
  return market;
}

test('daytime favors deliveries; nighttime favors races',()=>{
  const day=advanceActivityMarket(emptyMarket(12),60,12);
  const night=advanceActivityMarket(emptyMarket(22),60,22);
  assert.deepEqual([day.delivery.available,night.delivery.available],[3,0]);
  assert.deepEqual([day.race.available,night.race.available],[0,2]);
  assert.equal(advanceActivityMarket(night,15,22).delivery.available,1);
  assert.equal(advanceActivityMarket(day,120,12).race.available,1);
});

test('queues are bounded and full queues do not bank future arrivals',()=>{
  const market=advanceActivityMarket(createActivityMarket(22),1e12,22);
  assert.equal(market.race.available,3);
  consumeActivityOffer(market,'race');
  advanceActivityMarket(market,0,22);
  assert.equal(market.race.available,2);
  advanceActivityMarket(market,29,22);
  assert.equal(market.race.available,2);
  advanceActivityMarket(market,1,22);
  assert.equal(market.race.available,3);
});

test('sunset changes capacity and smoothly carries fractional wait progress',()=>{
  const market=emptyMarket(12);
  advanceActivityMarket(market,7.5,12);
  assert.equal(market.delivery.progress,.5);
  advanceActivityMarket(market,37.5,22);
  assert.equal(market.delivery.available,1);
  assert.equal(activityDemand('delivery',18.5).seconds,45);
  const full=createActivityMarket(12);
  advanceActivityMarket(full,0,22);
  assert.equal(full.delivery.available,1);
  assert.equal(full.race.available,1);
});

test('no time elapsed creates no offers; empty queues show a countdown',()=>{
  const market=emptyMarket(12);
  advanceActivityMarket(market,0,12);
  assert.equal(consumeActivityOffer(market,'delivery'),false);
  assert.match(activitySummary(market,'delivery',12),/Daytime.*0 available.*15 s/);
  assert.match(activitySummary(market,'race',22),/Night.*30 s/);
  assert.throws(()=>advanceActivityMarket(market,-1,12),RangeError);
  assert.throws(()=>advanceActivityMarket(market,NaN,12),RangeError);
  assert.throws(()=>activityDemand('unknown',12),RangeError);
  assert.throws(()=>createActivityMarket(NaN),RangeError);
});
