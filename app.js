// Phase 2B.2.1 — Bind collision editor to IndexedDB character library

// --- IndexedDB helpers (same DB as Phase 2B.1) ---
const DB_NAME='rpgwb_db';
const DB_VER=1;
const STORE_PROJECT='project';

function openDB(){
  return new Promise((res,rej)=>{
    const r=indexedDB.open(DB_NAME,DB_VER);
    r.onsuccess=()=>res(r.result);
    r.onerror=()=>rej(r.error);
  });
}
async function idbGet(key){
  const db=await openDB();
  return new Promise((res,rej)=>{
    const tx=db.transaction(STORE_PROJECT,'readonly');
    const rq=tx.objectStore(STORE_PROJECT).get(key);
    rq.onsuccess=()=>{db.close();res(rq.result)};
    rq.onerror=()=>{db.close();rej(rq.error)};
  });
}
async function idbPut(key,val){
  const db=await openDB();
  return new Promise((res,rej)=>{
    const tx=db.transaction(STORE_PROJECT,'readwrite');
    tx.objectStore(STORE_PROJECT).put(val,key);
    tx.oncomplete=()=>{db.close();res()};
    tx.onerror=()=>{db.close();rej(tx.error)};
  });
}

// --- UI refs ---
const modeBtn=document.getElementById('modeBtn');
const modeMenu=document.getElementById('modeMenu');
const palettePanel=document.getElementById('palettePanel');
const charsPanel=document.getElementById('charsPanel');
const charList=document.getElementById('charList');

const collisionEditor=document.getElementById('collisionEditor');
const collisionCanvas=document.getElementById('collisionCanvas');
const cctx=collisionCanvas.getContext('2d');
const closeCollision=document.getElementById('closeCollision');

let project=null;
let characters=[];
let activeChar=null;

// MODE menu
modeBtn.onclick=()=>modeMenu.classList.toggle('hidden');
modeMenu.querySelectorAll('button').forEach(btn=>{
  btn.onclick=()=>{
    modeMenu.classList.add('hidden');
    palettePanel.classList.add('hidden');
    charsPanel.classList.add('hidden');
    if(btn.dataset.mode==='characters') charsPanel.classList.remove('hidden');
  };
});

// Load project + characters
async function loadProject(){
  project=await idbGet('default')||{};
  characters=project.characterLibrary||[];

  // Failsafe: ensure at least one character exists
  if(!characters.length){
    characters=[{
      id:'default_char',
      name:'Default Character',
      fps:8,
      frames:{north:[],south:[],west:[],east:[]},
      collision:{x:12,y:28,w:24,h:16},
      anchor:{x:24,y:48}
    }];
    project.characterLibrary=characters;
    await idbPut('default',project);
  }

  // Ensure collision + anchor exist
  characters.forEach(c=>{
    if(!c.collision) c.collision={x:12,y:28,w:24,h:16};
    if(!c.anchor) c.anchor={x:24,y:48};
  });

  renderCharList();
}
loadProject();

function renderCharList(){
  charList.innerHTML='';
  characters.forEach(c=>{
    const b=document.createElement('button');
    b.textContent=c.name;
    b.onclick=()=>openCollisionEditor(c);
    charList.appendChild(b);
  });
}

// Collision editor
function openCollisionEditor(char){
  activeChar=char;
  collisionEditor.classList.remove('hidden');
  resizeCollisionCanvas();
  drawCollision();
}

closeCollision.onclick=async()=>{
  collisionEditor.classList.add('hidden');
  await idbPut('default',project);
};

function resizeCollisionCanvas(){
  const dpr=window.devicePixelRatio||1;
  collisionCanvas.width=window.innerWidth*dpr;
  collisionCanvas.height=(window.innerHeight-80)*dpr;
  cctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener('resize',resizeCollisionCanvas);

function drawCollision(){
  cctx.clearRect(0,0,collisionCanvas.width,collisionCanvas.height);
  const cx=collisionCanvas.width/2/(window.devicePixelRatio||1);
  const cy=collisionCanvas.height/2/(window.devicePixelRatio||1);

  // sprite placeholder
  cctx.strokeStyle='#555';
  cctx.strokeRect(cx-24,cy-48,48,48);

  // collision
  const col=activeChar.collision;
  cctx.strokeStyle='#0f0';
  cctx.strokeRect(cx-24+col.x,cy-48+col.y,col.w,col.h);

  // anchor
  cctx.fillStyle='#f00';
  cctx.beginPath();
  cctx.arc(cx-24+activeChar.anchor.x,cy-48+activeChar.anchor.y,4,0,Math.PI*2);
  cctx.fill();
}

let dragging=false;
collisionCanvas.addEventListener('pointerdown',()=>dragging=true);
collisionCanvas.addEventListener('pointerup',()=>dragging=false);
collisionCanvas.addEventListener('pointermove',e=>{
  if(!dragging||!activeChar) return;
  activeChar.collision.w=Math.max(4,activeChar.collision.w+e.movementX*0.2);
  activeChar.collision.h=Math.max(4,activeChar.collision.h+e.movementY*0.2);
  drawCollision();
});
