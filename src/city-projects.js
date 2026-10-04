import { CITY_PROJECTS } from './config/city-projects.js';
import { gridPoint } from './grid-map.js';

export function cityProjects(career) {
  const funded = new Map();
  for (const transaction of career.transactions) if (transaction.type === 'donation') funded.set(transaction.projectId, (funded.get(transaction.projectId) || 0) - transaction.amountCents);
  const complete = new Set(CITY_PROJECTS.filter(project => (funded.get(project.id) || 0) >= project.targetCents).map(project => project.id));
  return CITY_PROJECTS.map(project => ({ ...project, fundedCents: funded.get(project.id) || 0, completed: complete.has(project.id), unlocked: !project.requires || complete.has(project.requires) }));
}

export function cityEffects(career) {
  const projects = cityProjects(career), completed = id => projects.find(project => project.id === id).completed;
  return { park: completed('community-park'), improvedRoads: completed('road-renewal'), cameras: completed('city-safety'), skyline: completed('city-safety') };
}

export function cityProjectPoint(map) {
  const spawn = map.locations.find(location => location.kind === 'spawn');
  const point = gridPoint(map, spawn.col, spawn.row);
  // Keep the park in an interior block even for custom edge spawn points.
  return { x: point.x + (spawn.col < map.size - 1 ? 1 : -1) * map.blockSize / 2, z: point.z + (spawn.row > 0 ? 1 : -1) * map.blockSize / 2 };
}

export function donationQuote(career, projectId, amountCents) {
  const project = cityProjects(career).find(item => item.id === projectId);
  if (!project?.unlocked || project.completed) throw new Error('Project is not accepting donations');
  if (!Number.isSafeInteger(amountCents) || amountCents < 1) throw new Error('Choose a positive donation');
  const chargedCents = Math.min(amountCents, project.targetCents - project.fundedCents);
  if (chargedCents > career.walletCents) throw new Error('Not enough money for this donation');
  return { project, chargedCents, completes: project.fundedCents + chargedCents >= project.targetCents };
}
