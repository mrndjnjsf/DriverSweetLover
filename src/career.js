import { ECONOMY } from "./config/economy.js";
import {
  VEHICLE_IDS, createVehicleCondition, validateVehicleCondition,
  getServiceQuote, applyService,
} from './condition.js';
import { fuelCapacity, fuelFillQuote, FUEL_PRICE_CENTS_PER_LITER } from './fuel.js';
import { bathroomQuote, useBathroom } from './needs.js';
import { donationQuote } from './city-projects.js';
import { CITY_PROJECTS } from './config/city-projects.js';
import { createFleet, validateFleet, activeVehicle, assignedDriver, dealershipOpen, driverAvailable, fleetEligibility, fleetJobQuote } from './fleet.js';
import { DEALERSHIP, DRIVERS, FLEET } from './config/fleet.js';
import { APPEARANCES } from './config/appearance.js';
import { CONTROL_OPTIONS } from './control-tuning.js';

// Browser-local career data. Money is always integer US cents.
export const SAVE_VERSION = 2;
// Keep the original storage slot so old careers are migrated, not abandoned.
export const SAVE_KEY = 'driver-sweet-lover:career:v1';
export const STARTING_WALLET_CENTS = ECONOMY.startingWalletCents;
export const DRAG_WIN_PAYOUT_CENTS = ECONOMY.dragWinPayoutCents;
const MAX_WALLET_CENTS = 1_000_000_000;
const MAX_JOB_PAYOUT_CENTS = 25_000;
const MAX_FINE_CENTS = 100_000;
const validId = id => typeof id === 'string' && /^[A-Za-z0-9:_-]{1,80}$/.test(id);
const validFineReason = reason => typeof reason === 'string' && reason.length > 0 && reason.length <= 160 && /^[\x20-\x7E]+$/.test(reason);

function requireId(id, name) {
  if (!validId(id)) throw new TypeError(`${name} must be a short ID`);
  return id;
}

function requireMoney(amount, name, maximum = MAX_WALLET_CENTS) {
  if (!Number.isSafeInteger(amount) || amount < 0 || amount > maximum) {
    throw new RangeError(`${name} must be a nonnegative integer number of cents`);
  }
  return amount;
}

function requireNode(nodeId, name) {
  if (!Number.isInteger(nodeId) || nodeId < 0 || nodeId >= 2500) {
    throw new RangeError(`${name} must be a 50 by 50 map node ID`);
  }
  return nodeId;
}

function requireVehicleId(vehicleId) {
  if (!VEHICLE_IDS.includes(vehicleId)) throw new RangeError('Unknown vehicle');
  return vehicleId;
}

function payoutForDistance(distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0 || distanceKm > 25) {
    throw new RangeError('Delivery distance must be between 0 and 25 km');
  }
  return Math.min(MAX_JOB_PAYOUT_CENTS, 1_200 + Math.round(distanceKm * 450));
}

/** A map/route system supplies a reachable pickup, drop-off and route length. */
export function createDeliveryOffer(id, pickupNodeId, dropoffNodeId, distanceKm) {
  requireId(id, 'Job ID');
  // Reserve four characters for the "job:" transaction prefix.
  if (id.length > 76) throw new RangeError('Job ID is too long');
  requireNode(pickupNodeId, 'Pickup');
  requireNode(dropoffNodeId, 'Drop-off');
  if (pickupNodeId === dropoffNodeId) throw new RangeError('Pickup and drop-off must differ');
  return {
    id, type: 'delivery', pickupNodeId, dropoffNodeId, distanceKm,
    payoutCents: payoutForDistance(distanceKm),
  };
}

export function createCareer(activeVehicleId = 'eclipse') {
  requireVehicleId(activeVehicleId);
  return {
    schemaVersion: SAVE_VERSION,
    activeVehicleId,
    starterVehicleIds:[activeVehicleId],starterChoiceMade:activeVehicleId==='mustang',
    vehicles: { [activeVehicleId]:createVehicleCondition(activeVehicleId) },
    vehicleMeta:{[activeVehicleId]:{id:activeVehicleId,modelId:activeVehicleId,appearance:'original'}},
    fleet:createFleet(),
    walletCents: STARTING_WALLET_CENTS,
    transactions: [],
    jobs: { active: null, completedIds: [], cancelledIds: [] },
  };
}

