import { createServer } from 'node:http';
import { createReadStream,existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { dirname,extname,resolve,sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const directory=dirname(fileURLToPath(import.meta.url));
const root=resolve(directory,existsSync(resolve(directory,'game/index.html'))?'game':'../dist');
if(!existsSync(resolve(root,'index.html')))throw new Error('Compila el juego con npm run build antes de abrirlo.');
const port=Number(process.env.PORT??process.argv[2]??'4180');
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Puerto inválido.');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
createServer(async(request,response)=>{
  try{
    const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    if(!['GET','HEAD'].includes(request.method)){response.writeHead(405);response.end();return;}
    let target=resolve(root,'.'+pathname);
    if(target!==root&&!target.startsWith(root+sep)){response.writeHead(403);response.end();return;}
    if(pathname==='/'||(!extname(pathname)&&!existsSync(target)))target=resolve(root,'index.html');
    let info;try{info=await stat(target);}catch{response.writeHead(404);response.end('Archivo no encontrado');return;}
    if(!info.isFile()){response.writeHead(404);response.end();return;}
    response.writeHead(200,{'Content-Type':types[extname(target)]??'application/octet-stream','Content-Length':info.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    if(request.method==='HEAD'){response.end();return;}createReadStream(target).pipe(response);
  }catch{response.writeHead(400);response.end('Solicitud inválida');}
}).listen(port,'127.0.0.1',()=>console.log(`MANDATO listo en http://127.0.0.1:${port}/ · Guarda esta dirección para conservar tu partida. Ctrl+C cierra el servidor.`));
