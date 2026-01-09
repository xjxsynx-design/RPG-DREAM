const TILE=40;
const State={mode:'terrain',maps:[],activeMapId:null};

document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-mode]').forEach(b=>{
    b.onclick=()=>{
      State.mode=b.dataset.mode;
      document.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x===b));
      draw();
      debug();
    };
  });
  document.getElementById('addMap').onclick=addMap;
  load();
  if(!State.maps.length) addMap();
  if(!State.activeMapId) State.activeMapId=State.maps[0].id;
  resize(); draw(); debug();
  window.addEventListener('resize',()=>{resize();draw();});
  const vp=document.getElementById('mapViewport');
  vp.addEventListener('pointerdown',e=>paint(e));
  vp.addEventListener('pointermove',e=>{if(e.buttons) paint(e);});
});

function addMap(){
  const id='map_'+Date.now().toString(36);
  State.maps.push({id,name:'New Map',tiles:{},collision:{}});
  State.activeMapId=id;
  save(); renderMaps();
}

function activeMap(){return State.maps.find(m=>m.id===State.activeMapId);}

function paint(e){
  const map=activeMap(); if(!map) return;
  const r=e.currentTarget.getBoundingClientRect();
  const x=Math.floor((e.clientX-r.left)/TILE);
  const y=Math.floor((e.clientY-r.top)/TILE);
  const k=x+','+y;
  if(State.mode==='collision') map.collision[k]=true;
  draw(); save(); debug();
}

function resize(){
  const c=document.getElementById('mapCanvas'),vp=document.getElementById('mapViewport');
  const dpr=window.devicePixelRatio||1;
  c.width=vp.clientWidth*dpr;
  c.height=vp.clientHeight*dpr;
  c.style.width=vp.clientWidth+'px';
  c.style.height=vp.clientHeight+'px';
  c.getContext('2d').setTransform(dpr,0,0,dpr,0,0);
}

function draw(){
  const c=document.getElementById('mapCanvas'),ctx=c.getContext('2d');
  const w=c.width,h=c.height;
  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle='rgba(255,255,255,.15)';
  for(let x=0;x<w;x+=TILE){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  for(let y=0;y<h;y+=TILE){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  const map=activeMap(); if(!map) return;
  if(State.mode==='collision'){
    ctx.fillStyle='rgba(255,0,0,.35)';
    Object.keys(map.collision).forEach(k=>{
      const [x,y]=k.split(',').map(Number);
      ctx.fillRect(x*TILE,y*TILE,TILE,TILE);
    });
  }
}

function renderMaps(){
  const ml=document.getElementById('mapList'); ml.innerHTML='';
  State.maps.forEach(m=>{
    const d=document.createElement('div');
    d.className='map-item'+(m.id===State.activeMapId?' active':'');
    d.textContent=m.name;
    d.onclick=()=>{State.activeMapId=m.id;draw();debug();};
    ml.appendChild(d);
  });
}

function debug(){
  document.getElementById('debug').textContent=JSON.stringify(State,null,2);
}

function save(){localStorage.setItem('RPG_DREAM_E3',JSON.stringify(State));}
function load(){
  const d=localStorage.getItem('RPG_DREAM_E3');
  if(d){Object.assign(State,JSON.parse(d));}
}