export function chooseStarter(career,modelId) {
  if(!['eclipse','civic'].includes(modelId))throw new RangeError('Choose an Eclipse or Civic');
  const next=copyCareer(career);
  if(next.starterChoiceMade)throw new Error('Starter already chosen; buy other cars at the dealership');
  if(next.transactions.length||next.jobs.active||Object.keys(next.vehicles).length!==1)throw new Error('Cannot replace a career with progression');
  next.activeVehicleId=modelId;next.starterVehicleIds=[modelId];next.starterChoiceMade=true;
  next.vehicles={[modelId]:createVehicleCondition(modelId)};
  next.vehicleMeta={[modelId]:{id:modelId,modelId,appearance:'original'}};
  return next;
}

function validateActiveJob(active) {
  if (active === null) return;
  if (!active || !['accepted', 'picked-up'].includes(active.status)) throw new TypeError('Invalid active job');
  const offer = createDeliveryOffer(active.id, active.pickupNodeId, active.dropoffNodeId, active.distanceKm);
  if (active.type !== 'delivery' || active.payoutCents !== offer.payoutCents) throw new TypeError('Invalid active job payout');
}

export function validateCareer(career) {
  if (!career || career.schemaVersion !== SAVE_VERSION) throw new TypeError('Unsupported career save version');
  requireId(career.activeVehicleId,'Owned vehicle ID');
  if (!career.vehicles) throw new TypeError('Missing vehicles');
  for (const vehicleId of Object.keys(career.vehicles)) {
    requireId(vehicleId,'Owned vehicle ID');
    const vehicle = career.vehicles[vehicleId];
    validateVehicleCondition(vehicle);
    if (VEHICLE_IDS.includes(vehicleId)&&vehicle.vehicleId!==vehicleId)throw new TypeError('Vehicle condition belongs to another car');
  }
  if(!Object.hasOwn(career.vehicles,career.activeVehicleId))throw new TypeError('Missing owned vehicle');
  requireMoney(career.walletCents, 'Wallet');
  if (!Array.isArray(career.transactions) || !career.jobs) throw new TypeError('Missing career history');
  if (!Array.isArray(career.jobs.completedIds) || !Array.isArray(career.jobs.cancelledIds)) {
    throw new TypeError('Invalid job history');
  }
  const completedIds = new Set(career.jobs.completedIds.map(id => requireId(id, 'Completed job ID')));
  const cancelledIds = new Set(career.jobs.cancelledIds.map(id => requireId(id, 'Cancelled job ID')));
  if (completedIds.size !== career.jobs.completedIds.length || cancelledIds.size !== career.jobs.cancelledIds.length) {
    throw new TypeError('Duplicate job IDs');
  }
  if ([...completedIds].some(id => cancelledIds.has(id))) throw new TypeError('Job cannot be both completed and cancelled');
  validateActiveJob(career.jobs.active);
  if (career.jobs.active && (completedIds.has(career.jobs.active.id) || cancelledIds.has(career.jobs.active.id))) {
    throw new TypeError('Active job is already finished');
  }
  const transactionIds = new Set();
  const paidJobIds = new Set();
  let balance = STARTING_WALLET_CENTS;
  for (const transaction of career.transactions) {
    if (!transaction || !['service', 'job', 'fine', 'race', 'fuel', 'bathroom', 'donation', 'car-purchase', 'fleet', 'fleet-reserve'].includes(transaction.type)) throw new TypeError('Invalid transaction');
    requireId(transaction.id, 'Transaction ID');
    if (transactionIds.has(transaction.id)) throw new TypeError('Duplicate transaction ID');
    transactionIds.add(transaction.id);
    if (!Number.isSafeInteger(transaction.amountCents) || Math.abs(transaction.amountCents) > MAX_WALLET_CENTS) {
      throw new TypeError('Invalid transaction amount');
    }
    if (transaction.type === 'service' && transaction.amountCents > 0) throw new TypeError('Service must be a debit');
    if (transaction.type === 'bathroom' && (!validId(transaction.siteId) || typeof transaction.free !== 'boolean' || !Number.isSafeInteger(transaction.priceCents) || transaction.priceCents < 0 || transaction.priceCents > 10000 || (transaction.free && transaction.priceCents !== 0) || transaction.amountCents !== -transaction.priceCents)) throw new TypeError('Invalid bathroom transaction');
    if (transaction.type === 'donation' && (!CITY_PROJECTS.some(project=>project.id===transaction.projectId) || transaction.amountCents >= 0)) throw new TypeError('Invalid donation transaction');
    if(transaction.type==='car-purchase'&&(!career.vehicles[transaction.vehicleId]||!VEHICLE_IDS.includes(transaction.modelId)||career.vehicles[transaction.vehicleId].vehicleId!==transaction.modelId||!Number.isSafeInteger(transaction.priceCents)||transaction.priceCents<1||transaction.amountCents!==-transaction.priceCents))throw new TypeError('Invalid car purchase');
    if(transaction.type==='fleet-reserve'&&(!DRIVERS[transaction.driverId]||transaction.amountCents>=0))throw new TypeError('Invalid reserve transfer');
    if(transaction.type==='fleet'){
      const fields=['grossCents','fuelCents','reserveCents','maintenanceCents','netCents','ownerCents','driverCents'];
      if(!DRIVERS[transaction.driverId]||!career.vehicles[transaction.vehicleId]||!Number.isSafeInteger(transaction.jobNumber)||transaction.jobNumber<1||transaction.id!==`fleet:${transaction.driverId}:${transaction.jobNumber}`||fields.some(key=>!Number.isSafeInteger(transaction[key])||transaction[key]<0)||!Number.isSafeInteger(transaction.shareBasisPoints)||transaction.shareBasisPoints<0||transaction.shareBasisPoints>10000||transaction.netCents!==transaction.grossCents-transaction.fuelCents-transaction.reserveCents||transaction.ownerCents!==Math.floor(transaction.netCents*transaction.shareBasisPoints/10000)||transaction.driverCents!==transaction.netCents-transaction.ownerCents||transaction.amountCents!==transaction.ownerCents)throw new TypeError('Invalid fleet payout');
    }
    if (transaction.type === 'fuel' && (
      !career.vehicles[transaction.vehicleId]
      || !Number.isFinite(transaction.liters) || transaction.liters <= 0
      || !Number.isSafeInteger(transaction.unitPriceCents) || transaction.unitPriceCents<1
      || transaction.amountCents !== -Math.round(transaction.liters * transaction.unitPriceCents)
    )) throw new TypeError('Invalid fuel transaction');
    if (transaction.type === 'job' && transaction.amountCents < 0) throw new TypeError('Job must be a credit');
    if (transaction.type === 'race' && (
      !validId(transaction.raceId) || transaction.raceId.length > 75
      || transaction.id !== `race:${transaction.raceId}`
      || !Number.isFinite(transaction.elapsedSeconds)
      || transaction.elapsedSeconds <= 0 || transaction.elapsedSeconds > 90
      || transaction.amountCents !== DRAG_WIN_PAYOUT_CENTS
    )) throw new TypeError('Invalid race transaction');
    if (transaction.type === 'fine') {
      requireId(transaction.fineId, 'Fine ID');
      if (transaction.fineId.length > 75 || transaction.id !== `fine:${transaction.fineId}`
        || !validFineReason(transaction.reason)
        || !Number.isSafeInteger(transaction.assessedCents)
        || transaction.assessedCents < 1 || transaction.assessedCents > MAX_FINE_CENTS
        || transaction.amountCents !== -Math.min(balance, transaction.assessedCents)) {
        throw new TypeError('Invalid fine transaction');
      }
    }
    balance += transaction.amountCents;
    requireMoney(balance, 'Transaction balance');
    if (transaction.balanceAfterCents !== balance) throw new TypeError('Transaction balance mismatch');
    if (transaction.type === 'job') {
      requireId(transaction.jobId, 'Paid job ID');
      if (transaction.id !== `job:${transaction.jobId}` || !completedIds.has(transaction.jobId)) {
        throw new TypeError('Job payout does not match completed job');
      }
      paidJobIds.add(transaction.jobId);
    }
  }
  if (paidJobIds.size !== completedIds.size) throw new TypeError('Completed job is missing its payout');
  if (career.walletCents !== balance) throw new TypeError('Wallet does not match transaction history');
  validateFleet(career);
  return career;
}

