const billInput = document.querySelector(".bill");
const splitInput = document.querySelector(".split");
const tipButtons = document.querySelectorAll(".tip-btn");
const customTipInput = document.getElementById("custom-tip");
const tipAmountDisplay = document.getElementById("tip-amount");
const totalBillDisplay = document.getElementById("total-bill");
const perPersonDisplay = document.getElementById("per-person");

let tipPercentage = 0;

tipButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tipPercentage = Number(btn.dataset.tip);
    customTipInput.value = ""; // clear custom tip
    tipButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    calculateTotals();
  });
});


[billInput, splitInput, customTipInput].forEach(input => {
  input.addEventListener("input", () => calculateTotals());
});


function calculateTotals() {
  const bill = parseFloat(billInput.value);
  const people = parseInt(splitInput.value) || 1;
  const customTip = parseFloat(customTipInput.value);

  // Use custom tip if entered
  const tipPercent = customTip > 0 ? customTip : tipPercentage;

  // Prevent calculation for empty bill
  if (isNaN(bill) || bill <= 0) {
    updateDisplay(0, 0, 0);
    return;
  }

  const tipAmount = (bill * tipPercent) / 100;
  const totalBill = bill + tipAmount;
  const perPerson = totalBill / people;

  updateDisplay(tipAmount, totalBill, perPerson);
}

function updateDisplay(tip, total, perPerson) {
  tipAmountDisplay.textContent = `Rs${tip.toFixed(2)}`;
  totalBillDisplay.textContent = `Rs${total.toFixed(2)}`;
  perPersonDisplay.textContent = `Rs${perPerson.toFixed(2)}`;
}

const themeToggle = document.getElementById("themeToggle");
const body = document.body;

const currentTheme = localStorage.getItem("theme") || "light";
if (currentTheme === "dark") {
  body.classList.add("dark-mode");
}

themeToggle.addEventListener("click", () => {
  body.classList.toggle("dark-mode");

  const theme = body.classList.contains("dark-mode") ? "dark" : "light";
  localStorage.setItem("theme", theme);
});
