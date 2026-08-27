/**
 * Guess My Number - Game Logic
 * Handles core game mechanics: number generation, guessing, scoring, and user interactions
 * Features: Difficulty levels, hint system, sound effects, theme toggle, statistics tracking, and countdown timer
 * Version 1.5
 */
"use strict";

// Generate the initial secret number
let secretNumber = Math.trunc(Math.random() * 20) + 1;

const MAX_SCORE = 20;
let score = MAX_SCORE;
let attempts = 0;
let lastGuess = null;
let lastDifference = null;
let previousGuesses = [];
let round = 1;
let difficulty = "medium"; // easy, medium, hard
let lastAction = "Game ready";
let timerInterval = null; // Stores the active timer interval ID
let timeLeft = 60;
const ROUND_TIME = 60;
let maxNumber = 20;
let minNumber = 1;
const SAVE_KEY = "guessMyNumberRoundSaveV1";
const ACHIEVEMENTS_KEY = "guessMyNumberAchievementsV1";
let highscore = Number(localStorage.getItem("highscore")) || 0;
let gamesPlayed = Number(localStorage.getItem("gamesPlayed")) || 0;
let currentStreak = Number(localStorage.getItem("currentStreak")) || 0;
let bestStreak = Number(localStorage.getItem("bestStreak")) || 0;
let achievements = {};

// Wins/Losses tracking
let wins = Number(localStorage.getItem("wins")) || 0;
let losses = Number(localStorage.getItem("losses")) || 0;
let previousScore = localStorage.getItem("previousScore") ? Number(localStorage.getItem("previousScore")) : null;

// Session tracking (resets on page load)
let sessionGames = 0;

// Game is now ready for player input

// Shortcut selector
const $ = (q) => document.querySelector(q);

const loadAchievements = () => {
  const saved = localStorage.getItem(ACHIEVEMENTS_KEY);
  if (!saved) {
    achievements = {};
    return;
  }

  try {
    achievements = JSON.parse(saved);
  } catch (err) {
    achievements = {};
  }
};

const updateAchievementsDisplay = () => {
  const unlocked = Object.entries(achievements || {})
    .filter(([, value]) => value)
    .map(([name]) => name);

  const visual = unlocked.length ? unlocked.map((name) => name.replace(/-/g, " ")).join(", ") : "None yet";
  $(".achievements").textContent = visual;
};

const saveAchievements = () => {
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
  updateAchievementsDisplay();
};

const unlockAchievement = (id, displayName, toastText = "") => {
  if (!achievements[id]) {
    achievements[id] = true;
    saveAchievements();
    showToast(toastText || `${displayName} unlocked`, "success");
  }
};