function copyCareer(career) {
  validateCareer(career);
  return {
    ...career,
    vehicles: Object.fromEntries(Object.keys(career.vehicles).map(id => [id, {
      ...career.vehicles[id],
      parts: Object.fromEntries(Object.entries(career.vehicles[id].parts).map(([key, part]) => [key, { ...part }])),
      oil: { ...career.vehicles[id].oil },
    }])),
    vehicleMeta:Object.fromEntries(Object.entries(career.vehicleMeta).map(([id,meta])=>[id,{...meta}])),
    fleet:{drivers:Object.fromEntries(Object.entries(career.fleet.drivers).map(([id,driver])=>[id,{...driver,raceIds:[...driver.raceIds],lastJob:driver.lastJob?{...driver.lastJob}:null}]))},
    transactions: career.transactions.map(item => ({ ...item })),
    jobs: {
      active: career.jobs.active ? { ...career.jobs.active } : null,
      completedIds: [...career.jobs.completedIds],
      cancelledIds: [...career.jobs.cancelledIds],
    },
  };
}

export function switchVehicle(career, vehicleId) {
  const next = copyCareer(career);
  if(!Object.hasOwn(next.vehicles,vehicleId))throw new RangeError('Unknown owned vehicle');
  if(assignedDriver(next,vehicleId))throw new Error('This car is working for a driver · reclaim it first');
  next.activeVehicleId = vehicleId;
  return next;
}

