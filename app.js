console.log('app.js loaded');

const TILE=32;
const State={mode:'terrain',biome:'Plains',tile:'Grass',map:{w:20,h:15,tiles:{}}};
const Biomes=['Plains','Desert','Tropical','Volcanic','Wetlands'];
const Tiles=['Grass','Water','Dirt','Stone'];

const canvas=document.getElementById('mapCanvas');
const ctx=canvas.getContext('2d');

function resize(){canvas.width=canvas.clientWidth;canvas.height=canvas.clientHeight;draw()}
window.addEventListener('resize',resize);

function bindUI(){
 document.querySelectorAll('.mode-btn').forEach(b=>{
  b.onclick=()=>{
   State.mode=b.dataset.mode;
   document.querySelectorAll('.mode-btn').forEach(x=>x.classList.toggle('active',x===b));
  };
 });
}

function buildPalettes(){
 const bb=document.getElementById('biomes');
 const tb=document.getElementById('tiles');
 Biomes.forEach(b=>{
  const e=document.createElement('div');
  e.className='chip'+(b===State.biome?' active':'');
  e.textContent=b;
  e.onclick=()=>{State.biome=b;document.querySelectorAll('#biomes .chip').forEach(c=>c.classList.toggle('active',c===e))};
  bb.appendChild(e);
 });
 Tiles.forEach(t=>{
  const e=document.createElement('div');
  e.className='chip'+(t===State.tile?' active':'');
  e.textContent=t;
  e.onclick=()=>{State.tile=t;document.querySelectorAll('#tiles .chip').forEach(c=>c.classList.toggle('active',c===e))};
  tb.appendChild(e);
 });
}

canvas.onclick=e=>{
 if(State.mode!=='terrain')return;
 const r=canvas.getBoundingClientRect();
 const x=Math.floor((e.clientX-r.left)/TILE);
 const y=Math.floor((e.clientY-r.top)/TILE);
 State.map.tiles[`${x},${y}`]=State.tile;
 draw();
};

function draw(){
 ctx.clearRect(0,0,canvas.width,canvas.height);
 for(let y=0;y<State.map.h;y++){
  for(let x=0;x<State.map.w;x++){
   ctx.strokeStyle='#1f2937';
   ctx.strokeRect(x*TILE,y*TILE,TILE,TILE);
   const k=`${x},${y}`;
   if(State.map.tiles[k]){
    ctx.fillStyle={Grass:'#16a34a',Water:'#2563eb',Dirt:'#92400e',Stone:'#6b7280'}[State.map.tiles[k]];
    ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
   }
  }
 }
}

window.addEventListener('DOMContentLoaded',()=>{bindUI();buildPalettes();resize()});
