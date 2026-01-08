const TILE=48;
const map=document.getElementById('map');
const ctx=map.getContext('2d');
const palette=document.getElementById('palettePanel');
const toggle=document.getElementById('paletteToggle');

let camX=0,camY=0,drag=false,lastX=0,lastY=0;
const cols=80,rows=80;
let grid=Array.from({length:rows},()=>Array.from({length:cols},()=>null));

function resize(){map.width=innerWidth;map.height=innerHeight-120;draw();}
addEventListener('resize',resize);resize();

const biomes={
 grassland:[{id:'grass_g',color:'#4caf50'}],
 plains:[{id:'plains',color:'#7cb342'}],
 desert:[{id:'desert',color:'#d7b56d'}],
 tropical:[{id:'tropical',color:'#2ecc71'}],
 wetlands:[{id:'wetlands',color:'#5d8c6a'}],
 volcanic:[{id:'volcanic',color:'#b03a2e'}]
};

let current=null;

Object.entries(biomes).forEach(([b,tiles])=>{
  tiles.forEach(t=>{
    const d=document.createElement('div');
    d.className='tile';
    d.style.background=t.color;
    d.title=b;
    d.onclick=()=>{
      document.querySelectorAll('.tile').forEach(x=>x.classList.remove('selected'));
      d.classList.add('selected');
      current=t;
    };
    palette.appendChild(d);
  });
});

toggle.onclick=()=>palette.classList.toggle('hidden');

map.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY});
map.addEventListener('pointermove',e=>{
 if(drag){camX+=lastX-e.clientX;camY+=lastY-e.clientY;lastX=e.clientX;lastY=e.clientY;draw();}
});
map.addEventListener('pointerup',()=>drag=false);

map.addEventListener('dblclick',e=>{
 if(!current)return;
 const r=map.getBoundingClientRect();
 const x=Math.floor((e.clientX+camX-r.left)/TILE);
 const y=Math.floor((e.clientY+camY-r.top)/TILE);
 if(x>=0&&y>=0&&x<cols&&y<rows){grid[y][x]=current.color;draw();}
});

function draw(){
 ctx.clearRect(0,0,map.width,map.height);
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const px=x*TILE-camX,py=y*TILE-camY;
  if(px>-TILE&&py>-TILE&&px<map.width&&py<map.height){
    if(grid[y][x]){ctx.fillStyle=grid[y][x];ctx.fillRect(px,py,TILE,TILE);}
    ctx.strokeStyle='#222';ctx.strokeRect(px,py,TILE,TILE);
  }
 }
}
draw();
