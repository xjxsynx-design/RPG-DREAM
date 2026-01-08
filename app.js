// 2B2_5 — DOM-based collision editor (Safari safe)

const DB_NAME='rpgwb_db', STORE='project';

function openDB(){
  return new Promise(res=>{
    const r=indexedDB.open(DB_NAME,1);
    r.onupgradeneeded=()=>r.result.createObjectStore(STORE);
    r.onsuccess=()=>res(r.result);
  });
}
async function getProject(){
  const db=await openDB();
  return new Promise(res=>{
    const tx=db.transaction(STORE,'readonly');
    const rq=tx.objectStore(STORE).get('default');
    rq.onsuccess=()=>{db.close();res(rq.result||{});};
  });
}
async function saveProject(p){
  const db=await openDB();
  return new Promise(res=>{
    const tx=db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).put(p,'default');
    tx.oncomplete=()=>{db.close();res();};
  });
}

// UI
const modeBtn=document.getElementById('modeBtn');
const modeMenu=document.getElementById('modeMenu');
const collisionPanel=document.getElementById('collisionPanel');
const charSelect=document.getElementById('charSelect');
const doneBtn=document.getElementById('doneBtn');
const spritePreview=document.getElementById('spritePreview');
const collisionBox=document.getElementById('collisionBox');
const anchorDot=document.getElementById('anchorDot');

let project, chars=[], activeChar=null;

modeBtn.onclick=()=>modeMenu.classList.toggle('hidden');
modeMenu.querySelectorAll('button').forEach(b=>{
  b.onclick=()=>{
    modeMenu.classList.add('hidden');
    if(b.dataset.mode==='collision') openCollision();
  };
});

async function openCollision(){
  project=await getProject();
  chars=project.characterLibrary||[];
  if(!chars.length){
    chars=[{id:'default',name:'Default',collision:{x:12,y:28,w:24,h:16},anchor:{x:24,y:48},img:null}];
    project.characterLibrary=chars;
    await saveProject(project);
  }
  charSelect.innerHTML='';
  chars.forEach(c=>{
    const o=document.createElement('option');
    o.value=c.id;o.textContent=c.name;
    charSelect.appendChild(o);
  });
  activeChar=chars[0];
  charSelect.onchange=()=>{
    activeChar=chars.find(c=>c.id===charSelect.value);
    layout();
  };
  collisionPanel.classList.remove('hidden');
  layout();
}

doneBtn.onclick=async()=>{
  await saveProject(project);
  collisionPanel.classList.add('hidden');
};

function layout(){
  // placeholder sprite (future: real frame)
  spritePreview.src=activeChar.img||'';
  const scale=3;
  collisionBox.style.left=activeChar.collision.x*scale+'px';
  collisionBox.style.top=activeChar.collision.y*scale+'px';
  collisionBox.style.width=activeChar.collision.w*scale+'px';
  collisionBox.style.height=activeChar.collision.h*scale+'px';
  anchorDot.style.left=activeChar.anchor.x*scale-6+'px';
  anchorDot.style.top=activeChar.anchor.y*scale-6+'px';
}

// Drag helpers
function makeDraggable(el, onMove){
  let sx,sy;
  el.onpointerdown=e=>{
    sx=e.clientX;sy=e.clientY;
    el.setPointerCapture(e.pointerId);
    el.onpointermove=ev=>{
      const dx=(ev.clientX-sx)/3, dy=(ev.clientY-sy)/3;
      sx=ev.clientX;sy=ev.clientY;
      onMove(dx,dy);
      layout();
    };
    el.onpointerup=()=>el.onpointermove=null;
  };
}

makeDraggable(collisionBox,(dx,dy)=>{
  activeChar.collision.x+=dx;
  activeChar.collision.y+=dy;
});
makeDraggable(anchorDot,(dx,dy)=>{
  activeChar.anchor.x+=dx;
  activeChar.anchor.y+=dy;
});
