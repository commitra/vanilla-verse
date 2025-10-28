
        // ===== DOM ELEMENTS =====
        const currentOperandElement = document.getElementById('currentOperand');
        const previousOperandElement = document.getElementById('previousOperand');
        const historyContainer = document.getElementById('historyContainer');
        const calculatorWrapper = document.getElementById('calculatorWrapper');
        const calculator = document.getElementById('calculator');
        const themeIcon = document.getElementById('themeIcon');
        const buttons = document.querySelectorAll('button');

        // ===== CALCULATOR STATE =====
        let currentOperand = '0';
        let previousOperand = '';
        let operation = null;
        let shouldResetScreen = false;
        let calculationHistory = [];

        // ===== LOCAL STORAGE KEYS ===== */
        const STORAGE_KEYS = {
            CALCULATOR_STATE: 'calculatorState',
            CALCULATION_HISTORY: 'calculationHistory',
            THEME: 'theme'
        };

        // ===== INITIALIZATION ===== */
        function init() {
            // Load saved state and history from localStorage
            loadCalculatorState();
            loadHistory();
            
            // Button click handlers
            buttons.forEach(button => {
                button.addEventListener('click', (e) => {
                    handleButtonClick(button, e);
                });
            });

            // Keyboard support
            document.addEventListener('keydown', handleKeyboardInput);
            
            // Auto-save on window close
            window.addEventListener('beforeunload', saveCalculatorState);
            
            updateDisplay();
        }

        // ===== BUTTON CLICK HANDLER ===== */
        function handleButtonClick(button, event) {
            // Add visual feedback
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = '';
            }, 100);

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

        // ===== KEYBOARD SUPPORT ===== */
        function handleKeyboardInput(e) {
            // Prevent default for calculator keys
            if (['Enter', 'Escape', 'Backspace', '+', '-', '*', '/', '.', '%'].includes(e.key)) {
                e.preventDefault();
            }

            // Number keys
            if (e.key >= '0' && e.key <= '9') {
                appendNumber(e.key);
            } 
            // Decimal point
            else if (e.key === '.') {
                appendDecimal();
            } 
            // Operator keys
            else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
                const operatorMap = {
                    '+': '+',
                    '-': '−',
                    '*': '×',
                    '/': '÷'
                };
                chooseOperation(operatorMap[e.key]);
            } 
            // Equals
            else if (e.key === 'Enter' || e.key === '=') {
                compute();
            } 
            // Clear (AC)
            else if (e.key === 'Escape') {
                clear();
            } 
            // Backspace
            else if (e.key === 'Backspace') {
                backspace();
            }
            // Percentage
            else if (e.key === '%') {
                percentage();
            }
        }

        // ===== NUMBER FUNCTIONS ===== */
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
            saveCalculatorState();
        }

        function appendDecimal() {
            if (shouldResetScreen) {
                currentOperand = '0';
                shouldResetScreen = false;
            }

            // Prevent multiple decimal points
            if (!currentOperand.includes('.')) {
                currentOperand += '.';
            }

            updateDisplay();
            saveCalculatorState();
        }

        // ===== OPERATION FUNCTIONS ===== */
        function chooseOperation(op) {
            if (currentOperand === '') return;

            if (previousOperand !== '') {
                compute();
            }

            operation = op;
            previousOperand = currentOperand;
            shouldResetScreen = true;
            updateDisplay();
            saveCalculatorState();
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
                case '+':
                    computation = prev + current;
                    break;
                case '−':
                    computation = prev - current;
                    break;
                case '×':
                    computation = prev * current;
                    break;
                case '÷':
                    if (current === 0) {
                        currentOperand = 'Error';
                        previousOperand = '';
                        operation = null;
                        shouldResetScreen = true;
                        updateDisplay();
                        saveCalculatorState();
                        return;
                    }
                    computation = prev / current;
                    break;
                default:
                    return;
            }

            // Create expression for history
            const expression = `${previousOperand} ${operation} ${currentOperand}`;
            const result = roundResult(computation);
            
            // Add to history
            addToHistory(expression, result);

            currentOperand = result;
            operation = null;
            previousOperand = '';
            shouldResetScreen = true;
            
            // Add success animation
            currentOperandElement.classList.add('success');
            setTimeout(() => {
                currentOperandElement.classList.remove('success');
            }, 500);
            
            updateDisplay();
            saveCalculatorState();
        }

        // ===== UTILITY FUNCTIONS ===== */
        function clear() {
            currentOperand = '0';
            previousOperand = '';
            operation = null;
            shouldResetScreen = false;
            updateDisplay();
            saveCalculatorState();
        }

        function backspace() {
            if (currentOperand === 'Error') {
                clear();
                return;
            }

            if (currentOperand.length > 1) {
                currentOperand = currentOperand.slice(0, -1);
            } else {
                currentOperand = '0';
            }
            updateDisplay();
            saveCalculatorState();
        }

        function toggleSign() {
            if (currentOperand === 'Error') return;
            
            if (currentOperand !== '0') {
                currentOperand = currentOperand.startsWith('-') 
                    ? currentOperand.slice(1) 
                    : '-' + currentOperand;
            }
            updateDisplay();
            saveCalculatorState();
        }

        function percentage() {
            if (currentOperand === 'Error') return;
            
            currentOperand = (parseFloat(currentOperand) / 100).toString();
            shouldResetScreen = true;
            updateDisplay();
            saveCalculatorState();
        }

        function roundResult(number) {
            // Handle very large or very small numbers
            if (Math.abs(number) > 1e10 || (Math.abs(number) < 1e-10 && number !== 0)) {
                return number.toExponential(6);
            }
            
            // Round to 10-12 significant digits
            const rounded = Math.round(number * 1e10) / 1e10;
            
            // Remove trailing zeros after decimal
            let result = rounded.toString();
            if (result.includes('.')) {
                result = result.replace(/\.?0+$/, '');
            }
            
            return result;
        }

        function formatNumber(number) {
            if (number === 'Error') return number;
            
            const stringNumber = number.toString();
            
            // Handle very long numbers
            if (stringNumber.length > 12) {
                const num = parseFloat(number);
                if (Math.abs(num) > 1e10 || (Math.abs(num) < 1e-10 && num !== 0)) {
                    return num.toExponential(6);
                }
                return stringNumber.substring(0, 12);
            }
            
            return stringNumber;
        }

        // ===== DISPLAY UPDATE ===== */
        function updateDisplay() {
            // Add transition effect
            currentOperandElement.style.transform = 'scale(0.98)';
            setTimeout(() => {
                currentOperandElement.style.transform = 'scale(1)';
            }, 100);

            currentOperandElement.textContent = formatNumber(currentOperand);
            
            if (operation != null) {
                previousOperandElement.textContent = `${previousOperand} ${operation}`;
            } else {
                previousOperandElement.textContent = '';
            }

            // Handle error state
            if (currentOperand === 'Error') {
                currentOperandElement.classList.add('error');
            } else {
                currentOperandElement.classList.remove('error');
            }
        }

        // ===== HISTORY FUNCTIONS ===== */
        function addToHistory(expression, result) {
            const historyItem = {
                expression: expression,
                result: result,
                timestamp: new Date().toISOString()
            };
            
            calculationHistory.unshift(historyItem);
            
            // Keep only the last 20 calculations
            if (calculationHistory.length > 20) {
                calculationHistory = calculationHistory.slice(0, 20);
            }
            
            saveHistory();
            renderHistory();
        }

        function renderHistory() {
            if (calculationHistory.length === 0) {
                historyContainer.innerHTML = '<div style="color: rgba(255,255,255,0.3); font-size: 0.8rem; text-align: center; padding: 10px;">No history yet</div>';
                return;
            }
            
            historyContainer.innerHTML = calculationHistory.map((item, index) => `
                <div class="history-item" onclick="useHistoryItem(${index})" title="Click to use this result">
                    ${item.expression} = ${item.result}
                </div>
            `).join('');
        }

        function useHistoryItem(index) {
            const item = calculationHistory[index];
            currentOperand = item.result;
            previousOperand = '';
            operation = null;
            shouldResetScreen = true;
            updateDisplay();
            saveCalculatorState();
        }

        function clearHistory() {
            calculationHistory = [];
            saveHistory();
            renderHistory();
        }

        function saveHistory() {
            try {
                localStorage.setItem(STORAGE_KEYS.CALCULATION_HISTORY, JSON.stringify(calculationHistory));
            } catch (e) {
                console.warn('Failed to save history:', e);
            }
        }

        function loadHistory() {
            try {
                const savedHistory = localStorage.getItem(STORAGE_KEYS.CALCULATION_HISTORY);
                if (savedHistory) {
                    calculationHistory = JSON.parse(savedHistory);
                    renderHistory();
                }
            } catch (e) {
                console.warn('Failed to load history:', e);
            }
        }

        // ===== LOCAL STORAGE FUNCTIONS ===== */
        function saveCalculatorState() {
            const state = {
                currentOperand,
                previousOperand,
                operation,
                shouldResetScreen,
                timestamp: new Date().toISOString()
            };
            
            try {
                localStorage.setItem(STORAGE_KEYS.CALCULATOR_STATE, JSON.stringify(state));
            } catch (e) {
                console.warn('Failed to save calculator state:', e);
            }
        }

        function loadCalculatorState() {
            try {
                const savedState = localStorage.getItem(STORAGE_KEYS.CALCULATOR_STATE);
                if (savedState) {
                    const state = JSON.parse(savedState);
                    
                    // Only restore if saved within last 24 hours
                    const savedTime = new Date(state.timestamp);
                    const now = new Date();
                    const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
                    
                    if (hoursDiff < 24) {
                        currentOperand = state.currentOperand || '0';
                        previousOperand = state.previousOperand || '';
                        operation = state.operation || null;
                        shouldResetScreen = state.shouldResetScreen || false;
                    }
                }
            } catch (e) {
                console.warn('Failed to load calculator state:', e);
            }
        }

        // ===== THEME TOGGLE ===== */
        function toggleTheme() {
            document.body.classList.toggle('light');
            const theme = document.body.classList.contains('light') ? 'light' : 'dark';
            localStorage.setItem(STORAGE_KEYS.THEME, theme);
            
            // Update theme icon
            updateThemeIcon(theme);
        }

        function updateThemeIcon(theme) {
            if (theme === 'light') {
                // Sun icon for light theme
                themeIcon.innerHTML = `
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                `;
                themeIcon.classList.remove('icon-moon');
                themeIcon.classList.add('icon-sun');
            } else {
                // Moon icon for dark theme
                themeIcon.innerHTML = `
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                `;
                themeIcon.classList.remove('icon-sun');
                themeIcon.classList.add('icon-moon');
            }
        }

        // Load saved theme
        const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
        if (savedTheme === 'light') {
            document.body.classList.add('light');
        }
        
        // Initialize theme icon based on current theme
        updateThemeIcon(savedTheme === 'light' ? 'light' : 'dark');

        // ===== START CALCULATOR ===== */
        init();
    