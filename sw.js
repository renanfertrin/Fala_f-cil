const V='ff-v5';
const BASE=["./", "index.html", "styles.css", "script.js", "manifest.webmanifest", "icone-urso-192.png","urso.svg","fundo-menino.svg","fundo-menina.svg", "icone-urso-512.png", "audio/Estou com dor.mp3", "audio/Estou com sede.mp3", "audio/Estou com sono.mp3", "audio/Hora de estudar.mp3", "audio/Hora de ir embora.mp3", "audio/Quero brincar.mp3", "audio/Quero comer.mp3", "audio/Quero ir ao banheiro.mp3"];
const IMGS=["imagens/Menino/EstouComDor.png", "imagens/Menino/EstouComFome.png", "imagens/Menino/EstouComSono.png", "imagens/Menino/HoraDeEstudar.png", "imagens/Menino/HoraDeIrEmbora.png", "imagens/Menino/QueroBeberAgua.png", "imagens/Menino/QueroBrincar.png", "imagens/Menino/QueroIrAoBanheiro.png", "imagens/Menina/EstouComDor.png", "imagens/Menina/EstouComFome.png", "imagens/Menina/EstouComSono.png", "imagens/Menina/HoraDeEstudar.png", "imagens/Menina/HoraDeIrEmbora.png", "imagens/Menina/QueroBeberAgua.png", "imagens/Menina/QueroBrincar.png", "imagens/Menina/QueroIrAoBanheiro.png"];
self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(V);await c.addAll(BASE);await Promise.allSettled(IMGS.map(u=>c.add(u)));self.skipWaiting()})()));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>clients.claim())));
const CODIGO=/\.(html|css|js|webmanifest)$|\/$/;
async function atender(req){
  // Arquivos do app (html/css/js): tenta a internet primeiro, para as atualizações chegarem logo
  if(CODIGO.test(new URL(req.url).pathname)){
    try{const n=await fetch(req.url,{cache:'no-cache'});if(n.status===200){(await caches.open(V)).put(req.url,n.clone());return n}}catch(e){}
  }
  let r=await caches.match(req.url);
  if(!r){r=await fetch(req.url);if(r.status===200)(await caches.open(V)).put(req.url,r.clone())}
  const rg=req.headers.get('range');
  if(!rg||r.status!==200)return r;
  const b=await r.blob(),p=rg.replace('bytes=','').split('-'),ini=+p[0],fim=p[1]?+p[1]:b.size-1;
  return new Response(b.slice(ini,fim+1),{status:206,headers:{'Content-Type':r.headers.get('Content-Type')||'audio/mpeg','Content-Range':'bytes '+ini+'-'+fim+'/'+b.size}});
}
self.addEventListener('fetch',e=>{if(e.request.method==='GET'&&e.request.url.startsWith(self.location.origin))e.respondWith(atender(e.request))});
