const TIME_LIMIT = 15; // seconds per question
let timeLeft = TIME_LIMIT;
let timerInterval = null;

const timerElement = document.getElementById("time");

let questions = []; // API-loaded questions
let i = 0, score = 0;

const q = document.getElementById('q'),
  answers = document.getElementById('answers'),
  result = document.getElementById('result');
const themeToggle = document.getElementById('theme-toggle');
const root = document.documentElement;

// Safe localStorage helpers
function safeGet(k){ try{ return localStorage.getItem(k) }catch(e){return null}}
function safeSet(k,v){ try{ localStorage.setItem(k,v) }catch(e){}}

function applyTheme(t){
  const theme = t === 'light' ? 'light' : 'dark';
  root.setAttribute('data-theme', theme);
  if(themeToggle) themeToggle.textContent = theme === 'light' ? '☀️' : '🌙';
}

themeToggle?.addEventListener('click', ()=>{
  const current = root.getAttribute('data-theme') || (safeGet('quiz-theme') || 'dark');
  const next = current === 'light' ? 'dark' : 'light';
  safeSet('quiz-theme', next);
  applyTheme(next);
});

// initialize theme from storage or system preference
const stored = safeGet('quiz-theme');
const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
applyTheme(stored ? stored : (prefersLight ? 'light' : 'dark'));

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
    b.className = 'answer-btn';
    b.addEventListener('click', () => {
      // prevent double clicks
      if (b.disabled) return;
      clearInterval(timerInterval);
      // mark selected
      Array.from(answers.children).forEach(x=>x.classList.remove('selected'));
      b.classList.add('selected');
      // mark correct/incorrect
      if (idx === cur.c){
        b.classList.add('correct');
        score++;
      } else {
        b.classList.add('incorrect');
        // reveal the correct one
        const correctBtn = answers.children[cur.c];
        if (correctBtn) correctBtn.classList.add('correct');
      }
      // disable all to avoid extra clicks
      Array.from(answers.children).forEach(x=>x.disabled=true);
      // short delay to show feedback
      setTimeout(()=>{
        handleNextQuestion();
      }, 700);
    });
    answers.appendChild(b);
  });
}

(async function init() {
  result.textContent = 'Loading questions...';
  await loadQuestions();
  render();
})();