const saveRoundState = () => {
  const snapshot = {
    secretNumber,
    score,
    attempts,
    lastGuess,
    lastDifference,
    previousGuesses,
    round,
    difficulty,
    timeLeft,
    maxNumber,
    highscore,
    gamesPlayed,
    wins,
    losses,
    currentStreak,
    bestStreak,
    savedAt: Date.now(),
    lastSavedAt: Date.now()
  };

  localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
  const saveDetail = $("#round-save-detail");
  if (saveDetail) {
    saveDetail.textContent = `Last saved: ${new Date(snapshot.lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
};

const restoreRoundState = () => {
  const saved = localStorage.getItem(SAVE_KEY);
  if (!saved) return false;

  try {
    const snapshot = JSON.parse(saved);
    secretNumber = Number(snapshot.secretNumber);
    score = Number(snapshot.score);
    attempts = Number(snapshot.attempts || 0);
    lastGuess = snapshot.lastGuess;
    lastDifference = snapshot.lastDifference ?? null;
    previousGuesses = Array.isArray(snapshot.previousGuesses) ? snapshot.previousGuesses : [];
    round = Number(snapshot.round || 1);
    difficulty = snapshot.difficulty || "medium";
    timeLeft = Number(snapshot.timeLeft ?? ROUND_TIME);
    maxNumber = Number(snapshot.maxNumber || 20);
    highscore = Number(snapshot.highscore || 0);
    gamesPlayed = Number(snapshot.gamesPlayed || 0);
    wins = Number(snapshot.wins || localStorage.getItem("wins") || 0);
    losses = Number(snapshot.losses || localStorage.getItem("losses") || 0);
    currentStreak = Number(snapshot.currentStreak || 0);
    bestStreak = Number(snapshot.bestStreak || 0);
    const lastSavedAt = Number(snapshot.lastSavedAt || snapshot.savedAt || Date.now());

    const selected = $(".difficulty-select");
    if (selected) {
      selected.value = difficulty;
    }

    $(".guess").max = maxNumber;
    $("#range-display").textContent = `(Between 1 and ${maxNumber})`;
    $(".score").textContent = score;
    $(".games-played").textContent = gamesPlayed;
    $(".current-streak").textContent = currentStreak;
    $(".highscore").textContent = highscore;
    $(".round").textContent = round;
    $(".attempts").textContent = attempts;
    $(".last-guess").textContent = lastGuess !== null ? lastGuess : "—";
    $(".history").textContent = previousGuesses.length ? previousGuesses.join(", ") : "None yet";

    const status = $("#round-save-status");
    if (status) {
      status.textContent = "Auto-save: restored";
    }

    const saveDetail = $("#round-save-detail");
    if (saveDetail) {
      saveDetail.textContent = `Last saved: ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    updateRoundDisplay();
    updateRoundBanner();
    updateScoreBar();
    updateDifficultyDisplay();
    updateInputHint();
    updateModeBadge();
    updateTimerDisplay();
    updateClosenessDisplay();
    updateWinsLossesDisplay();
    return true;
  } catch (err) {
    console.warn("Unable to restore saved round", err);
    localStorage.removeItem(SAVE_KEY);
    return false;
  }
};

const difficultyEmojis = {
  easy: "🟢",
  medium: "🟡",
  hard: "🔴"
};

/**
 * Plays audio feedback for game events
 * @param {string} type - The sound type: "success", "error", or "warm"
 */
let soundEnabled = localStorage.getItem("soundEnabled") !== "false";

const playSound = (type) => {
  if (!soundEnabled) return;

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const t = audioContext.currentTime;

  const playLayer = (freq, waveType, startTime, duration, vol, detune = 0, rampType = 'exponential') => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, startTime);
    osc.detune.setValueAtTime(detune, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + duration * 0.1);

    if (rampType === 'exponential') {
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    } else {
      gain.gain.linearRampToValueAtTime(0.001, startTime + duration);
    }

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  switch (type) {
    case "success":
      // Triumphant major arpeggio (C6, E6, G6, C7)
      playLayer(1046.50, "sine", t, 0.3, 0.15); // C6
      playLayer(1318.51, "sine", t + 0.12, 0.3, 0.15); // E6
      playLayer(1567.98, "sine", t + 0.24, 0.3, 0.15); // G6
      playLayer(2093.00, "triangle", t + 0.36, 0.6, 0.2); // C7 (final ring)
      playLayer(1046.50, "triangle", t + 0.36, 0.6, 0.1); // Sub C
      break;
    case "error":
      // Deep dissenting buzzer
      playLayer(200, "sawtooth", t, 0.2, 0.1, -10, 'linear');
      playLayer(250, "square", t, 0.2, 0.05, 10, 'linear');

      playLayer(150, "sawtooth", t + 0.2, 0.4, 0.15, -20, 'linear');
      playLayer(190, "square", t + 0.2, 0.4, 0.08, 0, 'linear');
      break;
    case "warm":
      // Smooth bell-like interval (perfect fifth)
      playLayer(523.25, "sine", t, 0.3, 0.12); // C5
      playLayer(783.99, "sine", t + 0.08, 0.4, 0.12); // G5
      break;
    case "click":
      // Subtle fast tick for UI interaction
      playLayer(1200, "triangle", t, 0.05, 0.06);
      playLayer(1500, "sine", t, 0.05, 0.04);
      break;
  }
};

// Bind click sounds to all buttons
document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => {
    // Exclude the check button since it already plays result sounds
    if (!btn.classList.contains('btn_check') && !btn.disabled) {
      playSound("click");
    }
  });
});

