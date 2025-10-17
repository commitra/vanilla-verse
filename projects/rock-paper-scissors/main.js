function initRockPaperScissors() {
  const choices = ["rock", "paper", "scissors"];
  let userScore = 0;
  let computerScore = 0;

  const userScoreSpan = document.getElementById("user-score");
  const computerScoreSpan = document.getElementById("computer-score");
  const resultDiv = document.getElementById("result");
  const displayChoicesDiv = document.getElementById("display-choices");
  const btns = document.querySelectorAll(".rps-btn");
  const restartBtn = document.getElementById("restart-btn");

  function getComputerChoice() {
    return choices[Math.floor(Math.random() * 3)];
  }

  function getResult(user, computer) {
    if (user === computer) return "draw";
    if (
      (user === "rock" && computer === "scissors") ||
      (user === "paper" && computer === "rock") ||
      (user === "scissors" && computer === "paper")
    )
      return "win";
    return "lose";
  }

  function displayScores() {
    userScoreSpan.textContent = userScore;
    computerScoreSpan.textContent = computerScore;
  }

  function handleClick(e) {
    const userChoice = e.target.dataset.choice;
    const computerChoice = getComputerChoice();
    const outcome = getResult(userChoice, computerChoice);
    displayChoicesDiv.textContent = `You: ${capitalize(
      userChoice
    )} | Computer: ${capitalize(computerChoice)}`;
    if (outcome === "win") {
      userScore++;
      resultDiv.textContent = "You win!";
      resultDiv.style.color = "#349946";
    } else if (outcome === "lose") {
      computerScore++;
      resultDiv.textContent = "You lose!";
      resultDiv.style.color = "#d43d29";
    } else {
      resultDiv.textContent = "It's a draw!";
      resultDiv.style.color = "#4078b3";
    }
    displayScores();
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  btns.forEach((btn) => {
    btn.addEventListener("click", handleClick);
  });

  restartBtn.addEventListener("click", function () {
    userScore = 0;
    computerScore = 0;
    displayScores();
    resultDiv.textContent = "";
    displayChoicesDiv.textContent = "";
  });

  // Initial score display
  displayScores();
}

window.addEventListener("DOMContentLoaded", initRockPaperScissors);
