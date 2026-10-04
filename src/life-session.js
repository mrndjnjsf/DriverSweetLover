import { createNeeds, advanceNeeds } from './needs.js';
import { advanceParking } from './parking.js';
import { createRival, advanceRival, declineRival } from './rival.js';

// Session-owned state, independent of the browser and presentation. Commands
// such as paid services still commit through the career transaction boundary.
export function createLifeSession() {
  return { needs:createNeeds(), parking:new Map(), rival:createRival() };
}

export function advanceLifeSession(session, dt, { map, sites, car, eligible=false, force=false, paused=false }) {
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Session time must be nonnegative');
  if(paused)return session;
  session.needs=advanceNeeds(session.needs,dt);
  session.rival=advanceRival(session.rival,dt,{map,car,eligible,force});
  for(const site of sites)session.parking.set(site.id,advanceParking(session.parking.get(site.id),car,site,dt));
  return session;
}

// Car resets and map edits clear location-dependent progress, not player needs
// or earned respect. No phantom invitation or half-settled parking survives.
export function resetLifeLocations(session) {
  session.parking.clear();
  session.rival=declineRival(session.rival);
  return session;
}
