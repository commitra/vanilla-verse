 const form = document.getElementById('form');
    const desc = document.getElementById('desc');
    const amount = document.getElementById('amount');
    const list = document.getElementById('list');
    const chart = document.getElementById('chart').getContext('2d');
    const exportBtn = document.getElementById('exportBtn');

    let items = [];

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
        .join('\\n');

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
    render();

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
