document.addEventListener("DOMContentLoaded", () => {
  const boardEl = document.getElementById("board");
  const restartBtn = document.getElementById("restartBtn");
  const xScoreEl = document.getElementById("xScore");
  const oScoreEl = document.getElementById("oScore");
  const Currentmode = document.getElementById("Currentmode");
  const drawScoreEl = document.getElementById("drawScore");
  const leftArrow = document.querySelector(".orange-marker"); // Player 1 arrow
  const rightArrow = document.querySelector(".pink-marker"); // Player 2 arrow
  let b = Array(9).fill(null);
  let turn = "X";
  let gameOver = false;
  let mode = "2P";
  let scores = { X: 0, O: 0, Draw: 0 };

  const winningCombos = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  function checkWin() {
    for (const combo of winningCombos) {
      const [a, bIndex, c] = combo;
      if (b[a] && b[a] === b[bIndex] && b[a] === b[c]) {
        b[a] += "w";
        b[bIndex] += "w";
        b[c] += "w";
        return b[a];
      }
    }
    return null;
  }

  function checkDraw() {
    return b.every((cell) => cell !== null);
  }

  function render() {
    boardEl.innerHTML = "";
    b.forEach((v, i) => {
      const btn = document.createElement("button");
      if (v && v.includes("w")) {
        v = v[0];
        if (v === "X") {
          document.querySelector(".one").classList.add("xWin");
          btn.classList.add("xWin");
        } else {
          document.querySelector(".two").classList.add("oWin");
          btn.classList.add("oWin");
        }
      }
      btn.classList.add("cell");

      btn.textContent = v || "";
      btn.addEventListener("click", () => move(i));
      boardEl.appendChild(btn);
    });
    updateTurnIndicator();
  }
  function updateTurnIndicator() {
    if (turn === "X") {
      leftArrow.style.visibility = "visible";
      rightArrow.style.visibility = "hidden";
    } else {
      leftArrow.style.visibility = "hidden";
      rightArrow.style.visibility = "visible";
    }
  }
  function move(i) {
    if (b[i] || gameOver) return;

    b[i] = turn;
    const winner = checkWin();

    if (winner) {
      scores[winner[0]]++;
      gameOver = true;
      setTimeout(() => {
      alert(`${winner[0]==='X'?"Player 1":"Player 2"} wins!`);
    }, 200);
    } else if (checkDraw()) {
      scores.Draw++;
      gameOver = true;
      setTimeout(() => {
      alert("It's a draw!");

      }, 200);
    } else {
      turn = turn === "X" ? "O" : "X";

      if (mode === "AI" && turn === "O" && !gameOver) aiMove();
    }
    render();
    updateScoreboard();
  }

  // Smart AI
  function aiMove() {
    let moveIndex = findBestMove("O"); // Win if possible
    if (moveIndex === null) moveIndex = findBestMove("X"); // Block X
    if (moveIndex === null && b[4] === null) moveIndex = 4; // Take center
    if (moveIndex === null) {
      const corners = [0, 2, 6, 8].filter((i) => b[i] === null);
      if (corners.length)
        moveIndex = corners[Math.floor(Math.random() * corners.length)];
    }
    if (moveIndex === null) {
      const empty = b
        .map((v, i) => (v === null ? i : null))
        .filter((v) => v !== null);
      moveIndex = empty[Math.floor(Math.random() * empty.length)];
    }
    move(moveIndex);
  }

  function findBestMove(player) {
    for (const combo of winningCombos) {
      const [a, bIndex, c] = combo;
      const line = [b[a], b[bIndex], b[c]];
      if (
        line.filter((v) => v === player).length === 2 &&
        line.includes(null)
      ) {
        return combo[line.indexOf(null)];
      }
    }
    return null;
  }

  function updateScoreboard() {
    xScoreEl.textContent = scores.X;
    oScoreEl.textContent = scores.O;
    drawScoreEl.textContent = scores.Draw;
  }

  function restart() {
    b = Array(9).fill(null);
    turn = "X";
    gameOver = false;
    document.querySelector(".one").classList.remove("xWin")
    document.querySelector(".two").classList.remove("oWin")
    render();
  }

  // Event listeners
  restartBtn.addEventListener("click", restart);
  const choices = document.querySelector(".choices");
  const playerMode = document.querySelector(".select-player");
  const compMode = document.querySelector(".select-computer");
  playerMode.addEventListener("click", (e) => {
    mode = playerMode.getAttribute("value");
    Currentmode.innerText="Player"
    document.querySelector(".start-modal").style.display = "none";
    restart();
  });
  compMode.addEventListener("click", (e) => {
    mode = compMode.getAttribute("value");
    Currentmode.innerText="Computer"

    document.querySelector(".start-modal").style.display = "none";
    restart();
  });

  const modeSettings = document.querySelector(".exit");
  modeSettings.addEventListener("click", () => {
    document.querySelector(".start-modal").style.display = "block";
  });


  // Initial render
  render();
  updateScoreboard();
});

// theme toggle
const themeToggle = document.getElementById("themeToggle");
const body = document.body;

const currentTheme = localStorage.getItem("theme") || "light";
if (currentTheme === "dark") {
  body.classList.add("dark-mode");
}

themeToggle.addEventListener("click", () => {
  body.classList.toggle("dark-mode");

  const theme = body.classList.contains("dark-mode") ? "dark" : "light";
  localStorage.setItem("theme", theme);
});

