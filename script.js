// --- Expanded Categorized Vocabulary Sets ---
const wordSets = {
  easy: [
    "duck", "bird", "bear", "frog", "lion", "wolf", "deer", "swan", "crow", "dove",
    "park", "lake", "tree", "leaf", "star", "moon", "rain", "wind", "snow", "city",
    "fish", "seal", "crab", "ship", "boat", "wave", "sand", "hill", "peak", "rock",
    "cloud", "forest", "stream", "tiger", "zebra", "monkey", "rabbit", "turtle"
  ],
  hard: [
    "flamingo", "elephant", "kangaroo", "hedgehog", "porcupine", "chameleon",
    "butterfly", "caterpillar", "alligator", "adventure", "championship", "ecosystem",
    "microscope", "playground", "sanctuary", "wilderness", "astronomy", "reflection",
    "architecture", "destination", "extraordinary", "temperature", "constellation"
  ],
  home: [
    "fall", "glad", "flag", "flask", "half", "dash", "lads", "sash", "ask", "add",
    "flash", "salad", "glass", "hall", "kafka", "shall", "slash", "all", "dad", "gas"
  ],
  top: [
    "tree", "quiet", "power", "tower", "water", "write", "purity", "pretty", "type",
    "rope", "wire", "poet", "root", "pout", "weep", "trip", "equip", "peer", "pour"
  ],
  bottom: [
    "cave", "band", "barn", "calm", "vivid", "scan", "mask", "back", "pack", "bank",
    "lamb", "exam", "zone", "zinc", "monk", "bomb", "verb", "munch", "camp", "jazz"
  ]
};

const allWordsPool = [
  ...wordSets.easy,
  ...wordSets.hard,
  ...wordSets.home,
  ...wordSets.top,
  ...wordSets.bottom,
  "castle", "garden", "harbor", "island", "jungle", "lantern", "meadow", "ocean",
  "planet", "shadow", "timber", "valley", "window", "yellow", "crystal", "diamond",
  "emerald", "feather", "glimmer", "harvest", "journey", "mountain", "orchard",
  "pyramid", "horizon", "thunder", "volcano", "waterfall", "blizzard", "starlight"
];

const targetTypes = [
  { icon: "🦆", styleClass: "duck" },
  { icon: "🦉", styleClass: "owl" },
  { icon: "🐼", styleClass: "panda" },
  { icon: "🦜", styleClass: "parrot" },
  { icon: "🦩", styleClass: "flamingo" }
];

// --- State Management ---
let selectedDifficulty = "easy";
let selectedLesson = "all";

let isGameRunning = false;
let score = 0;
let totalKeyPresses = 0;
let correctKeyPresses = 0;
let correctHits = 0;
let timeLeft = 60;

let gameTimer = null;
let spawnTimer = null;
let activeTargets = [];
let animationFrameId = null;

// --- DOM References ---
const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const endModal = document.getElementById("endModal");

const playBtn = document.getElementById("playBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const changeOptionsBtn = document.getElementById("changeOptionsBtn");
const exitGameBtn = document.getElementById("exitGameBtn");

const typingInput = document.getElementById("typingInput");
const flyStage = document.getElementById("flyStage");

const scoreVal = document.getElementById("scoreVal");
const timeVal = document.getElementById("timeVal");
const wpmVal = document.getElementById("wpmVal");
const accuracyVal = document.getElementById("accuracyVal");

const finalScore = document.getElementById("finalScore");
const finalWpm = document.getElementById("finalWpm");
const finalAccuracy = document.getElementById("finalAccuracy");
const finalHits = document.getElementById("finalHits");

// --- Menu Selection Handlers ---
document.querySelectorAll("#difficultyList .select-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#difficultyList .select-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedDifficulty = btn.dataset.diff;
  });
});

document.querySelectorAll("#lessonList .select-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#lessonList .select-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedLesson = btn.dataset.lesson;
  });
});

// --- Game Life Cycle ---
playBtn.addEventListener("click", startGame);
playAgainBtn.addEventListener("click", startGame);

changeOptionsBtn.addEventListener("click", () => {
  endModal.classList.remove("active");
  startScreen.classList.add("active");
});

exitGameBtn.addEventListener("click", () => {
  endGame();
  endModal.classList.remove("active");
  startScreen.classList.add("active");
});

