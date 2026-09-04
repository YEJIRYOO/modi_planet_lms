const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const health = document.querySelector('#health');
const overlay = document.querySelector('#calibration');
const stateEl = document.querySelector('#cal-state');
const arrow = document.querySelector('#arrow');
const pitch = document.querySelector('#pitch');
const roll = document.querySelector('#roll');
const W = canvas.width;
const H = canvas.height;

let keys = new Set();
let ship, bullets, enemies, particles, clouds, score, lives, elapsed, spawnTimer, invulnerable, gameOver;
let last = 0;
let attackLast = false;
let cal = {phase:'neutral', neutral:[], tilt:[], axis:null, sign:1, base:null, range:20, active:true};

function reset() {
  ship = {x:W / 2, y:H - 68, tilt:0};
  bullets = [];
  enemies = [];
  particles = [];
  clouds = Array.from({length:8}, (_,i) => ({x:(i * 149) % W, y:(i * 83) % H, size:38 + (i % 3) * 18, speed:9 + i % 4 * 5}));
  score = 0;
  lives = 3;
  elapsed = 0;
  spawnTimer = .4;
  invulnerable = 0;
  gameOver = false;
}
reset();

addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  keys.add(key);
  if (['arrowleft','arrowright','arrowup','arrowdown',' '].includes(key)) event.preventDefault();
  if (key === ' ' && !event.repeat) fire();
  if (gameOver && (key === 'enter' || key === 'r')) reset();
});
addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
document.querySelector('#attack').onclick = () => gameOver ? reset() : fire();

function fire() {
  if (gameOver) return;
  bullets.push({x:ship.x - 10, y:ship.y - 24}, {x:ship.x + 10, y:ship.y - 24});
}

function burst(x, y, color, count=18) {
  for (let i=0; i<count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 45 + Math.random() * 150;
    particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:.35+Math.random()*.55,color,size:2+Math.random()*5});
  }
}

function apply(data) {
  let x=0, y=0;
  if (cal.axis) {
    const raw = data.controls[cal.axis];
    x = (raw-cal.base)*cal.sign/cal.range;
    const other = cal.axis === 'roll' ? 'pitch' : 'roll';
    y = -(data.controls[other]-cal.cross)/90;
  }
  if (keys.has('arrowleft') || keys.has('a')) x--;
  if (keys.has('arrowright') || keys.has('d')) x++;
  if (keys.has('arrowup') || keys.has('w')) y--;
  if (keys.has('arrowdown') || keys.has('s')) y++;
  ship.tilt += (Math.max(-1,Math.min(1,x)) - ship.tilt) * .16;
  ship.x = Math.max(30, Math.min(W-30, ship.x+x*8));
  ship.y = Math.max(70, Math.min(H-35, ship.y+y*8));
  if (data.attack && !attackLast) fire();
  attackLast = data.attack;
}

function sample(data) {
  const s=data.controls;
  if (cal.phase==='neutral') {
    cal.neutral.push(s);
    stateEl.textContent=`중립 위치 측정 ${cal.neutral.length}/4`;
    if (cal.neutral.length===4) {
      cal.baseObj={pitch:cal.neutral.reduce((a,v)=>a+v.pitch,0)/4,roll:cal.neutral.reduce((a,v)=>a+v.roll,0)/4};
      cal.phase='tilt';
      stateEl.textContent='오른쪽 기울임을 기다리는 중';
    }
    return;
  }
  const dp=s.pitch-cal.baseObj.pitch, dr=s.roll-cal.baseObj.roll;
  if (!cal.axis) {
    const axis=Math.abs(dr)>Math.abs(dp)?'roll':'pitch', d=axis==='roll'?dr:dp;
    if (Math.abs(d)<6) return;
    cal.axis=axis; cal.sign=Math.sign(d); arrow.textContent='→';
  }
  const d=s[cal.axis]-cal.baseObj[cal.axis];
  if (d*cal.sign<3) return;
  cal.tilt.push(s);
  stateEl.textContent=`오른쪽 감지됨 ${cal.tilt.length}/8`;
  if (cal.tilt.length===8) {
    const avg=cal.tilt.reduce((a,v)=>a+v[cal.axis],0)/8;
    cal.base=cal.baseObj[cal.axis];
    cal.cross=cal.baseObj[cal.axis==='roll'?'pitch':'roll'];
    cal.range=Math.max(8,Math.abs(avg-cal.base));
    cal.active=false; stateEl.textContent='보정 완료'; arrow.textContent='✓';
    setTimeout(()=>overlay.hidden=true,500);
  }
}
document.querySelector('#skip').onclick=()=>{cal={active:false,axis:'roll',base:0,cross:0,range:90,sign:1};overlay.hidden=true};

