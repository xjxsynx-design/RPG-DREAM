// Terrain paint hardening: ensure active map + terrain mode + redraw order

const TILE_COLORS = { grass:"#4caf50", dirt:"#8b5a2b", water:"#2196f3" };
const VIEW = { tileSize:40 };

const EngineState = {
  mode:"terrain",
  activeMapId:null,
  activeTile:"grass",
  maps:[]
};

let isPainting=false;

document.addEventListener("DOMContentLoaded",()=>{
  bindUI();
  load();
  if(!EngineState.maps.length){ addMap(); }
  if(!EngineState.activeMapId && EngineState.maps.length){
    EngineState.activeMapId = EngineState.maps[0].id;
  }
  render();
  resize(); draw();
});

function bindUI(){
  document.querySelectorAll("[data-mode]").forEach(b=>{
    b.onclick=()=>{
      EngineState.mode=b.dataset.mode;
      document.querySelectorAll("[data-mode]").forEach(x=>x.classList.toggle("active",x===b));
    };
  });
  document.querySelectorAll("[data-tile]").forEach(b=>{
    b.onclick=()=>{
      EngineState.activeTile=b.dataset.tile;
      document.querySelectorAll("[data-tile]").forEach(x=>x.classList.toggle("active",x===b));
      renderDebug();
    };
  });
  document.getElementById("addMap").onclick=addMap;

  const vp=document.getElementById("mapViewport");
  vp.addEventListener("pointerdown",e=>{ if(EngineState.mode!=="terrain")return; isPainting=true; vp.setPointerCapture(e.pointerId); paint(e); });
  vp.addEventListener("pointermove",e=>{ if(isPainting) paint(e); });
  vp.addEventListener("pointerup",()=>{ isPainting=false; });
  window.addEventListener("resize",()=>{ resize(); draw(); });
}

function addMap(){
  const id="map_"+Date.now().toString(36);
  EngineState.maps.push({id,name:"New Map",w:50,h:50,tiles:{}});
  EngineState.activeMapId=id; save(); render(); draw();
}

function activeMap(){ return EngineState.maps.find(m=>m.id===EngineState.activeMapId)||null; }

function paint(e){
  const map=activeMap(); if(!map) return;
  const vp=document.getElementById("mapViewport");
  const r=vp.getBoundingClientRect();
  const x=Math.floor((e.clientX-r.left)/VIEW.tileSize);
  const y=Math.floor((e.clientY-r.top)/VIEW.tileSize);
  if(x<0||y<0) return;
  const k=x+","+y;
  if(EngineState.activeTile==="erase"){ delete map.tiles[k]; }
  else{ map.tiles[k]=EngineState.activeTile; }
  save(); draw(); renderDebug();
}

function resize(){
  const c=document.getElementById("mapCanvas"), vp=document.getElementById("mapViewport");
  const dpr=Math.max(1,window.devicePixelRatio||1);
  c.width=vp.clientWidth*dpr; c.height=vp.clientHeight*dpr;
  c.style.width=vp.clientWidth+"px"; c.style.height=vp.clientHeight+"px";
  c.getContext("2d").setTransform(dpr,0,0,dpr,0,0);
}

function draw(){
  const c=document.getElementById("mapCanvas"), ctx=c.getContext("2d");
  const vp=document.getElementById("mapViewport"); const w=vp.clientWidth,h=vp.clientHeight;
  ctx.clearRect(0,0,w,h); ctx.fillStyle="#0b0e14"; ctx.fillRect(0,0,w,h);
  const map=activeMap(); if(!map){ grid(w,h,ctx); return; }
  for(const [k,t] of Object.entries(map.tiles)){
    const [x,y]=k.split(",").map(Number);
    ctx.fillStyle=TILE_COLORS[t]||"#000";
    ctx.fillRect(x*VIEW.tileSize,y*VIEW.tileSize,VIEW.tileSize,VIEW.tileSize);
  }
  grid(w,h,ctx);
}

function grid(w,h,ctx){
  ctx.strokeStyle="rgba(255,255,255,0.12)";
  for(let x=0;x<=w;x+=VIEW.tileSize){ ctx.beginPath(); ctx.moveTo(x+.5,0); ctx.lineTo(x+.5,h); ctx.stroke(); }
  for(let y=0;y<=h;y+=VIEW.tileSize){ ctx.beginPath(); ctx.moveTo(0,y+.5); ctx.lineTo(w,y+.5); ctx.stroke(); }
}

function render(){
  const ml=document.getElementById("mapList"); ml.innerHTML="";
  EngineState.maps.forEach(m=>{
    const d=document.createElement("div");
    d.className="map-item"+(m.id===EngineState.activeMapId?" active":"");
    d.textContent=m.name;
    d.onclick=()=>{EngineState.activeMapId=m.id; save(); render(); draw();};
    ml.appendChild(d);
  });
  renderDebug();
}

function renderDebug(){ document.getElementById("debug").textContent=JSON.stringify(EngineState,null,2); }
function save(){ localStorage.setItem("RPG_DREAM_E1",JSON.stringify(EngineState)); }
function load(){ const d=localStorage.getItem("RPG_DREAM_E1"); if(d) Object.assign(EngineState,JSON.parse(d)); }
