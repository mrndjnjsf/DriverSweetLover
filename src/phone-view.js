export function createPhoneView(document) {
  const panel = document.getElementById('career-panel');
  const shell = panel.querySelector('.phone-shell');
  const watch = document.getElementById('objective-watch');
  const collapse = document.getElementById('phone-collapse');
  const title = document.getElementById('watch-title');
  const detail = document.getElementById('watch-detail');
  const progress = document.getElementById('watch-progress');
  let compact = false;
  function setCompact(value) {
    compact = value;
    shell.hidden = compact;
    watch.hidden = !compact;
    panel.classList.toggle('is-compact', compact);
    watch.setAttribute('aria-expanded', String(!compact));
    (compact ? document.getElementById('world') : collapse).focus({ preventScroll: true });
  }
  collapse.addEventListener('click', () => setCompact(true));
  watch.addEventListener('click', () => setCompact(false));
  return {
    toggle() { setCompact(!compact); },
    get compact() { return compact; },
    render(objective) {
      if (title.textContent !== objective.title) title.textContent = objective.title;
      if (detail.textContent !== objective.detail) detail.textContent = objective.detail;
      progress.hidden = objective.progress === null;
      if (objective.progress !== null) progress.value = objective.progress;
    },
  };
}