async function poll() {
  try {
    const response=await fetch('/api/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pitch:+pitch.value,roll:+roll.value})});
    const data=await response.json();
    health.textContent=data.mode==='real'?'● IMU LIVE':'● MOCK MODE';
    health.dataset.mode=data.mode;
    pitch.disabled=roll.disabled=data.mode==='real';
    cal.active?sample(data):apply(data);
  } catch (_) { health.textContent='● CONNECTION LOST'; health.dataset.mode='error'; }
  setTimeout(poll,90);
}
poll();

function update(dt) {
  if (cal.active || gameOver) return;
  elapsed += dt;
  invulnerable=Math.max(0,invulnerable-dt);
  spawnTimer-=dt;
  if (spawnTimer<=0) {
    const level=1+Math.floor(score/1000);
    enemies.push({x:45+Math.random()*(W-90),y:-38,speed:90+level*12+Math.random()*45,phase:Math.random()*6.28,size:25+Math.random()*9});
    spawnTimer=Math.max(.28,.92-level*.05)*(0.8+Math.random()*.5);
  }
  bullets.forEach(b=>b.y-=560*dt);
  enemies.forEach(e=>{e.y+=e.speed*dt;e.x+=Math.sin(elapsed*2.4+e.phase)*24*dt});
  clouds.forEach(c=>{c.y+=c.speed*dt;if(c.y>H+80){c.y=-80;c.x=Math.random()*W}});
  particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=50*dt;p.life-=dt});
  for (const e of enemies) {
    for (const b of bullets) if (!e.dead&&!b.dead&&Math.hypot(e.x-b.x,e.y-b.y)<e.size) {e.dead=b.dead=true;score+=100;burst(e.x,e.y,'#ffb24b')}
    if (!e.dead&&invulnerable<=0&&Math.hypot(e.x-ship.x,e.y-ship.y)<32) {e.dead=true;lives--;invulnerable=1.5;burst(ship.x,ship.y,'#8cfff2',28);if(lives<=0)gameOver=true}
    if (!e.dead&&e.y>H+35) e.dead=true;
  }
  bullets=bullets.filter(b=>b.y>-20&&!b.dead);
  enemies=enemies.filter(e=>!e.dead);
  particles=particles.filter(p=>p.life>0);
}

