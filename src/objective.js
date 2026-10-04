// A shared, presentation-neutral summary. A detour never changes the active job.
export function trackedObjective({ job, destination, navigation, race, raceProgress = 0, position }) {
  if (race?.phase === 'countdown') return { title: 'Hold the start line', detail: 'Wait for GO', progress: 0 };
  if (race?.phase === 'active') return { title: 'Reach the finish', detail: `${Math.round(raceProgress)} / 400 m`, progress: Math.min(1, raceProgress / 400) };
  const target = navigation || (job && destination);
  if (!target) return { title: 'No tracked objective', detail: 'Open phone to choose a stop or job', progress: null };
  const distance = Math.round(Math.hypot(position.x - target.x, position.z - target.z));
  return {
    title: navigation ? navigation.label : job.status === 'accepted' ? 'Pick up delivery' : 'Drop off delivery',
    detail: distance < 19 ? 'Stop and open the app' : `${distance} m away`,
    progress: null,
  };
}
