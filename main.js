// DOM Elements
const game = document.getElementById('game');
const player = document.getElementById('player');
const scoreText = document.getElementById('score');
const startScreen = document.getElementById('startScreen');
const startBtn = document.getElementById('startBtn');
const gameOverPanel = document.getElementById('gameOverPanel');
const finalScore = document.getElementById('finalScore');
const highScoreBadge = document.getElementById('highScoreBadge');
const restartBtn = document.getElementById('restartBtn');
const menuBtn = document.getElementById('menuBtn');
const bestScoreText = document.getElementById('bestScore');
const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const bgMusic = document.getElementById('bgMusic');
const deathMusic = document.getElementById('deathMusic');

let playerY = 280;
let score = 0;
let speed = 3;
let spawnInterval = null;
let lastTime = 0;
let shadows = [];
let running = false;
let gameLoopId = null;
let highScore = localStorage.getItem('highScore') || 0;

bestScoreText.textContent = highScore;

function setPlayerY(y){
  // Mobile platform height
  const mobileOffset = window.innerWidth <= 768 ? 100 : 0;

  // Calculate max lane considering mobile controls
  const maxLaneMobile = Math.floor((game.offsetHeight - mobileOffset - player.offsetHeight) / 60);

  let lane = Math.round(y / 60);
  lane = Math.max(0, Math.min(maxLaneMobile, lane)); // clamp lane properly

  playerY = lane * 60;

  // Jump/boing effect
  player.style.transform = 'translateY(-5px)';
  setTimeout(()=>{
    player.style.top = playerY + 'px';
    player.style.transform = 'translateY(0)';
  },50);
}


// Input
document.addEventListener('keydown',e=>{
  if(!running) return;
  if(e.key==='ArrowUp') setPlayerY(playerY-60);
  if(e.key==='ArrowDown') setPlayerY(playerY+60);
  if(e.key==='w') setPlayerY(playerY-60);
  if(e.key==='s') setPlayerY(playerY+60);
});
upBtn.addEventListener('click',()=>{if(running)setPlayerY(playerY-60);});
downBtn.addEventListener('click',()=>{if(running)setPlayerY(playerY+60);});

// Shadow
function createShadow() {
  const laneAttempts = [];

  // Determine max lane based on mobile platform
  const mobileOffset = window.innerWidth <= 768 ? 100 : 0;
  const maxLane = Math.floor((game.offsetHeight - mobileOffset - 40) / 60); // 40 = shadow height

  // Fill laneAttempts with allowed lanes
  for (let i = 0; i <= maxLane; i++) laneAttempts.push(i);

  while (laneAttempts.length > 0) {
    const index = Math.floor(Math.random() * laneAttempts.length);
    const lane = laneAttempts.splice(index, 1)[0];
    const yPos = lane * 60;

    // Avoid overlapping close to spawn
    if (shadows.some(s => s.lane === lane && s.x > 350)) continue;

    // Only gray-950 or black for strong visibility
    const colorClasses = ['bg-black', 'bg-gray-950' , 'bg-gray-900'];
    const chosenColor = colorClasses[Math.floor(Math.random() * colorClasses.length)];

    const shadowEl = document.createElement('div');
    shadowEl.className = `w-10 h-10 absolute rounded ${chosenColor} border border-gray-800`;
    shadowEl.style.left = '400px';
    shadowEl.style.top = yPos + 'px';
    game.appendChild(shadowEl);

    shadows.push({ el: shadowEl, x: 400, lane, speedOffset: Math.random() * 0.5 });
    break;
  }
}



// Start Game
function startGame(){
  shadows.forEach(s=>s.el.remove());
  shadows=[];
  score=0;
  speed=3;
  setPlayerY(280);
  scoreText.textContent='Score: 0';
  running=true;

  gameOverPanel.classList.add('hidden');
  gameOverPanel.classList.remove('flex','opacity-100');
  highScoreBadge.classList.add('hidden');

  bgMusic.currentTime=0;
  bgMusic.play();

  spawnInterval=setInterval(createShadow,700);
  lastTime=performance.now();
  gameLoopId=requestAnimationFrame(gameLoop);
}

// End Game
function endGame(){
  running=false;
  clearInterval(spawnInterval);
  if(gameLoopId) cancelAnimationFrame(gameLoopId);

  // Stop music and play death
  bgMusic.pause();
  deathMusic.currentTime=0;
  deathMusic.play();

  if(score>highScore){
    highScore=score;
    localStorage.setItem('highScore',highScore);
    highScoreBadge.classList.remove('hidden');
    bestScoreText.textContent = highScore;
  }

  finalScore.textContent=`Your Score: ${score} | High Score: ${highScore}`;
  game.classList.add('bg-red-900');
  setTimeout(()=>game.classList.remove('bg-red-900'),100);

  gameOverPanel.classList.remove('hidden');
  setTimeout(()=>gameOverPanel.classList.add('flex','opacity-100'),10);
}
scoreText.style.zIndex = 50; // ensures top layer

// Animate score
function animateScore(newScore){
  let current=parseInt(scoreText.textContent.replace('Score: ',''));
  if(current<newScore){
    const increment=()=>{if(current<newScore){current++;scoreText.textContent=`Score: ${current}`;requestAnimationFrame(increment);}};
    requestAnimationFrame(increment);
  }
}

// Game Loop
function gameLoop(now){
  const dt=now-lastTime;
  lastTime=now;

  for(let i=shadows.length-1;i>=0;i--){
    const s=shadows[i];
    s.x -= (speed+s.speedOffset)*(dt/16);
    s.el.style.left=s.x+'px';

    if(s.x<-50){
      s.el.remove();
      shadows.splice(i,1);
      score++;
      animateScore(score);
      createParticles(s.x+50,s.lane*60+5);
    }

    const pRect=player.getBoundingClientRect();
    const sRect=s.el.getBoundingClientRect();
    const pad=2;
    if(!(pRect.right-pad < sRect.left || pRect.left+pad > sRect.right || pRect.bottom-pad < sRect.top || pRect.top+pad > sRect.bottom)){
      endGame();
      return;
    }
  }

  // Speed increases slightly per score
  speed = 3 + score*0.1;

  if(running) gameLoopId=requestAnimationFrame(gameLoop);
}

// Particle effect
function createParticles(x,y){
  for(let i=0;i<3;i++){
    const p=document.createElement('div');
    p.className='w-1 h-1 bg-white absolute';
    p.style.left=x+'px';
    p.style.top=y+'px';
    game.appendChild(p);
    setTimeout(()=>p.remove(),300);
  }
}

// Buttons
startBtn.addEventListener('click',()=>{
  startScreen.style.display='none';
  game.classList.remove('hidden');
  startGame();
});
restartBtn.addEventListener('click',startGame);
menuBtn.addEventListener('click',()=>{
  game.classList.add('hidden');
  startScreen.style.display='flex';
  gameOverPanel.classList.add('hidden');
  gameOverPanel.classList.remove('flex','opacity-100');
  highScoreBadge.classList.add('hidden');
  clearInterval(spawnInterval);
  if(gameLoopId) cancelAnimationFrame(gameLoopId);
  running=false;
  bgMusic.pause();
});

// Cleanup
window.addEventListener('beforeunload',()=>{
  clearInterval(spawnInterval);
  if(gameLoopId) cancelAnimationFrame(gameLoopId);
  bgMusic.pause();
});