// Unit conversion definitions
const units = {
    length: {
        m: { name: 'Meters', toBase: (v) => v, fromBase: (v) => v },
        km: { name: 'Kilometers', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
        mi: { name: 'Miles', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
        ft: { name: 'Feet', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 }
    },
    temperature: {
        C: { 
            name: 'Celsius',
            toBase: (v) => v,
            fromBase: (v) => v
        },
        F: { 
            name: 'Fahrenheit',
            toBase: (v) => (v - 32) * 5/9,
            fromBase: (v) => (v * 9/5) + 32
        },
        K: { 
            name: 'Kelvin',
            toBase: (v) => v - 273.15,
            fromBase: (v) => v + 273.15
        }
    },
    weight: {
        g: { name: 'Grams', toBase: (v) => v, fromBase: (v) => v },
        kg: { name: 'Kilograms', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
        lb: { name: 'Pounds', toBase: (v) => v * 453.592, fromBase: (v) => v / 453.592 },
        oz: { name: 'Ounces', toBase: (v) => v * 28.3495, fromBase: (v) => v / 28.3495 }
    }
};

// State management
let currentCategory = 'length';
let isConverting = false;

// DOM elements
const input1 = document.getElementById('input1');
const input2 = document.getElementById('input2');
const unit1 = document.getElementById('unit1');
const unit2 = document.getElementById('unit2');
const swapBtn = document.getElementById('swapBtn');
const categoryBtns = document.querySelectorAll('.category-btn');
const themeToggle = document.getElementById('themeToggle');

// Load state from localStorage
function loadState() {
    const saved = localStorage.getItem('unitConverterState');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            currentCategory = state.category || 'length';
            return state;
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Save state to localStorage
function saveState() {
    const state = {
        category: currentCategory,
        unit1: unit1.value,
        unit2: unit2.value
    };
    localStorage.setItem('unitConverterState', JSON.stringify(state));
}

// Load theme from localStorage
function loadTheme() {
    const theme = localStorage.getItem('unitConverterTheme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Toggle between light and dark theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('unitConverterTheme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

// Populate unit dropdowns based on current category
function populateUnits() {
    const categoryUnits = units[currentCategory];
    const unitKeys = Object.keys(categoryUnits);
    
    unit1.innerHTML = '';
    unit2.innerHTML = '';
    
    unitKeys.forEach(key => {
        const option1 = document.createElement('option');
        option1.value = key;
        option1.textContent = categoryUnits[key].name;
        unit1.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = key;
        option2.textContent = categoryUnits[key].name;
        unit2.appendChild(option2);
    });

    const saved = loadState();
    if (saved && saved.category === currentCategory) {
        if (unitKeys.includes(saved.unit1)) unit1.value = saved.unit1;
        if (unitKeys.includes(saved.unit2)) unit2.value = saved.unit2;
    } else {
        unit1.value = unitKeys[0];
        unit2.value = unitKeys[1] || unitKeys[0];
    }
}

// Convert units bi-directionally
function convert(fromInput, toInput) {
    if (isConverting) return;
    
    const value = parseFloat(fromInput.value);
    if (isNaN(value) || fromInput.value === '') {
        toInput.value = '';
        return;
    }

    const fromUnit = fromInput === input1 ? unit1.value : unit2.value;
    const toUnit = fromInput === input1 ? unit2.value : unit1.value;

    const categoryUnits = units[currentCategory];
    
    // Convert to base unit, then to target unit
    const baseValue = categoryUnits[fromUnit].toBase(value);
    const result = categoryUnits[toUnit].fromBase(baseValue);

    isConverting = true;
    toInput.value = parseFloat(result.toFixed(6)).toString();
    isConverting = false;
}

// Switch between categories (Length, Temperature, Weight)
function switchCategory(category) {
    currentCategory = category;
    
    categoryBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    input1.value = '';
    input2.value = '';
    
    populateUnits();
    saveState();
}

// Swap units and values
function swapUnits() {
    const tempValue = input1.value;
    const tempUnit = unit1.value;
    
    input1.value = input2.value;
    unit1.value = unit2.value;
    
    input2.value = tempValue;
    unit2.value = tempUnit;
    
    saveState();
}

// Event listeners
categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        switchCategory(btn.dataset.category);
    });
});

input1.addEventListener('input', () => convert(input1, input2));
input2.addEventListener('input', () => convert(input2, input1));

unit1.addEventListener('change', () => {
    convert(input1, input2);
    saveState();
});

unit2.addEventListener('change', () => {
    convert(input1, input2);
    saveState();
});

swapBtn.addEventListener('click', swapUnits);
themeToggle.addEventListener('click', toggleTheme);

// Initialize app
loadTheme();
const saved = loadState();
if (saved) {
    switchCategory(saved.category);
} else {
    populateUnits();
}