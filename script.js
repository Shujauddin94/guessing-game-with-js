"use strict";

// Generate secret number
let secretNumber = Math.trunc(Math.random() * 20) + 1;

let score = 20;
let highscore = 0;

// Shortcut selector
const $ = (q) => document.querySelector(q);

// Update message
const setMessage = (msg) => {
  $(".message").textContent = msg;
};

// Check Button Click
$(".btn_check").addEventListener("click", function () {
  const guess = Number($(".guess").value);

  // No Input
  if (!guess) {
    setMessage("⛔ No number!");
    $(".guess").classList.add("shake");
    setTimeout(() => $(".guess").classList.remove("shake"), 300);
    return;
  }

  // Correct Guess
  if (guess === secretNumber) {
    setMessage("🎉 Correct Number!");
    $("body").style.backgroundColor = "#25cc45";
    $(".number").textContent = secretNumber;
    $(".number").classList.add("pop");

    if (score > highscore) {
      highscore = score;
      $(".highscore").textContent = highscore;
    }
    return;
  }

  // Wrong Guess
  if (score > 1) {
    setMessage(guess > secretNumber ? "📉 Too High!" : "📈 Too Low!");
    score--;
    $(".score").textContent = score;

    // little shake animation
    $(".number").classList.add("shake");
    setTimeout(() => $(".number").classList.remove("shake"), 200);
  } else {
    setMessage("💥 You lost the game!");
    $(".score").textContent = 0;
    $("body").style.backgroundColor = "#8b0000";
  }
});

// Again Button
$(".btn_again").addEventListener("click", function () {
  // Reset values
  score = 20;
  secretNumber = Math.trunc(Math.random() * 20) + 1;

  setMessage("Start guessing...");
  $(".score").textContent = score;
  $(".number").textContent = "?";
  $(".guess").value = "";

  $("body").style.backgroundColor = "rgba(88, 16, 32, 0.897)";
  $(".number").classList.remove("pop");
});