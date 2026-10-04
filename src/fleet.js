import { DRIVERS, FLEET, DEALERSHIP } from './config/fleet.js';
import { applyDrivingWear, applyService, getServiceQuote, PART_KEYS } from './condition.js';
import { FUEL_PRICE_CENTS_PER_LITER } from './fuel.js';
import { cityEffects } from './city-projects.js';
import { APPEARANCES } from './config/appearance.js';

export function createFleet() {
  return {drivers:Object.fromEntries(Object.keys(DRIVERS).map(id=>[id,{wins:0,raceIds:[],vehicleId:null,elapsedSeconds:0,jobNumber:0,reserveCents:0,lastJob:null,pausedReason:null}]))};
}
export const dealershipOpen=career=>cityEffects(career).improvedRoads;
export const driverAvailable=(career,id)=>Boolean(DRIVERS[id]&&career.fleet.drivers[id]?.wins>=DRIVERS[id].winsToHire&&cityEffects(career).park);
export const assignedDriver=(career,vehicleId)=>Object.entries(career.fleet.drivers).find(([,driver])=>driver.vehicleId===vehicleId)?.[0]||null;
export const activeVehicle=career=>career.vehicles[career.activeVehicleId];

export function validateFleet(career) {
  const ids=Object.keys(career.vehicles);
  if(ids.length<1||ids.length>DEALERSHIP.maxCars||!career.vehicleMeta||!career.fleet?.drivers)throw new TypeError('Invalid owned garage');
  if(typeof career.starterChoiceMade!=='boolean'||!Array.isArray(career.starterVehicleIds)||career.starterVehicleIds.length<1||career.starterVehicleIds.length>2||new Set(career.starterVehicleIds).size!==career.starterVehicleIds.length||career.starterVehicleIds.some(id=>!['eclipse','civic','mustang'].includes(id)||!Object.hasOwn(career.vehicles,id))||career.starterVehicleIds.includes('mustang')&&career.starterVehicleIds.length!==1)throw new TypeError('Invalid starter choice');
  if(Object.keys(career.vehicleMeta).length!==ids.length)throw new TypeError('Garage metadata mismatch');
  for(const id of ids){
    const meta=career.vehicleMeta[id];if(!meta||meta.id!==id||meta.modelId!==career.vehicles[id].vehicleId||!Object.hasOwn(APPEARANCES,meta.appearance))throw new TypeError('Invalid owned car metadata');
    if(!career.starterVehicleIds.includes(id)&&career.transactions.filter(receipt=>receipt.type==='car-purchase'&&receipt.vehicleId===id).length!==1)throw new TypeError('Owned car is missing its purchase');
  }
  if(Object.keys(career.fleet.drivers).length!==Object.keys(DRIVERS).length)throw new TypeError('Invalid driver roster');
  const assigned=new Set();
  for(const id of Object.keys(DRIVERS)){
    const driver=career.fleet.drivers[id];
    if(!driver||!Number.isSafeInteger(driver.wins)||driver.wins<0||!Array.isArray(driver.raceIds)||driver.wins!==driver.raceIds.length||new Set(driver.raceIds).size!==driver.wins||driver.raceIds.some(raceId=>!career.transactions.some(receipt=>receipt.type==='race'&&receipt.raceId===raceId)))throw new TypeError('Invalid driver wins');
    if(!Number.isFinite(driver.elapsedSeconds)||driver.elapsedSeconds<0||driver.elapsedSeconds>=FLEET.jobSeconds||!Number.isSafeInteger(driver.jobNumber)||driver.jobNumber<0||!Number.isSafeInteger(driver.reserveCents)||driver.reserveCents<0||driver.reserveCents>1e9)throw new TypeError('Invalid driver work state');
    if(driver.pausedReason!==null&&(typeof driver.pausedReason!=='string'||driver.pausedReason.length>160))throw new TypeError('Invalid driver pause reason');
    if(driver.vehicleId!==null){if(!ids.includes(driver.vehicleId)||driver.vehicleId===career.activeVehicleId||assigned.has(driver.vehicleId)||!driverAvailable(career,id))throw new TypeError('Invalid driver assignment');assigned.add(driver.vehicleId);}
    if(driver.vehicleId===null&&driver.elapsedSeconds!==0)throw new TypeError('Unassigned driver has pending work');
    const jobs=career.transactions.filter(receipt=>receipt.type==='fleet'&&receipt.driverId===id);
    if(jobs.length!==driver.jobNumber||jobs.some((receipt,i)=>receipt.jobNumber!==i+1))throw new TypeError('Driver jobs do not match receipts');
    const reserve=career.transactions.reduce((total,receipt)=>receipt.driverId!==id?total:receipt.type==='fleet-reserve'?total-receipt.amountCents:receipt.type==='fleet'?total+receipt.reserveCents-receipt.maintenanceCents:total,0);
    if(reserve!==driver.reserveCents)throw new TypeError('Driver reserve does not match receipts');
    if(JSON.stringify(driver.lastJob)!==JSON.stringify(jobs.at(-1)??null))throw new TypeError('Last driver job does not match receipts');
  }
}

export function fleetEligibility(condition) {
  if(condition.fuelLiters<FLEET.minimumFuelLiters)return 'Refuel this car before assigning it';
  if(PART_KEYS.some(key=>condition.parts[key].health<.25))return 'Repair this car before assigning it';
  return '';
}

// Coarse seeded work; no distant traffic/car renderer, no offline time.
export function fleetJobQuote(condition,driver) {
  const problem=fleetEligibility(condition);if(problem)return {problem};
  let serviced=condition,maintenanceCents=0;
  const actions=PART_KEYS.filter(key=>condition.parts[key].health<FLEET.serviceHealth).map(partKey=>({type:'repair',partKey}));
  if(condition.oil.condition<.55)actions.push({type:'oil-change'});
  for(const action of actions){maintenanceCents+=getServiceQuote(serviced,action).totalCents;serviced=applyService(serviced,action);}
  if(maintenanceCents>driver.reserveCents)return {problem:'Maintenance reserve too low · top up or reclaim and repair the car'};
  let next=serviced;
  for(let i=0;i<10;i++)next=applyDrivingWear(next,{dtSeconds:.1,distanceKm:FLEET.jobKm/10,speedMps:10,clutchPosition:0,clutchWorkJ:1000,throttle:.35,brake:.1,engineRpm:2500,running:true,elapsedGameDays:.001});
  const fuelLiters=FLEET.fuelLiters[condition.vehicleId]+Math.max(0,serviced.fuelLiters-next.fuelLiters);
  if(serviced.fuelLiters<fuelLiters)return {problem:'Refuel this car before assigning it'};
  // Employee buys back the fuel used, funded by gross receipts.
  next.fuelLiters=serviced.fuelLiters;
  const seed=((driver.jobNumber+1)*1664525+1013904223)>>>0;
  const grossCents=FLEET.grossBaseCents+seed%(FLEET.grossVariationCents+1);
  const fuelCents=Math.round(fuelLiters*FUEL_PRICE_CENTS_PER_LITER);
  const reserveCents=FLEET.reservePerJobCents;
  const netCents=Math.max(0,grossCents-fuelCents-reserveCents);
  const shareBasisPoints=Math.round(FLEET.ownerShare*10000);
  const ownerCents=Math.floor(netCents*shareBasisPoints/10000);
  return {condition:next,grossCents,fuelCents,reserveCents,maintenanceCents,netCents,shareBasisPoints,ownerCents,driverCents:netCents-ownerCents};
}
