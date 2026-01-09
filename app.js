const canvas=document.getElementById('grid');
const ctx=canvas.getContext('2d');
const TILE=40;
const W=50, H=50;

let mode='terrain';
let terrain={};

// size canvas larger than viewport to enable scroll
canvas.width=W*TILE;
canvas.height=H*TILE;

// UI bind
document.querySelectorAll('button').forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    mode=btn.dataset.mode;
  };
});

canvas.addEventListener('click',e=>{
  if(mode!=='terrain') return;
  const rect=canvas.getBoundingClientRect();
  const x=Math.floor((e.clientX-rect.left+canvas.parentElement.scrollLeft)/TILE);
  const y=Math.floor((e.clientY-rect.top+canvas.parentElement.scrollTop)/TILE);
  terrain[`${x},${y}`]=true;
  draw();
});

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='#222';
  for(let x=0;x<W;x++){
    for(let y=0;y<H;y++){
      ctx.strokeRect(x*TILE,y*TILE,TILE,TILE);
      if(terrain[`${x},${y}`]){
        ctx.fillStyle='#4da6ff';
        ctx.fillRect(x*TILE+4,y*TILE+4,TILE-8,TILE-8);
      }
    }
  }
}
draw();
