import test from 'node:test';
import assert from 'node:assert/strict';
import { createCareer,chooseStarter,buyVehicle,donateToCity,switchVehicle,serializeCareer,parseCareer,awardDragWin } from '../src/career.js';
import { replacementCareer } from '../src/intro.js';
import { createLegacyCareer } from './fixtures/legacy-career.mjs';
import { createVehicleCondition } from '../src/condition.js';

test('new player owns only the chosen free starter and must buy the other',()=>{
  for(const model of ['eclipse','civic']){
    let career=chooseStarter(createCareer(),model),other=model==='eclipse'?'civic':'eclipse';
    assert.deepEqual(Object.keys(career.vehicles),[model]);assert.equal(career.activeVehicleId,model);
    assert.equal(career.walletCents,50000);assert.equal(career.starterChoiceMade,true);
    assert.equal(replacementCareer(career).activeVehicleId,model);
    assert.throws(()=>switchVehicle(career,other),/Unknown owned/);
    assert.throws(()=>chooseStarter(career,other),/already chosen/);
    assert.throws(()=>buyVehicle(career,other,'early'),/renewal/);
    career=donateToCity(career,'community-park',10000,'park');
    career=donateToCity(career,'road-renewal',15000,'roads');
    // New player's remaining $250 cannot afford either dealership car.
    assert.throws(()=>buyVehicle(career,other,'poor'),/Not enough/);
    career=awardDragWin(career,'first-win',20);
    const bought=buyVehicle(career,other,'second-car');
    assert.equal(bought.vehicles['owned:second-car'].vehicleId,other);
    assert.equal(Object.keys(bought.vehicles).length,2);
    assert.equal(switchVehicle(bought,'owned:second-car').activeVehicleId,'owned:second-car');
    assert.deepEqual(parseCareer(serializeCareer(bought)),bought);
  }
});
test('legacy dual ownership is preserved, while a free fabricated second car is rejected',()=>{
  const legacy=createLegacyCareer('civic');
  assert.equal(legacy.starterChoiceMade,true);assert.deepEqual(legacy.starterVehicleIds,['eclipse','civic']);
  assert.equal(replacementCareer(legacy).activeVehicleId,'civic');
  assert.deepEqual(parseCareer(serializeCareer(legacy)),legacy);
  const modern=chooseStarter(createCareer(),'eclipse');
  modern.vehicles.civic=createVehicleCondition('civic');modern.vehicleMeta.civic={id:'civic',modelId:'civic',appearance:'original'};
  assert.throws(()=>serializeCareer(modern),/missing its purchase/);
});
test('pending choice and selected single-car career survive reload without receiving extra cars',()=>{
  const pending=createCareer();assert.equal(parseCareer(serializeCareer(pending)).starterChoiceMade,false);
  const chosen=chooseStarter(pending,'civic');assert.deepEqual(parseCareer(serializeCareer(chosen)),chosen);
  assert.equal(pending.starterChoiceMade,false);assert.deepEqual(Object.keys(pending.vehicles),['eclipse']);
  assert.throws(()=>chooseStarter(pending,'mustang'),/Eclipse or Civic/);
});
