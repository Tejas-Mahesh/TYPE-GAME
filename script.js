// --- Categorized English Vocabulary Sets ---
const wordSets = {
  easy: [
    "duck", "bird", "bear", "frog", "lion", "wolf", "deer", "swan", "crow", "dove",
    "park", "lake", "tree", "leaf", "star", "moon", "rain", "wind", "snow", "city"
  ],
  hard: [
    "flamingo", "elephant", "kangaroo", "hedgehog", "porcupine", "chameleon",
    "butterfly", "caterpillar", "alligator", "adventure", "moulding", "championship"
  ],
  home: [
    "fall", "glad", "flag", "flask", "half", "dash", "lads", "sash", "ask", "add"
  ],
  top: [
    "tree", "quiet", "power", "tower", "water", "write", "purity", "pretty", "type"
  ],
  bottom: [
    "cave", "band", "barn", "calm", "vivid", "scan", "mask", "back", "pack", "bank"
  ]
};

// General English pool for 'All English Words'
const allWordsPool = [
  ...wordSets.easy,
  ...wordSets.hard,
  "castle", "garden", "harbor", "island", "jungle", "lantern", "meadow", "ocean",
  "planet", "shadow", "timber", "valley", "window", "yellow", "crystal", "diamond",
  "emerald", "feather", "glimmer", "harvest", "journey", "mountain", "orchard"
];

// Target Avatars & Color Theme Classes
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
let totalTypedEntries = 0;
let correctHits = 0;
let timeLeft = 60;

let gameTimer = null;
let spawnTimer = null;
let activeTargets = [];

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

  // Speed & Spawning parameters derived from selected options
  let spawnInterval = 1600;
  if (selectedDifficulty === "medium") spawnInterval = 1300;
  if (selectedDifficulty === "hard") spawnInterval = 1000;

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
  requestAnimationFrame(moveTargets);
}

function endGame() {
  isGameRunning = false;
  clearInterval(gameTimer);
  clearInterval(spawnTimer);

  finalScore.innerText = score;
  finalWpm.innerText = calculateWPM();
  finalAccuracy.innerText = calculateAccuracy() + "%";
  finalHits.innerText = correctHits;

  endModal.classList.add("active");
}

function resetState() {
  clearInterval(gameTimer);
  clearInterval(spawnTimer);

  activeTargets.forEach(t => t.element.remove());
  activeTargets = [];

  score = 0;
  totalTypedEntries = 0;
  correctHits = 0;
  timeLeft = 60;

  scoreVal.innerText = "0";
  timeVal.innerText = "60s";
  wpmVal.innerText = "0";
  accuracyVal.innerText = "100%";
}

// --- Spawning & Target Mechanics ---
function getWordList() {
  if (selectedLesson === "all") return allWordsPool;
  return wordSets[selectedLesson] || allWordsPool;
}

function spawnTarget() {
  if (!isGameRunning) return;

  const pool = getWordList();
  const word = pool[Math.floor(Math.random() * pool.length)];
  const targetType = targetTypes[Math.floor(Math.random() * targetTypes.length)];
  const trackIdx = Math.floor(Math.random() * 3);

  // Speed calculated by difficulty
  let baseSpeed = 1.8;
  if (selectedDifficulty === "medium") baseSpeed = 2.5;
  if (selectedDifficulty === "hard") baseSpeed = 3.3;

  const speed = baseSpeed + Math.random() * 0.8;

  // Create Element
  const cardEl = document.createElement("div");
  cardEl.className = `target-card ${targetType.styleClass}`;

  // Build character spans for letter-by-letter typing highlight
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
    posX: -280,
    speed: speed,
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
    if (target.posX > stageWidth + 60) {
      target.element.remove();
      activeTargets.splice(i, 1);
    }
  }

  requestAnimationFrame(moveTargets);
}

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
    totalTypedEntries++;

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
      // Highlight typed character prefix
      wordSpans.forEach((span, idx) => {
        if (idx < typedVal.length) {
          span.className = "char-typed";
        } else {
          span.className = "char-untyped";
        }
      });
    } else {
      // Reset formatting when typing doesn't match
      wordSpans.forEach(span => span.className = "char-untyped");
    }
  });
});

// Detect space/enter for completed word submissions
typingInput.addEventListener("keydown", (e) => {
  if (isGameRunning && (e.key === " " || e.key === "Enter")) {
    const typedVal = typingInput.value.trim();
    if (typedVal !== "") {
      totalTypedEntries++;
      typingInput.value = "";
      
      // Reset all highlights
      activeTargets.forEach(target => {
        const wordSpans = target.element.querySelectorAll(".target-word span");
        wordSpans.forEach(span => span.className = "char-untyped");
      });

      updateStats();
    }
  }
});

// --- Score Calculations ---
function calculateWPM() {
  const elapsedMinutes = (60 - timeLeft) / 60;
  if (elapsedMinutes <= 0) return 0;
  return Math.round(correctHits / elapsedMinutes) || 0;
}

function calculateAccuracy() {
  if (totalTypedEntries === 0) return 100;
  return Math.min(100, Math.round((correctHits / totalTypedEntries) * 100));
}

function updateStats() {
  scoreVal.innerText = score;
  wpmVal.innerText = calculateWPM();
  accuracyVal.innerText = `${calculateAccuracy()}%`;
}