export function setVehicleAppearance(career,appearance) {
  const next=copyCareer(career);
  if(!Object.hasOwn(APPEARANCES,appearance))throw new Error('Unknown appearance');
  next.vehicleMeta[next.activeVehicleId].appearance=appearance;return next;
}

export function buyVehicle(career,modelId,transactionId) {
  const next=copyCareer(career);requireVehicleId(modelId);requireId(transactionId,'Purchase ID');
  if(/^(job|fine|race|fleet):/.test(transactionId))throw new Error('Transaction ID is reserved');
  const prior=next.transactions.find(receipt=>receipt.id===transactionId);
  if(prior){if(prior.type!=='car-purchase'||prior.modelId!==modelId)throw new Error('Purchase ID already used');return next;}
  if(!dealershipOpen(next))throw new Error('Dealership opens after street renewal');
  if(!Object.hasOwn(DEALERSHIP.pricesCents,modelId))throw new Error('This car is tutorial-only and cannot be purchased');
  if(Object.keys(next.vehicles).length>=DEALERSHIP.maxCars)throw new Error('Garage is full');
  const priceCents=DEALERSHIP.pricesCents[modelId],vehicleId=`owned:${transactionId}`;requireId(vehicleId,'Owned vehicle ID');
  if(next.walletCents<priceCents)throw new Error('Not enough money for this car');
  if(next.vehicles[vehicleId])throw new Error('Owned vehicle ID already used');
  next.vehicles[vehicleId]=createVehicleCondition(modelId);
  next.vehicleMeta[vehicleId]={id:vehicleId,modelId,appearance:'original'};
  next.walletCents-=priceCents;
  next.transactions.push({id:transactionId,type:'car-purchase',vehicleId,modelId,priceCents,amountCents:-priceCents,balanceAfterCents:next.walletCents});
  return next;
}

export function recordDriverWin(career,driverId,raceId) {
  const next=copyCareer(career),driver=next.fleet.drivers[driverId];
  if(!driver)throw new Error('Unknown driver');
  if(driver.raceIds.includes(raceId))return next;
  if(!next.transactions.some(receipt=>receipt.type==='race'&&receipt.raceId===raceId))throw new Error('A completed paid race win is required');
  driver.raceIds.push(raceId);driver.wins++;return next;
}

export function assignDriver(career,driverId,vehicleId) {
  const next=copyCareer(career),driver=next.fleet.drivers[driverId];
  if(!driver||!driverAvailable(next,driverId))throw new Error('Driver has not asked for work yet');
  if(driver.vehicleId)throw new Error('Reclaim the current work car first');
  if(!Object.hasOwn(next.vehicles,vehicleId)||vehicleId===next.activeVehicleId||assignedDriver(next,vehicleId))throw new Error('Choose an available spare car');
  const problem=fleetEligibility(next.vehicles[vehicleId]);if(problem)throw new Error(problem);
  driver.vehicleId=vehicleId;driver.elapsedSeconds=0;driver.pausedReason=null;return next;
}

