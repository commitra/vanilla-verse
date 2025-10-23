const tableBody = document.getElementById("tableBody");
const exportBtn = document.getElementById("exportBtn");
const categoryFilter = document.getElementById("categoryFilter");
const form = document.getElementById("expenseForm");

const monthlyCtx = document.getElementById("monthlyChart").getContext("2d");
const categoryCtx = document.getElementById("categoryChart").getContext("2d");

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let monthlyChart, categoryChart;

function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function updateTable() {
  if (expenses.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No data entered</td></tr>`;
    return;
  }

  tableBody.innerHTML = "";
  expenses.forEach((exp, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${exp.date}</td>
      <td>${exp.title}</td>
      <td>${exp.category}</td>
      <td>₹${exp.amount}</td>
      <td><button class="deleteBtn" data-index="${index}">🗑️</button></td>
    `;
    tableBody.appendChild(row);
  });


  document.querySelectorAll(".deleteBtn").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const i = e.target.getAttribute("data-index");
      expenses.splice(i, 1);
      saveExpenses();
      updateAll();
    })
  );
}

function updateCategoryFilter() {
  const categories = ["all", ...new Set(expenses.map((e) => e.category))];
  categoryFilter.innerHTML = categories
    .map((cat) => `<option value="${cat}">${cat}</option>`)
    .join("");
}

function renderMonthlyChart() {
  if (monthlyChart) monthlyChart.destroy();

  const monthMap = {};
  expenses.forEach((e) => {
    const month = e.date ? e.date.slice(0, 7) : "Unknown"; // YYYY-MM
    monthMap[month] = (monthMap[month] || 0) + parseFloat(e.amount);
  });

  const labels = Object.keys(monthMap);
  const data = Object.values(monthMap);

  monthlyChart = new Chart(monthlyCtx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Total Monthly Expense (₹)",
          data,
          backgroundColor: "#6200ea",
        },
      ],
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
    },
  });
}

function renderCategoryChart() {
  if (categoryChart) categoryChart.destroy();

  const categoryTotals = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] =
      (categoryTotals[e.category] || 0) + parseFloat(e.amount);
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  categoryChart = new Chart(categoryCtx, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            "#ff6384",
            "#36a2eb",
            "#ffce56",
            "#4caf50",
            "#ff9800",
            "#9c27b0",
          ],
        },
      ],
    },
    options: { responsive: true },
  });
}

exportBtn.addEventListener("click", () => {
  if (expenses.length === 0) return alert("No data to export!");
  let csvContent = "data:text/csv;charset=utf-8,Date,Title,Category,Amount\n";
  expenses.forEach((e) => {
    csvContent += `${e.date},${e.title},${e.category},${e.amount}\n`;
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "expenses.csv");
  document.body.appendChild(link);
  link.click();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;

  if (!title || !amount || !category || !date)
    return alert("Please fill all fields!");

  expenses.push({ title, amount, category, date });
  saveExpenses();
  form.reset();
  updateAll();
});

function updateAll() {
  updateTable();
  updateCategoryFilter();
  renderMonthlyChart();
  renderCategoryChart();
}

categoryFilter.addEventListener("change", (e) => {
  const filter = e.target.value;
  if (filter === "all") updateAll();
  else {
    const filtered = expenses.filter((ex) => ex.category === filter);
    tableBody.innerHTML = "";
    filtered.forEach((exp) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${exp.date}</td>
        <td>${exp.title}</td>
        <td>${exp.category}</td>
        <td>₹${exp.amount}</td>
        <td></td>
      `;
      tableBody.appendChild(row);
    });
  }
});

window.addEventListener("DOMContentLoaded", updateAll);
