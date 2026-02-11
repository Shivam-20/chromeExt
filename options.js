document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupEventListeners();
  loadWatchlist();
  loadAlerts();
});

/**
 * Sets up event listeners for all interactive elements
 */
function setupEventListeners() {
  document.getElementById('saveApi').addEventListener('click', saveApiKey);
  document.getElementById('saveAlertSettings').addEventListener('click', saveAlertSettings);
  document.getElementById('saveDisplaySettings').addEventListener('click', saveDisplaySettings);
  document.getElementById('exportData').addEventListener('click', exportData);
  document.getElementById('clearData').addEventListener('click', clearData);
}

/**
 * Loads user settings from storage
 */
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

/**
 * Saves API key to storage
 */
function saveApiKey() {
  const apiKeyInput = document.getElementById('apiKey');
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    showMessage('Please enter an API key', 'error');
    return;
  }

  if (apiKey === 'YOUR_ZAI_API_KEY') {
    showMessage('Please enter your actual Z.AI API key', 'error');
    return;
  }

  chrome.storage.local.set({ apiKey }, () => {
    showMessage('API key saved successfully!', 'success');
    apiKeyInput.value = '';
  });
}

/**
 * Saves alert settings
 */
function saveAlertSettings() {
  const settings = {
    alertFrequency: document.getElementById('alertFrequency').value,
    soundAlerts: document.getElementById('soundAlerts').checked
  };

  chrome.storage.local.set(settings, () => {
    showMessage('Alert settings saved!', 'success');
    
    chrome.alarms.clear('checkAlerts');
    chrome.alarms.create('checkAlerts', {
      periodInMinutes: parseInt(settings.alertFrequency)
    });
  });
}

/**
 * Saves display settings
 */
function saveDisplaySettings() {
  const settings = {
    darkMode: document.getElementById('darkMode').checked,
    showScores: document.getElementById('showScores').checked,
    autoRefresh: document.getElementById('autoRefresh').checked
  };

  chrome.storage.local.set(settings, () => {
    showMessage('Display settings saved!', 'success');
  });
}

/**
 * Loads and displays watchlist
 */
function loadWatchlist() {
  chrome.storage.local.get(['watchlist'], (result) => {
    const watchlist = result.watchlist || [];
    const container = document.getElementById('watchlistList');

    if (!watchlist || watchlist.length === 0) {
      container.innerHTML = '<p style="color: #71717a;">No items in watchlist</p>';
      return;
    }

    container.innerHTML = '';
    watchlist.forEach(symbol => {
      if (!symbol) return;
      
      const div = document.createElement('div');
      div.className = 'watchlist-item';
      
      const symbolSpan = document.createElement('span');
      symbolSpan.textContent = symbol;
      
      const removeButton = document.createElement('button');
      removeButton.dataset.symbol = symbol;
      removeButton.textContent = '×';
      removeButton.addEventListener('click', (e) => {
        removeFromWatchlist(e.target.dataset.symbol);
      });
      
      div.appendChild(symbolSpan);
      div.appendChild(removeButton);
      container.appendChild(div);
    });
  });
}

/**
 * Loads and displays active alerts
 */
function loadAlerts() {
  chrome.storage.local.get(['alerts'], (result) => {
    const alerts = result.alerts || [];
    const container = document.getElementById('alertList');

    if (!alerts || alerts.length === 0) {
      container.innerHTML = '<p style="color: #71717a;">No active alerts</p>';
      return;
    }

    container.innerHTML = '';
    alerts.forEach((alert, index) => {
      if (!alert || !alert.symbol) return;
      
      const div = document.createElement('div');
      div.className = 'alert-item';
      
      const span = document.createElement('span');
      span.textContent = `${alert.symbol} ${alert.type} $${alert.price}`;
      
      const removeButton = document.createElement('button');
      removeButton.dataset.index = index;
      removeButton.textContent = 'Remove';
      removeButton.addEventListener('click', (e) => {
        removeAlert(parseInt(e.target.dataset.index));
      });
      
      div.appendChild(span);
      div.appendChild(removeButton);
      container.appendChild(div);
    });
  });
}

/**
 * Removes a symbol from watchlist
 * @param {string} symbol - Symbol to remove
 */
function removeFromWatchlist(symbol) {
  chrome.storage.local.get(['watchlist'], (result) => {
    const watchlist = result.watchlist || [];
    const newWatchlist = watchlist.filter(s => s !== symbol);
    chrome.storage.local.set({ watchlist: newWatchlist });
    loadWatchlist();
  });
}

/**
 * Removes an alert by index
 * @param {number} index - Alert index to remove
 */
function removeAlert(index) {
  chrome.storage.local.get(['alerts'], (result) => {
    const alerts = result.alerts || [];
    if (index >= 0 && index < alerts.length) {
      alerts.splice(index, 1);
      chrome.storage.local.set({ alerts });
      loadAlerts();
    }
  });
}

/**
 * Exports all data to JSON file
 */
function exportData() {
  chrome.storage.local.get(null, (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock-analyzer-data.json';
    a.click();
    URL.revokeObjectURL(url);
    showMessage('Data exported successfully!', 'success');
  });
}

/**
 * Clears all data from storage
 */
function clearData() {
  if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    return;
  }

  chrome.storage.local.clear(() => {
    showMessage('All data cleared!', 'success');
    loadSettings();
    loadWatchlist();
    loadAlerts();
  });
}

/**
 * Displays a message to the user
 * @param {string} message - Message to display
 * @param {string} type - Message type ('success' or 'error')
 */
function showMessage(message, type = 'success') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message-${type}`;
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-size: 14px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;

  if (type === 'success') {
    messageDiv.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
  } else {
    messageDiv.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
  }

  document.body.appendChild(messageDiv);

  setTimeout(() => {
    messageDiv.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => messageDiv.remove(), 300);
  }, 3000);
}