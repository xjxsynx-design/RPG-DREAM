// E2: Biomes (logic-first)

const BIOMES = {
  grassland: { tiles: ["grass","dirt","water"] },
  desert: { tiles: ["sand","rock","water"] },
  snow: { tiles: ["snow","ice","water"] },
  volcanic: { tiles: ["lava","basalt","ash"] },
  wetlands: { tiles: ["mud","grass","water"] }
};

const TILE_COLORS = {
  grass:"#4caf50",
  dirt:"#8b5a2b",
  water:"#2196f3",
  sand:"#d2b48c",
  rock:"#777",
  snow:"#e0f2ff",
  ice:"#9fd3ff",
  lava:"#ff5722",
  basalt:"#444",
  ash:"#666",
  mud:"#5a4a3a"
};

const VIEW={tileSize:40};

const EngineState={
  mode:"terrain",
  activeBiome:"grassland",
  activeTile:"grass",
  maps:[],
  activeMapId:null
};

let painting=false;

document.addEventListener("DOMContentLoaded",()=>{
  bindUI();
  load();
  if(!EngineState.maps.length) addMap();
  if(!EngineState.activeMapId) EngineState.activeMapId=EngineState.maps[0].id;
  rebuildPalette();
  render();
  resize(); draw();
});

function bindUI(){
  document.querySelectorAll("[data-biome]").forEach(b=>{
    b.onclick=()=>{
      EngineState.activeBiome=b.dataset.biome;
      rebuildPalette();
      document.querySelectorAll("[data-biome]").forEach(x=>x.classList.toggle("active",x===b));
      renderDebug();
    };
  });
  document.getElementById("addMap").onclick=addMap;

  const vp=document.getElementById("mapViewport");
  vp.addEventListener("pointerdown",e=>{painting=true; paint(e); vp.setPointerCapture(e.pointerId);});
  vp.addEventListener("pointermove",e=>{if(painting) paint(e);});
  vp.addEventListener("pointerup",()=>painting=false);
  window.addEventListener("resize",()=>{resize(); draw();});
}

function rebuildPalette(){
  const pal=document.getElementById("palette");
  pal.innerHTML="";
  const tiles=BIOMES[EngineState.activeBiome].tiles;
  tiles.forEach(t=>{
    const b=document.createElement("button");
    b.className="tile-btn"+(t===EngineState.activeTile?" active":"");
    b.textContent=t;
    b.onclick=()=>{
      EngineState.activeTile=t;
      rebuildPalette();
      renderDebug();
    };
    pal.appendChild(b);
  });
}

function addMap(){
  const id="map_"+Date.now().toString(36);
  EngineState.maps.push({id,name:"New Map",w:50,h:50,tiles:{}});
  EngineState.activeMapId=id;
  save();
}

function activeMap(){return EngineState.maps.find(m=>m.id===EngineState.activeMapId);}

function paint(e){
  const map=activeMap(); if(!map) return;
  const r=e.currentTarget.getBoundingClientRect();
  const x=Math.floor((e.clientX-r.left)/VIEW.tileSize);
  const y=Math.floor((e.clientY-r.top)/VIEW.tileSize);
  if(x<0||y<0) return;
  const k=x+","+y;
  map.tiles[k]=EngineState.activeTile;
  save(); draw(); renderDebug();
}

function resize(){
  const c=document.getElementById("mapCanvas"),vp=document.getElementById("mapViewport");
  const dpr=window.devicePixelRatio||1;
  c.width=vp.clientWidth*dpr; c.height=vp.clientHeight*dpr;
  c.style.width=vp.clientWidth+"px"; c.style.height=vp.clientHeight+"px";
  c.getContext("2d").setTransform(dpr,0,0,dpr,0,0);
}

function draw(){
  const c=document.getElementById("mapCanvas"),ctx=c.getContext("2d");
  const map=activeMap(); if(!map) return;
  ctx.clearRect(0,0,c.width,c.height);
  for(const [k,t] of Object.entries(map.tiles)){
    const [x,y]=k.split(",").map(Number);
    ctx.fillStyle=TILE_COLORS[t]||"#000";
    ctx.fillRect(x*VIEW.tileSize,y*VIEW.tileSize,VIEW.tileSize,VIEW.tileSize);
  }
  ctx.strokeStyle="rgba(255,255,255,.15)";
  for(let x=0;x<=map.w;x++){ctx.beginPath();ctx.moveTo(x*VIEW.tileSize,0);ctx.lineTo(x*VIEW.tileSize,map.h*VIEW.tileSize);ctx.stroke();}
  for(let y=0;y<=map.h;y++){ctx.beginPath();ctx.moveTo(0,y*VIEW.tileSize);ctx.lineTo(map.w*VIEW.tileSize,y*VIEW.tileSize);ctx.stroke();}
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

function renderDebug(){document.getElementById("debug").textContent=JSON.stringify(EngineState,null,2);}
function save(){localStorage.setItem("RPG_DREAM_E2",JSON.stringify(EngineState));}
function load(){const d=localStorage.getItem("RPG_DREAM_E2"); if(d) Object.assign(EngineState,JSON.parse(d));}
