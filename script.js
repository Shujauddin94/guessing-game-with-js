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
let highscore = localStorage.getItem("highscore") ? Number(localStorage.getItem("highscore")) : 0;
console.log("Ready for player guesses.");

// Shortcut selector
const $ = (q) => document.querySelector(q);

const focusGuessInput = () => {
  const guessInput = $(".guess");
  guessInput.focus();
  guessInput.select();
};

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

updateRoundDisplay();
focusGuessInput();
toggleControls(false);

// Update message
const setMessage = (msg) => {
  $(".message").textContent = msg;
};

const setHint = (msg) => {
  $(".hint").textContent = msg;
};

const resetGameState = () => {
  score = 20;
  attempts = 0;
  lastGuess = null;
  previousGuesses = [];
  round += 1;
  secretNumber = Math.trunc(Math.random() * 20) + 1;
};

const updateGuessStats = () => {
  $(".attempts").textContent = attempts;
  $(".last-guess").textContent = lastGuess !== null ? lastGuess : "—";
  $(".history").textContent = previousGuesses.length ? previousGuesses.join(", ") : "None yet";
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
  if (guess < 1 || guess > 20) {
    setMessage("⛔ Please enter a number from 1 to 20.");
    console.log("Guess out of valid range.");
    $(".guess").classList.add("shake");
    markInvalidInput();
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
    setMessage("🎉 Correct Number!");
    setHint("🎉 You found the secret number!");
    $("body").style.backgroundColor = "#25cc45";
    $(".number").textContent = secretNumber;
    $(".number").classList.add("pop", "win-burst");
    toggleControls(true);

    if (score > highscore) {
      highscore = score;
      $(".highscore").textContent = highscore;
      localStorage.setItem("highscore", highscore);
    }
    return;
  }

  // Wrong Guess
  if (score > 1) {
    setMessage(guess > secretNumber ? "📉 Too High!" : "📈 Too Low!");

    if (difference <= 2) {
      setHint("🔥 Very close!");
    } else if (difference <= 5) {
      setHint("🌡️ Getting warmer");
    } else {
      setHint("🧭 Keep trying!");
    }

    score--;
    $(".score").textContent = score;
    updateScoreBar();

    // little shake animation
    $(".number").classList.add("shake");
    setTimeout(() => $(".number").classList.remove("shake"), 200);
  } else {
    setMessage("💥 You lost the game!");
    setHint(`💥 The number was ${secretNumber}.`);
    $(".score").textContent = 0;
    updateScoreBar();
    $("body").style.backgroundColor = "#8b0000";
    toggleControls(true);
  }

  // Clear input field
  $(".guess").value = "";
  focusGuessInput();
};

// Check Button Click
$(".btn_check").addEventListener("click", processGuess);

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
  $(".score").textContent = score;
  updateScoreBar();
  updateGuessStats();
  updateRoundDisplay();
  $(".number").textContent = "?";
  $(".number").classList.remove("win-burst");
  $(".guess").value = "";
  console.log("Game reset for a new round.");

  $("body").style.backgroundColor = "rgba(88, 16, 32, 0.897)";
  $(".number").classList.remove("pop");
  $(".guess").classList.remove("guess--invalid");
  toggleControls(false);
  focusGuessInput();
  console.log("Use the buttons to play again.");
});

// Allow Escape key to reset game
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    $(".btn_again").click();
  }
});

console.log("🎮 Game fully loaded and ready!");
console.log("⏱️ Timestamp: " + new Date().toLocaleTimeString());
console.log("✅ All event listeners initialized successfully!");
console.log("Commit 1: added small line 1");
console.log("Commit 2: added small line 2");
console.log("Commit 3: added small line 3");