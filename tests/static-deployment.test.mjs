import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {publicPath} from '../scripts/static-policy.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));

test('release includes every local module/asset reference and no private files',async()=>{
  const built=spawnSync(process.execPath,['scripts/build.mjs'],{cwd:root,encoding:'utf8'});
  assert.equal(built.status,0,built.stderr);
  const dir=path.join(root,'dist');
  const releaseHtml=await readFile(path.join(dir,'index.html'),'utf8');
  const releaseId=releaseHtml.match(/src="src\/main\.js\?v=([a-f0-9]+)"/)?.[1];
  assert.ok(releaseId,'Entry module must have a deployment version');
  async function files(folder){const entries=await readdir(folder,{withFileTypes:true});return (await Promise.all(entries.map(entry=>entry.isDirectory()?files(path.join(folder,entry.name)):path.join(folder,entry.name)))).flat();}
  for(const file of await files(dir)){
    const relative=path.relative(dir,file).split(path.sep).join('/');
    assert.ok(relative==='.nojekyll'||publicPath('/'+relative),relative);
    if(!/\.(?:js|html)$/.test(file))continue;
    const content=await readFile(file,'utf8');
    const references=relative.endsWith('.js')?[...content.matchAll(/(?:from\s*|import\s*)['"](\.{1,2}\/[^'"]+)['"]/g)].map(match=>match[1]):[...content.matchAll(/(?:src|href)="([^"#]+)"/g)].map(match=>match[1]);
    for(const reference of references){
      if(reference.includes('.js'))assert.ok(reference.endsWith(`?v=${releaseId}`),`Module version mismatch: ${reference}`);
      const target=path.resolve(path.dirname(file),reference.split('?')[0]);assert.ok(target.startsWith(dir+path.sep));assert.ok((await stat(target)).isFile(),`${relative}: ${reference}`);
    }
  }
  assert.match(await readFile(path.join(dir,'src/config/development.js'),'utf8'),/enabled: false/);
  assert.match(await readFile(path.join(dir,'index.html'),'utf8'),/Content-Security-Policy/);
  // Dynamic skin paths use a fixed registry: all four shipped combinations exist.
  for(const body of ['coupe-v1','sedan-v1'])for(const skin of ['solid','race'])assert.ok((await stat(path.join(dir,`assets/skins/${body}-${skin}.svg`))).isFile());
});

test('HTTP preview blocks private files and writes, serves game with security headers',async(t)=>{
  const child=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
  t.after(()=>child.kill());
  const address=await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('Server did not start')),10000);
    child.once('error',error=>{clearTimeout(timer);reject(error);});
    child.once('exit',code=>{clearTimeout(timer);reject(new Error(`Server exited ${code}`));});
    child.stdout.on('data',data=>{const match=data.toString().match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});
  });
  const response=await fetch(address);
  assert.equal(response.status,200);assert.match(await response.text(),/Driver Sweet Lover/);
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  assert.equal(response.headers.get('x-frame-options'),'DENY');
  assert.match(response.headers.get('content-security-policy'),/frame-ancestors 'none'/);
  for(const url of ['/README.md','/.env','/server.mjs','/artifacts/security-tests.log','/src/%5c..%5c.env'])assert.equal((await fetch(address+url)).status,404,url);
  assert.equal((await fetch(address,{method:'POST'})).status,405);
  const head=await fetch(address+'/src/main.js',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
});
