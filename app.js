// E4f – Camera + UI Rebind
const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

const TILE = 40;
const WORLD = 200;

const State = {
  mode: 'terrain',
  maps: [{id:'map0', name:'Map 0'}],
  activeMap: 'map0'
};

const camera = { x:0, y:0, zoom:1 };
let dragging=false, last={x:0,y:0};

// ---------- UI REBIND ----------
document.querySelectorAll('[data-mode]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    State.mode = btn.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    status.textContent = 'Mode: ' + State.mode;
  });
});

document.getElementById('addMap').addEventListener('click',()=>{
  const id='map'+State.maps.length;
  State.maps.push({id,name:'Map '+State.maps.length});
  State.activeMap=id;
  renderMaps();
});

function renderMaps(){
  const ml=document.getElementById('mapList');
  ml.innerHTML='';
  State.maps.forEach(m=>{
    const d=document.createElement('div');
    d.textContent=m.name;
    d.style.padding='8px';
    d.style.borderRadius='8px';
    d.style.background=m.id===State.activeMap?'#2a2f3d':'#222';
    d.addEventListener('click',()=>{
      State.activeMap=m.id;
      renderMaps();
      status.textContent='Active map: '+m.name;
    });
    ml.appendChild(d);
  });
}
renderMaps();

// ---------- CAMERA ----------
function resize(){
  const r=canvas.parentElement.getBoundingClientRect();
  canvas.width=r.width*devicePixelRatio;
  canvas.height=r.height*devicePixelRatio;
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  draw();
}
window.addEventListener('resize',resize);

canvas.addEventListener('pointerdown',e=>{
  dragging=true;
  last={x:e.clientX,y:e.clientY};
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
  camera.zoom=Math.min(4,Math.max(0.5,camera.zoom+(e.deltaY<0?0.1:-0.1)));
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
status.textContent='Mode: terrain';
