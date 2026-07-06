/**
 * Guess My Number - Game Logic
 * Handles core game mechanics: number generation, guessing, scoring, and user interactions
 * Features: Difficulty levels, hint system, sound effects, theme toggle, and statistics tracking
 */
"use strict";
console.log("Guessing game loaded.");
console.log("Guessing game initialized.");

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
console.log("Ready for player guesses.");

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
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  switch(type) {
    case "success":
      oscillator.frequency.value = 800;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      break;
    case "error":
      oscillator.frequency.value = 300;
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      break;
    case "warm":
      oscillator.frequency.value = 600;
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
  }
};

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
  guessInput.focus();
  guessInput.select();
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

const setStatusPill = (msg, modifier = "") => {
  const pill = $(".status-pill");
  pill.textContent = msg;
  pill.classList.toggle("status-pill--win", modifier === "win");
  pill.classList.toggle("status-pill--lose", modifier === "lose");
};

refreshGameUI();
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

/**
 * Resets the game state for a new round
 */
const resetGameState = () => {
  score = 20;
  attempts = 0;
  lastGuess = null;
  previousGuesses = [];
  round += 1;
  secretNumber = Math.trunc(Math.random() * maxNumber) + 1;
};

const updateGuessStats = () => {
  $(".attempts").textContent = attempts;
  $(".last-guess").textContent = lastGuess !== null ? lastGuess : "—";
  $(".history").textContent = previousGuesses.length ? previousGuesses.join(", ") : "None yet";
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
  
  navigator.clipboard.writeText(stats).then(() => {
    setMessage("📋 Stats copied!");
    setTimeout(() => setMessage("Game on!"), 2000);
  }).catch(() => {
    alert("Could not copy to clipboard");
  });
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
    console.log("No guess input detected.");
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
    console.log("Guess out of valid range.");
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
$(".difficulty-select").addEventListener("change", function(e) {
  difficulty = e.target.value;
  
  switch(difficulty) {
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
  $("#range-display").textContent = `(Between 1 and ${maxNumber})`;
  
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
  console.log(`🎮 Difficulty changed to ${difficulty.toUpperCase()} (1-${maxNumber})`);
});

// Check Button Click
$(".btn_check").addEventListener("click", processGuess);

$(".btn_clear_guess").addEventListener("click", function() {
  $(".guess").value = "";
  setMessage("✅ Guess cleared.");
  setHint("Type a new number and press Enter.");
  focusGuessInput();
});

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
  console.log(`🆕 Round ${round} started - Secret number: ${secretNumber}`);

  $("body").style.backgroundColor = "rgba(88, 16, 32, 0.897)";
  $(".number").classList.remove("pop");
  $(".guess").classList.remove("guess--invalid");
  toggleControls(false);
  focusGuessInput();
  console.log(`⏱️ Game ready. Attempts remaining: ${score}`);
});

// Allow Escape key to reset game, close stats modal, and R key to restart
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    if ($("#stats-modal").classList.contains("active")) {
      closeStatsModal();
    } else {
      $(".btn_again").click();
    }
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
$(".btn_clear_stats").addEventListener("click", function() {
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
    resetGameState();
    
    setMessage("Stats cleared! Ready for a fresh start.");
    setHint("Let's start fresh!");
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
    console.log("📊 All game stats cleared!");
  }
});

console.log("🎮 Game fully loaded and ready!");
console.log("⏱️ Timestamp: " + new Date().toLocaleTimeString());
console.log("✅ All event listeners initialized successfully!");

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
  console.log(`📊 Stats opened - Games: ${gamesPlayed}, Best Streak: ${bestStreak}`);
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

$(".btn_help").addEventListener("click", openHelpModal);
$(".btn-close-help").addEventListener("click", closeHelpModal);

// Close help modal when clicking outside
$("#help-modal").addEventListener("click", (e) => {
  if (e.target === $("#help-modal")) {
    closeHelpModal();
  }
});

// Show help with ? key
document.addEventListener("keydown", (e) => {
  if (e.key === "?") {
    e.preventDefault();
    openHelpModal();
  }
});