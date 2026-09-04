const pitch=document.querySelector('#pitch'),roll=document.querySelector('#roll'),left=document.querySelector('#left'),right=document.querySelector('#right'),message=document.querySelector('#message'),statusEl=document.querySelector('#status'),target=document.querySelector('#target'),score=document.querySelector('#score'),round=document.querySelector('#round'),needle=document.querySelector('#needle');
const calOverlay=document.querySelector('#calibration'),calArrow=document.querySelector('#cal-arrow'),calState=document.querySelector('#cal-state'),calDirection=document.querySelector('#cal-direction'),calProgress=document.querySelector('#cal-progress');
let feedbackTimer,lastControls={pitch:0,roll:0},cal;

function resetCalibration(){cal={active:true,phase:'neutral',neutralSamples:[],tiltSamples:[],baseValues:null,axis:null,sign:1,neutral:0,lastSampleAt:0};calOverlay.hidden=false;calArrow.textContent='·';calState.textContent='중립 위치를 측정합니다. 잠시 수평으로 유지하세요.';calDirection.textContent='현재 감지: 중립';calProgress.style.width='0%'}
resetCalibration();
document.querySelector('#zero').onclick=resetCalibration;
document.querySelector('#cal-skip').onclick=()=>{cal={active:false,axis:'roll',neutral:lastControls.roll,sign:1};calState.textContent='기본 방향을 사용합니다';calArrow.textContent='✓';calProgress.style.width='100%';setTimeout(()=>calOverlay.hidden=true,250)};

function average(samples,axis){return samples.reduce((sum,sample)=>sum+sample[axis],0)/samples.length}
function collectCalibration(controls){
  const now=performance.now();if(now-cal.lastSampleAt<140)return;cal.lastSampleAt=now;
  if(cal.phase==='neutral'){
    cal.neutralSamples.push(controls);const count=cal.neutralSamples.length;calState.textContent=`중립 위치 측정 ${count}/4`;calProgress.style.width=`${count*5}%`;
    if(count<4)return;
    cal.baseValues={pitch:average(cal.neutralSamples,'pitch'),roll:average(cal.neutralSamples,'roll')};cal.phase='tilt';calState.textContent='오른쪽으로 기울여보세요';return;
  }
  const dp=controls.pitch-cal.baseValues.pitch,dr=controls.roll-cal.baseValues.roll;
  if(!cal.axis){const axis=Math.abs(dr)>=Math.abs(dp)?'roll':'pitch',delta=axis==='roll'?dr:dp;if(Math.abs(delta)<6){calDirection.textContent='현재 감지: 중립';return}cal.axis=axis;cal.sign=Math.sign(delta);calArrow.textContent='→'}
  const delta=(controls[cal.axis]-cal.baseValues[cal.axis])*cal.sign;
  calDirection.textContent=delta>=3?'현재 감지: 오른쪽 →':delta<=-3?'현재 감지: 반대 방향 ←':'현재 감지: 중립';
  if(delta<3)return;
  cal.tiltSamples.push(controls);const count=cal.tiltSamples.length;calState.textContent=`오른쪽 감지됨 ${count}/8`;calProgress.style.width=`${20+count*10}%`;
  if(count<8)return;
  cal.neutral=cal.baseValues[cal.axis];cal.active=false;calState.textContent='보정 완료';calDirection.textContent=`${cal.axis.toUpperCase()} 축 · 오른쪽 방향 설정됨`;calArrow.textContent='✓';calProgress.style.width='100%';setTimeout(()=>calOverlay.hidden=true,550);
}

function paint(data){
  lastControls=data.controls;pitch.disabled=roll.disabled=data.mode==='real';statusEl.textContent=data.mode==='real'?`● IMU LIVE · P ${data.pitch}° / R ${data.roll}°`:'● MOCK · 슬라이더로 기울이세요';
  left.className=`light ${data.left}`;right.className=`light ${data.right}`;target.className=`target ${data.target_color}`;score.textContent=String(data.score).padStart(2,'0');round.textContent=String(data.round).padStart(2,'0');
  const raw=cal.axis?data.controls[cal.axis]:data.roll,delta=(raw-(cal.neutral||0))*(cal.sign||1);needle.parentElement.style.setProperty('--tilt',`${Math.max(4,Math.min(96,50+delta/1.2))}%`);
  if(cal.active){collectCalibration(data.controls);message.textContent='보정 중';return}
  clearTimeout(feedbackTimer);document.body.dataset.feedback=data.feedback;
  if(data.feedback==='correct'){(data.direction==='left'?left:right).classList.add('active');message.textContent='정답!\n중앙으로 돌아오세요'}else if(data.feedback==='wrong'){(data.direction==='left'?left:right).classList.add('wrong');message.textContent='다른 쪽이에요\n중앙으로 돌아오세요'}else message.textContent='LED 색과 같은 쪽으로\n기울이세요';
  if(data.feedback!=='center')feedbackTimer=setTimeout(()=>document.body.dataset.feedback='',450);
}

async function poll(){
  try{const body={pitch:+pitch.value,roll:+roll.value,axis:cal.axis||'roll',neutral:cal.neutral||0,sign:cal.sign||1,calibrating:cal.active};const response=await fetch('/api/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await response.json();if(!response.ok)throw Error(data.error);paint(data)}catch(error){statusEl.textContent=`● 연결 오류 · ${error.message}`}
  setTimeout(poll,100)
}
poll();addEventListener('pagehide',()=>navigator.sendBeacon('/api/stop',new Blob(['{}'],{type:'application/json'})));
