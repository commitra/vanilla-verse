const TIME_LIMIT = 15; // seconds per question
let timeLeft = TIME_LIMIT;
let timerInterval = null;

const timerElement = document.getElementById("time");

let questions = []; // API-loaded questions
let i = 0, score = 0;

const q = document.getElementById('q'),
  answers = document.getElementById('answers'),
  result = document.getElementById('result');

/** Decode HTML entities from API */
function decodeHTML(str) {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

/** Shuffle array */
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

/** Fetch questions from Open Trivia DB API */
async function loadQuestions() {
  try {
    const res = await fetch('https://opentdb.com/api.php?amount=5&type=multiple');
    const data = await res.json();
    questions = data.results.map(q => ({
      q: decodeHTML(q.question),
      a: shuffle([decodeHTML(q.correct_answer), ...q.incorrect_answers.map(decodeHTML)]),
      c: null, // correct answer index
      correctAnswer: decodeHTML(q.correct_answer)
    }));
    // Compute correct answer index
    questions.forEach(qObj => {
      qObj.c = qObj.a.findIndex(ans => ans === qObj.correctAnswer);
    });
  } catch (err) {
    console.error('Failed to load questions', err);
    q.textContent = 'Failed to load questions 😢';
    answers.innerHTML = '';
  }
}

/** Start timer for each question */
function startTimer() {
  clearInterval(timerInterval);
  timerElement.parentElement.style.display = 'block';
  timeLeft = TIME_LIMIT;
  timerElement.textContent = timeLeft;
  timerElement.parentElement.classList.remove('warning');

  timerInterval = setInterval(() => {
    timeLeft--;
    timerElement.textContent = timeLeft;

    if (timeLeft <= 5) {
      timerElement.parentElement.classList.add('warning');
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleNextQuestion();
    }
  }, 1000);
}

/** Move to next question */
function handleNextQuestion() {
  i++;
  render();
}

/** Render current question */
function render() {
  if (!questions.length) return;

  if (i >= questions.length) {
    clearInterval(timerInterval);
    timerElement.parentElement.style.display = 'none';
    q.textContent = '🎉 Quiz Complete!';
    answers.innerHTML = '';
    result.textContent = `Score: ${score}/${questions.length}`;
    return;
  }

  startTimer();

  const cur = questions[i];
  q.textContent = cur.q;
  answers.innerHTML = '';
  result.textContent = '';

  cur.a.forEach((ans, idx) => {
    const b = document.createElement('button');
    b.textContent = ans;
    b.addEventListener('click', () => {
      clearInterval(timerInterval);
      if (idx === cur.c) score++;
      handleNextQuestion();
    });
    answers.appendChild(b);
  });
}

/** Initialize quiz */
(async function init() {
  result.textContent = 'Loading questions...';
  await loadQuestions();
  render();
})();
