(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const scoreBox = document.getElementById('scoreBox');
  const highBox = document.getElementById('highBox');
  const statusText = document.getElementById('statusText');
  const pauseBtn = document.getElementById('pauseBtn');
  const restartBtn = document.getElementById('restartBtn');

  let lastTime = 0, running=false, paused=false, gameOver=false;
  let score=0, speed=5, spawnTimer=0, spawnInterval=1500, difficultyTimer=0;
  let highScore=Number(localStorage.getItem('dino-highscore')||0);
  highBox.textContent='High: '+highScore;

  const dino = {
    x:80, y:H-60-44, w:44, h:44, vy:0, gravity:0.9, jumpForce:-16, grounded:true, ducking:false,
    draw(){ ctx.save(); ctx.fillStyle='hsl(42,95%,56%)'; const by=this.y+(this.ducking?12:0); const bh=this.h-(this.ducking?12:0); roundRect(ctx,this.x,by,this.w,bh,6); ctx.fill(); ctx.fillStyle='#05251b'; ctx.fillRect(this.x+28,by+10,6,6); ctx.restore(); },
    update(dt){ if(!this.grounded||this.vy!==0){this.vy+=this.gravity*dt; this.y+=this.vy*dt*16; if(this.y>=H-60-this.h){this.y=H-60-this.h; this.vy=0; this.grounded=true;}} },
    jump(){if(this.grounded&&!this.ducking){this.vy=this.jumpForce; this.grounded=false;}},
    duck(isDown){if(isDown&&this.grounded)this.ducking=true; else this.ducking=false;},
    getBounds(){const by=this.y+(this.ducking?12:0); const bh=this.h-(this.ducking?12:0); return{x:this.x,y:by,w:this.w,h:bh}}
  };

  const obstacles=[];
  function spawnObstacle(){const height=randInt(18,48); const type=Math.random()<0.18?'flying':'ground'; let hgt=height; let y=H-60-hgt; if(type==='flying'){hgt=randInt(14,28); y=H-120-hgt-randInt(0,20);} obstacles.push({x:W+40,y:y,w:randInt(18,36),h:hgt,type:type,speed:speed, draw(){ctx.save();ctx.fillStyle='hsl(340,80%,62%)'; roundRect(ctx,this.x,this.y,this.w,this.h,6); ctx.fill(); ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(this.x+4,this.y+4,6,6); ctx.restore();}, update(dt){this.x-=this.speed*dt*16;}}); }

  function drawGround(offset){ctx.save(); ctx.fillStyle="#0b1220"; ctx.fillRect(0,H-60,W,60); ctx.strokeStyle="rgba(255,255,255,0.03)"; ctx.lineWidth=2; ctx.beginPath(); for(let x=-offset%40;x<W;x+=40){ctx.moveTo(x,H-30); ctx.lineTo(x+24,H-30);} ctx.stroke(); ctx.restore(); }

  function randInt(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
  function roundRect(ctx,x,y,w,h,r){const rad=r||6; ctx.beginPath(); ctx.moveTo(x+rad,y); ctx.arcTo(x+w,y,x+w,y+h,rad); ctx.arcTo(x+w,y+h,x,y+h,rad); ctx.arcTo(x,y+h,x,y,rad); ctx.arcTo(x,y,x+w,y,rad); ctx.closePath(); }

  function collides(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}

  const keys={};
  window.addEventListener('keydown',(e)=>{if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();if(!running) start(); dino.jump();} if(e.code==='ArrowDown'){keys.down=true; dino.duck(true);} if(e.code==='KeyP') togglePause(); if(e.code==='KeyR') restart();});
  window.addEventListener('keyup',(e)=>{if(e.code==='ArrowDown'){keys.down=false; dino.duck(false);}});
  canvas.addEventListener('touchstart',(e)=>{e.preventDefault(); if(!running) start(); dino.jump();},{passive:false});
  pauseBtn.addEventListener('click',togglePause);
  restartBtn.addEventListener('click',restart);

  function togglePause(){if(!running) return; paused=!paused; statusText.textContent=paused?'Paused':'Running'; pauseBtn.textContent=paused?'Resume':'Pause';}
  function restart(){obstacles.length=0; score=0; speed=5; spawnInterval=1500; spawnTimer=0; difficultyTimer=0; dino.y=H-60-dino.h; dino.vy=0; dino.grounded=true; dino.ducking=false; running=false; paused=false; gameOver=false; statusText.textContent='Ready — press Space to start'; pauseBtn.textContent='Pause'; scoreBox.textContent='Score: '+score; requestAnimationFrame((t)=>{lastTime=t; renderStartScreen();});}
  function start(){if(running) return; running=true; paused=false; gameOver=false; statusText.textContent='Running'; requestAnimationFrame(loop);}
  function doGameOver(){gameOver=true; running=false; statusText.textContent='Game Over — press Restart or R'; if(score>highScore){highScore=score; localStorage.setItem('dino-highscore',String(highScore)); highBox.textContent='High: '+highScore;}}

  function renderStartScreen(){ctx.clearRect(0,0,W,H); ctx.save(); ctx.fillStyle='rgba(255,255,255,0.02)'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#dbeafe'; ctx.font='700 20px Inter, Arial'; ctx.fillText('Mini Dino Run',20,36); ctx.font='14px Inter, Arial'; ctx.fillStyle='rgba(219,234,254,0.6)'; ctx.fillText('Press Space or Tap to start',20,60); dino.draw(); drawGround(0); ctx.restore(); }

  function loop(time){if(!lastTime) lastTime=time; const dt=(time-lastTime)/1000; lastTime=time; if(!running) return; if(!paused&&!gameOver){update(dt); render();} if(!gameOver) requestAnimationFrame(loop);}

  function update(dt){
    difficultyTimer+=dt*1000; if(difficultyTimer>2500){difficultyTimer=0; speed+=0.25; spawnInterval=Math.max(600,spawnInterval-50);}
    spawnTimer+=dt*1000; if(spawnTimer>spawnInterval){spawnTimer=0; spawnObstacle();}
    for(let i=obstacles.length-1;i>=0;i--){obstacles[i].update(dt); if(obstacles[i].x+obstacles[i].w<-50) obstacles.splice(i,1);}
    dino.update(dt);
    score+=Math.round(10*dt*(speed/5)); scoreBox.textContent='Score: '+score;
    const pBounds=dino.getBounds(); for(const obs of obstacles){const oBounds={x:obs.x,y:obs.y,w:obs.w,h:obs.h}; if(collides(pBounds,oBounds)){doGameOver(); break;}}
  }

  let groundOffset=0;
  function render(){ctx.clearRect(0,0,W,H); drawStars(); drawMountains(); groundOffset=(groundOffset+speed*0.8)%40; drawGround(groundOffset); for(const obs of obstacles) obs.draw(); dino.draw(); ctx.save(); ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fillRect(W-180,8,172,36); ctx.fillStyle='#e6eef8'; ctx.font='600 14px Inter, Arial'; ctx.fillText('Score: '+score,W-170,32); ctx.restore();}

  function drawMountains(){ctx.save(); ctx.fillStyle='rgba(10,20,40,0.6)'; ctx.beginPath(); ctx.moveTo(0,H-60); ctx.lineTo(60,H-140); ctx.lineTo(140,H-60); ctx.fill(); ctx.beginPath(); ctx.moveTo(180,H-60); ctx.lineTo(260,H-180); ctx.lineTo(340,H-60); ctx.fill(); ctx.beginPath(); ctx.moveTo(420,H-60); ctx.lineTo(560,H-220); ctx.lineTo(700,H-60); ctx.fill(); ctx.restore();}
  function drawStars(){ctx.save(); for(let i=0;i<40;i++){const x=(i*23+Math.cos(performance.now()/500+i)*20)%W; const y=20+((i*37)%80); ctx.fillStyle='rgba(255,255,255,'+(0.02+(i%3)*0.02)+')'; ctx.fillRect(x,y,2,2);} ctx.restore(); }

  renderStartScreen();
  canvas.addEventListener('click',()=>{if(!running) start();});
})();