const updateSoundButton = () => {
  const btnSound = $(".btn_sound");
  btnSound.textContent = soundEnabled ? "🔊" : "🔇";
  btnSound.title = soundEnabled ? "Sound on" : "Sound off";
  btnSound.setAttribute("aria-pressed", String(soundEnabled));
};

const toggleSound = () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem("soundEnabled", soundEnabled);
  updateSoundButton();
};

/**
 * Focuses and selects the guess input field
 */
const focusGuessInput = () => {
  const guessInput = $(".guess");
  guessInput.scrollIntoView({ behavior: "smooth", block: "center" });
  guessInput.focus();
  guessInput.select();
};

/**
 * Updates the UI display to indicate the valid guessing range
 */
const updateRangeDisplay = () => {
  $("#range-display").textContent = `(Between ${minNumber} and ${maxNumber})`;
  $("#range-readout").textContent = `Range: ${minNumber}–${maxNumber}`;
};

/**
 * Handles keyboard and click shortcuts for focusing the guess input
 * @param {Event} event - The keyboard or click event
 */
const handleNumberFocusShortcut = (event) => {
  if (event.type === "click" || (event.type === "keydown" && (event.key === "Enter" || event.key === " "))) {
    event.preventDefault();
    focusGuessInput();
  }
};

/**
 * Briefly highlights the guess input to indicate an invalid entry
 */
const markInvalidInput = () => {
  const guessInput = $(".guess");
  guessInput.classList.add("guess--invalid");
  setTimeout(() => guessInput.classList.remove("guess--invalid"), 400);
};

const toggleControls = (isDisabled) => {
  const guessInput = $(".guess");
  const checkButton = $(".btn_check");

  guessInput.disabled = isDisabled;
  checkButton.disabled = isDisabled;
  checkButton.style.opacity = isDisabled ? "0.6" : "1";
};

// Initialize highscore display
$(".highscore").textContent = highscore;
$(".badge-highscore").textContent = highscore;
$(".previous-score").textContent = previousScore !== null ? previousScore : "—";

const updateRoundDisplay = () => {
  $(".round").textContent = round;
};

const updateGamesPlayedDisplay = () => {
  $(".games-played").textContent = gamesPlayed;
};

const updateStreakDisplay = () => {
  $(".current-streak").textContent = currentStreak;
  $(".best-streak").textContent = bestStreak;
};

const updateWinsLossesDisplay = () => {
  const winEl = $(".wins");
  const lossEl = $(".losses");
  const winRateEl = $(".win-rate");
  if (winEl) winEl.textContent = wins;
  if (lossEl) lossEl.textContent = losses;
  if (winRateEl) {
    const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;
    winRateEl.textContent = `${winRate}%`;
  }
};

const updateDifficultyDisplay = () => {
  const emoji = difficultyEmojis[difficulty];
  $(".difficulty-text").textContent = `${emoji} ${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}`;
};

const updateAttemptsProgress = () => {
  const remainingAttempts = score;
  const totalAttempts = MAX_SCORE;
  const percentage = (remainingAttempts / totalAttempts) * 100;

  const fillEl = $(".attempts-progress-fill");
  const leftEl = $(".attempts-left");
  const progressBar = $("#attempts-progress");

  if (fillEl) fillEl.style.width = percentage + "%";
  if (leftEl) leftEl.textContent = remainingAttempts;
  if (progressBar) {
    progressBar.setAttribute("aria-valuenow", remainingAttempts);
  }
};

const updateInputHint = () => {
  const guessInput = $(".guess");
  guessInput.placeholder = `${minNumber}-${maxNumber}`;
  guessInput.setAttribute("aria-label", `Enter your guess between ${minNumber} and ${maxNumber}`);
};

const updateModeBadge = () => {
  const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  $("#mode-pill").textContent = `Mode: ${label} · Round ${round}`;
};

const setGameTip = (msg) => {
  $("#game-tip").textContent = msg;
};

const updateTimerDisplay = () => {
  const el = $("#round-timer");
  if (!el) return;
  el.textContent = `⏱ ${timeLeft}s`;
  el.classList.toggle("round-timer--warning", timeLeft <= 10);
};

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

