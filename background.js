chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'quickAnalyze') {
    getSymbolPrice(request.symbol).then(data => {
      sendResponse({ data });
    }).catch(error => {
      sendResponse({ error: error.message });
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
  chrome.alarms.create('checkAlerts', { periodInMinutes: 30 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkAlerts') {
    checkPriceAlerts();
  }
});

async function checkPriceAlerts() {
  chrome.storage.local.get(['alerts'], async (result) => {
    const alerts = result.alerts || [];
    const triggeredAlerts = [];

    for (const alert of alerts) {
      try {
        const analysis = await getSymbolPrice(alert.symbol);
        const currentPrice = parseFloat(analysis.price);

        if ((alert.type === 'above' && currentPrice >= alert.price) ||
            (alert.type === 'below' && currentPrice <= alert.price)) {
          triggeredAlerts.push({ ...alert, currentPrice });
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
  });
}

async function getSymbolPrice(symbol) {
  const ZAI_API_KEY = 'YOUR_ZAI_API_KEY';
  const ZAI_API_URL = 'https://api.z.ai/v1/chat/completions';

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
      'Authorization': `Bearer ${ZAI_API_KEY}`
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
      temperature: 0.2
    })
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);

  return jsonMatch ? JSON.parse(jsonMatch[0]) : { price: '0', change: '0%' };
}