import { createCareer,parseCareer } from '../../src/career.js';
import { createVehicleCondition } from '../../src/condition.js';

// Real shape of the preceding schema-two build, which gifted both manuals.
export function createLegacyCareer(active='eclipse') {
  const career=createCareer(active);
  for(const id of ['eclipse','civic']){
    career.vehicles[id]=createVehicleCondition(id);
    career.vehicleMeta[id]={id,modelId:id,appearance:'original'};
  }
  delete career.starterVehicleIds;delete career.starterChoiceMade;
  return parseCareer(JSON.stringify({version:2,career}));
}
