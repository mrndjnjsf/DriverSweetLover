import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
function files(directory) {
  return readdirSync(directory, {withFileTypes:true}).flatMap(entry =>
    entry.isDirectory() ? files(join(directory, entry.name)) : /\.m?js$/.test(entry.name) ? [join(directory, entry.name)] : []);
}
const sources=['server.mjs',...files('src'),...files('scripts'),...files('tests')];
for (const file of sources) {
  const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`Syntax checked ${sources.length} JavaScript files.`);
