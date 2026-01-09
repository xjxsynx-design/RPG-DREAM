const canvas=document.getElementById('world');
const ctx=canvas.getContext('2d');
const TILE=40;
const WORLD=200;

const camera={x:0,y:0,zoom:1};
let dragging=false,last={x:0,y:0};

function resize(){
  const r=canvas.parentElement.getBoundingClientRect();
  canvas.width=r.width*devicePixelRatio;
  canvas.height=r.height*devicePixelRatio;
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  draw();
}
window.addEventListener('resize',resize);

canvas.addEventListener('pointerdown',e=>{
  dragging=true; last={x:e.clientX,y:e.clientY};
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
  if(!dragging) return;
  camera.x+=(e.clientX-last.x)/camera.zoom;
  camera.y+=(e.clientY-last.y)/camera.zoom;
  last={x:e.clientX,y:e.clientY};
  draw();
});
canvas.addEventListener('pointerup',()=>dragging=false);
canvas.addEventListener('wheel',e=>{
  e.preventDefault();
  const z=camera.zoom+(e.deltaY<0?0.1:-0.1);
  camera.zoom=Math.min(4,Math.max(0.5,z));
  draw();
},{passive:false});

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.translate(canvas.width/2/camera.zoom,canvas.height/2/camera.zoom);
  ctx.scale(camera.zoom,camera.zoom);
  ctx.translate(camera.x,camera.y);

  ctx.strokeStyle='rgba(255,255,255,.15)';
  for(let x=0;x<=WORLD;x++){
    ctx.beginPath();
    ctx.moveTo(x*TILE,0);
    ctx.lineTo(x*TILE,WORLD*TILE);
    ctx.stroke();
  }
  for(let y=0;y<=WORLD;y++){
    ctx.beginPath();
    ctx.moveTo(0,y*TILE);
    ctx.lineTo(WORLD*TILE,y*TILE);
    ctx.stroke();
  }
  ctx.restore();
}

resize();
