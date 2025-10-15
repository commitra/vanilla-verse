const TIME_LIMIT = 15; // Total time for each question
let timeLeft = TIME_LIMIT;
let timerInterval = null; // This will store the interval ID

// Get the timer element from the DOM
const timerElement = document.getElementById("time");

const data = [{ q: '2 + 2 = ?', a: ['3', '4', '5'], c: 1 }, { q: 'Capital of France?', a: ['Berlin', 'Paris', 'Rome'], c: 1 }];
let i = 0, score = 0;
const q = document.getElementById('q'),
  answers = document.getElementById('answers'),
  result = document.getElementById('result');

// Function to handle moving to the next question when time runs out
function handleNextQuestion() {
  i++;
  render();
}

function startTimer() {
  // Clear any existing timer before starting a new one
  clearInterval(timerInterval);
  
  // Make sure the timer is visible at the start of a question
  timerElement.parentElement.style.display = 'block';

  // Reset the time left for the new question
  timeLeft = TIME_LIMIT;
  timerElement.textContent = timeLeft;
  timerElement.parentElement.classList.remove('warning'); // Remove warning color

  timerInterval = setInterval(() => {
    timeLeft--;
    timerElement.textContent = timeLeft;

    // Add a visual warning when time is low
    if (timeLeft <= 5) {
      timerElement.parentElement.classList.add('warning');
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleNextQuestion();
    }
  }, 1000);
}

function render() {
  if (i >= data.length) {
    clearInterval(timerInterval); // Stop timer at the end
    
    // Hide the timer element
    timerElement.parentElement.style.display = 'none';
    
    q.textContent = 'Done!';
    answers.innerHTML = '';
    result.textContent = `Score: ${score}/${data.length}`;
    return;
  }

  // Start the timer each time a new question is rendered
  startTimer();

  const cur = data[i];
  q.textContent = cur.q;
  answers.innerHTML = '';
  cur.a.forEach((ans, idx) => {
    const b = document.createElement('button');
    b.textContent = ans;
    b.addEventListener('click', () => {
      clearInterval(timerInterval);
      if (idx === cur.c) score++;
      i++;
      render();
    });
    answers.appendChild(b);
  });
}

render();