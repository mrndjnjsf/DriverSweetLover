import { ACTIVITY } from './config/activity.js';
import { daylightAt } from './time-of-day.js';

export function activityDemand(kind, hour) {
  const config=ACTIVITY[kind];
  if(!config)throw new RangeError('Unknown activity');
  const daylight=daylightAt(hour);
  return {
    capacity:daylight>=.5?config.dayCapacity:config.nightCapacity,
    seconds:config.nightSeconds+(config.daySeconds-config.nightSeconds)*daylight,
    daytime:daylight>=.5,
  };
}

export function createActivityMarket(hour) {
  return Object.fromEntries(Object.keys(ACTIVITY).map(kind=>[kind,{available:activityDemand(kind,hour).capacity,progress:0}]));
}

// Fractional progress preserves elapsed waiting time across sunrise/sunset.
// Full queues do not bank arrivals, and large time steps require no loops.
export function advanceActivityMarket(market, dt, hour) {
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Activity time must be nonnegative');
  for(const kind of Object.keys(ACTIVITY)){
    const demand=activityDemand(kind,hour),queue=market[kind];
    queue.available=Math.min(queue.available,demand.capacity);
    if(queue.available===demand.capacity){queue.progress=0;continue;}
    const progress=queue.progress+dt/demand.seconds;
    queue.available=Math.min(demand.capacity,queue.available+Math.floor(progress));
    queue.progress=queue.available===demand.capacity?0:progress%1;
  }
  return market;
}

export function consumeActivityOffer(market, kind) {
  if(!ACTIVITY[kind])throw new RangeError('Unknown activity');
  if(market[kind].available===0)return false;
  market[kind].available--;
  return true;
}

export function activitySummary(market, kind, hour) {
  const demand=activityDemand(kind,hour),queue=market[kind];
  const shift=kind==='delivery'
    ?demand.daytime?'Daytime delivery rush':'Quiet night deliveries'
    :demand.daytime?'Quiet daytime racing':'Night racing rush';
  return `${shift} · ${queue.available} available${queue.available?'':` · next in ${Math.ceil((1-queue.progress)*demand.seconds)} s`}`;
}
