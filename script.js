// --- Extensive Standard English Vocabulary List ---
const dictionary = [
  "apple", "river", "cloud", "breeze", "beacon", "castle", "dragon", "forest",
  "garden", "harbor", "island", "jungle", "kingdom", "lantern", "meadow", "ocean",
  "planet", "quarry", "shadow", "timber", "valley", "window", "yellow", "zephyr",
  "amber", "blossom", "crystal", "diamond", "emerald", "feather", "glimmer", "harvest",
  "journey", "knapsack", "library", "mountain", "notebook", "orchard", "pyramid",
  "rainbow", "sapphire", "thunder", "umbrella", "volcano", "whisper", "horizon",
  "galaxy", "harmony", "miracle", "pioneer", "riddle", "silence", "triumph", "voyage",
  "wander", "brave", "swift", "bright", "calm", "eager", "gentle", "happy", "jolly",
  "keen", "lively", "noble", "polite", "quiet", "radiant", "steady", "vibrant", "wise",
  "anchor", "bridge", "canyon", "desert", "falcon", "glacier", "hunter", "legend",
  "monarch", "nature", "pebble", "rocket", "spirit", "temple", "velvet", "wisdom",
  "autumn", "butter", "candle", "dolphins", "engine", "flower", "guitar", "planet"
];

// --- Unique Bird Emojis for Visual Variety ---
const birdIcons = ["🦅", "🦜", "🕊️", "🦉", "🦆", "🦩", "🐦"];

// --- State Variables ---
let score = 0;
let totalTypedEntries = 0;
let correctHitsCount = 0;
let easyHits = 0;
let mediumHits = 0;
let hardHits = 0;

let timeLeft = 60;
let isGameRunning = false;
let gameTimer = null;
let spawnTimer = null;
let activeBirds = [];

// --- DOM References ---
const skyArea = document.getElementById("skyArea");
const wordInput = document.getElementById("wordInput");
const startOverlay = document.getElementById("startOverlay");
const endModal = document.getElementById("endModal");

const timeEl = document.getElementById("time");
const scoreEl = document.getElementById("score");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const modalRestartBtn = document.getElementById("modalRestartBtn");

// Final modal stat displays
const finalScore = document.getElementById("finalScore");
const finalWpm = document.getElementById("finalWpm");
const finalAccuracy = document.getElementById("finalAccuracy");
const finalHits = document.getElementById("finalHits");
const easyHitsEl = document.getElementById("easyHits");
const medHitsEl = document.getElementById("medHits");
const hardHitsEl = document.getElementById("hardHits");

// --- Input Listener ---
wordInput.addEventListener("input", (e) => {
  const typedText = wordInput.value.trim().toLowerCase();

  // Trigger game start if user types 'start'
  if (!isGameRunning && typedText === "start") {
    startGame();
    wordInput.value = "";
    return;
  }

  if (!isGameRunning) return;

  // Check matching active bird
  const hitIndex = activeBirds.findIndex(b => b.word.toLowerCase() === typedText);

  if (hitIndex !== -1) {
    totalTypedEntries++;
    correctHitsCount++;
    
    const targetBird = activeBirds[hitIndex];
    
    // Update Score & Tier Counts
    score += targetBird.points;
    if (targetBird.tier === "easy") easyHits++;
    else if (targetBird.tier === "medium") mediumHits++;
    else hardHits++;

    // Play Pop animation & remove
    popBird(targetBird);
    activeBirds.splice(hitIndex, 1);

    // Clear input box
    wordInput.value = "";
    updateStatsUI();
  }
});

// Detect wrong submissions on 'Space' or 'Enter'
wordInput.addEventListener("keydown", (e) => {
  if (isGameRunning && (e.key === " " || e.key === "Enter")) {
    const typedText = wordInput.value.trim();
    if (typedText !== "") {
      totalTypedEntries++;
      wordInput.value = "";
      updateStatsUI();
    }
  }
});