const onTimerExpired = () => {
  stopTimer();
  setMessage("⏰ Time's up!");
  setHint(`⏰ The number was ${secretNumber}.`);
  setGameTip("Tip: Press Again! to start a new round.");
  setStatusPill("Time out!", "lose");
  $(".score").textContent = 0;
  updateScoreBar();
  updateRoundBanner();
  $("body").style.backgroundColor = "#8b0000";
  toggleControls(true);
  incrementGamesPlayed();
  // record loss due to timeout
  losses++;
  localStorage.setItem("losses", losses);
  updateWinsLossesDisplay();
  currentStreak = 0;
  localStorage.setItem("currentStreak", currentStreak);
  playSound("error");
};

const startTimer = () => {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      onTimerExpired();
    }
  }, 1000);
};

const resetTimer = () => {
  stopTimer();
  timeLeft = ROUND_TIME;
  updateTimerDisplay();
};

const refreshGameUI = () => {
  updateRoundDisplay();
  updateGamesPlayedDisplay();
  updateStreakDisplay();
  updateDifficultyDisplay();
  updateAttemptsProgress();
  updateInputHint();
  updateModeBadge();
};

const buildRoundBannerText = () => {
  const guessCount = previousGuesses.length;
  const guessWord = guessCount === 1 ? "guess" : "guesses";
  return `Round ${round} • ${score} chances left • ${guessCount} ${guessWord} tracked`;
};

/**
 * Updates the text displayed in the round banner
 * @param {string} msg - The message to display
 */
const updateRoundBanner = (msg = buildRoundBannerText()) => {
  $(".round-banner").textContent = msg;
};

const updateLastAction = (msg) => {
  lastAction = msg;
  const el = $("#last-action");
  if (el) {
    el.textContent = `Last action: ${msg}`;
  }
};

/**
 * Sets the status pill text and updates the document title
 * @param {string} msg - The status message
 * @param {string} modifier - The modifier class name (e.g., "win", "lose")
 */
const setStatusPill = (msg, modifier = "") => {
  const pill = $(".status-pill");
  pill.textContent = msg;
  pill.classList.toggle("status-pill--win", modifier === "win");
  pill.classList.toggle("status-pill--lose", modifier === "lose");
  document.title = `Guess My Number - ${msg}`;
};

restoreRoundState();
loadAchievements();
updateAchievementsDisplay();
refreshGameUI();
updateRoundBanner();
setStatusPill("Live play");
setGameTip(`Tip: Enter a number from 1 to ${maxNumber}.`);
focusGuessInput();
toggleControls(false);
updateTimerDisplay();

// Updates the main game message display
const setMessage = (msg) => {
  $(".message").textContent = msg;
};

const setHint = (msg) => {
  $(".hint").textContent = msg;
};

const showToast = (msg, type = "info") => {
  const toast = $("#app-toast");
  toast.textContent = msg;
  toast.dataset.type = type;
  toast.classList.remove("show");
  void toast.offsetWidth;
  toast.classList.add("show");
  clearTimeout(showToast.timerId);
  showToast.timerId = setTimeout(() => toast.classList.remove("show"), 2200);
};

/**
 * Resets the game state for a new round
 * @param {boolean} advanceRound - Whether this call should increment the round counter
 */
const resetGameState = (advanceRound = true) => {
  score = MAX_SCORE;
  attempts = 0;
  lastGuess = null;
  lastDifference = null;
  previousGuesses = [];
  if (advanceRound) {
    round++;
  }
  secretNumber = Math.trunc(Math.random() * maxNumber) + 1;
  resetTimer();
  updateAttemptsProgress();
  updateRoundBanner();
  saveRoundState();
};

const getClosenessLabel = (difference) => {
  if (difference === null || difference === undefined) return "—";
  if (difference === 0) return "Exact";
  if (difference <= 2) return "Hot";
  if (difference <= 5) return "Warm";
  return "Cold";
};

const updateClosenessDisplay = () => {
  const status = $("#closeness-status");
  if (!status) return;

  const difference = lastDifference;
  const label = getClosenessLabel(difference);
  status.textContent = label;
  status.classList.toggle("is-hot", label === "Hot");
  status.classList.toggle("is-warm", label === "Warm");
  status.classList.toggle("is-cold", label === "Cold" || label === "Exact");
};

