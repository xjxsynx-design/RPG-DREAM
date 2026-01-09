const app=document.getElementById('app');
app.innerHTML=`
<div style='padding:12px'>
<button onclick="setMode('terrain')">Terrain</button>
<button onclick="setMode('collision')">Collision</button>
<button onclick="setMode('characters')">Characters</button>
<div id='mode'>Mode: terrain</div>
<div id='viewport' style='margin-top:12px;width:100%;height:60vh;overflow:auto;border:1px solid #333'>
<canvas id='grid' width='2000' height='2000'></canvas>
</div>
</div>`;
let mode='terrain';
function setMode(m){mode=m;document.getElementById('mode').textContent='Mode: '+m;}
const ctx=document.getElementById('grid').getContext('2d');
for(let x=0;x<2000;x+=50){for(let y=0;y<2000;y+=50){ctx.strokeStyle='#222';ctx.strokeRect(x,y,50,50);}}