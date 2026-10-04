import test from 'node:test';
import assert from 'node:assert/strict';
import {publicPath,CONTENT_SECURITY_POLICY} from '../scripts/static-policy.mjs';
import {parseCareer,createCareer,serializeCareer} from '../src/career.js';
import {importGridMap} from '../src/grid-map.js';
test('static server allowlist excludes private, encoded and non-game paths',()=>{
  for(const url of ['/.env','/.git/config','/artifacts/save.json','/README.md','/server.mjs','/scripts/build.mjs','/tests/career.test.mjs','/src/%2eenv','/src/..%2f.env','/src/%5c..%5c.env','/src/%00main.js','/%ZZ','/vendor/unknown.js'])assert.equal(publicPath(url),null,url);
  for(const url of ['/','/index.html?testdrive=mustang','/src/main.js','/src/config/vehicles.js','/vendor/three.core.js','/assets/skins/coupe-v1-solid.svg'])assert.ok(publicPath(url),url);
  assert.match(CONTENT_SECURITY_POLICY,/script-src 'self';/);
  assert.match(CONTENT_SECURITY_POLICY,/object-src 'none'/);
  assert.ok(!CONTENT_SECURITY_POLICY.includes('unsafe-eval'));
});
test('untrusted serialized inputs are bounded and validated',()=>{
  assert.throws(()=>parseCareer(' '.repeat(5_000_001)),/too large/);
  assert.throws(()=>parseCareer({}),/invalid/);
  assert.throws(()=>parseCareer('{"version":2,"career":{"__proto__":{"polluted":true}}}'));
  assert.equal({}.polluted,undefined);
  assert.deepEqual(parseCareer(serializeCareer(createCareer())),createCareer());
  assert.throws(()=>importGridMap(' '.repeat(250001)),/too large/);
  assert.throws(()=>importGridMap('{"version":1,"size":1000000}'));
});
