// Real gameplay seconds. Queues are session-only; accepted jobs stay in career state.
export const ACTIVITY = Object.freeze({
  delivery: Object.freeze({dayCapacity:3, nightCapacity:1, daySeconds:15, nightSeconds:75}),
  race: Object.freeze({dayCapacity:1, nightCapacity:3, daySeconds:180, nightSeconds:30}),
});