export function reclaimDriverCar(career,driverId) {
  const next=copyCareer(career),driver=next.fleet.drivers[driverId];if(!driver)throw new Error('Unknown driver');
  driver.vehicleId=null;driver.elapsedSeconds=0;driver.pausedReason=null;return next;
}

export function fundDriverReserve(career,driverId,amountCents,transactionId) {
  const next=copyCareer(career);requireId(transactionId,'Reserve transfer ID');requireMoney(amountCents,'Reserve transfer');
  if(/^(job|fine|race|fleet):/.test(transactionId))throw new Error('Transaction ID is reserved');
  const prior=next.transactions.find(receipt=>receipt.id===transactionId);
  if(prior){if(prior.type!=='fleet-reserve'||prior.driverId!==driverId||prior.amountCents!==-amountCents)throw new Error('Transfer ID already used');return next;}
  const driver=next.fleet.drivers[driverId];
  if(!driver||!driverAvailable(next,driverId)||amountCents<1)throw new Error('Driver reserve is unavailable');
  if(next.walletCents<amountCents)throw new Error('Not enough money for this reserve');
  requireMoney(driver.reserveCents+amountCents,'Driver reserve');
  driver.reserveCents+=amountCents;next.walletCents-=amountCents;
  next.transactions.push({id:transactionId,type:'fleet-reserve',driverId,amountCents:-amountCents,balanceAfterCents:next.walletCents});return next;
}

export function advanceFleet(career,dt) {
  if(!Number.isFinite(dt)||dt<0||dt>1)throw new RangeError('Fleet time must be between zero and one second');
  if(dt===0||!Object.values(career.fleet.drivers).some(driver=>driver.vehicleId))return {career,events:[]};
  const next=copyCareer(career),events=[];
  for(const [driverId,driver] of Object.entries(next.fleet.drivers)){
    if(!driver.vehicleId)continue;
    if(driver.elapsedSeconds===0||driver.pausedReason){const quote=fleetJobQuote(next.vehicles[driver.vehicleId],driver);if(quote.problem){driver.pausedReason=quote.problem;continue;}driver.pausedReason=null;}
    driver.elapsedSeconds+=dt;
    if(driver.elapsedSeconds<FLEET.jobSeconds)continue;
    const quote=fleetJobQuote(next.vehicles[driver.vehicleId],driver);
    if(quote.problem){driver.elapsedSeconds=0;driver.pausedReason=quote.problem;continue;}
    if(next.walletCents+quote.ownerCents>MAX_WALLET_CENTS){driver.elapsedSeconds=0;driver.pausedReason='Wallet limit reached · spend money before work resumes';continue;}
    driver.elapsedSeconds-=FLEET.jobSeconds;driver.jobNumber++;
    const id=`fleet:${driverId}:${driver.jobNumber}`;
    if(next.transactions.some(receipt=>receipt.id===id))throw new Error('Fleet job already paid');
    requireMoney(next.walletCents+quote.ownerCents,'Wallet');
    next.vehicles[driver.vehicleId]=quote.condition;
    driver.reserveCents+=quote.reserveCents-quote.maintenanceCents;
    const {condition,...breakdown}=quote;
    next.walletCents+=quote.ownerCents;
    const receipt={id,type:'fleet',driverId,vehicleId:driver.vehicleId,jobNumber:driver.jobNumber,...breakdown,amountCents:quote.ownerCents,balanceAfterCents:next.walletCents};
    next.transactions.push(receipt);driver.lastJob={...receipt};events.push(receipt);
  }
  return {career:next,events};
}

export function purchaseBathroom(career, needs, site, parking, transactionId) {
  const next = copyCareer(career);
  requireId(transactionId, 'Bathroom visit ID');
  const prior = next.transactions.find(item => item.id === transactionId);
  if (prior) {
    if (prior.type !== 'bathroom' || prior.siteId !== site?.id) throw new Error('Visit ID already used');
    return { career: next, needs };
  }
  const cost = bathroomQuote(site);
  const relieved = useBathroom(needs, site, parking);
  if (next.walletCents < cost) throw new Error('Not enough money · use the free community bathroom');
  next.walletCents -= cost;
  next.transactions.push({ id: transactionId, type: 'bathroom', siteId: site.id, free: Boolean(site.free), priceCents: cost, amountCents: cost ? -cost : 0, balanceAfterCents: next.walletCents });
  return { career: next, needs: relieved };
}