const updateGuessStats = () => {
  $(".attempts").textContent = attempts;
  $(".last-guess").textContent = lastGuess !== null ? lastGuess : "—";
  $(".history").textContent = previousGuesses.length ? previousGuesses.join(", ") : "None yet";
  const usedEl = $("#guesses-used");
  if (usedEl) {
    usedEl.textContent = `${previousGuesses.length}/${maxNumber}`;
  }
  updateClosenessDisplay();
  updateAchievementsDisplay();
  updateRoundBanner();
};

const updateHighscore = () => {
  localStorage.setItem("highscore", highscore);
  $(".highscore").textContent = highscore;
  $(".badge-highscore").textContent = highscore;
};

const incrementGamesPlayed = () => {
  previousScore = score;
  localStorage.setItem("previousScore", previousScore);
  gamesPlayed++;
  sessionGames++;
  $(".games-played").textContent = gamesPlayed;
  $(".session-games").textContent = sessionGames;
  $(".previous-score").textContent = previousScore;
  localStorage.setItem("gamesPlayed", gamesPlayed);

  if (gamesPlayed === 10) {
    unlockAchievement("ten-games", "Ten Games", "Ten games played unlocked");
  }
};

const copyStatsToClipboard = () => {
  const stats = `🎮 Guess My Number Stats
━━━━━━━━━━━━━━━━━━━━
Difficulty: ${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}
Games Played: ${gamesPlayed}
Current Round: ${round}
Highscore: ${highscore}
Current Streak: ${currentStreak}
Best Streak: ${bestStreak}
Previous Guesses: ${previousGuesses.length ? previousGuesses.join(", ") : "None yet"}`;

  const successMessage = () => {
    setMessage("📋 Game stats copied!");
    showToast("Game stats copied to clipboard", "success");
    setTimeout(() => setMessage("Game on!"), 2000);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(stats)
      .then(successMessage)
      .catch(() => {
        window.prompt("Copy your stats manually:", stats);
        successMessage();
      });
    return;
  }

  const copied = window.prompt("Copy your stats manually:", stats);
  if (copied !== null) {
    successMessage();
  }
};

// Update score bar
const updateScoreBar = () => {
  const percentage = (score / MAX_SCORE) * 100;
  const fill = $(".score-bar-fill");
  fill.style.width = percentage + "%";
  fill.classList.toggle("score-bar-fill--danger", score <= 5);
};

