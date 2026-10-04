const average = values => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
const percentile = (values, percent) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * percent))];
};

// Opt-in diagnostic overlay. The game does not write profile sessions to saves.
export function createPerformanceMonitor(root = document.body) {
  const panel = document.createElement('pre');
  panel.id = 'performance-monitor';
  panel.style.cssText = 'position:fixed;left:8px;top:8px;z-index:1000;margin:0;padding:7px 10px;background:#08191de0;color:#bdf2db;font:11px/1.4 monospace;pointer-events:none;white-space:pre';
  root.append(panel);
  const gaps = [], cpu = [], render = [];
  let previous = null, lastReport = 0;
  return {
    record(rafNow, cpuMs, renderMs, drawCalls, triangles, profileLabel) {
      if (previous !== null) {
        gaps.push(Math.max(0, rafNow - previous));
        cpu.push(cpuMs);
        render.push(renderMs);
        if (gaps.length > 180) { gaps.shift(); cpu.shift(); render.shift(); }
      }
      previous = rafNow;
      if (rafNow - lastReport < 1200 || gaps.length < 30) return;
      lastReport = rafNow;
      const meanGap = average(gaps);
      panel.textContent = `${profileLabel}\nFPS ${(1000 / meanGap).toFixed(1)} · p95 gap ${percentile(gaps, .95).toFixed(1)} ms\nCPU ${average(cpu).toFixed(1)} ms · render ${average(render).toFixed(1)} ms\nDraw ${drawCalls} · tri ${triangles}`;
    },
    dispose() { panel.remove(); },
  };
}