export function donateToCity(career, projectId, amountCents, transactionId) {
  const next = copyCareer(career);
  requireId(transactionId, 'Donation ID');
  const prior = next.transactions.find(item=>item.id===transactionId);
  if(prior){if(prior.type!=='donation'||prior.projectId!==projectId)throw new Error('Donation ID already used');return next;}
  const quote=donationQuote(next,projectId,amountCents);
  next.walletCents-=quote.chargedCents;
  next.transactions.push({id:transactionId,type:'donation',projectId,amountCents:-quote.chargedCents,balanceAfterCents:next.walletCents});
  return next;
}

/** Use this after `applyDrivingWear` or `applyImpactDamage` on a single car. */
export function setVehicleCondition(career, condition, ownedId = null) {
  const next = copyCareer(career);
  validateVehicleCondition(condition);
  const id=ownedId??(activeVehicle(next).vehicleId===condition.vehicleId?next.activeVehicleId:condition.vehicleId);
  if (!next.vehicles[id]||next.vehicles[id].vehicleId!==condition.vehicleId) throw new RangeError('Vehicle is not owned');
  if(assignedDriver(next,id))throw new Error('Reclaim this car before changing its condition');
  next.vehicles[id] = {
    ...condition,
    parts: Object.fromEntries(Object.entries(condition.parts).map(([key, part]) => [key, { ...part }])),
    oil: { ...condition.oil },
  };
  return next;
}

export function configurePedals(career,kind,value){
  const next=copyCareer(career),condition=activeVehicle(next);
  if(!Object.hasOwn(CONTROL_OPTIONS,kind)||!CONTROL_OPTIONS[kind].includes(value))throw new Error('Unknown pedal setting');
  const part=kind==='throttle'?'engine':'clutch';
  if(!condition.parts[part].sku.endsWith(':upgraded'))throw new Error(`Upgrade the ${part} first`);
  if(assignedDriver(next,next.activeVehicleId))throw new Error('Reclaim the car before tuning');
  condition.controlTune={...condition.controlTune,[kind]:value};
  return next;
}

export function acceptDelivery(career, offer) {
  const next = copyCareer(career);
  if (next.jobs.active) throw new RangeError('Finish or cancel the active job first');
  if (!offer) throw new TypeError('Delivery offer required');
  const expected = createDeliveryOffer(offer.id, offer.pickupNodeId, offer.dropoffNodeId, offer.distanceKm);
  if (offer.type !== expected.type || offer.payoutCents !== expected.payoutCents) {
    throw new TypeError('Delivery offer payout does not match route');
  }
  if (next.jobs.completedIds.includes(offer.id) || next.jobs.cancelledIds.includes(offer.id)) {
    throw new RangeError('Job ID has already been used');
  }
  next.jobs.active = { ...expected, status: 'accepted' };
  return next;
}

export function pickupDelivery(career, nodeId) {
  const next = copyCareer(career);
  requireNode(nodeId, 'Current');
  const job = next.jobs.active;
  if (!job || job.status !== 'accepted') throw new RangeError('No delivery awaiting pickup');
  if (nodeId !== job.pickupNodeId) throw new RangeError('Drive to the pickup point');
  job.status = 'picked-up';
  return next;
}

/** Passing the job ID makes repeated completion requests safely idempotent. */
export function completeDelivery(career, jobId, nodeId) {
  const next = copyCareer(career);
  requireId(jobId, 'Job ID');
  requireNode(nodeId, 'Current');
  if (next.jobs.completedIds.includes(jobId)) return next;
  const job = next.jobs.active;
  if (!job || job.id !== jobId || job.status !== 'picked-up') throw new RangeError('Delivery is not ready for drop-off');
  if (nodeId !== job.dropoffNodeId) throw new RangeError('Drive to the drop-off point');
  const transactionId = `job:${job.id}`;
  if (next.transactions.some(item => item.id === transactionId)) throw new TypeError('Job has already paid');
  const balance = next.walletCents + job.payoutCents;
  requireMoney(balance, 'Wallet');
  next.walletCents = balance;
  next.jobs.completedIds.push(job.id);
  next.jobs.active = null;
  next.transactions.push({
    id: transactionId, type: 'job', jobId: job.id,
    amountCents: job.payoutCents, balanceAfterCents: balance,
  });
  return next;
}

