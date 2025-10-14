// score.js
// Handles score display + best score persistence (localStorage)

export const ScoreManager = (function () {
    const STORAGE_KEY = "snake_best_score_v1";
    let score = 0;
    let best = 0;
    let el;

    function loadBest() {
        try {
            const val = localStorage.getItem(STORAGE_KEY);
            best = val ? parseInt(val, 10) || 0 : 0;
        } catch {
            best = 0;
        }
    }

    function saveBest() {
        try {
            localStorage.setItem(STORAGE_KEY, String(best));
        } catch { }
    }

    function createUI() {
        el = document.createElement("div");
        el.id = "scoreBoard";
        el.setAttribute("aria-live", "polite");
        el.setAttribute("role", "status");
        el.textContent = `Score: ${score} • Best: ${best}`;
        document.querySelector("main").insertBefore(el, document.getElementById("board"));
    }

    function updateDisplay() {
        if (el) el.textContent = `Score: ${score} • Best: ${best}`;
    }

    function reset() {
        score = 0;
        updateDisplay();
    }

    function increment() {
        score += 1;
        updateDisplay();
    }

    function gameOver() {
        if (score > best) {
            best = score;
            saveBest();
        }
        updateDisplay();
    }

    document.addEventListener("DOMContentLoaded", () => {
        loadBest();
        createUI();
        updateDisplay();
    });

    return { reset, increment, gameOver };
})();
