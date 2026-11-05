const ITENS=[
["Estou com sede.mp3","QueroBeberAgua.png","Sede","SEDE"],
["Quero comer.mp3","EstouComFome.png","Comer","COMER"],
["Quero ir ao banheiro.mp3","QueroIrAoBanheiro.png","Banheiro","BANHEIRO"],
["Estou com sono.mp3","EstouComSono.png","Sono","SONO"],
["Quero brincar.mp3","QueroBrincar.png","Brincar","BRINCAR"],
["Hora de estudar.mp3","HoraDeEstudar.png","Estudar","ESTUDAR"],
["Estou com dor.mp3","EstouComDor.png","Dor","COM DOR"],
["Hora de ir embora.mp3","HoraDeIrEmbora.png","Embora","IR EMBORA"]];
const $=id=>document.getElementById(id);
let alunos=[],atual=null,edicao=false,organizar=false,audioAtual=null,item=null,generoNovo='menino';
try{alunos=JSON.parse(localStorage.getItem('ff-alunos')||'[]')}catch(e){}
const salvar=()=>{try{localStorage.setItem('ff-alunos',JSON.stringify(alunos))}catch(e){}};

// Fotos personalizadas ficam só neste aparelho (IndexedDB)
const db=new Promise((ok,err)=>{const r=indexedDB.open('falafacil',1);r.onupgradeneeded=()=>r.result.createObjectStore('fotos');r.onsuccess=()=>ok(r.result);r.onerror=()=>err(r.error)});
const idb=(modo,fn)=>db.then(d=>new Promise((ok,err)=>{const t=d.transaction('fotos',modo),rq=fn(t.objectStore('fotos'));t.oncomplete=()=>ok(rq&&rq.result);t.onerror=()=>err(t.error)}));
const chave=img=>atual.id+'/'+img;

