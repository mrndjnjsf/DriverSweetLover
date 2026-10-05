import {mkdir,readdir,readFile,writeFile,lstat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {ROOT_ASSETS,CONTENT_SECURITY_POLICY,publicPath} from './static-policy.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const output=path.join(root,'dist');
// A deployment has one module identity. Prevent cached modules from mixing
// previous gameplay rules with the current HTML after Pages publication.
const releaseId=randomBytes(8).toString('hex');
await mkdir(output,{recursive:true});
if((await lstat(output)).isSymbolicLink())throw new Error('Release directory cannot be a symlink');
// Fail on stale/unexpected output instead of deleting user-supplied files.
async function checkOutput(dir){for(const entry of await readdir(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name),relative=path.relative(output,file).split(path.sep).join('/');
  if(entry.isSymbolicLink())throw new Error(`Symlink in release: ${relative}`);
  if(entry.isDirectory())await checkOutput(file);
  else if(relative!=='.nojekyll'&&!publicPath('/'+relative))throw new Error(`Unexpected release file: ${relative}. Move it out of dist before building.`);
}}
await checkOutput(output);
let count=0;
async function copy(relative){
  if((await lstat(path.join(root,relative))).isSymbolicLink())throw new Error(`Symlink in source: ${relative}`);
  let data=await readFile(path.join(root,relative));
  if(relative==='src/config/development.js')data=Buffer.from('export const DEVELOPMENT = Object.freeze({ enabled: false });\n');
  if(relative.endsWith('.js'))data=Buffer.from(data.toString().replace(/((?:from\s*|import\s*)['"])(\.{1,2}\/[^'"]+\.js)(['"])/g,`$1$2?v=${releaseId}$3`));
  if(relative==='index.html')data=Buffer.from(data.toString().replace('src="src/main.js"',`src="src/main.js?v=${releaseId}"`));
  if(relative==='index.html')data=Buffer.from(data.toString().replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="'+CONTENT_SECURITY_POLICY+'"><meta name="referrer" content="no-referrer">'));
  await mkdir(path.dirname(path.join(output,relative)),{recursive:true});
  await writeFile(path.join(output,relative),data);count++;
}
async function tree(relative){for(const entry of await readdir(path.join(root,relative),{withFileTypes:true})){
  if(entry.isSymbolicLink())throw new Error(`Symlink in source assets: ${relative}/${entry.name}`);
  const file=relative+'/'+entry.name;
  if(entry.isDirectory())await tree(file);
  else if(publicPath('/'+file))await copy(file);
}}
for(const file of ROOT_ASSETS)await copy(file);
for(const dir of ['src','assets','vendor'])await tree(dir);
await writeFile(path.join(output,'.nojekyll'),'');
console.log(`Built ${count} static files in dist. Development controls disabled.`);