// Function to process guess
const processGuess = function () {
  if ($(".btn_check").disabled) return;
  const guessValue = $(".guess").value;
  const guess = Number(guessValue);

  // Handle empty input gracefully
  if (!guessValue || guessValue.trim() === "") {
    setMessage("⛔ No number!");
    setGameTip(`Tip: Type a number between 1 and ${maxNumber}.`);
    updateLastAction("Attempt blocked: empty guess");
    $(".guess").classList.add("shake");
    markInvalidInput();
    setTimeout(() => $(".guess").classList.remove("shake"), 300);
    focusGuessInput();
    return;
  }

  // Invalid range
  if (guess < 1 || guess > maxNumber) {
    setMessage(`⛔ Please enter a number from 1 to ${maxNumber}.`);
    setGameTip(`Tip: Keep your guess within 1 and ${maxNumber}.`);
    updateLastAction(`Attempt blocked: ${guess} out of range`);
    $(".guess").classList.add("shake");
    markInvalidInput();
    setTimeout(() => $(".guess").classList.remove("shake"), 300);
    focusGuessInput();
    return;
  }

  if (previousGuesses.includes(guess)) {
    setMessage("⚠️ You already guessed that number.");
    setHint("Try a different guess.");
    setGameTip("Tip: Choose a fresh number you have not tried yet.");
    updateLastAction(`Duplicate guess: ${guess}`);
    $(".guess").classList.add("shake");
    setTimeout(() => $(".guess").classList.remove("shake"), 300);
    focusGuessInput();
    return;
  }

  if (attempts === 0) startTimer();
  attempts++;
  lastGuess = guess;
  previousGuesses.push(guess);

  if (attempts === 1) {
    unlockAchievement("first-guess", "First Guess", "First guess unlocked");
  }

  if (previousGuesses.length >= 5) {
    unlockAchievement("five-guesses", "Five Guesses", "Five guesses unlocked");
  }

  updateLastAction(`Guess checked: ${guess}`);

  const difference = Math.abs(guess - secretNumber);
  lastDifference = difference;
  updateGuessStats();

  // Handle Correct Guess scenario
  if (guess === secretNumber) {
    playSound("success");
    setMessage("🎉 Correct Number!");
    setHint("🎉 You found the secret number!");
    setGameTip("Tip: Start a fresh round whenever you're ready.");
    setStatusPill("You win!", true);
    $("body").style.backgroundColor = "#25cc45";
    $(".number").textContent = secretNumber;
    $(".number").classList.remove("flip-reveal");
    void $(".number").offsetWidth; // reflow to restart animation
    $(".number").classList.add("pop", "win-burst", "flip-reveal");
    $(".number").addEventListener("animationend", () => {
      $(".number").classList.remove("flip-reveal");
    }, { once: true });
    $(".guess").classList.add("guess--feedback-correct");
    toggleControls(true);
    incrementGamesPlayed();
    // record win
    wins++;
    localStorage.setItem("wins", wins);
    updateWinsLossesDisplay();

    if (score > highscore) {
      highscore = score;
      updateHighscore();
      setGameTip("Tip: New highscore! Keep the streak going.");
    }

    unlockAchievement("first-win", "First Win", "First win unlocked");

    // Update streak
    currentStreak++;
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
      localStorage.setItem("bestStreak", bestStreak);
    }
    localStorage.setItem("currentStreak", currentStreak);
    updateStreakDisplay();
  } else {
    if (score > 1) {
      playSound("error");
      const isTooHigh = guess > secretNumber;
      setMessage(isTooHigh ? "📉 Too High!" : "📈 Too Low!");

      // Add color feedback
      $(".guess").classList.remove("guess--feedback-low", "guess--feedback-high");
      $(".guess").classList.add(isTooHigh ? "guess--feedback-high" : "guess--feedback-low");

      if (difference <= 2) {
        playSound("warm");
        setHint("🔥 Very close!");
        setGameTip("Tip: You're very close — keep going!");
      } else if (difference <= 5) {
        setHint("🌡️ Getting warmer");
        setGameTip("Tip: You're getting warmer.");
      } else {
        setHint("🧭 Keep trying!");
        setGameTip("Tip: Try a different range of numbers.");
      }

      score--;
      $(".score").textContent = score;
      updateScoreBar();
      updateAttemptsProgress();
      updateRoundBanner();

      // Auto-reset in hard mode after three failed guesses
      if (difficulty === "hard" && attempts >= 3) {
        setMessage("🔁 Hard mode reset after 3 misses.");
        setHint("Try again from a fresh round.");
        setGameTip("Tip: Hard mode resets after three misses.");
        $(".number").classList.remove("pop", "win-burst");
        setTimeout(() => {
          $(".btn_again").click();
        }, 900);
      }

      // little shake animation
      $(".number").classList.add("shake");
      setTimeout(() => $(".number").classList.remove("shake"), 200);
    } else {
      setMessage("💥 You lost the game!");
      setHint(`💥 The number was ${secretNumber}.`);
      setGameTip("Tip: Press Again! to start a new round.");
      setStatusPill("Game over!", "lose");
      $(".score").textContent = 0;
      updateScoreBar();
      updateRoundBanner();
      $("body").style.backgroundColor = "#8b0000";
      toggleControls(true);
      incrementGamesPlayed();
      // record loss
      losses++;
      localStorage.setItem("losses", losses);
      currentStreak = 0;
      localStorage.setItem("currentStreak", currentStreak);
      updateStreakDisplay();
    }
  }

  // Clear input field
  $(".guess").value = "";
  saveRoundState();
  focusGuessInput();
};

