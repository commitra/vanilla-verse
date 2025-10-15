const form = document.getElementById('form');
const desc = document.getElementById('desc');
const amount = document.getElementById('amount');
const list = document.getElementById('list');
const chart = document.getElementById('chart').getContext('2d');
const exportBtn = document.getElementById('exportBtn');

// localStorage key
const STORAGE_KEY = 'vanillaverse_expense_tracker_items';

// Load items from localStorage on page load
let items = loadFromStorage();

// Load data from localStorage
function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate that it's an array
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error('Error loading expenses from localStorage:', error);
  }
  return [];
}

// Save data to localStorage
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving expenses to localStorage:', error);
    // Handle quota exceeded error
    alert('Unable to save data. Storage may be full.');
  }
}

form.addEventListener('submit', e => {
  e.preventDefault();
  items.push({
    id: crypto.randomUUID(),
    desc: desc.value,
    amount: parseFloat(amount.value) || 0,
    date: new Date().toLocaleDateString()
  });
  desc.value = '';
  amount.value = '';
  
  // Save to localStorage after adding new item
  saveToStorage();
  
  render();
});

function render() {
  list.innerHTML = '';
  let total = 0;
  for (const it of items) {
    total += it.amount;
    const li = document.createElement('li');
    li.textContent = `${it.date} — ${it.desc} — ₹${it.amount.toFixed(2)}`;
    list.appendChild(li);
  }
  drawChart(total);
}

function drawChart(total) {
  const w = 300, h = 150;
  chart.clearRect(0, 0, w, h);
  chart.fillStyle = '#17171c';
  chart.fillRect(0, 0, w, h);
  chart.fillStyle = '#6ee7b7';
  chart.fillRect(0, h - (total % h), w, (total % h));
}

// --- CSV Export Feature ---
function exportCSV() {
  if (items.length === 0) {
    alert('No expenses to export!');
    return;
  }

  // Convert items to CSV format
  const headers = ['Date', 'Description', 'Amount (INR)'];
  const rows = items.map(it => [it.date, it.desc, it.amount]);
  const csvContent = [headers, ...rows]
    .map(row => row.map(val => `"${val}"`).join(','))
    .join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

exportBtn.addEventListener('click', exportCSV);

// Initial render with loaded data
render();

console.log(`Expense Tracker loaded with ${items.length} expense(s) from storage`);