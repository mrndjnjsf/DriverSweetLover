import test from 'node:test';
import assert from 'node:assert/strict';
import { createCareer, donateToCity, parseCareer, serializeCareer, applyFine } from '../src/career.js';
import { cityProjects, cityEffects, donationQuote } from '../src/city-projects.js';
import { createGridMap } from '../src/grid-map.js';
import { createSpeedCameras, updateSpeedCameras } from '../src/speed-cameras.js';

test('projects reveal in order and partial donations and completions survive existing career serialization', () => {
  let career=createCareer();
  assert.deepEqual(cityProjects(career).filter(project=>project.unlocked).map(project=>project.id),['community-park']);
  assert.throws(()=>donateToCity(career,'road-renewal',100,'locked'),/not accepting/);
  career=donateToCity(career,'community-park',2500,'donation:1');
  assert.equal(cityProjects(career)[0].fundedCents,2500);
  assert.equal(cityEffects(career).park,false);
  assert.equal(donateToCity(career,'community-park',2500,'donation:1').walletCents,47500);
  const quote=donationQuote(career,'community-park',10000);
  assert.equal(quote.chargedCents,7500);
  career=donateToCity(career,'community-park',10000,'donation:2');
  assert.equal(career.walletCents,40000);
  assert.equal(cityEffects(career).park,true);
  assert.equal(cityProjects(career)[1].unlocked,true);
  assert.deepEqual(parseCareer(serializeCareer(career)),career);
  assert.throws(()=>donateToCity(career,'community-park',100,'donation:3'),/not accepting/);
  assert.throws(()=>donateToCity(career,'road-renewal',-1,'donation:4'),/positive/);
  const poor=applyFine(career,{id:'low-wallet',reason:'Test fine',amountCents:career.walletCents-10});
  assert.throws(()=>donateToCity(poor,'road-renewal',2500,'unaffordable'),/Not enough/);
  assert.equal(poor.walletCents,10);
  assert.equal(poor.transactions.length,career.transactions.length+1);
  career=donateToCity(career,'road-renewal',15000,'donation:5');
  assert.equal(cityEffects(career).improvedRoads,true);
  career=donateToCity(career,'city-safety',20000,'donation:6');
  assert.equal(cityEffects(career).cameras,true);
  assert.equal(career.walletCents,5000);
});

test('cameras only fine speeding nearby vehicles when funded, with a cooldown', () => {
  const system=createSpeedCameras(createGridMap()), camera=system.cameras[0];
  const car={x:camera.x,z:camera.z,speed:20};
  assert.equal(updateSpeedCameras(system,car,.1,false),null);
  assert.equal(updateSpeedCameras(system,{...car,speed:15},.1,true),null);
  assert.equal(updateSpeedCameras(system,{...car,x:car.x+50},.1,true),null);
  assert.equal(updateSpeedCameras(system,car,.1,true).amountCents,4500);
  assert.equal(updateSpeedCameras(system,car,1,true),null);
  assert.equal(updateSpeedCameras(system,car,21,true).id,'camera-2');
});
