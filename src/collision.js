// A small, deterministic contact test for the player's car and nearby traffic.
// Positions are metres and speeds are metres/second. Heading zero faces -Z.
const forward = heading => ({ x: -Math.sin(heading), z: -Math.cos(heading) });
const right = heading => ({ x: Math.cos(heading), z: -Math.sin(heading) });
const dot = (a, b) => a.x * b.x + a.z * b.z;

function overlapOnAxis(a, b, axis) {
  const displacement = { x: b.x - a.x, z: b.z - a.z };
  const radius = car => {
    const f = forward(car.heading), r = right(car.heading);
    return Math.abs(dot(f, axis)) * (car.halfLength ?? 2.25)
      + Math.abs(dot(r, axis)) * (car.halfWidth ?? .95);
  };
  return Math.abs(dot(displacement, axis)) <= radius(a) + radius(b);
}

export function carsOverlap(a, b) {
  if (![a.x, a.z, a.heading, b.x, b.z, b.heading].every(Number.isFinite)) return false;
  return [forward(a.heading), right(a.heading), forward(b.heading), right(b.heading)]
    .every(axis => overlapOnAxis(a, b, axis));
}

export function findTrafficImpact(player, vehicles) {
  let strongest = null;
  for (const vehicle of vehicles) {
    if (!carsOverlap(player, vehicle)) continue;
    const displacement = { x: vehicle.x - player.x, z: vehicle.z - player.z };
    const distance = Math.hypot(displacement.x, displacement.z);
    const normal = distance > .001
      ? { x: displacement.x / distance, z: displacement.z / distance }
      : forward(player.heading);
    const playerVelocity = forward(player.heading);
    const trafficVelocity = forward(vehicle.heading);
    const relative = {
      x: playerVelocity.x * player.speed - trafficVelocity.x * vehicle.speed,
      z: playerVelocity.z * player.speed - trafficVelocity.z * vehicle.speed,
    };
    const impactSpeedMps = Math.abs(dot(relative, normal));
    const end = dot(displacement, forward(player.heading)) >= 0 ? 'front' : 'rear';
    const impact = { vehicleId: vehicle.id, end, impactSpeedMps };
    if (!strongest || impactSpeedMps > strongest.impactSpeedMps) strongest = impact;
  }
  return strongest;
}
