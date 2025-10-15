// chart.js - Exchange Rate Chart Module (Dark Theme)

class ExchangeRateChart {
  constructor() {
    this.chart = null;
    this.chartCanvas = null;
    this.init();
  }

  init() {
    // Wait for DOM to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    // Create canvas for chart
    const container = document.getElementById('chartContainer');
    if (!container) return;

    this.chartCanvas = document.createElement('canvas');
    this.chartCanvas.id = 'rateChart';
    container.appendChild(this.chartCanvas);

    // Setup event listeners
    const loadBtn = document.getElementById('loadChart');
    if (loadBtn) {
      loadBtn.addEventListener('click', () => this.loadChartData());
    }

    // Populate currency selects
    this.populateCurrencySelects();
    
    // Load initial chart
    this.loadChartData();
  }

  populateCurrencySelects() {
    const currencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'];
    const fromSelect = document.getElementById('chartFrom');
    const toSelect = document.getElementById('chartTo');

    if (fromSelect && toSelect) {
      currencies.forEach(currency => {
        fromSelect.add(new Option(currency, currency));
        toSelect.add(new Option(currency, currency));
      });
      
      // Set defaults
      fromSelect.value = 'USD';
      toSelect.value = 'EUR';
    }
  }

  async loadChartData() {
    const from = document.getElementById('chartFrom')?.value;
    const to = document.getElementById('chartTo')?.value;

    if (!from || !to) {
      this.showMessage('Please select currencies');
      return;
    }

    if (from === to) {
      this.showMessage('Please select different currencies');
      return;
    }

    try {
      // Show loading state
      this.showLoading(true);

      // Fetch 7-day historical data
      const data = await this.fetchHistoricalRates(from, to);
      
      // Render chart
      this.renderChart(data, from, to);
      
    } catch (error) {
      console.error('Error loading chart data:', error);
      this.showMessage('Failed to load chart data. Using sample data.');
      
      // Use mock data as fallback
      const mockData = this.getMockData();
      this.renderChart(mockData, from, to);
    }
  }

  async fetchHistoricalRates(from, to) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const formatDate = (date) => date.toISOString().split('T')[0];

    // Using frankfurter.app (free, no key needed)
    const url = `https://api.frankfurter.app/${formatDate(startDate)}..${formatDate(endDate)}?from=${from}&to=${to}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('API request failed');
    
    const data = await response.json();
    
    // Transform data for chart
    const dates = Object.keys(data.rates).sort();
    const rates = dates.map(date => data.rates[date][to]);

    return {
      labels: dates.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      values: rates
    };
  }

  getMockData() {
    // Mock 7-day data for testing
    const today = new Date();
    const labels = [];
    const values = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      values.push(parseFloat((0.85 + Math.random() * 0.1).toFixed(4)));
    }

    return { labels, values };
  }

  renderChart(data, from, to) {
    const ctx = this.chartCanvas.getContext('2d');

    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    // Dark theme colors
    const accentColor = '#6ee7b7';
    const textColor = '#eef1f8';
    const mutedColor = '#a6adbb';
    const gridColor = 'rgba(166, 173, 187, 0.1)';

    // Create new chart using Chart.js
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          label: `${from} to ${to} Exchange Rate`,
          data: data.values,
          borderColor: accentColor,
          backgroundColor: 'rgba(110, 231, 183, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: accentColor,
          pointBorderColor: '#0b1020',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: textColor,
              font: {
                size: 12,
                weight: '600'
              },
              padding: 15
            }
          },
          title: {
            display: true,
            text: '7-Day Exchange Rate Trend',
            color: textColor,
            font: {
              size: 16,
              weight: '600'
            },
            padding: {
              bottom: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgba(23, 23, 28, 0.95)',
            titleColor: textColor,
            bodyColor: mutedColor,
            borderColor: gridColor,
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              label: function(context) {
                return `Rate: ${context.parsed.y.toFixed(4)}`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: mutedColor,
              font: {
                size: 11
              }
            },
            grid: {
              color: gridColor,
              drawBorder: false
            }
          },
          y: {
            beginAtZero: false,
            ticks: {
              color: mutedColor,
              font: {
                size: 11
              },
              callback: function(value) {
                return value.toFixed(4);
              }
            },
            grid: {
              color: gridColor,
              drawBorder: false
            }
          }
        }
      }
    });
    
    this.showLoading(false);
  }

  showLoading(isLoading) {
    const container = document.getElementById('chartContainer');
    if (!container) return;

    if (isLoading) {
      container.innerHTML = '<p style="text-align: center; padding: 50px;">Loading chart data...</p>';
      // Re-create canvas after clearing
      this.chartCanvas = document.createElement('canvas');
      this.chartCanvas.id = 'rateChart';
    } else if (!this.chartCanvas.parentElement) {
      container.innerHTML = '';
      container.appendChild(this.chartCanvas);
    }
  }

  showMessage(message) {
    const container = document.getElementById('chartContainer');
    if (!container) return;
    
    container.innerHTML = `<p style="text-align: center; padding: 50px; color: var(--muted);">${message}</p>`;
  }
}

// Initialize chart when script loads
const exchangeChart = new ExchangeRateChart();