// Difficulty selector handler
$(".difficulty-select").addEventListener("change", function (e) {
  difficulty = e.target.value;

  switch (difficulty) {
    case "easy":
      maxNumber = 10;
      break;
    case "hard":
      maxNumber = 50;
      break;
    default:
      maxNumber = 20;
  }

  // Update range display
  updateRangeDisplay();

  // Update input max attribute
  $(".guess").max = maxNumber;

  // Reset game with new difficulty
  resetGameState();
  setMessage("Start guessing...");
  setHint(`Hint: We'll tell you if you're close. Difficulty: ${difficulty}`);
  setStatusPill("Live play");
  $(".score").textContent = score;
  updateScoreBar();
  updateGuessStats();
  refreshGameUI();
  setGameTip(`Tip: Enter a number from 1 to ${maxNumber}.`);
  $(".number").textContent = "?";
  $(".guess").value = "";
  $(".guess").classList.remove("guess--feedback-low", "guess--feedback-high", "guess--feedback-correct", "guess--invalid");
  $("body").style.backgroundColor = "rgba(88, 16, 32, 0.897)";
  toggleControls(false);
  focusGuessInput();
});

// Check Button Click
$(".btn_check").addEventListener("click", processGuess);

$(".btn_clear_guess").addEventListener("click", function () {
  $(".guess").value = "";
  setMessage("✅ Guess cleared.");
  setHint("Type a new number and press Enter.");
  showToast("Guess cleared", "warning");
  focusGuessInput();
});

// Reset button handler (resets current round without advancing)
$(".btn_reset").addEventListener("click", resetGame);

function resetGame() {
  resetGameState(false);
  setMessage("🔄 Game reset.");
  setHint("Make a guess!");
  setStatusPill("Live play");
  $(".score").textContent = score;
  updateScoreBar();
  updateGuessStats();
  refreshGameUI();
  $(".number").textContent = "?";
  $(".guess").value = "";
  $(".guess").classList.remove("guess--feedback-low", "guess--feedback-high", "guess--feedback-correct", "guess--invalid");
  $("body").style.backgroundColor = "rgba(88, 16, 32, 0.897)";
  toggleControls(false);
  focusGuessInput();
}

// Allow Enter key on guess input
$(".guess").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    processGuess();
  }
});

$(".number").addEventListener("click", handleNumberFocusShortcut);
$(".number").addEventListener("keydown", handleNumberFocusShortcut);

// Again Button
$(".btn_again").addEventListener("click", function () {
  resetGameState();

  setMessage("Start guessing...");
  setHint("Hint: We'll tell you if you're close.");
  setStatusPill("Live play");
  $(".score").textContent = score;
  updateScoreBar();
  updateGuessStats();
  refreshGameUI();
  setGameTip(`Tip: Enter a number from 1 to ${maxNumber}.`);
  $(".number").textContent = "?";
  $(".number").classList.remove("win-burst");
  $(".guess").value = "";
  $(".guess").classList.remove("guess--feedback-low", "guess--feedback-high", "guess--feedback-correct", "guess--invalid");

  $("body").style.backgroundColor = "rgba(88, 16, 32, 0.897)";
  $(".number").classList.remove("pop");
  $(".guess").classList.remove("guess--invalid");
  toggleControls(false);
  focusGuessInput();
});

// Allow Escape key to reset game, close stats or help modal, and R key to restart
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    if ($("#stats-modal").classList.contains("active")) {
      closeStatsModal();
      return;
    }
    if ($("#help-modal").classList.contains("active")) {
      closeHelpModal();
      return;
    }
    $(".btn_again").click();
  }

  if ((e.key.toLowerCase() === "r" || e.key.toLowerCase() === "n") && document.activeElement !== $(".guess")) {
    $(".btn_again").click();
  }

  if (e.key.toLowerCase() === "c") {
    const guessInput = $(".guess");
    if (guessInput.value) {
      guessInput.value = "";
      setMessage("✅ Guess cleared.");
      setHint("Type a new number and press Enter.");
      focusGuessInput();
    }
  }
});

