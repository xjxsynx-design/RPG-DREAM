const TILE=48;
const map=document.getElementById('map');
const ctx=map.getContext('2d');
const palette=document.getElementById('palettePanel');
const toggle=document.getElementById('paletteToggle');

let camX=0, camY=0, dragging=false, lastX=0, lastY=0;

// world size (much larger)
const cols=60, rows=60;
let grid=Array.from({length:rows},()=>Array.from({length:cols},()=>null));

function resize(){
  map.width=window.innerWidth;
  map.height=window.innerHeight-120;
  draw();
}
window.addEventListener('resize',resize);
resize();

const tiles=[
 {id:'grass',name:'Grass',color:'#4caf50',desc:'Short green grass'},
 {id:'dirt',name:'Dirt',color:'#8b5a2b',desc:'Packed dirt'},
 {id:'water',name:'Water',color:'#2196f3',desc:'Shallow water'}
];

let current=tiles[0];

tiles.forEach(t=>{
  const d=document.createElement('div');
  d.className='tile';
  d.style.background=t.color;
  d.title=t.name+': '+t.desc;
  d.onclick=()=>{
    document.querySelectorAll('.tile').forEach(x=>x.classList.remove('selected'));
    d.classList.add('selected');
    current=t;
  };
  palette.appendChild(d);
});

palette.firstChild.classList.add('selected');

toggle.onclick=()=>palette.classList.toggle('hidden');

map.addEventListener('pointerdown',e=>{
  dragging=true;
  lastX=e.clientX;
  lastY=e.clientY;
});

map.addEventListener('pointermove',e=>{
  if(dragging){
    camX+=lastX-e.clientX;
    camY+=lastY-e.clientY;
    lastX=e.clientX;
    lastY=e.clientY;
    draw();
  }
});

map.addEventListener('pointerup',()=>dragging=false);

map.addEventListener('dblclick',e=>{
  const rect=map.getBoundingClientRect();
  const x=Math.floor((e.clientX+camX-rect.left)/TILE);
  const y=Math.floor((e.clientY+camY-rect.top)/TILE);
  if(x>=0&&y>=0&&x<cols&&y<rows){
    grid[y][x]=current.id;
    draw();
  }
});

function draw(){
  ctx.clearRect(0,0,map.width,map.height);
  for(let y=0;y<rows;y++){
    for(let x=0;x<cols;x++){
      const px=x*TILE-camX;
      const py=y*TILE-camY;
      if(px>-TILE&&py>-TILE&&px<map.width&&py<map.height){
        if(grid[y][x]){
          const t=tiles.find(tt=>tt.id===grid[y][x]);
          ctx.fillStyle=t.color;
          ctx.fillRect(px,py,TILE,TILE);
        }
        ctx.strokeStyle='#222';
        ctx.strokeRect(px,py,TILE,TILE);
      }
    }
  }
}

draw();

document.getElementById('saveBtn').onclick=()=>{
  localStorage.setItem('rpg_map',JSON.stringify({grid,camX,camY}));
  alert('Saved locally');
};

document.getElementById('exportBtn').onclick=()=>{
  const data={tileSize:TILE,tiles,grid};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='project.mk';
  a.click();
};
