class BMICalculator {
    constructor() {
        this.isMetric = true;
        this.history = this.loadHistory();
        this.chart = null;
        this.selectedGender = this.loadGenderPreference();
        this.validationState = {
            weight: false,
            height: false,
            gender: false
        };
        this.initializeElements();
        this.bindEvents();
        this.updatePlaceholders();
        this.updateHistoryControls();
        this.renderHistory();
        this.setGenderPreference();
    }

    initializeElements() {
        this.form = document.getElementById('bmiForm');
        this.weightInput = document.getElementById('weightInput');
        this.heightInput = document.getElementById('heightInput');
        this.weightError = document.getElementById('weightError');
        this.heightError = document.getElementById('heightError');
        this.genderError = document.getElementById('genderError');
        this.genderRadios = document.querySelectorAll('input[name="gender"]');
        this.result = document.getElementById('result');
        this.bmiDisplay = document.getElementById('bmiDisplay');
        this.bmiValue = document.getElementById('bmiValue');
        this.bmiCategory = document.getElementById('bmiCategory');
        this.bmiRange = document.getElementById('bmiRange');
        this.bmiAdvice = document.getElementById('bmiAdvice');
        this.submitBtn = document.getElementById('submitBtn');
        this.metricBtn = document.getElementById('metricBtn');
        this.imperialBtn = document.getElementById('imperialBtn');
        this.historyList = document.getElementById('historyList');
        this.clearHistoryBtn = document.getElementById('clearHistory');
        this.listViewBtn = document.getElementById('listViewBtn');
        this.chartViewBtn = document.getElementById('chartViewBtn');
        this.chartContainer = document.getElementById('chartContainer');
        this.weightUp = document.getElementById('weightUp');
        this.weightDown = document.getElementById('weightDown');
        this.heightUp = document.getElementById('heightUp');
        this.heightDown = document.getElementById('heightDown');
    }

    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.metricBtn.addEventListener('click', () => this.toggleUnit(true));
        this.imperialBtn.addEventListener('click', () => this.toggleUnit(false));
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        this.listViewBtn.addEventListener('click', () => this.showListView());
        this.chartViewBtn.addEventListener('click', () => this.showChartView());

        this.weightUp.addEventListener('click', () => this.incrementValue('weight', 0.1));
        this.weightDown.addEventListener('click', () => this.incrementValue('weight', -0.1));
        this.heightUp.addEventListener('click', () => this.incrementValue('height', 0.1));
        this.heightDown.addEventListener('click', () => this.incrementValue('height', -0.1));

        this.weightInput.addEventListener('input', () => this.validateField('weight'));
        this.heightInput.addEventListener('input', () => this.validateField('height'));
        
