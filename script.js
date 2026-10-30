// --- Vocabulary Banks categorized by Lesson Type ---
const wordBanks = {
  hard: [
    "abandon", "absolute", "brilliant", "calendar", "capacity", "category",
    "charity", "decision", "dynamic", "eclipse", "economy", "facility",
    "festival", "frontier", "garment", "general", "gravity", "habitat",
    "horizon", "ignition", "justice", "kinetic", "lantern", "magnet",
    "navigate", "organic", "pioneer", "quality", "radical", "radiant",
    "rejected", "satellite", "somalia", "strategy", "terminal", "umbrella"
  ],
  easy: [
    "apple", "beach", "cloud", "dance", "eagle", "flame", "grape", "house",
    "juice", "kite", "lemon", "mouse", "night", "ocean", "plant", "queen",
    "river", "smile", "train", "unity", "voice", "water", "youth", "zebra"
  ],
  homerow: [
    "asdf", "jkl;", "dad", "fad", "lad", "sad", "fall", "salad", "glass",
    "flask", "kajal", "all", "gall", "sass", "jalal", "flag", "lags"
  ],
  toprow: [
    "qwer", "tyui", "op", "power", "quiet", "route", "type", "rope", "tree",
    "pour", "write", "prop", "tour", "peer", "true", "error", "port"
  ],
  bottomrow: [
    "zxcv", "bnm", "zinc", "mini", "bomb", "cave", "bane", "mac", "van",
    "zero", "zinc", "vim", "mix", "vim", "zulu"
  ]
};

const animalEmojis = ["🦆", "🐼", "🐸", "🦉", "🐧", "🐨", "🦊"];

// --- Game State Variables ---
let currentDifficulty = "hard";
let currentLesson = "hard";
let score = 0;
let timeLeft = 60;
let isPlaying = false;
let gameTimer = null;
let spawnTimer = null;
let activeAnimals = [];
let totalTypedCount = 0;
let correctHits = 0;

// --- DOM References ---
const optionsScreen = document.getElementById("optionsScreen");
const gameScreen = document.getElementById("gameScreen");
const playBtn = document.getElementById("playBtn");
const quitBtn = document.getElementById("quitBtn");

const diffList = document.getElementById("diffList");
const lessonList = document.getElementById("lessonList");

const liveScoreEl = document.getElementById("liveScore");
const timeLeftEl = document.getElementById("timeLeft");
const gameInput = document.getElementById("gameInput");
const tracksArea = document.getElementById("tracksArea");
const meterThumb = document.getElementById("meterThumb");

const reportModal = document.getElementById("reportModal");
const repScore = document.getElementById("repScore");
const repWpm = document.getElementById("repWpm");
const repAccuracy = document.getElementById("repAccuracy");
const repAnimals = document.getElementById("repAnimals");
const menuReturnBtn = document.getElementById("menuReturnBtn");

// --- Menu Selection Handlers ---
diffList.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li) return;
  [...diffList.children].forEach(el => el.classList.remove("selected"));
  li.classList.add("selected");
  currentDifficulty = li.getAttribute("data-val");
});

lessonList.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li) return;
  [...lessonList.children].forEach(el => el.classList.remove("selected"));
  li.classList.add("selected");
  currentLesson = li.getAttribute("data-val");
});

// --- Start Game ---
playBtn.addEventListener("click", startGame);