function reduzir(file){return new Promise((ok,err)=>{const im=new Image(),u=URL.createObjectURL(file);im.onload=()=>{const e=Math.min(1,600/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*e;c.height=im.height*e;c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(ok,'image/jpeg',.8)};im.onerror=err;im.src=u})}

function tocar(arq){
  pararFala();
  if(audioAtual){audioAtual.pause();audioAtual.currentTime=0}
  audioAtual=new Audio('audio/'+arq);
  audioAtual.play().catch(()=>alert('Não foi possível tocar o áudio.'));
}

function mostrar(lista){$('tela-alunos').hidden=!lista;$('tela-aluno').hidden=lista}

function listar(){
  document.body.className='tema-menino';$('titulo').textContent='FalaFácil';
  const l=$('lista-alunos');l.innerHTML='';
  alunos.forEach(a=>{
    const linha=document.createElement('div');linha.className='linha';
    const b=document.createElement('button');b.type='button';b.className='aluno tema-'+a.genero;b.textContent=a.nome;b.onclick=()=>abrir(a.id);
    const x=document.createElement('button');x.type='button';x.className='lixo';x.textContent='🗑';x.setAttribute('aria-label','Excluir '+a.nome);x.onclick=()=>excluirAluno(a);
    linha.append(b,x);l.append(linha);
  });
  $('lista-alunos').hidden=!alunos.length;$('tela-alunos').classList.toggle('vazio',!alunos.length);
  mostrar(true);
}

function aplicarEdicao(){
  $('editar').setAttribute('aria-pressed',edicao);$('editar').textContent=edicao?'Concluir':'Editar fotos';
  $('organizar').setAttribute('aria-pressed',organizar);$('organizar').textContent=organizar?'Concluir':'Organizar';
  $('aviso').hidden=!(edicao||organizar);
  $('aviso').textContent=organizar?'Use as setas para mudar a posição e o olho para esconder ou mostrar.':'Toque em um quadrado para trocar a foto ou editar o card.';
  $('excluir').hidden=!edicao;$('grade').classList.toggle('edicao',edicao);
}

function todosCards(){
  const t=[...ITENS.map(it=>({id:it[1],it})),...(atual.extras||[]).map(x=>({id:'x'+x.id,x}))],o=atual.ordem||[];
  return t.sort((a,b)=>{const p=o.indexOf(a.id),q=o.indexOf(b.id);return(p<0?999:p)-(q<0?999:q)});
}
function mover(i,d){const ids=todosCards().map(c=>c.id);[ids[i],ids[i+d]]=[ids[i+d],ids[i]];atual.ordem=ids;salvar();desenhar()}
function esconder(id){const o=atual.ocultos||[];atual.ocultos=o.includes(id)?o.filter(x=>x!==id):[...o,id];salvar();desenhar()}
async function desenhar(){
  const g=$('grade');g.innerHTML='';
  const todos=todosCards(),ocultos=atual.ocultos||[];
  for(let i=0;i<todos.length;i++){
    const c=todos[i],oculto=ocultos.includes(c.id);
    if(oculto&&!organizar)continue;
    const foto=await idb('readonly',q=>q.get(c.it?chave(c.it[1]):chaveX(atual,c.x,'foto')));
    const rot=c.it?c.it[3]:c.x.rot;
    const b=document.createElement(organizar?'div':'button');if(!organizar)b.type='button';
    b.className='item-box'+(oculto?' oculto':'');
    const im=document.createElement('img');im.alt=rot;
    im.src=foto?URL.createObjectURL(foto):(c.it?'imagens/'+(atual.genero==='menina'?'Menina':'Menino')+'/'+c.it[1]:'');
    const l=document.createElement('div');l.className='label';l.textContent=rot;b.append(im,l);
    if(organizar){
      const k=document.createElement('div');k.className='ctrl';
      const mk=(t,aria,fn,dis)=>{const x=document.createElement('button');x.type='button';x.textContent=t;x.setAttribute('aria-label',aria);x.disabled=!!dis;x.onclick=fn;return x};
      k.append(mk('◀','Mover para antes',()=>mover(i,-1),i===0),mk(oculto?'🚫':'👁',oculto?'Mostrar card':'Esconder card',()=>esconder(c.id)),mk('▶','Mover para depois',()=>mover(i,1),i===todos.length-1));
      b.append(k);
    }else b.onclick=()=>{
      if(edicao){if(c.it){item=c.it;$('dlg-titulo').textContent='Foto de '+rot;$('dlg').showModal()}else abrirCard(c.x)}
      else if(c.it)tocar(c.it[0]);else tocarCard(c.x);
    };
    g.append(b);
  }
}

async function abrir(id){
  atual=alunos.find(a=>a.id===id);if(!atual)return;edicao=false;organizar=false;
  try{localStorage.setItem('ff-ultimo',id)}catch(e){}
  document.body.className='tema-'+atual.genero;$('titulo').textContent=atual.nome;
  mostrar(false);aplicarEdicao();await desenhar();
}

document.querySelectorAll('.seletor-btn').forEach(b=>b.onclick=()=>{
  generoNovo=b.dataset.genero;
  document.querySelectorAll('.seletor-btn').forEach(x=>x.setAttribute('aria-pressed',x===b));
});
$('criar').onclick=()=>{
  const nome=$('nome').value.trim();if(!nome){$('nome').focus();return}
  const a={id:Date.now().toString(36),nome,genero:generoNovo};
  alunos.push(a);salvar();$('nome').value='';abrir(a.id);
};
$('voltar').onclick=()=>{try{localStorage.removeItem('ff-ultimo')}catch(e){}listar()};
$('editar').onclick=async()=>{edicao=!edicao;organizar=false;aplicarEdicao();await desenhar()};
$('organizar').onclick=async()=>{organizar=!organizar;edicao=false;aplicarEdicao();await desenhar()};
$('add-card').onclick=()=>abrirCard(null);
async function excluirAluno(a){
  if(!confirm('Excluir '+a.nome+' e as fotos dele(a) deste aparelho? Isso não pode ser desfeito.'))return;
  for(const it of ITENS)await idb('readwrite',s=>s.delete(a.id+'/'+it[1]));
  for(const x of a.extras||[]){await idb('readwrite',s=>s.delete(chaveX(a,x,'foto')));await idb('readwrite',s=>s.delete(chaveX(a,x,'audio')))}
  alunos=alunos.filter(x=>x.id!==a.id);salvar();
  try{localStorage.removeItem('ff-ultimo')}catch(e){}
  listar();
}
$('excluir').onclick=()=>excluirAluno(atual);
['f-cam','f-gal'].forEach(i=>$(i).onchange=async e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const b=await reduzir(f);await idb('readwrite',s=>s.put(b,chave(item[1])));$('dlg').close();await desenhar()}
  catch(x){alert('Não foi possível salvar a foto. Tente outra imagem.')}
});
$('padrao').onclick=async()=>{await idb('readwrite',s=>s.delete(chave(item[1])));$('dlg').close();await desenhar()};
$('fechar').onclick=()=>$('dlg').close();