        // Gender selection events
        this.genderRadios.forEach(radio => {
            radio.addEventListener('change', () => this.handleGenderChange());
        });
    }

    incrementValue(fieldType, step) {
        const input = fieldType === 'weight' ? this.weightInput : this.heightInput;
        const currentValue = parseFloat(input.value) || 0;
        const newValue = Math.max(0, currentValue + step);
        input.value = newValue.toFixed(1);
        input.dispatchEvent(new Event('input'));
        this.validateField(fieldType);
    }

    toggleUnit(isMetric) {
        this.isMetric = isMetric;
        this.metricBtn.classList.toggle('active', isMetric);
        this.imperialBtn.classList.toggle('active', !isMetric);
        this.updatePlaceholders();
        this.clearForm();
    }

    updatePlaceholders() {
        if (this.isMetric) {
            this.weightInput.placeholder = 'Enter weight in kg';
            this.heightInput.placeholder = 'Enter height in cm';
        } else {
            this.weightInput.placeholder = 'Enter weight in lbs';
            this.heightInput.placeholder = 'Enter height in inches';
        }
    }

    clearForm() {
        this.weightInput.value = '';
        this.heightInput.value = '';
        this.clearValidation();
        this.hideResult();
        this.updateSubmitButton();
    }

    handleGenderChange() {
        const selectedRadio = document.querySelector('input[name="gender"]:checked');
        if (selectedRadio) {
            this.selectedGender = selectedRadio.value;
            this.saveGenderPreference();
            this.validateField('gender');
        }
    }

    loadGenderPreference() {
        try {
            return localStorage.getItem('bmiGender') || '';
        } catch (error) {
            console.error('Error loading gender preference:', error);
            return '';
        }
    }

    saveGenderPreference() {
        try {
            localStorage.setItem('bmiGender', this.selectedGender);
        } catch (error) {
            console.error('Error saving gender preference:', error);
        }
    }

    setGenderPreference() {
        if (this.selectedGender) {
            const radio = document.querySelector(`input[name="gender"][value="${this.selectedGender}"]`);
            if (radio) {
                radio.checked = true;
                this.validateField('gender');
            }
        }
    }

    handleSubmit(e) {
        e.preventDefault();

        const weightValid = this.validateField('weight', true);
        const heightValid = this.validateField('height', true);
        const genderValid = this.validateField('gender', true);

        if (!weightValid || !heightValid || !genderValid) {
            this.focusFirstInvalid();
            return;
        }

        const weight = parseFloat(this.weightInput.value);
        const height = parseFloat(this.heightInput.value);

        const bmi = this.calculateBMI(weight, height);
        const category = this.getBMICategory(bmi);

        this.displayResult(bmi, category);
        this.saveToHistory(weight, height, bmi, category);
    }

    validateField(fieldType, forceShowError = false) {
        if (fieldType === 'gender') {
            return this.validateGender(forceShowError);
        }

        const input = fieldType === 'weight' ? this.weightInput : this.heightInput;
        const errorElement = fieldType === 'weight' ? this.weightError : this.heightError;
        const value = input.value.trim();

        input.classList.remove('error', 'success');
        errorElement.classList.remove('show');
        errorElement.textContent = '';
        input.setAttribute('aria-invalid', 'false');

        if (value === '') {
            if (forceShowError) {
                this.setFieldError(
                    input,
                    errorElement,
                    `${fieldType === 'weight' ? 'Please enter your weight.' : 'Please enter your height.'}`
                );
            }
            this.validationState[fieldType] = false;
            this.updateSubmitButton();
            return false;
        }

        const numValue = parseFloat(value);
        const unit = fieldType === 'weight'
            ? (this.isMetric ? 'kg' : 'lbs')
            : (this.isMetric ? 'cm' : 'inches');

        if (numValue <= 0) {
            this.setFieldError(
                input,
                errorElement,
                `${fieldType === 'weight' ? 'Weight' : 'Height'} must be greater than 0 ${unit}.`
            );
            this.validationState[fieldType] = false;
            this.updateSubmitButton();
            return false;
        }

        if (fieldType === 'weight') {
            return this.validateWeight(numValue, input, errorElement);
        } else {
            return this.validateHeight(numValue, input, errorElement);
        }
    }

    validateGender(forceShowError = false) {
        const selectedGender = document.querySelector('input[name="gender"]:checked');
        
        this.genderError.classList.remove('show');
        this.genderError.textContent = '';

        if (!selectedGender) {
            if (forceShowError) {
                this.genderError.textContent = 'Please select your gender.';
                this.genderError.classList.add('show');
            }
            this.validationState.gender = false;
            this.updateSubmitButton();
            return false;
        }

        this.validationState.gender = true;
        this.updateSubmitButton();
        return true;
    }

    validateWeight(weight, input, errorElement) {
        const minWeight = this.isMetric ? 20 : 44;
        const maxWeight = this.isMetric ? 300 : 660;
        const unit = this.isMetric ? 'kg' : 'lbs';

        if (weight < minWeight) {
            this.setFieldError(
                input,
                errorElement,
                `Entered weight looks too low (minimum ${minWeight} ${unit}).`
            );
            this.validationState.weight = false;
            this.updateSubmitButton();
            return false;
        }

        if (weight > maxWeight) {
            this.setFieldError(
                input,
                errorElement,
                `Entered weight looks too high (maximum ${maxWeight} ${unit}).`
            );
            this.validationState.weight = false;
            this.updateSubmitButton();
            return false;
        }

        this.setFieldSuccess(input);
        this.validationState.weight = true;
        this.updateSubmitButton();
        return true;
    }

    validateHeight(height, input, errorElement) {
        const minHeight = this.isMetric ? 100 : 39;
        const maxHeight = this.isMetric ? 250 : 98;
        const unit = this.isMetric ? 'cm' : 'inches';

        if (height < minHeight) {
            this.setFieldError(
                input,
                errorElement,
                `Entered height looks too short (minimum ${minHeight} ${unit}).`
            );
            this.validationState.height = false;
            this.updateSubmitButton();
            return false;
        }

        if (height > maxHeight) {
            this.setFieldError(
                input,
                errorElement,
                `Entered height looks too tall (maximum ${maxHeight} ${unit}).`
            );
            this.validationState.height = false;
            this.updateSubmitButton();
            return false;
        }

        this.setFieldSuccess(input);
        this.validationState.height = true;
        this.updateSubmitButton();
        return true;
    }

    focusFirstInvalid() {
        const first = this.form.querySelector('[aria-invalid="true"], .error');
        if (first && typeof first.focus === 'function') {
            first.focus();
        }
    }

    setFieldError(input, errorElement, message) {
        input.classList.add('error');
        input.setAttribute('aria-invalid', 'true');
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    setFieldSuccess(input) {
        input.classList.add('success');
        input.setAttribute('aria-invalid', 'false');
    }

    clearValidation() {
        this.weightInput.classList.remove('error', 'success');
        this.heightInput.classList.remove('error', 'success');
        this.weightError.classList.remove('show');
        this.heightError.classList.remove('show');
        this.genderError.classList.remove('show');
        this.weightError.textContent = '';
        this.heightError.textContent = '';
        this.genderError.textContent = '';
        this.weightInput.setAttribute('aria-invalid', 'false');
        this.heightInput.setAttribute('aria-invalid', 'false');
        this.validationState = { weight: false, height: false, gender: false };
    }

    updateSubmitButton() {
        const isValid = this.validationState.weight && this.validationState.height && this.validationState.gender;
        this.submitBtn.disabled = !isValid;
    }

    calculateBMI(weight, height) {
        let weightKg = weight;
        let heightM = height;

        if (!this.isMetric) {
            weightKg = weight * 0.453592;
            heightM = height * 0.0254;
        } else {
            heightM = height / 100;
        }

        return weightKg / (heightM * heightM);
    }

    getBMICategory(bmi) {
        const gender = this.selectedGender;
        
        const categories = [
            {
                name: 'Severely Underweight',
                min: -Infinity, max: 16.0,
                class: 'bmi-severe-underweight',
                historyClass: 'severe-underweight',
                range: 'BMI < 16.0',
                advice: this.getGenderSpecificAdvice('severely-underweight', gender, bmi)
            },
            {
                name: 'Underweight',
                min: 16.0, max: 18.5,
                class: 'bmi-underweight',
                historyClass: 'underweight',
                range: '16.0 ≤ BMI < 18.5',
                advice: this.getGenderSpecificAdvice('underweight', gender, bmi)
            },
            {
                name: 'Normal Weight',
                min: 18.5, max: 25.0,
                class: 'bmi-healthy',
                historyClass: 'healthy',
                range: '18.5 ≤ BMI < 25.0',
                advice: this.getGenderSpecificAdvice('normal', gender, bmi)
            },
            {
                name: 'Overweight',
                min: 25.0, max: 30.0,
                class: 'bmi-overweight',
                historyClass: 'overweight',
                range: '25.0 ≤ BMI < 30.0',
                advice: this.getGenderSpecificAdvice('overweight', gender, bmi)
            },
            {
                name: 'Obese',
                min: 30.0, max: 35.0,
                class: 'bmi-obese',
                historyClass: 'obese',
                range: '30.0 ≤ BMI < 35.0',
                advice: this.getGenderSpecificAdvice('obese', gender, bmi)
            },
            {
                name: 'Extremely Obese',
                min: 35.0, max: Infinity,
                class: 'bmi-extreme',
                historyClass: 'extreme',
                range: 'BMI ≥ 35.0',
                advice: this.getGenderSpecificAdvice('extremely-obese', gender, bmi)
            }
        ];

        return categories.find(c => bmi >= c.min && bmi < c.max);
    }

    getGenderSpecificAdvice(category, gender, bmi) {
        const healthTips = {
            'severely-underweight': {
                male: 'This is very low for men. Please consult a healthcare professional. Consider increasing calorie intake with nutrient-dense foods.',
                female: 'This is very low for women. Please consult a healthcare professional. Consider increasing calorie intake with nutrient-dense foods.',
                other: 'This BMI is very low. Please consult a healthcare professional. Consider increasing calorie intake with nutrient-dense foods.'
            },
            'underweight': {
                male: 'Consider a balanced, calorie-rich diet with lean proteins. Men may benefit from strength training to build healthy muscle mass.',
                female: 'Consider a balanced, calorie-rich diet with iron-rich foods. Women may benefit from weight-bearing exercises and adequate calcium intake.',
                other: 'Consider a balanced, calorie-rich diet and speak to a clinician if concerned. Focus on nutrient-dense foods and regular activity.'
            },
            'normal': {
                male: 'Excellent! Maintain a balanced diet with adequate protein and regular exercise. Men should focus on cardiovascular and strength training.',
                female: 'Excellent! Maintain a balanced diet with iron, calcium, and folate. Women benefit from regular weight-bearing exercises.',
                other: 'Great! Maintain a balanced diet and regular activity. Focus on whole foods and consistent exercise routine.'
            },
            'overweight': {
                male: 'Consider lifestyle changes focusing on portion control and regular exercise. Men may benefit from HIIT workouts and reduced processed foods.',
                female: 'Consider lifestyle changes with emphasis on balanced nutrition and regular activity. Women should focus on sustainable dietary changes.',
                other: 'Consider lifestyle changes (diet/activity). Small, consistent changes help. Focus on whole foods and regular movement.'
            },
            'obese': {
                male: 'Higher health risk for men. Speak to a healthcare provider for guidance. Consider structured weight management programs.',
                female: 'Higher health risk for women. Speak to a healthcare provider for guidance. Consider hormone-related factors and structured programs.',
                other: 'Higher health risk. Speak to a healthcare provider for guidance. Consider comprehensive lifestyle modifications.'
            },
            'extremely-obese': {
                male: 'Significant health risk for men. Please consult a healthcare professional immediately for comprehensive treatment options.',
                female: 'Significant health risk for women. Please consult a healthcare professional immediately for comprehensive treatment options.',
                other: 'Significant health risk. Please consult a healthcare professional immediately for comprehensive treatment options.'
            }
        };

        return healthTips[category][gender] || healthTips[category]['other'];
    }

    displayResult(bmi, category) {
        this.bmiValue.textContent = bmi.toFixed(1);
        
        // Add gender icon to category name
        const genderIcon = this.getGenderIcon();
        this.bmiCategory.innerHTML = `${genderIcon} ${category.name}`;
        
        this.bmiRange.textContent = category.range;
        this.bmiAdvice.textContent = category.advice;
        this.bmiDisplay.className = `bmi-display ${category.class}`;
        this.result.classList.add('show');
    }

    getGenderIcon() {
        const icons = {
            'male': '♂',
            'female': '♀',
            'other': '⚧'
        };
        return icons[this.selectedGender] || '';
    }

    saveToHistory(weight, height, bmi, category) {
        const entry = {
            id: Date.now(),
            date: new Date(),
            weight: weight,
            height: height,
            bmi: bmi.toFixed(1),
            category: category.name,
            categoryClass: category.historyClass,
            unit: this.isMetric ? 'metric' : 'imperial',
            gender: this.selectedGender
        };

        this.history.unshift(entry);

        if (this.history.length > 10) {
            this.history = this.history.slice(0, 10);
        }

        this.saveHistory();
        this.renderHistory();
        this.updateHistoryControls();

        if (this.chartViewBtn.classList.contains('active')) {
            this.renderChart();
        }
    }

    loadHistory() {
        try {
            const history = localStorage.getItem('bmiHistory');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    }

    saveHistory() {
        try {
            localStorage.setItem('bmiHistory', JSON.stringify(this.history));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.warn('Storage quota exceeded. Clearing old history.');
                this.history = this.history.slice(0, 5);
                localStorage.setItem('bmiHistory', JSON.stringify(this.history));
            } else {
                console.error('Error saving history:', error);
            }
        }
    }

    renderHistory() {
        if (this.history.length === 0) {
            this.historyList.innerHTML = '<p class="empty-history">No calculations yet. Start by calculating your BMI above.</p>';
            return;
        }

        this.historyList.innerHTML = this.history.map(entry => {
            const date = new Date(entry.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="history-item ${entry.categoryClass}">
                    <div class="history-content">
                        <div class="history-info">
                            <div class="history-main">BMI: ${entry.bmi}</div>
                            <div class="history-category ${entry.categoryClass}">${entry.category}</div>
                            <div class="history-details">
                                ${entry.weight}${entry.unit === 'metric' ? 'kg' : 'lbs'} • 
                                ${entry.height}${entry.unit === 'metric' ? 'cm' : 'in'}
                            </div>
                        </div>
                        <div class="history-date">${formattedDate}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    clearHistory() {
        if (this.history.length === 0) return;

        this.history = [];
        this.saveHistory();
        this.updateHistoryControls();

        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }

        if (this.chartViewBtn.classList.contains('active')) {
            this.chartContainer.innerHTML = '<p class="empty-history">No calculations yet. Start by calculating your BMI above.</p>';
        } else {
            this.renderHistory();
        }
    }

    showListView() {
        this.listViewBtn.classList.add('active');
        this.chartViewBtn.classList.remove('active');
        this.historyList.style.display = 'flex';
        this.chartContainer.classList.remove('show');
        this.renderHistory();
    }

    showChartView() {
        this.listViewBtn.classList.remove('active');
        this.chartViewBtn.classList.add('active');
        this.historyList.style.display = 'none';
        this.chartContainer.classList.add('show');

        if (this.history.length === 0) {
            this.chartContainer.innerHTML = '<p class="empty-history">No calculations yet. Start by calculating your BMI above.</p>';
        } else {
            this.renderChart();
        }
    }

    renderChart() {
        if (this.history.length === 0) return;

        const labels = this.history.map(entry => {
            const date = new Date(entry.date);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }).reverse();

        const bmiData = this.history.map(entry => parseFloat(entry.bmi)).reverse();

        const pointBackgroundColors = this.history.map(entry => entry.color || (() => {
            const b = parseFloat(entry.bmi);
            if (b < 16) return '#1e3a8a';
            if (b < 18.5) return '#3b82f6';
            if (b < 25) return '#10b981';
            if (b < 30) return '#f59e0b';
            if (b < 35) return '#ef4444';
            return '#7f1d1d';
        })()).reverse();

        if (this.chart) {
            this.chart.destroy();
        }

        this.chartContainer.innerHTML = '<canvas id="bmiChart"></canvas>';
        const ctx = document.getElementById('bmiChart').getContext('2d');

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'BMI',
                    data: bmiData,
                    borderColor: 'rgba(16, 185, 129, 0.9)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    pointBackgroundColor: pointBackgroundColors,
                    pointBorderColor: 'rgba(255, 255, 255, 0.9)',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: function (context) {
                                return `BMI: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: {
                                size: 12
                            }
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            font: {
                                size: 12
                            }
                        },
                        suggestedMin: 15,
                        suggestedMax: 40
                    }
                }
            }
        });
    }

    updateHistoryControls() {
        const hasHistory = this.history.length > 0;
        this.clearHistoryBtn.disabled = !hasHistory;
    }

    hideResult() {
        this.result.classList.remove('show');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BMICalculator();
});

const themeToggle = document.getElementById('themeToggle');
        const body = document.body;

      
        const currentTheme = localStorage.getItem('theme') || 'light';
        if (currentTheme === 'dark') {
            body.classList.add('dark-mode');
        }

        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            
        
            const theme = body.classList.contains('dark-mode') ? 'dark' : 'light';
            localStorage.setItem('theme', theme);
        });
