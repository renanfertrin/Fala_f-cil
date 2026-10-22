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