// Clear Stats Button
$(".btn_clear_stats").addEventListener("click", function () {
  if (confirm("Are you sure you want to clear all stats and highscore?")) {
    highscore = 0;
    round = 1;
    gamesPlayed = 0;
    currentStreak = 0;
    bestStreak = 0;
    $(".highscore").textContent = 0;
    $(".badge-highscore").textContent = 0;
    $(".games-played").textContent = 0;
    $(".current-streak").textContent = 0;
    localStorage.removeItem("highscore");
    localStorage.removeItem("gamesPlayed");
    localStorage.removeItem("currentStreak");
    localStorage.removeItem("bestStreak");
    resetGameState(false);

    setMessage("Stats cleared! Ready for a fresh start.");
    setHint("Let's start fresh!");
    showToast("All stats reset", "success");
    $(".score").textContent = score;
    updateScoreBar();
    updateGuessStats();
    updateRoundDisplay();
    $(".number").textContent = "?";
    $(".guess").value = "";
    $(".guess").classList.remove("guess--feedback-low", "guess--feedback-high", "guess--feedback-correct", "guess--invalid");
    $("body").style.backgroundColor = "rgba(88, 16, 32, 0.897)";
    toggleControls(false);
    focusGuessInput();
  }
});


// Theme toggle
const initTheme = () => {
  const savedTheme = localStorage.getItem("gameTheme") || "dark";
  const btnTheme = $(".btn_theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    btnTheme.textContent = "☀️";
    btnTheme.setAttribute("aria-pressed", "true");
  } else {
    btnTheme.textContent = "🌙";
    btnTheme.setAttribute("aria-pressed", "false");
  }
};

const toggleTheme = () => {
  const isLight = document.body.classList.toggle("light-theme");
  const btnTheme = $(".btn_theme");
  localStorage.setItem("gameTheme", isLight ? "light" : "dark");
  btnTheme.textContent = isLight ? "☀️" : "🌙";
  btnTheme.setAttribute("aria-pressed", String(isLight));
};

$(".btn_theme").addEventListener("click", toggleTheme);
$(".btn_sound").addEventListener("click", toggleSound);
initTheme();
updateSoundButton();

// Stats modal
const openStatsModal = () => {
  $(".stat-games").textContent = gamesPlayed;
  $(".stat-session-games").textContent = sessionGames;
  $(".stat-round").textContent = round;
  $(".stat-highscore").textContent = highscore;
  $(".stat-attempts").textContent = attempts;
  $(".stat-current-streak").textContent = currentStreak;
  $(".stat-best-streak").textContent = bestStreak;
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;
  $(".stat-win-rate").textContent = `${winRate}%`;
  $(".stat-history").textContent = previousGuesses.length ? previousGuesses.join(", ") : "None yet";
  $("#stats-modal").classList.add("active");
};

const closeStatsModal = () => {
  $("#stats-modal").classList.remove("active");
};

$(".btn_stats").addEventListener("click", openStatsModal);
$(".btn-close-stats").addEventListener("click", closeStatsModal);
$(".btn_copy_stats").addEventListener("click", copyStatsToClipboard);

// Close modal when clicking outside
$("#stats-modal").addEventListener("click", (e) => {
  if (e.target === $("#stats-modal")) {
    closeStatsModal();
  }
});

// Help modal functionality
const openHelpModal = () => {
  $("#help-modal").classList.add("active");
};

const closeHelpModal = () => {
  $("#help-modal").classList.remove("active");
};

const toggleHelpModal = () => {
  const helpModal = $("#help-modal");
  helpModal.classList.toggle("active");
};

$(".btn_help").addEventListener("click", openHelpModal);
$(".btn-close-help").addEventListener("click", closeHelpModal);

// Close help modal when clicking outside
$("#help-modal").addEventListener("click", (e) => {
  if (e.target === $("#help-modal")) {
    closeHelpModal();
  }
});

// Keyboard shortcuts for help, stats, and theme
document.addEventListener("keydown", (e) => {
  if (e.target.tagName.toLowerCase() === 'input') return; // Don't trigger when typing in input
  if (e.key === "?" || e.key.toLowerCase() === "h") {
    e.preventDefault();
    toggleHelpModal();
  } else if (e.key.toLowerCase() === "s") {
    e.preventDefault();
    if ($("#stats-modal").classList.contains("active")) {
      closeStatsModal();
    } else {
      openStatsModal();
    }
  } else if (e.key.toLowerCase() === "t") {
    e.preventDefault();
    toggleTheme();
  } else if (e.key.toLowerCase() === "m" || e.key.toLowerCase() === "v") {
    e.preventDefault();
    toggleSound();
  } else if (e.key.toLowerCase() === "i") {
    e.preventDefault();
    focusGuessInput();
  }
});








