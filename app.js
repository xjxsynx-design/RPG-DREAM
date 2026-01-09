const TILE_COLORS = {
  grass: "#4caf50",
  dirt: "#8b5a2b",
  water: "#2196f3"
};

const EngineState = {
  mode: "terrain",
  activeMapId: null,
  activeTile: "grass",
  maps: []
};

const VIEW = { tileSize: 40 };

document.addEventListener("DOMContentLoaded", () => {
  bindUI();
  load();
  render();
  resize();
  draw();
});

function bindUI(){
  document.querySelectorAll("[data-mode]").forEach(b=>{
    b.onclick = ()=>{ EngineState.mode=b.dataset.mode; };
  });
  document.querySelectorAll("[data-tile]").forEach(b=>{
    b.onclick = ()=>{ EngineState.activeTile=b.dataset.tile; };
  });
  document.getElementById("addMap").onclick = addMap;
  window.addEventListener("resize", ()=>{ resize(); draw(); });
  document.getElementById("mapViewport").onclick = paintTile;
}

function addMap(){
  const id = "map_"+Date.now();
  EngineState.maps.push({ id, name:"New Map", w:50, h:50, tiles:{} });
  EngineState.activeMapId = id;
  save();
  render();
  draw();
}

function activeMap(){
  return EngineState.maps.find(m=>m.id===EngineState.activeMapId);
}

function paintTile(e){
  if(EngineState.mode!=="terrain") return;
  const map = activeMap();
  if(!map) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const x = Math.floor((e.clientX-rect.left)/VIEW.tileSize);
  const y = Math.floor((e.clientY-rect.top)/VIEW.tileSize);
  const key = x+","+y;
  if(EngineState.activeTile==="erase") delete map.tiles[key];
  else map.tiles[key] = EngineState.activeTile;
  save();
  draw();
}

function resize(){
  const c = document.getElementById("mapCanvas");
  const vp = document.getElementById("mapViewport");
  const dpr = window.devicePixelRatio||1;
  c.width = vp.clientWidth*dpr;
  c.height = vp.clientHeight*dpr;
  c.style.width = vp.clientWidth+"px";
  c.style.height = vp.clientHeight+"px";
  c.getContext("2d").setTransform(dpr,0,0,dpr,0,0);
}

function draw(){
  const c = document.getElementById("mapCanvas");
  const ctx = c.getContext("2d");
  ctx.clearRect(0,0,c.width,c.height);
  const map = activeMap();
  if(!map) return;

  // grid
  ctx.strokeStyle="rgba(255,255,255,0.12)";
  for(let x=0;x<=map.w;x++){
    ctx.beginPath();
    ctx.moveTo(x*VIEW.tileSize,0);
    ctx.lineTo(x*VIEW.tileSize,map.h*VIEW.tileSize);
    ctx.stroke();
  }
  for(let y=0;y<=map.h;y++){
    ctx.beginPath();
    ctx.moveTo(0,y*VIEW.tileSize);
    ctx.lineTo(map.w*VIEW.tileSize,y*VIEW.tileSize);
    ctx.stroke();
  }

  // tiles
  Object.entries(map.tiles).forEach(([k,t])=>{
    const [x,y]=k.split(",").map(Number);
    ctx.fillStyle = TILE_COLORS[t];
    ctx.fillRect(x*VIEW.tileSize,y*VIEW.tileSize,VIEW.tileSize,VIEW.tileSize);
  });
}

function render(){
  const ml = document.getElementById("mapList");
  ml.innerHTML="";
  EngineState.maps.forEach(m=>{
    const d=document.createElement("div");
    d.className="map-item"+(m.id===EngineState.activeMapId?" active":"");
    d.textContent=m.name;
    d.onclick=()=>{EngineState.activeMapId=m.id; draw(); render();};
    ml.appendChild(d);
  });
  document.getElementById("debug").textContent=JSON.stringify(EngineState,null,2);
}

function save(){
  localStorage.setItem("RPG_DREAM_E1",JSON.stringify(EngineState));
}
function load(){
  const d=localStorage.getItem("RPG_DREAM_E1");
  if(d) Object.assign(EngineState,JSON.parse(d));
}