function startGame() {
  resetState();
  isGameRunning = true;

  startScreen.classList.remove("active");
  endModal.classList.remove("active");

  typingInput.value = "";
  typingInput.focus();

  // Spawning intervals based on difficulty
  let spawnInterval = 1200;
  if (selectedDifficulty === "medium") spawnInterval = 900;
  if (selectedDifficulty === "hard") spawnInterval = 650;

  // 1-Minute Clock Timer
  gameTimer = setInterval(() => {
    timeLeft--;
    timeVal.innerText = `${timeLeft}s`;
    updateStats();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);

  // Spawn Target Objects
  spawnTarget();
  spawnTimer = setInterval(spawnTarget, spawnInterval);

  // Start Animation Loop
  animationFrameId = requestAnimationFrame(moveTargets);
}

function endGame() {
  isGameRunning = false;
  clearInterval(gameTimer);
  clearInterval(spawnTimer);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  finalScore.innerText = score;
  finalWpm.innerText = calculateWPM();
  finalAccuracy.innerText = calculateAccuracy() + "%";
  finalHits.innerText = correctHits;

  endModal.classList.add("active");
}

function resetState() {
  clearInterval(gameTimer);
  clearInterval(spawnTimer);
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  activeTargets.forEach(t => t.element.remove());
  activeTargets = [];

  score = 0;
  totalKeyPresses = 0;
  correctKeyPresses = 0;
  correctHits = 0;
  timeLeft = 60;

  scoreVal.innerText = "0";
  timeVal.innerText = "60s";
  wpmVal.innerText = "0";
  accuracyVal.innerText = "100%";
}

// --- Spawning & Target Mechanics with Non-Overlapping Lanes ---
function getWordList() {
  if (selectedLesson === "all") return allWordsPool;
  return wordSets[selectedLesson] || allWordsPool;
}

function spawnTarget() {
  if (!isGameRunning) return;

  const pool = getWordList();
  const word = pool[Math.floor(Math.random() * pool.length)];
  const targetType = targetTypes[Math.floor(Math.random() * targetTypes.length)];

  let trackIdx = Math.floor(Math.random() * 4);
  let attempts = 0;

  // Ensure targets in the same lane do not overlap/stack
  while (attempts < 4) {
    const lastInTrack = activeTargets
      .filter(t => t.trackIdx === trackIdx)
      .sort((a, b) => b.posX - a.posX)[0];

    if (!lastInTrack || lastInTrack.posX > -120) {
      break;
    }
    trackIdx = (trackIdx + 1) % 4;
    attempts++;
  }

  if (attempts === 4) return;

  // Speed calculation based on difficulty
  let baseSpeed = 3.2;
  if (selectedDifficulty === "medium") baseSpeed = 4.5;
  if (selectedDifficulty === "hard") baseSpeed = 6.0;

  const speed = baseSpeed + Math.random() * 1.0;

  // Create Element
  const cardEl = document.createElement("div");
  cardEl.className = `target-card ${targetType.styleClass}`;

  let spansHTML = "";
  for (let i = 0; i < word.length; i++) {
    spansHTML += `<span class="char-untyped">${word[i]}</span>`;
  }

  cardEl.innerHTML = `
    <span class="target-avatar">${targetType.icon}</span>
    <span class="target-word">${spansHTML}</span>
  `;

  const trackContainer = document.getElementById(`track-${trackIdx}`);
  trackContainer.appendChild(cardEl);

  activeTargets.push({
    element: cardEl,
    word: word.toLowerCase(),
    posX: -420,
    speed: speed,
    trackIdx: trackIdx,
    points: word.length > 6 ? 3 : (word.length > 4 ? 2 : 1)
  });
}

function moveTargets() {
  if (!isGameRunning) return;

  const stageWidth = flyStage.clientWidth;

  for (let i = activeTargets.length - 1; i >= 0; i--) {
    const target = activeTargets[i];
    target.posX += target.speed;
    target.element.style.left = `${target.posX}px`;

    // Remove targets that move off screen
    if (target.posX > stageWidth + 80) {
      target.element.remove();
      activeTargets.splice(i, 1);
    }
  }

  animationFrameId = requestAnimationFrame(moveTargets);
}

// --- Keypress & Real-Time Accuracy Auditing ---
typingInput.addEventListener("keydown", (e) => {
  if (!isGameRunning) return;

  if (["Shift", "Control", "Alt", "CapsLock", "Tab", "Escape", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    return;
  }

  totalKeyPresses++;

  if (e.key === "Backspace") {
    correctKeyPresses = Math.max(0, correctKeyPresses - 1);
    updateStats();
    return;
  }

  const typedVal = (typingInput.value + (e.key.length === 1 ? e.key : "")).trim().toLowerCase();
  const matchingTarget = activeTargets.find(t => t.word.startsWith(typedVal));
  
  if (matchingTarget) {
    correctKeyPresses++;
  }

  updateStats();
});

// --- Real-Time Typing & Letter Highlight Matcher ---
typingInput.addEventListener("input", () => {
  if (!isGameRunning) return;

  const typedVal = typingInput.value.trim().toLowerCase();

  // 1. Check full word hits
  const hitIndex = activeTargets.findIndex(t => t.word === typedVal);

  if (hitIndex !== -1) {
    const hitTarget = activeTargets[hitIndex];
    score += hitTarget.points;
    correctHits++;

    // Pop animation
    hitTarget.element.classList.add("popped");
    setTimeout(() => hitTarget.element.remove(), 200);
    activeTargets.splice(hitIndex, 1);

    typingInput.value = "";
    updateStats();
    return;
  }

  // 2. Real-Time Letter Highlight Matching for Partial Typing
  activeTargets.forEach(target => {
    const wordSpans = target.element.querySelectorAll(".target-word span");

    if (typedVal !== "" && target.word.startsWith(typedVal)) {
      wordSpans.forEach((span, idx) => {
        if (idx < typedVal.length) {
          span.className = "char-typed";
        } else {
          span.className = "char-untyped";
        }
      });
    } else {
      wordSpans.forEach(span => span.className = "char-untyped");
    }
  });
});

// Detect space/enter for resetting completed submissions
typingInput.addEventListener("keydown", (e) => {
  if (isGameRunning && (e.key === " " || e.key === "Enter")) {
    typingInput.value = "";
    activeTargets.forEach(target => {
      const wordSpans = target.element.querySelectorAll(".target-word span");
      wordSpans.forEach(span => span.className = "char-untyped");
    });
  }
});

// --- Score & Metric Calculations ---
function calculateWPM() {
  const elapsedMinutes = (60 - timeLeft) / 60;
  if (elapsedMinutes <= 0) return 0;
  return Math.round(correctHits / elapsedMinutes) || 0;
}

function calculateAccuracy() {
  if (totalKeyPresses <= 0) return 100;
  const acc = Math.round((correctKeyPresses / totalKeyPresses) * 100);
  return Math.min(100, Math.max(0, acc));
}

function updateStats() {
  scoreVal.innerText = score;
  wpmVal.innerText = calculateWPM();
  accuracyVal.innerText = `${calculateAccuracy()}%`;
}
