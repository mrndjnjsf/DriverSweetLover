import { CITY_PROJECTS } from './config/city-projects.js';

export function createCityPhoneView(document, onDonate) {
  const root = document.getElementById('city-projects');
  const cards = new Map();
  for (const project of CITY_PROJECTS) {
    const card = document.createElement('article'); card.className = 'city-project';
    const title = document.createElement('h3'); title.textContent = project.name;
    const benefit = document.createElement('p'); benefit.textContent = project.benefit;
    const tradeoff = document.createElement('small'); tradeoff.textContent = project.tradeoff;
    const progress = document.createElement('p');
    const bar = document.createElement('progress'); bar.max = project.targetCents;
    const donate = document.createElement('button'); donate.className = 'phone-action';
    donate.addEventListener('click', () => onDonate(project.id, 2500));
    card.append(title, benefit, tradeoff, progress, bar, donate); root.append(card);
    cards.set(project.id, { card, progress, bar, donate });
  }
  return projects => {
    for (const project of projects) {
      const {card,progress,bar,donate} = cards.get(project.id);
      card.hidden = !project.unlocked;
      const text = `$${(project.fundedCents/100).toFixed(2)} / $${(project.targetCents/100).toFixed(2)}${project.completed?' · COMPLETE':''}`;
      if(progress.textContent!==text)progress.textContent=text;
      bar.value=project.fundedCents;
      const amount=Math.min(2500,project.targetCents-project.fundedCents);
      donate.textContent=project.completed?'PROJECT FUNDED':`DONATE $${(amount/100).toFixed(2)}`;
      donate.disabled=project.completed||project.unaffordable;
    }
  };
}
