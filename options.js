document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupEventListeners();
  loadWatchlist();
  loadAlerts();
});

function setupEventListeners() {
  document.getElementById('saveApi').addEventListener('click', saveApiKey);
  document.getElementById('saveAlertSettings').addEventListener('click', saveAlertSettings);
  document.getElementById('saveDisplaySettings').addEventListener('click', saveDisplaySettings);
  document.getElementById('exportData').addEventListener('click', exportData);
  document.getElementById('clearData').addEventListener('click', clearData);
}

function loadSettings() {
  chrome.storage.local.get(['apiKey', 'alertFrequency', 'soundAlerts', 'darkMode', 'showScores', 'autoRefresh'], (result) => {
    document.getElementById('apiKey').value = result.apiKey || '';
    document.getElementById('alertFrequency').value = result.alertFrequency || '30';
    document.getElementById('soundAlerts').checked = result.soundAlerts || false;
    document.getElementById('darkMode').checked = result.darkMode !== false;
    document.getElementById('showScores').checked = result.showScores !== false;
    document.getElementById('autoRefresh').checked = result.autoRefresh || false;
  });
}

function saveApiKey() {
  const apiKey = document.getElementById('apiKey').value.trim();
  
  if (!apiKey) {
    alert('Please enter an API key');
    return;
  }

  chrome.storage.local.set({ apiKey }, () => {
    document.getElementById('apiSuccess').classList.remove('hidden');
    setTimeout(() => {
      document.getElementById('apiSuccess').classList.add('hidden');
    }, 3000);
  });
}

function saveAlertSettings() {
  const settings = {
    alertFrequency: document.getElementById('alertFrequency').value,
    soundAlerts: document.getElementById('soundAlerts').checked
  };

  chrome.storage.local.set(settings, () => {
    alert('Alert settings saved!');
    
    chrome.alarms.clear('checkAlerts');
    chrome.alarms.create('checkAlerts', {
      periodInMinutes: parseInt(settings.alertFrequency)
    });
  });
}

function saveDisplaySettings() {
  const settings = {
    darkMode: document.getElementById('darkMode').checked,
    showScores: document.getElementById('showScores').checked,
    autoRefresh: document.getElementById('autoRefresh').checked
  };

  chrome.storage.local.set(settings, () => {
    alert('Display settings saved!');
  });
}

function loadWatchlist() {
  chrome.storage.local.get(['watchlist'], (result) => {
    const watchlist = result.watchlist || [];
    const container = document.getElementById('watchlistList');

    if (watchlist.length === 0) {
      container.innerHTML = '<p style="color: #71717a;">No items in watchlist</p>';
      return;
    }

    container.innerHTML = '';
    watchlist.forEach(symbol => {
      const div = document.createElement('div');
      div.className = 'watchlist-item';
      div.innerHTML = `
        <span>${symbol}</span>
        <button data-symbol="${symbol}">×</button>
      `;
      div.querySelector('button').addEventListener('click', (e) => {
        removeFromWatchlist(e.target.dataset.symbol);
      });
      container.appendChild(div);
    });
  });
}

function loadAlerts() {
  chrome.storage.local.get(['alerts'], (result) => {
    const alerts = result.alerts || [];
    const container = document.getElementById('alertList');

    if (alerts.length === 0) {
      container.innerHTML = '<p style="color: #71717a;">No active alerts</p>';
      return;
    }

    container.innerHTML = '';
    alerts.forEach((alert, index) => {
      const div = document.createElement('div');
      div.className = 'alert-item';
      div.innerHTML = `
        <span>${alert.symbol} ${alert.type} $${alert.price}</span>
        <button data-index="${index}">Remove</button>
      `;
      div.querySelector('button').addEventListener('click', (e) => {
        removeAlert(parseInt(e.target.dataset.index));
      });
      container.appendChild(div);
    });
  });
}

function removeFromWatchlist(symbol) {
  chrome.storage.local.get(['watchlist'], (result) => {
    const watchlist = result.watchlist || [];
    const newWatchlist = watchlist.filter(s => s !== symbol);
    chrome.storage.local.set({ watchlist: newWatchlist });
    loadWatchlist();
  });
}

function removeAlert(index) {
  chrome.storage.local.get(['alerts'], (result) => {
    const alerts = result.alerts || [];
    alerts.splice(index, 1);
    chrome.storage.local.set({ alerts });
    loadAlerts();
  });
}

function exportData() {
  chrome.storage.local.get(null, (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock-analyzer-data.json';
    a.click();
    URL.revokeObjectURL(url);
  });
}

function clearData() {
  if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    return;
  }

  chrome.storage.local.clear(() => {
    alert('All data cleared!');
    loadSettings();
    loadWatchlist();
    loadAlerts();
  });
}