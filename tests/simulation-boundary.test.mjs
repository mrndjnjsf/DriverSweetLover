import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('core game rules and their dependencies stay independent of presentation', () => {
  const seen = new Set();
  function inspect(url) {
    if (seen.has(url.href)) return;
    seen.add(url.href);
    assert.ok(!/\/vendor\/|\/presentation\/|\/main\.js$|\/(?:.+-view|eclipse-model|civic-model|model-utils|driving-hud|map-editor)\.js$/.test(url.pathname), url.pathname);
    const source = readFileSync(url, 'utf8');
    assert.doesNotMatch(source, /\b(?:document|window|localStorage|requestAnimationFrame)\s*[.(]/, url.pathname);
    for (const match of source.matchAll(/(?:import|export)\s+(?:[^;'"]*?\s+from\s*)?['"]([^'"]+)['"]/g)) {
      assert.ok(match[1].startsWith('.'), `Unexpected external dependency: ${match[1]}`);
      inspect(new URL(match[1], url));
    }
  }
  for (const name of ['physics', 'career', 'condition', 'fuel', 'traffic', 'collision', 'road-events', 'police', 'drag-race', 'grid-map', 'parking', 'parked-contact', 'needs', 'city-projects', 'speed-cameras', 'rival', 'life-session', 'fleet']) {
    inspect(new URL(`../src/${name}.js`, import.meta.url));
  }
});