export function cancelDelivery(career, jobId) {
  const next = copyCareer(career);
  requireId(jobId, 'Job ID');
  if (next.jobs.cancelledIds.includes(jobId)) return next;
  if (!next.jobs.active || next.jobs.active.id !== jobId) throw new RangeError('Job is not active');
  next.jobs.cancelledIds.push(jobId);
  next.jobs.active = null;
  return next;
}

/** Service quote is recomputed at purchase time; callers cannot set the price. */
export function purchaseService(career, action, transactionId, vehicleId = career.activeVehicleId) {
  const next = copyCareer(career);
  requireId(transactionId, 'Transaction ID');
  if (transactionId.startsWith('job:') || transactionId.startsWith('fine:') || transactionId.startsWith('race:')) throw new RangeError('Transaction ID is reserved');
  if(!next.vehicles[vehicleId]||assignedDriver(next,vehicleId))throw new Error('Owned vehicle is not available for service');
  const prior = next.transactions.find(item => item.id === transactionId);
  if (prior) {
    if (prior.type === 'service' && prior.vehicleId === vehicleId
      && prior.action?.type === action?.type && prior.action?.partKey === action?.partKey) return next;
    throw new RangeError('Transaction ID already belongs to another purchase');
  }
  const quote = getServiceQuote(next.vehicles[vehicleId], action);
  if (next.walletCents < quote.totalCents) throw new RangeError('Insufficient funds for service');
  next.vehicles[vehicleId] = applyService(next.vehicles[vehicleId], action);
  next.walletCents -= quote.totalCents;
  next.transactions.push({
    id: transactionId, type: 'service', vehicleId,
    action: quote.action, amountCents: -quote.totalCents,
    balanceAfterCents: next.walletCents,
  });
  return next;
}

/** Fill the selected car's tank at a station. The quote is recomputed here. */
export function purchaseFuel(career, transactionId, vehicleId = career.activeVehicleId) {
 const next = copyCareer(career);
 requireId(transactionId, 'Transaction ID');
 if(!next.vehicles[vehicleId]||assignedDriver(next,vehicleId))throw new Error('Owned vehicle is not available for fuel');
 const prior = next.transactions.find(item => item.id === transactionId);
 if (prior) {
  if (prior.type === 'fuel' && prior.vehicleId === vehicleId) return next;
  throw new RangeError('Transaction ID already belongs to another purchase');
 }
 const modelId=next.vehicles[vehicleId].vehicleId;
 const quote = fuelFillQuote(modelId, next.vehicles[vehicleId].fuelLiters);
 if (quote.liters <= 0) throw new RangeError('Tank is already full');
 if (next.walletCents < quote.totalCents) throw new RangeError('Insufficient funds for fuel');
 next.vehicles[vehicleId].fuelLiters = fuelCapacity(modelId);
 next.walletCents -= quote.totalCents;
 next.transactions.push({id:transactionId,type:'fuel',vehicleId,liters:quote.liters,unitPriceCents:FUEL_PRICE_CENTS_PER_LITER,amountCents:-quote.totalCents,balanceAfterCents:next.walletCents});
 return next;
}

/** A witnessed citation is charged once; an empty wallet stays at zero. */
export function applyFine(career, { id, reason, amountCents } = {}) {
  const next = copyCareer(career);
  requireId(id, 'Fine ID');
  if (id.length > 75) throw new RangeError('Fine ID is too long');
  if (!validFineReason(reason)) throw new TypeError('Fine reason must be short plain text');
  if (!Number.isSafeInteger(amountCents) || amountCents < 1 || amountCents > MAX_FINE_CENTS) {
    throw new RangeError('Fine amount must be between 1 and 100000 cents');
  }
  const transactionId = `fine:${id}`;
  const prior = next.transactions.find(item => item.id === transactionId);
  if (prior) {
    if (prior.type === 'fine' && prior.reason === reason && prior.assessedCents === amountCents) return next;
    throw new RangeError('Fine ID already belongs to another citation');
  }
  const charged = Math.min(next.walletCents, amountCents);
  next.walletCents -= charged;
  next.transactions.push({
    id: transactionId, type: 'fine', fineId: id, reason,
    assessedCents: amountCents, amountCents: -charged,
    balanceAfterCents: next.walletCents,
  });
  return next;
}