function startGame() {
  optionsScreen.classList.remove("active");
  gameScreen.classList.add("active");
  reportModal.classList.remove("active");

  resetGameState();
  isPlaying = true;
  gameInput.focus();

  // Timer countdown
  gameTimer = setInterval(() => {
    timeLeft--;
    timeLeftEl.innerText = timeLeft;
    
    // Update vertical side meter thumb progress (0% to 100%)
    const progressPercent = ((60 - timeLeft) / 60) * 100;
    meterThumb.style.top = `${progressPercent}%`;

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);

  // Spawn initial animals and set intervals based on difficulty
  let spawnInterval = currentDifficulty === "hard" ? 1300 : currentDifficulty === "medium" ? 1700 : 2200;
  spawnAnimal();
  spawnTimer = setInterval(spawnAnimal, spawnInterval);

  requestAnimationFrame(updateAnimationLoop);
}

function resetGameState() {
  clearInterval(gameTimer);
  clearInterval(spawnTimer);
  activeAnimals.forEach(a => a.element.remove());
  activeAnimals = [];

  score = 0;
  timeLeft = 60;
  totalTypedCount = 0;
  correctHits = 0;

  liveScoreEl.innerText = "0";
  timeLeftEl.innerText = "60";
  meterThumb.style.top = "0%";
  gameInput.value = "";
}

// --- Spawning & Moving Animals ---
function spawnAnimal() {
  if (!isPlaying) return;

  const wordBank = wordBanks[currentLesson] || wordBanks.hard;
  const randomWord = wordBank[Math.floor(Math.random() * wordBank.length)];
  const randomEmoji = animalEmojis[Math.floor(Math.random() * animalEmojis.length)];
  const randomTrackIndex = Math.floor(Math.random() * 3);

  // Determine speed based on difficulty
  let speedMultiplier = currentDifficulty === "hard" ? 2.2 : currentDifficulty === "medium" ? 1.7 : 1.2;
  let speed = (1.2 + Math.random() * 0.8) * speedMultiplier;

  // DOM creation
  const animalEl = document.createElement("div");
  animalEl.className = "animal-target";
  animalEl.innerHTML = `
    <span class="animal-emoji">${randomEmoji}</span>
    <span class="animal-word">${randomWord}</span>
  `;

  const trackContainer = document.getElementById(`track-${randomTrackIndex}`);
  trackContainer.appendChild(animalEl);

  activeAnimals.push({
    element: animalEl,
    word: randomWord,
    posX: -180,
    speed: speed
  });
}

function updateAnimationLoop() {
  if (!isPlaying) return;

  const canvasWidth = tracksArea.clientWidth;

  for (let i = activeAnimals.length - 1; i >= 0; i--) {
    const animal = activeAnimals[i];
    animal.posX += animal.speed;
    animal.element.style.left = `${animal.posX}px`;

    // Remove animal if it crosses right edge
    if (animal.posX > canvasWidth + 60) {
      animal.element.remove();
      activeAnimals.splice(i, 1);
    }
  }

  requestAnimationFrame(updateAnimationLoop);
}

// --- Typing Input Listener ---
gameInput.addEventListener("input", () => {
  if (!isPlaying) return;

  const typedText = gameInput.value.trim().toLowerCase();
  const matchedIndex = activeAnimals.findIndex(a => a.word.toLowerCase() === typedText);

  if (matchedIndex !== -1) {
    totalTypedCount++;
    correctHits++;

    const targetAnimal = activeAnimals[matchedIndex];
    score += targetAnimal.word.length * 10;
    liveScoreEl.innerText = score;

    // Pop animation
    targetAnimal.element.classList.add("popped");
    setTimeout(() => targetAnimal.element.remove(), 200);
    activeAnimals.splice(matchedIndex, 1);

    gameInput.value = "";
  }
});

gameInput.addEventListener("keydown", (e) => {
  if (isPlaying && (e.key === "Enter" || e.key === " ")) {
    if (gameInput.value.trim() !== "") {
      totalTypedCount++;
      gameInput.value = "";
    }
  }
});

// --- End Game & Report Modal ---
function endGame() {
  isPlaying = false;
  clearInterval(gameTimer);
  clearInterval(spawnTimer);

  repScore.innerText = score;
  repWpm.innerText = Math.round((correctHits / 1) || 0); // 1 minute game session WPM
  repAccuracy.innerText = totalTypedCount === 0 ? "100%" : `${Math.round((correctHits / totalTypedCount) * 100)}%`;
  repAnimals.innerText = correctHits;

  reportModal.classList.add("active");
}

quitBtn.addEventListener("click", () => {
  isPlaying = false;
  clearInterval(gameTimer);
  clearInterval(spawnTimer);
  gameScreen.classList.remove("active");
  optionsScreen.classList.add("active");
});

menuReturnBtn.addEventListener("click", () => {
  reportModal.classList.remove("active");
  gameScreen.classList.remove("active");
  optionsScreen.classList.add("active");
});
