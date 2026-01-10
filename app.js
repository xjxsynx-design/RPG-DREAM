console.log('app.js loaded');

const TILE = 32;

const State = {
  mode: 'terrain',
  activeMap: null,
  maps: [],
  characters: [],
  activeCharacter: null,
  biome: 'Plains',
  tile: 'Grass'
};

const BIOMES = ['Plains','Desert','Tropical','Volcanic','Wetlands'];
const TILES = ['Grass','Water','Dirt','Stone'];
const TILE_COLORS = {
  Grass:'#16a34a',
  Water:'#2563eb',
  Dirt:'#92400e',
  Stone:'#6b7280'
};

const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas(){
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  draw();
}
window.addEventListener('resize', resizeCanvas);

function bindUI(){
  document.querySelectorAll('.mode-btn').forEach(btn=>{
    btn.onclick=()=>setMode(btn.dataset.mode);
  });

  document.getElementById('addMapBtn').onclick = addMap;
  document.getElementById('addCharacterBtn').onclick = addCharacter;
}

function setMode(mode){
  State.mode = mode;
  document.querySelectorAll('.mode-btn').forEach(b=>b.classList.toggle('active', b.dataset.mode===mode));
  document.getElementById('terrainPanel').classList.toggle('hidden', mode!=='terrain');
  document.getElementById('charactersPanel').classList.toggle('hidden', mode!=='characters');
}

function buildPalettes(){
  const bp = document.getElementById('biomePalette');
  const tp = document.getElementById('tilePalette');

  BIOMES.forEach(b=>{
    const el=document.createElement('div');
    el.className='chip'+(b===State.biome?' active':'');
    el.textContent=b;
    el.onclick=()=>{
      State.biome=b;
      [...bp.children].forEach(c=>c.classList.toggle('active',c===el));
    };
    bp.appendChild(el);
  });

  TILES.forEach(t=>{
    const el=document.createElement('div');
    el.className='chip'+(t===State.tile?' active':'');
    el.textContent=t;
    el.onclick=()=>{
      State.tile=t;
      [...tp.children].forEach(c=>c.classList.toggle('active',c===el));
    };
    tp.appendChild(el);
  });
}

function addMap(){
  const map={w:20,h:15,tiles:{}};
  State.maps.push(map);
  State.activeMap = map;
  draw();
}

function addCharacter(){
  const id='char_'+Math.random().toString(36).slice(2,6);
  const c={id,name:'Character '+State.characters.length};
  State.characters.push(c);
  State.activeCharacter=c;
  renderCharacters();
}

function renderCharacters(){
  const list=document.getElementById('characterList');
  list.innerHTML='';
  State.characters.forEach(c=>{
    const el=document.createElement('div');
    el.className='chip'+(c===State.activeCharacter?' active':'');
    el.textContent=c.name;
    el.onclick=()=>{State.activeCharacter=c;renderCharacters();};
    list.appendChild(el);
  });
}

canvas.onclick = e=>{
  if(!State.activeMap || State.mode!=='terrain') return;
  const r=canvas.getBoundingClientRect();
  const x=Math.floor((e.clientX-r.left)/TILE);
  const y=Math.floor((e.clientY-r.top)/TILE);
  State.activeMap.tiles[`${x},${y}`]=State.tile;
  draw();
};

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(!State.activeMap) return;

  for(let y=0;y<State.activeMap.h;y++){
    for(let x=0;x<State.activeMap.w;x++){
      ctx.strokeStyle='#1f2937';
      ctx.strokeRect(x*TILE,y*TILE,TILE,TILE);
      const t=State.activeMap.tiles[`${x},${y}`];
      if(t){
        ctx.fillStyle=TILE_COLORS[t];
        ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
      }
    }
  }
}

window.addEventListener('DOMContentLoaded',()=>{
  bindUI();
  buildPalettes();
  resizeCanvas();
});
