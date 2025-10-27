
const currentOperandElement = document.getElementById('currentOperand');
const previousOperandElement = document.getElementById('previousOperand');
const buttons = document.querySelectorAll('button');

let currentOperand = '0';
let previousOperand = '';
let operation = null;
let shouldResetScreen = false;

function init() {
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      button.classList.add('press-animation');
      setTimeout(() => button.classList.remove('press-animation'), 200);

      handleButtonClick(button);
    });
  });

  document.addEventListener('keydown', handleKeyboardInput);

  updateDisplay();
}

function handleButtonClick(button) {
  if (button.dataset.number !== undefined) {
    appendNumber(button.dataset.number);
  } else if (button.dataset.action === 'operator') {
    chooseOperation(button.dataset.operator);
  } else if (button.dataset.action === 'decimal') {
    appendDecimal();
  } else if (button.dataset.action === 'equals') {
    compute();
  } else if (button.dataset.action === 'clear') {
    clear();
  } else if (button.dataset.action === 'backspace') {
    backspace();
  } else if (button.dataset.action === 'toggle-sign') {
    toggleSign();
  } else if (button.dataset.action === 'percentage') {
    percentage();
  }
}

function handleKeyboardInput(e) {
  if (e.key === 'Enter' || e.key === 'Escape' || e.key === 'Backspace') {
    e.preventDefault();
  }

  if (e.key >= '0' && e.key <= '9') {
    appendNumber(e.key);
  }
  else if (e.key === '.') {
    appendDecimal();
  }
  else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
    const operatorMap = {
      '+': '+',
      '-': '−',
      '*': '×',
      '/': '÷'
    };
    chooseOperation(operatorMap[e.key]);
  }
  else if (e.key === 'Enter' || e.key === '=') {
    compute();
  }
  else if (e.key === 'Escape') {
    clear();
  }
  else if (e.key === 'Backspace') {
    backspace();
  }
}

function appendNumber(number) {
  if (shouldResetScreen) {
    currentOperand = '';
    shouldResetScreen = false;
  }

  if (currentOperand === '0') {
    currentOperand = number;
  } else if (currentOperand.length < 12) {
    currentOperand += number;
  }

  updateDisplay();
}

function appendDecimal() {
  if (shouldResetScreen) {
    currentOperand = '0';
    shouldResetScreen = false;
  }

  if (!currentOperand.includes('.')) {
    currentOperand += '.';
  }

  updateDisplay();
}

function chooseOperation(op) {
  if (currentOperand === '') return;

  if (previousOperand !== '') {
    compute();
  }

  operation = op;
  previousOperand = currentOperand;
  shouldResetScreen = true;
  updateDisplay();
}

function compute() {
  if (operation === null || previousOperand === '') return;

  let computation;
  const prev = parseFloat(previousOperand);
  const current = parseFloat(currentOperand);

  if (isNaN(prev) || isNaN(current)) {
    clear();
    return;
  }

  switch (operation) {
    case '+': computation = prev + current; break;
    case '−': computation = prev - current; break;
    case '×': computation = prev * current; break;
    case '÷':
      if (current === 0) {
        currentOperand = 'Error';
        previousOperand = '';
        operation = null;
        shouldResetScreen = true;
        updateDisplay();
        return;
      }
      computation = prev / current;
      break;
    default: return;
  }

  currentOperand = roundResult(computation);
  operation = null;
  previousOperand = '';
  shouldResetScreen = true;
  updateDisplay();
}

function clear() {
  currentOperand = '0';
  previousOperand = '';
  operation = null;
  shouldResetScreen = false;
  updateDisplay();
}

function backspace() {
  if (currentOperand.length > 1) {
    currentOperand = currentOperand.slice(0, -1);
  } else {
    currentOperand = '0';
  }
  updateDisplay();
}

function toggleSign() {
  if (currentOperand !== '0') {
    currentOperand = currentOperand.startsWith('-')
      ? currentOperand.slice(1)
      : '-' + currentOperand;
  }
  updateDisplay();
}

function percentage() {
  currentOperand = (parseFloat(currentOperand) / 100).toString();
  shouldResetScreen = true;
  updateDisplay();
}

function roundResult(number) {
  const strNumber = number.toExponential(12);
  const roundedNumber = parseFloat(strNumber);

  return Number.isInteger(roundedNumber)
    ? roundedNumber.toString()
    : roundedNumber.toString();
}

function formatNumber(number) {
  if (number === 'Error') return number;

  const stringNumber = number.toString();

  if (stringNumber.length > 12) {
    return parseFloat(number).toExponential(6);
  }

  return stringNumber;
}

function updateDisplay() {
  currentOperandElement.textContent = formatNumber(currentOperand);

  if (operation != null) {
    previousOperandElement.textContent = `${previousOperand} ${operation}`;
  } else {
    previousOperandElement.textContent = '';
  }

  if (currentOperand === 'Error') {
    currentOperandElement.classList.add('error');
  } else {
    currentOperandElement.classList.remove('error');
  }
}

init();
