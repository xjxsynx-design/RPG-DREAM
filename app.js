const TILE=48;
const map=document.getElementById('map');
const ctx=map.getContext('2d');
const palette=document.getElementById('palette');

const tiles=[
 {id:'grass',name:'Grass',color:'#4caf50',desc:'Short green grass'},
 {id:'dirt',name:'Dirt',color:'#8b5a2b',desc:'Packed dirt'},
 {id:'water',name:'Water',color:'#2196f3',desc:'Shallow water'}
];

let current=tiles[0];
let cols=map.width/TILE, rows=map.height/TILE;
let grid=Array.from({length:rows},()=>Array.from({length:cols},()=>null));

tiles.forEach(t=>{
  const d=document.createElement('div');
  d.className='tile';
  d.style.background=t.color;
  d.title=t.name+': '+t.desc;
  d.onclick=()=>current=t;
  palette.appendChild(d);
});

map.addEventListener('pointerdown',e=>{
  const r=map.getBoundingClientRect();
  const x=Math.floor((e.clientX-r.left)/TILE);
  const y=Math.floor((e.clientY-r.top)/TILE);
  if(x>=0&&y>=0&&x<cols&&y<rows){
    grid[y][x]=current.id;
    draw();
  }
});

function draw(){
  ctx.clearRect(0,0,map.width,map.height);
  for(let y=0;y<rows;y++){
    for(let x=0;x<cols;x++){
      const id=grid[y][x];
      if(id){
        const t=tiles.find(tt=>tt.id===id);
        ctx.fillStyle=t.color;
        ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
      }
      ctx.strokeStyle='#222';
      ctx.strokeRect(x*TILE,y*TILE,TILE,TILE);
    }
  }
}
draw();

document.getElementById('saveBtn').onclick=()=>{
  localStorage.setItem('rpg_map',JSON.stringify(grid));
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