/** A completed drag win pays a fixed amount exactly once across reloads. */
export function awardDragWin(career, raceId, elapsedSeconds) {
  const next = copyCareer(career);
  requireId(raceId, 'Race ID');
  if (raceId.length > 75) throw new RangeError('Race ID is too long');
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0 || elapsedSeconds > 90) {
    throw new RangeError('Invalid race time');
  }
  const transactionId = `race:${raceId}`;
  const prior = next.transactions.find(item => item.id === transactionId);
  if (prior) {
    if (prior.type === 'race' && prior.elapsedSeconds === elapsedSeconds) return next;
    throw new RangeError('Race ID already belongs to another result');
  }
  const balance = next.walletCents + DRAG_WIN_PAYOUT_CENTS;
  requireMoney(balance, 'Wallet');
  next.walletCents = balance;
  next.transactions.push({
    id: transactionId, type: 'race', raceId, elapsedSeconds,
    amountCents: DRAG_WIN_PAYOUT_CENTS, balanceAfterCents: balance,
  });
  return next;
}

export function serializeCareer(career) {
  validateCareer(career);
  return JSON.stringify({ version: SAVE_VERSION, career });
}

export function parseCareer(serialized) {
  if(typeof serialized!=='string'||serialized.length>5_000_000)throw new TypeError('Save is too large or invalid');
  const envelope = JSON.parse(serialized);
  if (!envelope || ![1,SAVE_VERSION].includes(envelope.version)) throw new TypeError('Unsupported save version');
  if(envelope.version===1){
    if(envelope.career?.schemaVersion!==1)throw new TypeError('Unsupported career save version');
    envelope.career.schemaVersion=SAVE_VERSION;
    envelope.career.vehicleMeta=Object.fromEntries(Object.keys(envelope.career.vehicles||{}).map(id=>[id,{id,modelId:id,appearance:'original'}]));
    envelope.career.fleet=createFleet();
  }
  // Bathroom receipts from the initial build used the charged amount as the quote.
  if(envelope.version===1&&Array.isArray(envelope.career?.transactions))for(const receipt of envelope.career.transactions){
    if(receipt?.type==='bathroom'&&receipt.priceCents===undefined)receipt.priceCents=Math.max(0,-receipt.amountCents);
    if(receipt?.type==='fuel'&&receipt.unitPriceCents===undefined)receipt.unitPriceCents=110;
  }
  // Version-one saves created before fuel existed start with a full tank.
  if (envelope.version===1&&envelope.career?.vehicles) for (const vehicleId of VEHICLE_IDS) {
   if (envelope.career.vehicles[vehicleId] && envelope.career.vehicles[vehicleId].fuelLiters === undefined)
    envelope.career.vehicles[vehicleId].fuelLiters = createVehicleCondition(vehicleId).fuelLiters;
  }
  // Earlier builds gifted both manuals. Preserve those cars and all history.
  if(envelope.career&&envelope.career.starterVehicleIds===undefined&&envelope.career.starterChoiceMade===undefined){
    envelope.career.starterVehicleIds=['eclipse','civic'].filter(id=>Object.hasOwn(envelope.career.vehicles||{},id));
    envelope.career.starterChoiceMade=true;
  }
  validateCareer(envelope.career);
  return copyCareer(envelope.career);
}

export function saveCareer(storage, career, key = SAVE_KEY) {
  const serialized = serializeCareer(career);
  const existing=storage.getItem(key);
  if(existing){let legacy=false;try{legacy=JSON.parse(existing).version===1;}catch{}
    if(legacy&&storage.getItem(`${key}:backup:v1`)===null)storage.setItem(`${key}:backup:v1`,existing);
  }
  storage.setItem(key, serialized);
  return serialized;
}

/** Leaves corrupt saves intact for recovery/export and starts a fresh session. */
export function loadCareer(storage, { key = SAVE_KEY, vehicleId = 'eclipse' } = {}) {
  let serialized;
  try {
    serialized = storage.getItem(key);
  } catch (error) {
    return { career: createCareer(vehicleId), hasSave: false, recovered: true, error: `Storage unavailable: ${error.message}` };
  }
  if (serialized === null) return { career: createCareer(vehicleId), hasSave: false, recovered: false, error: null };
  try {
    return { career: parseCareer(serialized), hasSave: true, recovered: false, error: null };
  } catch (error) {
    return { career: createCareer(vehicleId), hasSave: true, recovered: true, error: String(error.message) };
  }
}
