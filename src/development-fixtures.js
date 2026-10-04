import { createCareer, chooseStarter, buyVehicle, awardDragWin, recordDriverWin, donateToCity } from './career.js';

// Called only in explicit sandbox mode. Uses real rules and temporary storage.
export function createFleetPreview() {
  let career=chooseStarter(createCareer(),'eclipse');
  for(let i=1;i<=3;i++){career=awardDragWin(career,`fixture-kai-${i}`,20);career=recordDriverWin(career,'kai',`fixture-kai-${i}`);}
  career=donateToCity(career,'community-park',10000,'fixture-park');
  career=donateToCity(career,'road-renewal',15000,'fixture-roads');
  career=buyVehicle(career,'civic','fixture-civic');
  return career;
}
