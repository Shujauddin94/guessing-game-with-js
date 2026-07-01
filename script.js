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
console.log("Ready for player guesses.");

// Shortcut selector
const $ = (q) => document.querySelector(q);

/**
 * Plays audio feedback for game events
 * @param {string} type - The sound type: "success", "error", or "warm"
 */
const playSound = (type) => {
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
  $(".difficulty-text").textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
};

const setStatusPill = (msg, modifier = "") => {
  const pill = $(".status-pill");
  pill.textContent = msg;
  pill.classList.toggle("status-pill--win", modifier === "win");
  pill.classList.toggle("status-pill--lose", modifier === "lose");
};

updateRoundDisplay();
updateGamesPlayedDisplay();
updateDifficultyDisplay();
setStatusPill("Live play");
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
    setStatusPill("You win!", true);
    $("body").style.backgroundColor = "#25cc45";
    $(".number").textContent = secretNumber;
    $(".number").classList.add("pop", "win-burst");
    $(".guess").classList.add("guess--feedback-correct");
    toggleControls(true);
    updateGamesPlayed();

    if (score > highscore) {
      highscore = score;
      $(".highscore").textContent = highscore;
      localStorage.setItem("highscore", highscore);
    }
    return;
  }

  // Wrong Guess
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
    } else if (difference <= 5) {
      setHint("🌡️ Getting warmer");
    } else {
      setHint("🧭 Keep trying!");
    }

    score--;
    $(".score").textContent = score;
    updateScoreBar();

    // Auto-reset in hard mode after three failed guesses
    if (difficulty === "hard" && attempts >= 3) {
      setMessage("🔁 Hard mode reset after 3 misses.");
      setHint("Try again from a fresh round.");
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
    setStatusPill("Game over!", "lose");
    $(".score").textContent = 0;
    updateScoreBar();
    $("body").style.backgroundColor = "#8b0000";
    toggleControls(true);
    incrementGamesPlayed();
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
  updateRoundDisplay();
  updateDifficultyDisplay();
  $(".number").textContent = "?";
  $(".guess").value = "";
  $(".guess").classList.remove("guess--feedback-low", "guess--feedback-high", "guess--feedback-correct", "guess--invalid");
  $("body").style.backgroundColor = "rgba(88, 16, 32, 0.897)";
  toggleControls(false);
  focusGuessInput();
  console.log(`Difficulty changed to ${difficulty} (1-${maxNumber})`);
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
  updateRoundDisplay();
  $(".number").textContent = "?";
  $(".number").classList.remove("win-burst");
  $(".guess").value = "";
  $(".guess").classList.remove("guess--feedback-low", "guess--feedback-high", "guess--feedback-correct", "guess--invalid");
  console.log("Game reset for a new round.");

  $("body").style.backgroundColor = "rgba(88, 16, 32, 0.897)";
  $(".number").classList.remove("pop");
  $(".guess").classList.remove("guess--invalid");
  toggleControls(false);
  focusGuessInput();
  console.log("Use the buttons to play again.");
});

// Allow Escape key to reset game and R key to restart
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
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
$(".btn_clear_stats").addEventListener("click", function() {
  if (confirm("Are you sure you want to clear all stats and highscore?")) {
    highscore = 0;
    round = 1;
    gamesPlayed = 0;
    $(".highscore").textContent = 0;
    $(".games-played").textContent = 0;
    localStorage.removeItem("highscore");
    localStorage.removeItem("gamesPlayed");
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
initTheme();

// Stats modal
const openStatsModal = () => {
  $(".stat-games").textContent = gamesPlayed;
  $(".stat-round").textContent = round;
  $(".stat-highscore").textContent = highscore;
  $(".stat-attempts").textContent = attempts;
  $(".stat-history").textContent = previousGuesses.length ? previousGuesses.join(", ") : "None yet";
  $("#stats-modal").classList.add("active");
};

const closeStatsModal = () => {
  $("#stats-modal").classList.remove("active");
};

$(".btn_stats").addEventListener("click", openStatsModal);
$(".btn-close-stats").addEventListener("click", closeStatsModal);

// Close modal when clicking outside
$("#stats-modal").addEventListener("click", (e) => {
  if (e.target === $("#stats-modal")) {
    closeStatsModal();
  }
});