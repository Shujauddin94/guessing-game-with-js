/**
 * Guess My Number - Game Logic
 * Handles core game mechanics: number generation, guessing, scoring, and user interactions
 * Features: Difficulty levels, hint system, sound effects, theme toggle, and statistics tracking
 * Version 1.1
 */
"use strict";

// Generate secret number
let secretNumber = Math.trunc(Math.random() * 20) + 1;

let score = 20;
let attempts = 0;
let lastGuess = null;
let previousGuesses = [];
let round = 1;
let difficulty = "medium"; // easy, medium, hard
let maxNumber = 20;
let highscore = localStorage.getItem("highscore") ? Number(localStorage.getItem("highscore")) : 0;
let gamesPlayed = localStorage.getItem("gamesPlayed") ? Number(localStorage.getItem("gamesPlayed")) : 0;
let currentStreak = localStorage.getItem("currentStreak") ? Number(localStorage.getItem("currentStreak")) : 0;
let bestStreak = localStorage.getItem("bestStreak") ? Number(localStorage.getItem("bestStreak")) : 0;

// Game is now ready for player input

// Shortcut selector
const $ = (q) => document.querySelector(q);

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

const updateRangeDisplay = () => {
  $("#range-display").textContent = `(Between 1 and ${maxNumber})`;
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
const updateRoundDisplay = () => {
  $(".round").textContent = round;
};

const updateGamesPlayedDisplay = () => {
  $(".games-played").textContent = gamesPlayed;
};

const updateDifficultyDisplay = () => {
  const emoji = difficultyEmojis[difficulty];
  $(".difficulty-text").textContent = `${emoji} ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;
};

const updateInputHint = () => {
  const guessInput = $(".guess");
  guessInput.placeholder = `1-${maxNumber}`;
  guessInput.setAttribute("aria-label", `Enter your guess between 1 and ${maxNumber}`);
};

const updateModeBadge = () => {
  const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  $("#mode-pill").textContent = `Mode: ${label} · Round ${round}`;
};

const setGameTip = (msg) => {
  $("#game-tip").textContent = msg;
};

const refreshGameUI = () => {
  updateRoundDisplay();
  updateGamesPlayedDisplay();
  updateDifficultyDisplay();
  updateInputHint();
  updateModeBadge();
};

const buildRoundBannerText = () => {
  const guessCount = previousGuesses.length;
  const guessWord = guessCount === 1 ? "guess" : "guesses";
  return `Round ${round} • ${score} chances left • ${guessCount} ${guessWord} tracked`;
};

const updateRoundBanner = (msg = buildRoundBannerText()) => {
  $(".round-banner").textContent = msg;
};

const setStatusPill = (msg, modifier = "") => {
  const pill = $(".status-pill");
  pill.textContent = msg;
  pill.classList.toggle("status-pill--win", modifier === "win");
  pill.classList.toggle("status-pill--lose", modifier === "lose");
};

refreshGameUI();
updateRoundBanner();
setStatusPill("Live play");
setGameTip(`Tip: Enter a number from 1 to ${maxNumber}.`);
focusGuessInput();
toggleControls(false);

// Update message
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
  score = 20;
  attempts = 0;
  lastGuess = null;
  previousGuesses = [];
  if (advanceRound) {
    round += 1;
  }
  secretNumber = Math.trunc(Math.random() * maxNumber) + 1;
  updateRoundBanner();
};

const updateGuessStats = () => {
  $(".attempts").textContent = attempts;
  $(".last-guess").textContent = lastGuess !== null ? lastGuess : "—";
  $(".history").textContent = previousGuesses.length ? previousGuesses.join(", ") : "None yet";
  updateRoundBanner();
};

const updateHighscore = () => {
  localStorage.setItem("highscore", highscore);
  $(".highscore").textContent = highscore;
};

const incrementGamesPlayed = () => {
  gamesPlayed++;
  $(".games-played").textContent = gamesPlayed;
  localStorage.setItem("gamesPlayed", gamesPlayed);
};

const copyStatsToClipboard = () => {
  const stats = `🎮 Guess My Number Stats
━━━━━━━━━━━━━━━━━━━━
Games Played: ${gamesPlayed}
Current Round: ${round}
Highscore: ${highscore}
Current Streak: ${currentStreak}
Best Streak: ${bestStreak}
Previous Guesses: ${previousGuesses.length ? previousGuesses.join(", ") : "None yet"}`;

  const successMessage = () => {
    setMessage("📋 Stats copied!");
    showToast("Stats copied to clipboard", "success");
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
  const percentage = (score / 20) * 100;
  $(".score-bar-fill").style.width = percentage + "%";
};

// Function to process guess
const processGuess = function () {
  const guessValue = $(".guess").value;
  const guess = Number(guessValue);

  // No Input
  if (!guessValue) {
    setMessage("⛔ No number!");
    setGameTip(`Tip: Type a number between 1 and ${maxNumber}.`);
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
    $(".guess").classList.add("shake");
    setTimeout(() => $(".guess").classList.remove("shake"), 300);
    focusGuessInput();
    return;
  }

  attempts++;
  lastGuess = guess;
  previousGuesses.push(guess);
  updateGuessStats();

  const difference = Math.abs(guess - secretNumber);

  // Correct Guess
  if (guess === secretNumber) {
    playSound("success");
    setMessage("🎉 Correct Number!");
    setHint("🎉 You found the secret number!");
    setGameTip("Tip: Start a fresh round whenever you're ready.");
    setStatusPill("You win!", true);
    $("body").style.backgroundColor = "#25cc45";
    $(".number").textContent = secretNumber;
    $(".number").classList.add("pop", "win-burst");
    $(".guess").classList.add("guess--feedback-correct");
    toggleControls(true);
    incrementGamesPlayed();

    if (score > highscore) {
      highscore = score;
      updateHighscore();
      setGameTip("Tip: New highscore! Keep the streak going.");
    }

    // Update streak
    currentStreak++;
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
      localStorage.setItem("bestStreak", bestStreak);
    }
    localStorage.setItem("currentStreak", currentStreak);
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
      currentStreak = 0;
      localStorage.setItem("currentStreak", currentStreak);
    }
  }

  // Clear input field
  $(".guess").value = "";
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
  setHint("Hint: We'll tell you if you're close.");
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

  if (e.key.toLowerCase() === "r" && document.activeElement !== $(".guess")) {
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
    $(".games-played").textContent = 0;
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
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    $(".btn_theme").textContent = "☀️";
  } else {
    $(".btn_theme").textContent = "🌙";
  }
};

const toggleTheme = () => {
  const isLight = document.body.classList.toggle("light-theme");
  localStorage.setItem("gameTheme", isLight ? "light" : "dark");
  $(".btn_theme").textContent = isLight ? "☀️" : "🌙";
};

$(".btn_theme").addEventListener("click", toggleTheme);
$(".btn_sound").addEventListener("click", toggleSound);
initTheme();
updateSoundButton();

// Stats modal
const openStatsModal = () => {
  $(".stat-games").textContent = gamesPlayed;
  $(".stat-round").textContent = round;
  $(".stat-highscore").textContent = highscore;
  $(".stat-attempts").textContent = attempts;
  $(".stat-current-streak").textContent = currentStreak;
  $(".stat-best-streak").textContent = bestStreak;
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
  } else if (e.key.toLowerCase() === "m") {
    e.preventDefault();
    toggleSound();
  }
});