// --- Game Control Functions ---
function startGame() {
  resetState();
  isGameRunning = true;
  startOverlay.style.display = "none";
  endModal.classList.remove("active");
  wordInput.value = "";
  wordInput.placeholder = "Type the flying words...";
  wordInput.focus();

  // Start 1-Minute Countdown
  gameTimer = setInterval(() => {
    timeLeft--;
    timeEl.innerText = `${timeLeft}s`;
    updateStatsUI();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);

  // Spawn first set of birds immediately and schedule interval
  spawnBird();
  spawnTimer = setInterval(spawnBird, 1400);

  // Frame Loop for updating bird positions
  requestAnimationFrame(moveBirds);
}

function endGame() {
  isGameRunning = false;
  clearInterval(gameTimer);
  clearInterval(spawnTimer);

  // Show Modal Results
  finalScore.innerText = score;
  finalWpm.innerText = calculateWPM();
  finalAccuracy.innerText = calculateAccuracy() + "%";
  finalHits.innerText = correctHitsCount;
  easyHitsEl.innerText = easyHits;
  medHitsEl.innerText = mediumHits;
  hardHitsEl.innerText = hardHits;

  endModal.classList.add("active");
  wordInput.placeholder = "Game Over! Click Play Again.";
}

function resetState() {
  clearInterval(gameTimer);
  clearInterval(spawnTimer);

  // Remove existing bird DOM elements
  activeBirds.forEach(b => b.element.remove());
  activeBirds = [];

  score = 0;
  totalTypedEntries = 0;
  correctHitsCount = 0;
  easyHits = 0;
  mediumHits = 0;
  hardHits = 0;
  timeLeft = 60;

  timeEl.innerText = "60s";
  scoreEl.innerText = "0";
  wpmEl.innerText = "0";
  accuracyEl.innerText = "100%";
}

// --- Spawning & Moving Birds ---
function spawnBird() {
  if (!isGameRunning) return;

  // Pick random word from dictionary
  const randomWord = dictionary[Math.floor(Math.random() * dictionary.length)];
  const randomIcon = birdIcons[Math.floor(Math.random() * birdIcons.length)];
  const randomTrack = Math.floor(Math.random() * 3); // 3 Tracks (0, 1, 2)

  // Categorize complexity
  let tier = "easy";
  let points = 1;
  let speed = 2.0 + Math.random() * 1.0; // Movement speed

  if (randomWord.length >= 8) {
    tier = "hard";
    points = 3;
    speed = 1.2 + Math.random() * 0.8;
  } else if (randomWord.length >= 6) {
    tier = "medium";
    points = 2;
    speed = 1.6 + Math.random() * 1.0;
  }

  // Create DOM Element
  const birdEl = document.createElement("div");
  birdEl.className = `bird-target ${tier}`;
  birdEl.innerHTML = `
    <span class="bird-icon">${randomIcon}</span>
    <span class="word-label">${randomWord}</span>
  `;

  const trackContainer = document.getElementById(`track-${randomTrack}`);
  trackContainer.appendChild(birdEl);

  activeBirds.push({
    element: birdEl,
    word: randomWord,
    tier: tier,
    points: points,
    posX: -180,
    speed: speed
  });
}

function moveBirds() {
  if (!isGameRunning) return;

  const skyWidth = skyArea.clientWidth;

  for (let i = activeBirds.length - 1; i >= 0; i--) {
    const bird = activeBirds[i];
    bird.posX += bird.speed;
    bird.element.style.left = `${bird.posX}px`;

    // Remove if bird flies off right edge of screen
    if (bird.posX > skyWidth + 50) {
      bird.element.remove();
      activeBirds.splice(i, 1);
    }
  }

  requestAnimationFrame(moveBirds);
}

function popBird(birdObj) {
  birdObj.element.classList.add("popped");
  setTimeout(() => {
    birdObj.element.remove();
  }, 250);
}

// --- Metrics Calculations ---
function calculateWPM() {
  const timeElapsedMinutes = (60 - timeLeft) / 60;
  if (timeElapsedMinutes <= 0) return 0;
  return Math.round((correctHitsCount) / timeElapsedMinutes) || 0;
}

function calculateAccuracy() {
  if (totalTypedEntries === 0) return 100;
  return Math.min(100, Math.round((correctHitsCount / totalTypedEntries) * 100));
}

function updateStatsUI() {
  scoreEl.innerText = score;
  wpmEl.innerText = calculateWPM();
  accuracyEl.innerText = `${calculateAccuracy()}%`;
}

// Event Listeners for Start & Restart buttons
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
modalRestartBtn.addEventListener("click", startGame);
