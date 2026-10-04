import { assignedDriver, dealershipOpen, driverAvailable } from './fleet.js';
import { fuelCapacity } from './fuel.js';
import { DEALERSHIP, DRIVERS, FLEET } from './config/fleet.js';

export function createFleetPhoneView(document,{names,onSwitch,onBuy,onAssign,onReclaim,onReserve}) {
  const get=id=>document.getElementById(id),money=cents=>'$'+(cents/100).toFixed(2);
  let optionKey='';
  const purchaseButtons=Object.entries(DEALERSHIP.pricesCents).map(([modelId,price])=>{
    const button=document.createElement('button');button.textContent=`BUY ${names[modelId]} · ${money(price)}`;
    button.onclick=()=>onBuy(modelId);get('dealership-cars').append(button);return {button,price};
  });
  get('owned-car').onchange=()=>onSwitch(get('owned-car').value);
  get('driver-assign').onclick=()=>onAssign('kai',get('driver-car').value);
  get('driver-reclaim').onclick=()=>onReclaim('kai');
  get('driver-reserve').onclick=()=>onReserve('kai');
  get('driver-request-open').onclick=()=>document.querySelector('[data-phone-app="drivers"]').click();
  function render(career,{atGarage,recovered,raceActive}) {
    const available=driverAvailable(career,'kai'),driver=career.fleet.drivers.kai;
    get('drivers-app').hidden=!available;get('driver-request').hidden=!available;
    get('dealership').hidden=!dealershipOpen(career);
    const ids=Object.keys(career.vehicles),key=JSON.stringify([ids,career.activeVehicleId,ids.map(id=>assignedDriver(career,id))]);
    const label=id=>`${names[career.vehicles[id].vehicleId]}${career.starterVehicleIds.includes(id)?' · starter':` · #${ids.indexOf(id)+1}`}`;
    if(key!==optionKey){
      optionKey=key;
      get('owned-car').replaceChildren();get('driver-car').replaceChildren();
      for(const id of ids){
        const busy=assignedDriver(career,id);
        const option=document.createElement('option');option.value=id;option.textContent=label(id)+(busy?' · working':'');option.disabled=Boolean(busy);get('owned-car').append(option);
        if(id!==career.activeVehicleId&&!busy){const spare=option.cloneNode(true);get('driver-car').append(spare);}
      }
      get('owned-car').value=career.activeVehicleId;
    }
    get('owned-car').disabled=recovered||raceActive;
    get('garage-instance').textContent=label(career.activeVehicleId);
    get('dealership-location').textContent=atGarage?'At your garage · purchases available':'Drive to the Garage marker in Maps and stop to purchase';
    purchaseButtons.forEach(({button,price})=>button.disabled=!atGarage||raceActive||recovered||career.walletCents<price||ids.length>=DEALERSHIP.maxCars);
    get('driver-request-text').textContent=driver.vehicleId?`${DRIVERS.kai.name}: Thanks for the work car. Check Drivers for my deliveries and maintenance reserve.`:`${DRIVERS.kai.name}: You beat me ${driver.wins} times. Got a spare car? I can run deliveries for you.`;
    get('driver-status').textContent=driver.vehicleId?`${DRIVERS.kai.name} · ${label(driver.vehicleId)} · ${driver.pausedReason||`delivering · next job ${Math.ceil(FLEET.jobSeconds-driver.elapsedSeconds)} s`}`:`${DRIVERS.kai.name} is ready for a spare car.`;
    get('driver-reserve-label').textContent=`Maintenance reserve ${money(driver.reserveCents)} · ${Math.round(FLEET.ownerShare*100)}% of net to you`;
    get('driver-assign').hidden=Boolean(driver.vehicleId);get('driver-car').hidden=Boolean(driver.vehicleId);
    get('driver-car-label').hidden=Boolean(driver.vehicleId);
    get('driver-reclaim').hidden=!driver.vehicleId;
    get('driver-assign').disabled=!available||!get('driver-car').value||recovered||raceActive;
    get('driver-reclaim').disabled=recovered;
    get('driver-reserve').disabled=!available||recovered||career.walletCents<FLEET.reserveTopUpCents;
    get('driver-reserve').textContent=`ADD ${money(FLEET.reserveTopUpCents)} TO RESERVE`;
    const job=driver.lastJob;
    get('driver-last-job').textContent=job?`Last job: gross ${money(job.grossCents)} − fuel ${money(job.fuelCents)} − reserve ${money(job.reserveCents)} = net ${money(job.netCents)}. You ${money(job.ownerCents)} · driver ${money(job.driverCents)}. Service from reserve ${money(job.maintenanceCents)}.`:'No employee deliveries completed yet. Work advances only during active play.';
    get('appearance-select').value=career.vehicleMeta[career.activeVehicleId].appearance;
    get('driver-work-condition').textContent=driver.vehicleId?`Work car: fuel ${activeFuel(career,driver.vehicleId)}% · clutch ${Math.round(career.vehicles[driver.vehicleId].parts.clutch.health*100)}% · ${career.vehicles[driver.vehicleId].odometerKm.toFixed(1)} km`:'';
  }
  const activeFuel=(career,id)=>Math.round(career.vehicles[id].fuelLiters/fuelCapacity(career.vehicles[id].vehicleId)*100);
  return {render};
}
