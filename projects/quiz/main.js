const TIME_LIMIT = 20; // seconds per question
let timeLeft = TIME_LIMIT;
let timerInterval = null;

const timerElement = document.getElementById("time");
const settingsPanel = document.getElementById("settings");
const quizContent = document.getElementById("quiz-content");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const startButton = document.getElementById("start-quiz");

let questions = []; // API-loaded questions
let currentQuestions = []; // Questions for current session
let i = 0, score = 0;
let totalQuestions = 5;

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

/** Fisher-Yates shuffle algorithm */
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/** Decode HTML entities from API */
function decodeHTML(str) {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

/** Get settings from UI */
function getSettings() {
  const category = document.getElementById('category').value;
  const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
  const questionCount = parseInt(document.getElementById('question-count').value);
  const shuffleAnswers = document.getElementById('shuffle-answers').checked;
  const shuffleQuestions = document.getElementById('shuffle-questions').checked;
  
  return { category, difficulty, questionCount, shuffleAnswers, shuffleQuestions };
}

/** Fetch questions from Open Trivia DB API with filters */
async function loadQuestions() {
  try {
    const settings = getSettings();
    totalQuestions = settings.questionCount;
    
    let apiUrl = `https://opentdb.com/api.php?amount=20&type=multiple`;
    if (settings.category !== 'any') {
      apiUrl += `&category=${settings.category}`;
    }
    if (settings.difficulty !== 'any') {
      apiUrl += `&difficulty=${settings.difficulty}`;
    }

    const res = await fetch(apiUrl);
    const data = await res.json();
    
    if (data.response_code !== 0 || !data.results.length) {
      throw new Error('No questions available with selected filters');
    }

    questions = data.results.map(q => ({
      q: decodeHTML(q.question),
      a: [decodeHTML(q.correct_answer), ...q.incorrect_answers.map(decodeHTML)],
      c: 0, // correct answer index will be set after shuffling
      correctAnswer: decodeHTML(q.correct_answer),
      difficulty: q.difficulty,
      category: q.category
    }));

    // Prepare questions for current session
    currentQuestions = settings.shuffleQuestions ? 
      shuffleArray(questions).slice(0, totalQuestions) : 
      questions.slice(0, totalQuestions);

    // Process each question
    currentQuestions.forEach(qObj => {
      if (settings.shuffleAnswers) {
        const correctIndex = qObj.a.findIndex(ans => ans === qObj.correctAnswer);
        const shuffledAnswers = shuffleArray(qObj.a);
        qObj.a = shuffledAnswers;
        qObj.c = shuffledAnswers.findIndex(ans => ans === qObj.correctAnswer);
      } else {
        qObj.c = 0; // Correct answer is always first if not shuffled
      }
    });

  } catch (err) {
    console.error('Failed to load questions', err);
    q.textContent = 'Failed to load questions. Please try different filters. 😢';
    answers.innerHTML = '';
    return false;
  }
  return true;
}

/** Update progress bar */
function updateProgress() {
  const progress = ((i + 1) / currentQuestions.length) * 100;
  progressFill.style.width = `${progress}%`;
  progressText.textContent = `Question ${i + 1} of ${currentQuestions.length}`;
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
      handleTimeUp();
    }
  }, 1000);
}

/** Handle when time runs out */
function handleTimeUp() {
  const currentQuestion = currentQuestions[i];
  Array.from(answers.children).forEach(btn => {
    btn.disabled = true;
    if (parseInt(btn.dataset.index) === currentQuestion.c) {
      btn.classList.add('correct');
    }
  });
  
  result.textContent = 'Time\'s up!';
  
  setTimeout(() => {
    handleNextQuestion();
  }, 1500);
}

/** Move to next question */
function handleNextQuestion() {
  i++;
  if (i < currentQuestions.length) {
    render();
  } else {
    endQuiz();
  }
}

/** End quiz and show results */
function endQuiz() {
  clearInterval(timerInterval);
  timerElement.parentElement.style.display = 'none';
  q.textContent = '🎉 Quiz Complete!';
  answers.innerHTML = '';
  result.textContent = `Final Score: ${score}/${currentQuestions.length}`;
  
  // Add restart button
  const restartBtn = document.createElement('button');
  restartBtn.textContent = 'Try Again';
  restartBtn.className = 'start-btn';
  restartBtn.style.marginTop = '1rem';
  restartBtn.onclick = resetQuiz;
  result.appendChild(restartBtn);
}

/** Reset quiz to settings screen */
function resetQuiz() {
  i = 0;
  score = 0;
  currentQuestions = [];
  settingsPanel.classList.remove('hidden');
  quizContent.classList.add('hidden');
  result.textContent = '';
}

/** Render current question */
function render() {
  if (!currentQuestions.length) return;

  updateProgress();
  startTimer();

  const cur = currentQuestions[i];
  q.textContent = cur.q;
  answers.innerHTML = '';
  result.textContent = '';

  cur.a.forEach((ans, idx) => {
    const b = document.createElement('button');
    b.textContent = ans;
    b.className = 'answer-btn';
    b.dataset.index = idx;
    b.addEventListener('click', () => {
      if (b.disabled) return;
      clearInterval(timerInterval);
      
      Array.from(answers.children).forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      
      if (idx === cur.c){
        b.classList.add('correct');
        score++;
        result.textContent = 'Correct! 🎉';
      } else {
        b.classList.add('incorrect');
        const correctBtn = answers.children[cur.c];
        if (correctBtn) correctBtn.classList.add('correct');
        result.textContent = 'Incorrect 😞';
      }
      
      Array.from(answers.children).forEach(x => x.disabled = true);
      
      setTimeout(() => {
        handleNextQuestion();
      }, 1500);
    });
    answers.appendChild(b);
  });
}

/** Start quiz */
async function startQuiz() {
  const success = await loadQuestions();
  if (success && currentQuestions.length > 0) {
    i = 0;
    score = 0;
    settingsPanel.classList.add('hidden');
    quizContent.classList.remove('hidden');
    render();
  }
}

// Event Listeners
startButton.addEventListener('click', startQuiz);

// Initialize
result.textContent = 'Configure your quiz settings and click "Start Quiz"';