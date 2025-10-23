function initRockPaperScissorsMinusOne() {
  const choices = ["rock", "paper", "scissors"];
  let userScore = 0;
  let computerScore = 0;

  // State for a round
  let userSelections = [];
  let computerSelections = [];
  let userFinalChoice = null;
  let userFinalIndex = null;
  let computerFinalChoice = null;

  // Elements
  const userScoreSpan = document.getElementById("user-score");
  const computerScoreSpan = document.getElementById("computer-score");
  const resultDiv = document.getElementById("result");
  const displayChoicesDiv = document.getElementById("display-choices");
  const phaseDiv = document.getElementById("phase");
  const btns = document.querySelectorAll(".rps-btn");
  const selectedTwoDiv = document.getElementById("selected-two");
  const lockBtn = document.getElementById("lock-btn");
  const computerReveal = document.getElementById("computer-reveal");
  const computerTwoDiv = document.getElementById("computer-two");
  const minusOneDiv = document.getElementById("minus-one");
  const finalChoiceOptionsDiv = document.getElementById("final-choice-options");
  const finalizeBtn = document.getElementById("finalize-btn");
  const finalChoicesDiv = document.getElementById("final-choices");
  const nextRoundBtn = document.getElementById("next-round-btn");
  const restartBtn = document.getElementById("restart-btn");

  function displayScores() {
    userScoreSpan.textContent = userScore;
    computerScoreSpan.textContent = computerScore;
  }

  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // RPS comparison from perspective of first argument
  function compare(a, b) {
    if (a === b) return 0; // draw
    if (
      (a === "rock" && b === "scissors") ||
      (a === "paper" && b === "rock") ||
      (a === "scissors" && b === "paper")
    )
      return 1; // a wins
    return -1; // a loses
  }

  function getRandomChoice() {
    return choices[Math.floor(Math.random() * choices.length)];
  }

  // Computer picks two with replacement
  function getComputerTwo() {
    return [getRandomChoice(), getRandomChoice()];
  }

  // Maximin strategy: pick comp keep that maximizes the worst-case vs user's two options
  function getComputerFinalChoice(userPair, compPair) {
    const candidates = compPair;
    // For each candidate, compute the worst (min) outcome against user's options
    const scored = candidates.map((c, idx) => {
      const vsUser = userPair.map((u) => compare(c, u));
      const minOutcome = Math.min(...vsUser); // -1 < 0 < 1
      const maxOutcome = Math.max(...vsUser);
      return { idx, choice: c, minOutcome, maxOutcome };
    });
    // Choose the one with best minOutcome; tie-break by best maxOutcome; then random
    let best = [];
    let bestMin = -2;
    scored.forEach((s) => {
      if (s.minOutcome > bestMin) {
        bestMin = s.minOutcome;
        best = [s];
      } else if (s.minOutcome === bestMin) {
        best.push(s);
      }
    });
    if (best.length > 1) {
      // tie-break on maxOutcome
      let bestMax = -2;
      let next = [];
      best.forEach((s) => {
        if (s.maxOutcome > bestMax) {
          bestMax = s.maxOutcome;
          next = [s];
        } else if (s.maxOutcome === bestMax) {
          next.push(s);
        }
      });
      best = next;
    }
    const pick = best[Math.floor(Math.random() * best.length)];
    return pick.choice;
  }

  // UI helpers
  function clearChildren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function renderChips(el, arr, { removable = false, selectable = false, selected = null, onRemove = null, onSelect = null } = {}) {
    clearChildren(el);
    arr.forEach((val, index) => {
      const chip = document.createElement("button");
      chip.className = "chip" + (selectable ? " selectable" : "") + (selected === index ? " selected" : "");
      chip.setAttribute("type", "button");
      chip.dataset.index = String(index);
      chip.dataset.choice = val;
      chip.textContent = cap(val);
      if (removable) {
        chip.classList.add("removable");
        chip.setAttribute("title", "Remove");
        chip.addEventListener("click", () => {
          onRemove && onRemove(index);
        });
      } else if (selectable) {
        chip.addEventListener("click", () => {
          onSelect && onSelect(index, val);
        });
      }
      el.appendChild(chip);
    });
  }

  function show(element) {
    element.classList.remove("hidden");
  }
  function hide(element) {
    element.classList.add("hidden");
  }

  function setPhase(text) {
    if (phaseDiv) phaseDiv.textContent = text;
  }

  function flashOutcome(outcome) {
    const body = document.body;
    body.classList.remove("win-bg", "lose-bg", "draw-bg");
    if (outcome === "win") body.classList.add("win-bg");
    else if (outcome === "lose") body.classList.add("lose-bg");
    else body.classList.add("draw-bg");
    // remove after a short time
    setTimeout(() => {
      body.classList.remove("win-bg", "lose-bg", "draw-bg");
    }, 900);
  }

  function resetRoundUI() {
    userSelections = [];
    computerSelections = [];
    userFinalChoice = null;
    userFinalIndex = null;
    computerFinalChoice = null;
    renderChips(selectedTwoDiv, userSelections);
    hide(computerReveal);
    clearChildren(computerTwoDiv);
    hide(minusOneDiv);
    clearChildren(finalChoiceOptionsDiv);
    finalizeBtn.disabled = true;
    lockBtn.disabled = true;
    finalChoicesDiv.textContent = "";
    displayChoicesDiv.textContent = "";
    resultDiv.textContent = "";
    setPhase("Step 1 — Pick any two symbols");
    // Re-enable choice buttons for step 1
    btns.forEach((b) => (b.disabled = false));
    hide(nextRoundBtn);
  }

  // Step 1: user selects two (duplicates allowed)
  function onChoiceClick(e) {
    const btn = e.currentTarget;
    const choice = btn.dataset.choice;
    if (!choice) return;
    if (userSelections.length >= 2) {
      return; // already have two; allow removal via chips
    }
    userSelections.push(choice);
    const refreshSelectedChips = () => {
      renderChips(selectedTwoDiv, userSelections, {
        removable: true,
        onRemove: (idx) => {
          userSelections.splice(idx, 1);
          refreshSelectedChips();
          updateLockState();
        },
      });
    };
    refreshSelectedChips();
    updateLockState();
  }

  function updateLockState() {
    lockBtn.disabled = userSelections.length !== 2;
  }

  // Lock in: reveal computer and move to minus-one phase
  function onLock() {
    // Disable choice buttons for now
    btns.forEach((b) => (b.disabled = true));
    computerSelections = getComputerTwo();
    renderChips(computerTwoDiv, computerSelections);
    show(computerReveal);
    setPhase("Step 2 — Minus One: choose one to keep");
    // Prepare user's minus-one selection options
    const handleSelectFinal = (idx, val) => {
      userFinalIndex = idx;
      userFinalChoice = val;
      finalizeBtn.disabled = false;
      // re-render to keep current highlight, keep handler for future changes
      renderChips(finalChoiceOptionsDiv, userSelections, {
        selectable: true,
        selected: userFinalIndex,
        onSelect: handleSelectFinal,
      });
    };

    renderChips(finalChoiceOptionsDiv, userSelections, {
      selectable: true,
      selected: userFinalIndex,
      onSelect: handleSelectFinal,
    });
    show(minusOneDiv);

    // Decide computer's final choice now (simultaneous selection)
    computerFinalChoice = getComputerFinalChoice(userSelections, computerSelections);
  }

  // Finalize showdown
  function onFinalize() {
    if (!userFinalChoice) return;
    // compute outcome for user
    const comp = computerFinalChoice;
    const user = userFinalChoice;
    const cmp = compare(user, comp);
    let outcomeText = "";
    let outcome = "draw";
    if (cmp > 0) {
      outcome = "win";
      outcomeText = "You win!";
      userScore++;
    } else if (cmp < 0) {
      outcome = "lose";
      outcomeText = "You lose!";
      computerScore++;
    } else {
      outcome = "draw";
      outcomeText = "It's a draw!";
    }

    displayScores();
    displayChoicesDiv.textContent = `You kept: ${cap(user)} | Computer kept: ${cap(comp)}`;
    resultDiv.textContent = outcomeText;
    finalChoicesDiv.textContent = `${cap(user)} vs ${cap(comp)}`;

    flashOutcome(outcome);

    // Show next round button
    show(nextRoundBtn);
    // Disable finalize button and selection chips
    finalizeBtn.disabled = true;
    // Prevent further selection
    Array.from(finalChoiceOptionsDiv.children).forEach((c) => c.setAttribute("disabled", "true"));
  }

  // Next round: keep scores
  function onNextRound() {
    resetRoundUI();
  }

  // Restart: reset scores and round
  function onRestart() {
    userScore = 0;
    computerScore = 0;
    displayScores();
    onNextRound();
  }

  // Wire events
  btns.forEach((btn) => btn.addEventListener("click", onChoiceClick));
  lockBtn.addEventListener("click", onLock);
  finalizeBtn.addEventListener("click", onFinalize);
  nextRoundBtn.addEventListener("click", onNextRound);
  restartBtn.addEventListener("click", onRestart);

  // Initial state
  displayScores();
  resetRoundUI();
}

window.addEventListener("DOMContentLoaded", initRockPaperScissorsMinusOne);
