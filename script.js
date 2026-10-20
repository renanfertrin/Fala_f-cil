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
let alunos=[],atual=null,edicao=false,audioAtual=null,item=null,generoNovo='menino';
try{alunos=JSON.parse(localStorage.getItem('ff-alunos')||'[]')}catch(e){}
const salvar=()=>{try{localStorage.setItem('ff-alunos',JSON.stringify(alunos))}catch(e){}};

// Fotos personalizadas ficam só neste aparelho (IndexedDB)
const db=new Promise((ok,err)=>{const r=indexedDB.open('falafacil',1);r.onupgradeneeded=()=>r.result.createObjectStore('fotos');r.onsuccess=()=>ok(r.result);r.onerror=()=>err(r.error)});
const idb=(modo,fn)=>db.then(d=>new Promise((ok,err)=>{const t=d.transaction('fotos',modo),rq=fn(t.objectStore('fotos'));t.oncomplete=()=>ok(rq&&rq.result);t.onerror=()=>err(t.error)}));
const chave=img=>atual.id+'/'+img;

function reduzir(file){return new Promise((ok,err)=>{const im=new Image(),u=URL.createObjectURL(file);im.onload=()=>{const e=Math.min(1,600/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*e;c.height=im.height*e;c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(ok,'image/jpeg',.8)};im.onerror=err;im.src=u})}

function tocar(arq){
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
  $('lista-alunos').hidden=!alunos.length;
  mostrar(true);
}

function aplicarEdicao(){
  $('editar').setAttribute('aria-pressed',edicao);$('editar').textContent=edicao?'Concluir':'Editar fotos';
  $('aviso').hidden=$('excluir').hidden=!edicao;$('grade').classList.toggle('edicao',edicao);
}

async function desenhar(){
  const g=$('grade');g.innerHTML='';
  for(const it of ITENS){
    const [audio,img,alt,rot]=it,foto=await idb('readonly',s=>s.get(chave(img)));
    const b=document.createElement('button');b.type='button';b.className='item-box';
    const im=document.createElement('img');im.alt=alt;
    im.src=foto?URL.createObjectURL(foto):'imagens/'+(atual.genero==='menina'?'Menina':'Menino')+'/'+img;
    const l=document.createElement('div');l.className='label';l.textContent=rot;
    b.append(im,l);
    b.onclick=()=>{if(edicao){item=it;$('dlg-titulo').textContent='Foto de '+rot;$('dlg').showModal()}else tocar(audio)};
    g.append(b);
  }
}

async function abrir(id){
  atual=alunos.find(a=>a.id===id);if(!atual)return;edicao=false;
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
$('editar').onclick=()=>{edicao=!edicao;aplicarEdicao()};
async function excluirAluno(a){
  if(!confirm('Excluir '+a.nome+' e as fotos dele(a) deste aparelho? Isso não pode ser desfeito.'))return;
  for(const it of ITENS)await idb('readwrite',s=>s.delete(a.id+'/'+it[1]));
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

listar();
let ultimo=null;try{ultimo=localStorage.getItem('ff-ultimo')}catch(e){}
if(ultimo)abrir(ultimo);
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js');
