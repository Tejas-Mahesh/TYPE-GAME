// Game Elements
const input = document.getElementById("input");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");
const overlay = document.getElementById("overlay");
const overlayCard = document.getElementById("overlayCard");
const startBtn = document.getElementById("startBtn");

// Word Lists
const simpleWords = [
  "bird", "fly", "sky", "wing", "nest", "fast", "code", "java", "node", 
  "wind", "tree", "cloud", "blue", "star", "dash", "zoom", "soft", "peak"
];

const strongWords = [
  "javascript", "developer", "algorithm", "responsive", "efficiency", 
  "programming", "architecture", "microcontroller", "optimization", 
  "performance", "synchronous", "cybersecurity"
];

const birdIcons = ["🦅", "🦜", "🕊️", "🦆", "🦉", "🦅"];

// Game Variables
let score = 0;
let time = 60;
let timerInterval = null;
let spawnInterval = null;
let gameActive = false;

let totalKeystrokes = 0;
let correctKeystrokes = 0;
let totalWordsTyped = 0;
let correctWordsCount = 0;

let activeBirds = []; // Array of bird objects { id, word, lane, speed, position, points, element }

// Listen for "Start Game" command or Space/Enter typing
input.addEventListener("input", (e) => {
  const typedVal = input.value.trim().toLowerCase();

  // If game is inactive, check if user typed "dstart game" or "start game"
  if (!gameActive) {
    if (typedVal === "start game" || typedVal === "dstart game") {
      startGame();
    }
    return;
  }

  // Record total keystrokes for accuracy calculation
  if (e.inputType === "insertText") {
    totalKeystrokes++;
  }
});

// Submit word on Space or Enter key
input.addEventListener("keydown", (e) => {
  if (!gameActive) return;

  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    const typedWord = input.value.trim().toLowerCase();
    
    if (typedWord.length > 0) {
      checkWordMatch(typedWord);
    }
    input.value = "";
  }
});

// Start Game Workflow
function startGame() {
  resetStats();
  gameActive = true;
  overlay.style.display = "none";
  input.value = "";
  input.placeholder = "Type moving words and hit SPACE or ENTER...";
  input.focus();

  // Start 1-minute countdown
  timerInterval = setInterval(() => {
    time--;
    timeEl.innerText = time;
    calculateWPM();

    if (time <= 0) {
      endGame();
    }
  }, 1000);

  // Spawn birds at regular intervals
  spawnBird();
  spawnInterval = setInterval(spawnBird, 1800);

  // Animation Loop for Moving Birds
  requestAnimationFrame(moveBirds);
}

// Spawn new bird in one of the 3 lanes
function spawnBird() {
  if (!gameActive) return;

  // Choose simple (70% chance) vs strong (30% chance)
  const isStrong = Math.random() > 0.7;
  const wordList = isStrong ? strongWords : simpleWords;
  const word = wordList[Math.floor(Math.random() * wordList.length)];

  const points = isStrong ? 20 : 10;
  const laneIndex = Math.floor(Math.random() * 3);
  const laneEl = document.getElementById(`lane-${laneIndex}`);
  const icon = birdIcons[Math.floor(Math.random() * birdIcons.length)];

  // Create Bird DOM element
  const birdEl = document.createElement("div");
  birdEl.className = `bird ${isStrong ? 'strong' : 'simple'}`;
  birdEl.innerHTML = `
    <span class="bird-icon">${icon}</span>
    <span class="word-tag">${word}</span>
    <span class="points-badge">+${points}</span>
  `;

  laneEl.appendChild(birdEl);

  const speed = isStrong ? 1.2 + Math.random() * 0.8 : 1.8 + Math.random() * 1.2;

  const birdObj = {
    id: Date.now() + Math.random(),
    word: word,
    lane: laneIndex,
    speed: speed,
    position: -150, // Start just off-screen to the left
    points: points,
    element: birdEl
  };

  activeBirds.push(birdObj);
}

// Animate bird positions continuously
function moveBirds() {
  if (!gameActive) return;

  const containerWidth = document.getElementById("gameSky").offsetWidth;

  for (let i = activeBirds.length - 1; i >= 0; i--) {
    const bird = activeBirds[i];
    bird.position += bird.speed;
    bird.element.style.left = `${bird.position}px`;

    // Remove birds that fly beyond the right boundary
    if (bird.position > containerWidth + 50) {
      bird.element.remove();
      activeBirds.splice(i, 1);
    }
  }

  requestAnimationFrame(moveBirds);
}

// Check typed word against active birds
function checkWordMatch(typedWord) {
  totalWordsTyped++;
  let matchedIndex = activeBirds.findIndex(b => b.word.toLowerCase() === typedWord);

  if (matchedIndex !== -1) {
    const matchedBird = activeBirds[matchedIndex];
    
    // Add score & update keystroke stats
    score += matchedBird.points;
    scoreEl.innerText = score;
    correctWordsCount++;
    correctKeystrokes += typedWord.length;

    // Visual shot-down effect
    matchedBird.element.style.transform = "scale(1.4) rotate(20deg)";
    matchedBird.element.style.opacity = "0";
    
    setTimeout(() => {
      matchedBird.element.remove();
    }, 200);

    activeBirds.splice(matchedIndex, 1);
  }

  updateAccuracy();
  calculateWPM();
}

// Calculate Accuracy
function updateAccuracy() {
  if (totalKeystrokes === 0) {
    accuracyEl.innerText = "100%";
    return;
  }
  const acc = Math.round((correctKeystrokes / totalKeystrokes) * 100);
  accuracyEl.innerText = `${Math.min(100, Math.max(0, acc))}%`;
}

// Calculate WPM (Words Per Minute based on 5 chars per word standard)
function calculateWPM() {
  const timeElapsed = (60 - time) / 60;
  if (timeElapsed <= 0) return;
  const wpm = Math.round((correctKeystrokes / 5) / timeElapsed);
  wpmEl.innerText = wpm || 0;
}

// Reset stats for new round
function resetStats() {
  score = 0;
  time = 60;
  totalKeystrokes = 0;
  correctKeystrokes = 0;
  totalWordsTyped = 0;
  correctWordsCount = 0;

  scoreEl.innerText = "0";
  timeEl.innerText = "60";
  wpmEl.innerText = "0";
  accuracyEl.innerText = "100%";

  // Clean remaining birds
  activeBirds.forEach(b => b.element.remove());
  activeBirds = [];
}

// End Game & Display Results
function endGame() {
  gameActive = false;
  clearInterval(timerInterval);
  clearInterval(spawnInterval);

  input.disabled = true;

  const finalWPM = wpmEl.innerText;
  const finalAcc = accuracyEl.innerText;

  overlayCard.innerHTML = `
    <h2>🎉 Time's Up! Game Over 🎉</h2>
    <p>Here is your typing performance report:</p>
    
    <div class="summary-stats">
      <div><strong>Final Score:</strong> ${score}</div>
      <div><strong>Speed:</strong> ${finalWPM} WPM</div>
      <div><strong>Accuracy:</strong> ${finalAcc}</div>
      <div><strong>Targets Hit:</strong> ${correctWordsCount} words</div>
    </div>

    <button id="restartBtn">Play Again</button>
  `;

  overlay.style.display = "flex";

  document.getElementById("restartBtn").addEventListener("click", () => {
    input.disabled = false;
    startGame();
  });
}

// Start Button Event Listener
startBtn.addEventListener("click", startGame);
