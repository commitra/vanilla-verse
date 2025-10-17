// score.js
export const ScoreManager = (function () {
    const STORAGE_KEY_SCORE = "snake_highest_score";
    const STORAGE_KEY_PLAYER = "snake_highest_player";

    let scoreA = 0, scoreB = 0;
    let bestScore = 0, bestPlayer = "None";

    const scoreAEl = document.getElementById("scoreA");
    const scoreBEl = document.getElementById("scoreB");
    const bestScoreEl = document.getElementById("bestScore");
    const bestPlayerEl = document.getElementById("bestPlayer");

    function loadBest() {
        bestScore = parseInt(localStorage.getItem(STORAGE_KEY_SCORE)) || 0;
        bestPlayer = localStorage.getItem(STORAGE_KEY_PLAYER) || "None";
        updateDisplay();
    }

    function saveBest() {
        localStorage.setItem(STORAGE_KEY_SCORE, bestScore);
        localStorage.setItem(STORAGE_KEY_PLAYER, bestPlayer);
    }

    function updateDisplay() {
        scoreAEl.textContent = scoreA;
        scoreBEl.textContent = scoreB;
        bestScoreEl.textContent = bestScore;
        bestPlayerEl.textContent = bestPlayer;
    }

    function reset() {
        scoreA = 0;
        scoreB = 0;
        updateDisplay();
    }

    function addScore(player) {
        if (player === "A") scoreA += 1;
        else if (player === "B") scoreB += 1;
        updateDisplay();
    }

    function gameOver(winner, finalScore) {
        if (winner !== "Draw" && finalScore > bestScore) {
            bestScore = finalScore;
            bestPlayer = winner;
            saveBest();
        }
        updateDisplay();
    }

    function getScores() {
        return { scoreA, scoreB, bestScore, bestPlayer };
    }

    document.addEventListener("DOMContentLoaded", loadBest);

    return { reset, addScore, gameOver, getScores };
})();
