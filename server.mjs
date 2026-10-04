import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {publicPath,CONTENT_SECURITY_POLICY} from './scripts/static-policy.mjs';
const workspace=path.dirname(fileURLToPath(import.meta.url));
const root=process.argv.includes('--release')?path.join(workspace,'dist'):workspace;
const port=Number(process.env.PORT||5174);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':`${CONTENT_SECURITY_POLICY}; frame-ancestors 'none'`,'X-Frame-Options':'DENY'};
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{...headers,Allow:'GET, HEAD'}).end();return;}
  const relative=publicPath(req.url);
  if(!relative){res.writeHead(404,headers).end('Not found');return;}
  try{
    const file=await fs.realpath(path.join(root,relative));
    const realRoot=await fs.realpath(root);
    if(!file.startsWith(realRoot+path.sep))throw new Error('Outside site');
    const data=await fs.readFile(file);
    res.writeHead(200,{...headers,'Content-Type':mime[path.extname(file)]||'application/octet-stream'});
    res.end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(404,headers).end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Driver Sweet Lover: http://127.0.0.1:${server.address().port}${process.argv.includes('--release')?' (release)':''}`));