// ---------- Cards personalizados (nome, foto e áudio criados pelo professor) ----------
let cardEdit=null,fotoNova=null,audioNovo=null,modoAudio='nenhum',gravador=null,pedacos=[];
const chaveX=(a,x,t)=>a.id+'/x'+x.id+'/'+t;

const nativo=()=>window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform();
function pararFala(){try{if(nativo())Capacitor.nativePromise('TextToSpeech','stop',{}).catch(()=>{});else if('speechSynthesis' in window)speechSynthesis.cancel()}catch(e){}}
function falar(t){
  pararFala();
  const erro=()=>alert('Não foi possível falar o texto neste aparelho. Use a opção "Áudio".');
  if(nativo()){try{Capacitor.nativePromise('TextToSpeech','speak',{text:t,lang:'pt-BR',rate:.9,pitch:1,volume:1,category:'ambient'}).catch(erro)}catch(e){erro()}return}
  if(!('speechSynthesis' in window)){erro();return}
  const u=new SpeechSynthesisUtterance(t);u.lang='pt-BR';u.rate=.9;speechSynthesis.speak(u);
}
function tocarBlob(b){
  if(audioAtual)audioAtual.pause();
  audioAtual=new Audio(URL.createObjectURL(b));audioAtual.play().catch(()=>alert('Não foi possível tocar o áudio.'));
}
async function tocarCard(x){
  pararFala();
  if(audioAtual){audioAtual.pause();audioAtual.currentTime=0}
  if(x.modo==='texto'&&x.texto)falar(x.texto);
  else if(x.modo==='gravado'){const b=await idb('readonly',q=>q.get(chaveX(atual,x,'audio')));if(b)tocarBlob(b)}
}
function atualizarModo(){
  document.querySelectorAll('.modo-btn').forEach(b=>b.setAttribute('aria-pressed',b.dataset.modo===modoAudio));
  $('sec-gravar').hidden=modoAudio!=='gravado';$('sec-texto').hidden=modoAudio!=='texto';
  $('btn-ouvir').hidden=!(audioNovo||(cardEdit&&cardEdit.temAudio));
  $('btn-gravar').textContent=$('btn-ouvir').hidden?'● Gravar':'● Gravar de novo';
}
async function abrirCard(x){
  cardEdit=x;fotoNova=audioNovo=null;modoAudio=x?x.modo:'nenhum';
  $('dc-titulo').textContent=x?'Editar card':'Novo card';
  $('c-nome').value=x?x.rot:'';$('c-texto').value=x?x.texto||'':'';$('c-excluir').hidden=!x;
  $('c-prev').hidden=!x;
  if(x){const f=await idb('readonly',q=>q.get(chaveX(atual,x,'foto')));if(f)$('c-prev').src=URL.createObjectURL(f)}
  atualizarModo();$('dlg-card').showModal();
}
document.querySelectorAll('.modo-btn').forEach(b=>b.onclick=()=>{modoAudio=b.dataset.modo;atualizarModo()});
['c-cam','c-gal'].forEach(i=>$(i).onchange=async e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  try{fotoNova=await reduzir(f);$('c-prev').src=URL.createObjectURL(fotoNova);$('c-prev').hidden=false}
  catch(x){alert('Não foi possível usar essa imagem.')}
});
$('btn-gravar').onclick=async()=>{
  if(gravador&&gravador.state==='recording'){gravador.stop();return}
  try{
    const st=await navigator.mediaDevices.getUserMedia({audio:true});
    pedacos=[];gravador=new MediaRecorder(st);
    gravador.ondataavailable=e=>pedacos.push(e.data);
    gravador.onstop=()=>{st.getTracks().forEach(t=>t.stop());audioNovo=new Blob(pedacos,{type:gravador.mimeType||'audio/webm'});atualizarModo()};
    gravador.start();$('btn-gravar').textContent='■ Parar gravação';
  }catch(e){alert('Não foi possível usar o microfone. Verifique a permissão do aplicativo.')}
};
$('c-arq').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;if(f.size>5e6){alert('Arquivo grande demais (máximo 5 MB).');return}audioNovo=f;atualizarModo()};
$('btn-ouvir').onclick=async()=>{
  const b=audioNovo||await idb('readonly',q=>q.get(chaveX(atual,cardEdit,'audio')));if(b)tocarBlob(b);
};
$('btn-falar').onclick=()=>{const t=$('c-texto').value.trim();if(t)falar(t)};
$('c-fechar').onclick=()=>{if(gravador&&gravador.state==='recording')gravador.stop();$('dlg-card').close()};
$('c-salvar').onclick=async()=>{
  const nome=$('c-nome').value.trim(),texto=$('c-texto').value.trim();
  if(!nome){$('c-nome').focus();return}
  if(!cardEdit&&!fotoNova){alert('Escolha uma foto para o card.');return}
  if(modoAudio==='texto'&&!texto){$('c-texto').focus();return}
  if(modoAudio==='gravado'&&!audioNovo&&!(cardEdit&&cardEdit.temAudio)){alert('Grave um áudio ou escolha outra opção.');return}
  const x=cardEdit||{id:Date.now().toString(36)};
  x.rot=nome;x.modo=modoAudio;x.texto=modoAudio==='texto'?texto:'';
  try{
    if(fotoNova)await idb('readwrite',q=>q.put(fotoNova,chaveX(atual,x,'foto')));
    if(modoAudio==='gravado'&&audioNovo){await idb('readwrite',q=>q.put(audioNovo,chaveX(atual,x,'audio')));x.temAudio=true}
    if(modoAudio!=='gravado'&&x.temAudio){await idb('readwrite',q=>q.delete(chaveX(atual,x,'audio')));x.temAudio=false}
  }catch(e){alert('Não foi possível salvar o card.');return}
  atual.extras=atual.extras||[];if(!cardEdit)atual.extras.push(x);
  salvar();$('dlg-card').close();await desenhar();
};
$('c-excluir').onclick=async()=>{
  if(!confirm('Excluir o card "'+cardEdit.rot+'"?'))return;
  await idb('readwrite',q=>q.delete(chaveX(atual,cardEdit,'foto')));await idb('readwrite',q=>q.delete(chaveX(atual,cardEdit,'audio')));
  atual.extras=atual.extras.filter(e=>e!==cardEdit);salvar();$('dlg-card').close();await desenhar();
};