function roundRect(x,y,w,h,r) {ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function drawBackground() {
  const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#06142d');sky.addColorStop(.55,'#0e4167');sky.addColorStop(1,'#16718b');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.globalAlpha=.14;ctx.strokeStyle='#b8f6ff';ctx.lineWidth=1;
  for(let y=110;y<H;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y+elapsed*22%48);ctx.stroke()}
  for(let x=-W;x<W*2;x+=100){ctx.beginPath();ctx.moveTo(W/2,70);ctx.lineTo(x+(elapsed*45)%100,H);ctx.stroke()}
  ctx.restore();
  clouds.forEach(c=>{ctx.save();ctx.globalAlpha=.09;ctx.fillStyle='white';ctx.beginPath();ctx.ellipse(c.x,c.y,c.size*1.7,c.size*.55,0,0,7);ctx.ellipse(c.x-c.size,c.y+4,c.size,c.size*.4,0,0,7);ctx.fill();ctx.restore()});
}
function drawShip() {
  if(invulnerable>0&&Math.floor(invulnerable*12)%2)return;
  ctx.save();ctx.translate(ship.x,ship.y);ctx.rotate(ship.tilt*.16);ctx.shadowColor='#56f4ff';ctx.shadowBlur=22;ctx.fillStyle='#d8ff69';ctx.beginPath();ctx.moveTo(0,-31);ctx.lineTo(-8,-4);ctx.lineTo(-29,13);ctx.lineTo(-9,10);ctx.lineTo(0,24);ctx.lineTo(9,10);ctx.lineTo(29,13);ctx.lineTo(8,-4);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#12354c';ctx.beginPath();ctx.ellipse(0,-9,5,12,0,0,7);ctx.fill();ctx.fillStyle='#56f4ff';ctx.fillRect(-2,19,4,17);ctx.restore();
}
function drawEnemy(e) {ctx.save();ctx.translate(e.x,e.y);ctx.rotate(Math.sin(elapsed*2+e.phase)*.12);ctx.shadowColor='#ff5445';ctx.shadowBlur=14;ctx.fillStyle='#ff654f';ctx.beginPath();ctx.moveTo(0,27);ctx.lineTo(-9,2);ctx.lineTo(-e.size,-13);ctx.lineTo(-8,-8);ctx.lineTo(0,-25);ctx.lineTo(8,-8);ctx.lineTo(e.size,-13);ctx.lineTo(9,2);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#ffd465';ctx.fillRect(-3,-10,6,13);ctx.restore()}
function drawHud() {
  ctx.save();ctx.fillStyle='rgba(3,10,24,.58)';roundRect(18,16,210,48,13);ctx.fill();roundRect(W-184,16,166,48,13);ctx.fill();ctx.fillStyle='#f7fbff';ctx.font='800 13px system-ui';ctx.fillText('SCORE',34,36);ctx.fillStyle='#8cfff2';ctx.font='800 20px ui-monospace';ctx.fillText(String(score).padStart(6,'0'),91,39);ctx.fillStyle='#f7fbff';ctx.font='800 13px system-ui';ctx.fillText(`LEVEL ${1+Math.floor(score/1000)}`,W-166,45);for(let i=0;i<3;i++){ctx.fillStyle=i<lives?'#d8ff69':'#34465c';ctx.beginPath();ctx.moveTo(W-69+i*18,33);ctx.lineTo(W-76+i*18,50);ctx.lineTo(W-62+i*18,50);ctx.closePath();ctx.fill()}ctx.restore();
}
function draw() {
  drawBackground();enemies.forEach(drawEnemy);
  ctx.save();ctx.shadowColor='#ffe96b';ctx.shadowBlur=13;ctx.fillStyle='#fff28a';bullets.forEach(b=>{ctx.fillRect(b.x-2,b.y-8,4,16)});ctx.restore();
  particles.forEach(p=>{ctx.save();ctx.globalAlpha=Math.max(0,p.life*1.7);ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);ctx.restore()});
  if(!gameOver)drawShip();drawHud();
  if(gameOver){ctx.fillStyle='rgba(2,7,17,.78)';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.fillStyle='#ff7866';ctx.font='900 64px system-ui';ctx.fillText('MISSION FAILED',W/2,H/2-15);ctx.fillStyle='white';ctx.font='600 18px system-ui';ctx.fillText(`FINAL SCORE ${score}  ·  ENTER 또는 ATTACK으로 재시작`,W/2,H/2+35);ctx.textAlign='left'}
}
function loop(time) {const dt=Math.min(.04,(time-last)/1000||0);last=time;update(dt);draw();requestAnimationFrame(loop)}
requestAnimationFrame(loop);
addEventListener('pagehide',()=>navigator.sendBeacon('/api/stop',new Blob(['{}'],{type:'application/json'})));
