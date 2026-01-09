const canvas=document.getElementById('canvas');
const ctx=canvas.getContext('2d');
let scale=1, offset={x:0,y:0}, panning=false, last={x:0,y:0};

function resize(){
  const r=canvas.parentElement.getBoundingClientRect();
  canvas.width=r.width*devicePixelRatio;
  canvas.height=r.height*devicePixelRatio;
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  draw();
}
window.addEventListener('resize',resize);

canvas.addEventListener('pointerdown',e=>{
  panning=true; last={x:e.clientX,y:e.clientY};
});
canvas.addEventListener('pointermove',e=>{
  if(!panning) return;
  offset.x+=e.clientX-last.x;
  offset.y+=e.clientY-last.y;
  last={x:e.clientX,y:e.clientY};
  draw();
});
canvas.addEventListener('pointerup',()=>panning=false);
canvas.addEventListener('wheel',e=>{
  e.preventDefault();
  scale=Math.min(4,Math.max(0.5,scale+(e.deltaY<0?0.1:-0.1)));
  draw();
},{passive:false});

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.translate(offset.x,offset.y);
  ctx.scale(scale,scale);
  ctx.strokeStyle='rgba(255,255,255,.2)';
  for(let x=0;x<1000;x+=40){
    ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1000);ctx.stroke();
  }
  for(let y=0;y<1000;y+=40){
    ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1000,y);ctx.stroke();
  }
  ctx.restore();
}
resize();