// ---------- Imprimir (2 ou 3 colunas), baixar PDF e backup ----------
let colunas=2;
const porFolha=()=>colunas*4;
const cardsImpressao=()=>{const o=atual.ocultos||[];return todosCards().filter(c=>!o.includes(c.id))};
async function srcCard(c){
  const f=await idb('readonly',q=>q.get(c.it?chave(c.it[1]):chaveX(atual,c.x,'foto')));
  return f?URL.createObjectURL(f):(c.it?'imagens/'+(atual.genero==='menina'?'Menina':'Menino')+'/'+c.it[1]:'');
}
async function imprimir(){
  const cards=cardsImpressao(),f=$('folha');f.innerHTML='';f.className='folha-'+colunas;
  for(let i=0;i<cards.length;i+=porFolha()){
    const pg=document.createElement('section');pg.className='folha-pagina';
    const t=document.createElement('div');t.className='folha-titulo';t.textContent='FalaFácil – '+atual.nome;pg.append(t);
    const g=document.createElement('div');g.className='folha-grade';
    for(const c of cards.slice(i,i+porFolha())){
      const d=document.createElement('div');d.className='folha-card';
      const im=document.createElement('img');im.alt='';im.src=await srcCard(c);
      const l=document.createElement('div');l.textContent=c.it?c.it[3]:c.x.rot;
      d.append(im,l);g.append(d);
    }
    pg.append(g);f.append(pg);
  }
  await Promise.all([...f.querySelectorAll('img')].map(im=>im.decode?im.decode().catch(()=>{}):0));
  if(window.AndroidPrint)window.AndroidPrint.print();else window.print();
}
const carregar=src=>new Promise(ok=>{const im=new Image();im.onload=()=>ok(im);im.onerror=()=>ok(null);im.src=src});
async function paginasJPEG(){
  const cards=cardsImpressao(),W=1240,H=1754,M=59,G=colunas===3?30:35,cw=(W-2*M-G*(colunas-1))/colunas,ch=343,topo=135,out=[];
  for(let i=0;i<cards.length;i+=porFolha()){
    const cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
    x.fillStyle='#fff';x.fillRect(0,0,W,H);x.textAlign='center';x.textBaseline='middle';
    x.fillStyle='#1F497D';x.font='bold 42px Arial,sans-serif';x.fillText('FalaFácil – '+atual.nome,W/2,M+22);
    const lote=cards.slice(i,i+porFolha());
    for(let k=0;k<lote.length;k++){
      const c=lote[k],px=M+(k%colunas)*(cw+G),py=topo+Math.floor(k/colunas)*(ch+35),im=await carregar(await srcCard(c));
      x.save();x.beginPath();x.roundRect(px,py,cw,ch,24);x.clip();x.fillStyle='#eee';x.fillRect(px,py,cw,ch);
      if(im){const s=Math.max(cw/im.width,ch/im.height),dw=im.width*s,dh=im.height*s;x.drawImage(im,px+(cw-dw)/2,py+(ch-dh)/2,dw,dh)}
      x.fillStyle='#222';x.fillRect(px,py+ch-58,cw,58);
      x.fillStyle='#fff';x.font='bold '+(colunas===3?30:36)+'px Arial,sans-serif';x.fillText((c.it?c.it[3]:c.x.rot).toUpperCase(),px+cw/2,py+ch-29);
      x.restore();
      x.setLineDash([12,8]);x.strokeStyle='#555';x.lineWidth=3;x.beginPath();x.roundRect(px,py,cw,ch,24);x.stroke();x.setLineDash([]);
    }
    const blob=await new Promise(ok=>cv.toBlob(ok,'image/jpeg',.88));
    out.push({bytes:new Uint8Array(await blob.arrayBuffer()),w:W,h:H});
  }
  return out;
}
function montarPDF(pags){
  const enc=new TextEncoder(),partes=[],offs=[];let pos=0;
  const add=v=>{const b=typeof v==='string'?enc.encode(v):v;partes.push(b);pos+=b.length};
  const obj=(id,dict,stream)=>{offs[id]=pos;add(id+' 0 obj\n'+dict+'\n');if(stream){add('stream\n');add(stream);add('\nendstream\n')}add('endobj\n')};
  const n=pags.length,total=2+3*n;
  add('%PDF-1.4\n');
  obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
  obj(2,'<< /Type /Pages /Kids ['+pags.map((_,i)=>(3+3*i)+' 0 R').join(' ')+'] /Count '+n+' >>');
  pags.forEach((p,i)=>{
    const pg=3+3*i,ct=4+3*i,im=5+3*i,cont='q 595.28 0 0 841.89 0 0 cm /Im0 Do Q';
    obj(pg,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 '+im+' 0 R >> >> /Contents '+ct+' 0 R >>');
    obj(ct,'<< /Length '+cont.length+' >>',cont);
    obj(im,'<< /Type /XObject /Subtype /Image /Width '+p.w+' /Height '+p.h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+p.bytes.length+' >>',p.bytes);
  });
  const xr=pos;add('xref\n0 '+(total+1)+'\n0000000000 65535 f \n');
  for(let i=1;i<=total;i++)add(String(offs[i]).padStart(10,'0')+' 00000 n \n');
  add('trailer\n<< /Size '+(total+1)+' /Root 1 0 R >>\nstartxref\n'+xr+'\n%%EOF');
  return new Blob(partes,{type:'application/pdf'});
}
// Entrega um arquivo: no Android abre o compartilhar (salvar/enviar); no navegador baixa direto
const blobB64=b=>new Promise((ok,err)=>{const r=new FileReader();r.onload=()=>ok(r.result.split(',')[1]);r.onerror=err;r.readAsDataURL(b)});
const b64Blob=(b64,tipo)=>{const bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new Blob([u],{type:tipo})};
async function entregarArquivo(nome,blob){
  if(nativo()){
    const r=await Capacitor.nativePromise('Filesystem','writeFile',{path:nome,data:await blobB64(blob),directory:'CACHE'});
    await Capacitor.nativePromise('Share','share',{title:nome,dialogTitle:'Salvar ou enviar',url:r.uri});
  }else{
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=nome;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  }
}
async function baixarPDF(){
  aviso('Gerando PDF…');
  const pags=await paginasJPEG();
  await entregarArquivo('FalaFacil-cards-'+atual.nome.replace(/[^\w-]+/g,'_')+'.pdf',montarPDF(pags));
}
async function fazerBackup(){
  const chaves=await idb('readonly',q=>q.getAllKeys()),arquivos={};
  for(const k of chaves){const b=await idb('readonly',q=>q.get(k));if(b)arquivos[k]={tipo:b.type||'application/octet-stream',dados:await blobB64(b)}}
  const dados=JSON.stringify({app:'FalaFacil',versao:1,data:new Date().toISOString(),alunos,arquivos});
  await entregarArquivo('FalaFacil-backup-'+new Date().toISOString().slice(0,10)+'.json',new Blob([dados],{type:'application/json'}));
}
async function restaurarBackup(arq){
  let d;try{d=JSON.parse(await arq.text())}catch(e){alert('Arquivo de backup inválido.');return}
  if(d.app!=='FalaFacil'||!Array.isArray(d.alunos)){alert('Este arquivo não é um backup do FalaFácil.');return}
  if(!confirm('Restaurar o backup com '+d.alunos.length+' aluno(s)? Alunos com o mesmo código serão substituídos.'))return;
  for(const [k,v] of Object.entries(d.arquivos||{}))await idb('readwrite',q=>q.put(b64Blob(v.dados,v.tipo),k));
  for(const a of d.alunos){const i=alunos.findIndex(x=>x.id===a.id);if(i>=0)alunos[i]=a;else alunos.push(a)}
  salvar();listar();aviso('Backup restaurado');
}
function atualizarColunas(){document.querySelectorAll('.col-btn').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.col===colunas))}
$('imprimir').onclick=()=>{atualizarColunas();$('dlg-imp').showModal()};
document.querySelectorAll('.col-btn').forEach(b=>b.onclick=()=>{colunas=+b.dataset.col;atualizarColunas()});
$('imp-print').onclick=()=>{$('dlg-imp').close();imprimir()};
$('imp-pdf').onclick=async()=>{$('dlg-imp').close();try{await baixarPDF()}catch(e){alert('Não foi possível gerar o PDF.')}};
$('imp-fechar').onclick=()=>$('dlg-imp').close();
$('bk-salvar').onclick=async()=>{try{await fazerBackup()}catch(e){alert('Não foi possível salvar o backup.')}};
$('bk-arq').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)restaurarBackup(f)};

// Modo professor: segurar o título por 3 segundos mostra/esconde os botões de gerenciar
let tmrProf=null,tmrToast=null;
function aviso(t){const e=$('toast');e.textContent=t;e.hidden=false;clearTimeout(tmrToast);tmrToast=setTimeout(()=>e.hidden=true,2200)}
function alternarProfessor(){
  const on=document.documentElement.classList.toggle('professor');
  if(!on){edicao=organizar=false;if(atual&&!$('tela-aluno').hidden){aplicarEdicao();desenhar()}}
  aviso('Modo professor '+(on?'ligado':'desligado'));
}
$('titulo').addEventListener('pointerdown',()=>{tmrProf=setTimeout(alternarProfessor,3000)});
['pointerup','pointerleave','pointercancel'].forEach(e=>$('titulo').addEventListener(e,()=>clearTimeout(tmrProf)));
$('titulo').addEventListener('contextmenu',e=>e.preventDefault());
$('versao').textContent='Versão '+(window.FF_VERSAO||'web');

listar();
let ultimo=null;try{ultimo=localStorage.getItem('ff-ultimo')}catch(e){}
if(ultimo)abrir(ultimo);
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js');
