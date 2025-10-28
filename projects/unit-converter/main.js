
// ============================================
// CONFIGURATION & DATA
// ============================================

const conversionData = {
    length: {
        units: ['m', 'km', 'mi', 'ft'],
        toBase: {
            m: 1,
            km: 1000,
            mi: 1609.344,
            ft: 0.3048
        }
    },
    temperature: {
        units: ['C', 'F', 'K'],
        convert: (value, from, to) => {
            if (from === to) return value;

            // Convert to Celsius first
            let celsius;
            if (from === 'C') celsius = value;
            else if (from === 'F') celsius = (value - 32) * 5 / 9;
            else if (from === 'K') celsius = value - 273.15;

            // Convert from Celsius to target
            if (to === 'C') return celsius;
            if (to === 'F') return celsius * 9 / 5 + 32;
            if (to === 'K') return celsius + 273.15;
        }
    },
    weight: {
        units: ['g', 'kg', 'lb', 'oz'],
        toBase: {
            g: 1,
            kg: 1000,
            lb: 453.59237,
            oz: 28.349523125
        }
    }
};

// ============================================
// STATE MANAGEMENT
// ============================================

const state = {
    category: 'length',
    unit1: 'm',
    unit2: 'km',
    value1: '',
    value2: '',
    theme: 'light',
    isUpdating: false
};

// ============================================
// DOM REFERENCES
// ============================================

const elements = {
    category: document.getElementById('category'),
    input1: document.getElementById('input1'),
    input2: document.getElementById('input2'),
    unit1: document.getElementById('unit1'),
    unit2: document.getElementById('unit2'),
    swapBtn: document.getElementById('swapBtn'),
    themeToggle: document.getElementById('themeToggle'),
    themeIcon: document.getElementById('themeIcon'),
    html: document.documentElement
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format number with sensible rounding (max 6 decimals, no trailing zeros)
 */
function formatNumber(num) {
    if (num === null || num === undefined || num === '' || isNaN(num) || !isFinite(num)) {
        return '';
    }
    return parseFloat(parseFloat(num).toFixed(6)).toString();
}

/**
 * Convert value between units
 */
function convert(value, fromUnit, toUnit, category) {
    if (value === '' || value === null || value === undefined || isNaN(value)) {
        return '';
    }

    const numValue = parseFloat(value);
    const data = conversionData[category];

    if (category === 'temperature') {
        return data.convert(numValue, fromUnit, toUnit);
    }

    // For length and weight: convert through base unit
    const baseValue = numValue * data.toBase[fromUnit];
    return baseValue / data.toBase[toUnit];
}

/**
 * Update state and persist
 */
function updateState(updates) {
    Object.assign(state, updates);
}

// ============================================
// THEME MANAGEMENT
// ============================================

function setTheme(theme) {
    updateState({ theme });

    if (theme === 'dark') {
        elements.html.setAttribute('data-theme', 'dark');
        elements.themeIcon.textContent = '☀️';
    } else {
        elements.html.removeAttribute('data-theme');
        elements.themeIcon.textContent = '🌙';
    }
}

function toggleTheme() {
    setTheme(state.theme === 'light' ? 'dark' : 'light');
}

// ============================================
// UNIT MANAGEMENT
// ============================================

/**
 * Populate unit dropdowns based on selected category
 */
function populateUnitOptions(category) {
    const units = conversionData[category].units;

    // Clear existing options
    elements.unit1.innerHTML = '';
    elements.unit2.innerHTML = '';

    // Add new options
    units.forEach(unit => {
        elements.unit1.add(new Option(unit, unit));
        elements.unit2.add(new Option(unit, unit));
    });

    // Set default selections
    elements.unit1.value = units[0];
    elements.unit2.value = units[Math.min(1, units.length - 1)];

    updateState({
        unit1: elements.unit1.value,
        unit2: elements.unit2.value
    });
}

/**
 * Update unit options when category changes
 */
function handleCategoryChange() {
    const category = elements.category.value;
    updateState({ category, value1: '', value2: '' });

    populateUnitOptions(category);

    // Clear inputs
    elements.input1.value = '';
    elements.input2.value = '';
}

// ============================================
// CONVERSION LOGIC
// ============================================

/**
 * Perform conversion from input1 to input2
 */
function convertFromInput1() {
    if (state.isUpdating) return;

    state.isUpdating = true;

    const value = elements.input1.value;
    const result = convert(value, state.unit1, state.unit2, state.category);

    elements.input2.value = formatNumber(result);
    updateState({ value1: value, value2: elements.input2.value });

    state.isUpdating = false;
}

/**
 * Perform conversion from input2 to input1
 */
function convertFromInput2() {
    if (state.isUpdating) return;

    state.isUpdating = true;

    const value = elements.input2.value;
    const result = convert(value, state.unit2, state.unit1, state.category);

    elements.input1.value = formatNumber(result);
    updateState({ value1: elements.input1.value, value2: value });

    state.isUpdating = false;
}

/**
 * Handle unit selection changes
 */
function handleUnitChange(changedUnit) {
    // Update state
    if (changedUnit === 'unit1') {
        updateState({ unit1: elements.unit1.value });
    } else {
        updateState({ unit2: elements.unit2.value });
    }

    // Recalculate based on which input has a value
    if (elements.input1.value !== '') {
        convertFromInput1();
    } else if (elements.input2.value !== '') {
        convertFromInput2();
    }
}

/**
 * Swap units and values
 */
function handleSwap() {
    // Swap units
    const tempUnit = state.unit1;
    updateState({ unit1: state.unit2, unit2: tempUnit });
    elements.unit1.value = state.unit1;
    elements.unit2.value = state.unit2;

    // Swap values
    const tempValue = elements.input1.value;
    elements.input1.value = elements.input2.value;
    elements.input2.value = tempValue;

    updateState({
        value1: elements.input1.value,
        value2: elements.input2.value
    });
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Set up all event listeners
 */
function initEventListeners() {
    elements.category.addEventListener('change', handleCategoryChange);
    elements.input1.addEventListener('input', convertFromInput1);
    elements.input2.addEventListener('input', convertFromInput2);
    elements.unit1.addEventListener('change', () => handleUnitChange('unit1'));
    elements.unit2.addEventListener('change', () => handleUnitChange('unit2'));
    elements.swapBtn.addEventListener('click', handleSwap);
    elements.themeToggle.addEventListener('click', toggleTheme);
}

/**
 * Initialize the application
 */
function init() {
    // Set up initial category
    populateUnitOptions(state.category);

    // Set up event listeners
    initEventListeners();

    // Set initial theme
    setTheme(state.theme);
}

// Start the application
init();
