const ZAI_API_URL = 'https://api.z.ai/v1/chat/completions';

const CONFIG = {
  ALERT_CHECK_INTERVAL: 30,
  TEMPERATURE: {
    PRICE_CHECK: 0.2
  }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'quickAnalyze') {
    getSymbolPrice(request.symbol).then(data => {
      sendResponse({ data });
    }).catch(error => {
      console.error('Quick analyze error:', error);
      sendResponse({ error: 'Failed to get symbol price' });
    });
    return true;
  }

  if (request.action === 'openPopup') {
    chrome.action.openPopup();
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Stock & Fund Analyzer Pro extension installed');
  setupAlerts();
});

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
});

function setupAlerts() {
  chrome.alarms.create('checkAlerts', { periodInMinutes: CONFIG.ALERT_CHECK_INTERVAL });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkAlerts') {
    checkPriceAlerts();
  }
});

/**
 * Checks all price alerts and triggers notifications
 * @returns {Promise<void>}
 */
async function checkPriceAlerts() {
  try {
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(['alerts'], resolve);
    });
    
    const alerts = result.alerts || [];
    if (!alerts || alerts.length === 0) return;
    
    const triggeredAlerts = [];

    for (const alert of alerts) {
      if (!alert || !alert.symbol) continue;
      
      try {
        const analysis = await getSymbolPrice(alert.symbol);
        const currentPrice = parseFloat(analysis.price.replace(/[^0-9.-]/g, ''));

        if (!isNaN(currentPrice) && !isNaN(alert.price)) {
          if ((alert.type === 'above' && currentPrice >= alert.price) ||
              (alert.type === 'below' && currentPrice <= alert.price)) {
            triggeredAlerts.push({ ...alert, currentPrice });
          }
        }
      } catch (error) {
        console.error('Error checking alert for', alert.symbol, error);
      }
    }

    if (triggeredAlerts.length > 0) {
      triggeredAlerts.forEach(alert => {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: `Price Alert: ${alert.symbol}`,
          message: `${alert.symbol} is now ${alert.type} $${alert.price} (Current: $${alert.currentPrice})`
        });
      });

      chrome.storage.local.set({ 
        alerts: alerts.filter(a => !triggeredAlerts.find(t => t.symbol === a.symbol && t.price === a.price))
      });
    }
  } catch (error) {
    console.error('Error checking price alerts:', error);
  }
}

/**
 * Gets current price for a symbol
 * @param {string} symbol - Stock/fund symbol
 * @returns {Promise<Object>} Price data
 * @throws {Error} If API request fails
 */
async function getSymbolPrice(symbol) {
  const result = await new Promise((resolve) => {
    chrome.storage.local.get(['apiKey'], resolve);
  });
  
  const apiKey = result.apiKey;
  
  const prompt = `You need to get the CURRENT real-time market price for ${symbol}.

Return ONLY valid JSON:
{
  "price": "Current price with $ sign (e.g., $185.92)",
  "change": "Daily change % with sign (e.g., +2.34% or -1.15%)"
}

IMPORTANT:
- Use the most recent market data available
- Price should be the current trading price or last close
- Change should be today's percentage change
- If market is closed, use the last closing price
- Return ONLY the JSON object, no other text`;

  const response = await fetch(ZAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { 
          role: 'system', 
          content: `You are a real-time market data provider. Your responses must be:
1. 100% accurate to the best of your knowledge
2. Current as of today's market session
3. Formatted exactly as requested
4. JSON-only output (no markdown, no explanations)

You have access to stock market data and can provide real-time prices for major stocks and funds.` 
        },
        { role: 'user', content: prompt }
      ],
      temperature: CONFIG.TEMPERATURE.PRICE_CHECK
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Price check API request failed');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('Invalid price API response: No content returned');
  }
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Invalid price response format');
  }

  const parsedData = JSON.parse(jsonMatch[0]);
  
  if (!parsedData || typeof parsedData !== 'object') {
    throw new Error('Invalid price data structure');
  }
  
  return parsedData;
}