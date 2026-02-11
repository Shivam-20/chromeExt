const ZAI_API_URL = 'https://api.z.ai/api/coding/paas/v4/chat/completions';

const CONFIG = {
  ALERT_CHECK_INTERVAL: 30,
  TEMPERATURE: {
    PRICE_CHECK: 0.2
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    BASE_DELAY: 1000,
    MAX_DELAY: 10000,
    BACKOFF_MULTIPLIER: 2
  },
  RATE_LIMIT: {
    WINDOW_MS: 60000,
    MAX_REQUESTS: 10
  },
  CACHE_DURATION: 5 * 60 * 1000 // 5 minutes cache
};

let requestTimestamps = [];
let priceCache = new Map();

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Rate limiting helper
 */
function canMakeRequest() {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter(
    timestamp => now - timestamp < CONFIG.RATE_LIMIT.WINDOW_MS
  );
  return requestTimestamps.length < CONFIG.RATE_LIMIT.MAX_REQUESTS;
}

function recordRequest() {
  requestTimestamps.push(Date.now());
}

function getTimeUntilNextRequest() {
  const now = Date.now();
  const windowStart = now - CONFIG.RATE_LIMIT.WINDOW_MS;

  if (requestTimestamps.length === 0) return 0;

  const oldestInWindow = requestTimestamps.find(ts => ts > windowStart);
  if (!oldestInWindow) return 0;

  return oldestInWindow + CONFIG.RATE_LIMIT.WINDOW_MS - now;
}

/**
 * Retry wrapper with exponential backoff
 */
async function retryWithBackoff(fn, operation = 'operation') {
  let lastError;

  for (let attempt = 1; attempt <= CONFIG.RETRY.MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!error.message?.toLowerCase().includes('rate limit') &&
          !error.message?.toLowerCase().includes('429')) {
        throw error;
      }

      if (attempt < CONFIG.RETRY.MAX_ATTEMPTS) {
        const delay = Math.min(
          CONFIG.RETRY.BASE_DELAY * Math.pow(CONFIG.RETRY.BACKOFF_MULTIPLIER, attempt - 1),
          CONFIG.RETRY.MAX_DELAY
        );

        console.warn(`Background: ${operation} failed (attempt ${attempt}/${CONFIG.RETRY.MAX_ATTEMPTS}), retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Gets API key from chrome storage
 * @returns {Promise<string>} API key
 */
async function getApiKey() {
  try {
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(['apiKey'], resolve);
    });
    
    const apiKey = result.apiKey || 'YOUR_ZAI_API_KEY';
    
    if (apiKey === 'YOUR_ZAI_API_KEY') {
      console.warn('Background: API key is still placeholder');
    }
    
    return apiKey;
  } catch (error) {
    console.error('Background: Error getting API key:', error);
    return 'YOUR_ZAI_API_KEY';
  }
}

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
    let rateLimitHit = false;

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
        console.error('Background: Error checking alert for', alert.symbol, error);

        // If rate limit is hit, stop checking more alerts
        if (error.message?.toLowerCase().includes('rate limit')) {
          rateLimitHit = true;
          console.warn('Background: Rate limit hit, stopping alert checks');
          break;
        }
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

      // Remove triggered alerts
      chrome.storage.local.set({
        alerts: alerts.filter(a => !triggeredAlerts.find(t => t.symbol === a.symbol && t.price === a.price))
      });
    }

    if (rateLimitHit) {
      console.warn('Background: Some alerts were not checked due to rate limiting');
    }
  } catch (error) {
    console.error('Background: Error checking price alerts:', error);
  }
}

/**
 * Gets current price for a symbol with caching and retry logic
 * @param {string} symbol - Stock/fund symbol
 * @returns {Promise<Object>} Price data
 * @throws {Error} If API request fails
 */
async function getSymbolPrice(symbol) {
  // Check cache first
  const cachedItem = priceCache.get(symbol);
  if (cachedItem && (Date.now() - cachedItem.timestamp < CONFIG.CACHE_DURATION)) {
    console.log(`Background: Using cached price for ${symbol}`);
    return cachedItem.data;
  }

  return retryWithBackoff(async () => {
    // Wait if rate limited
    while (!canMakeRequest()) {
      const waitTime = getTimeUntilNextRequest();
      console.log(`Background: Rate limit reached. Waiting ${Math.round(waitTime / 1000)}s...`);
      await sleep(waitTime);
    }

    recordRequest();

    const result = await new Promise((resolve) => {
      chrome.storage.local.get(['apiKey'], resolve);
    });

    const apiKey = result.apiKey;

    const prompt = `You need to get the CURRENT real-time market price for ${symbol} (Indian stock/mutual fund).

Return ONLY valid JSON:
{
  "price": "Current price in ₹ (e.g., ₹2,456.75)",
  "change": "Daily change % with sign (e.g., +2.34% or -1.15%)"
}

IMPORTANT:
- Use the most recent Indian market data available from NSE/BSE
- Price must be in Indian Rupees (₹)
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
        model: 'glm-4.7',
        messages: [
          {
            role: 'system',
            content: `You are a real-time Indian market data provider for NSE/BSE. Your responses must be:
1. 100% accurate to the best of your knowledge
2. Current as of today's market session (IST)
3. All prices in Indian Rupees (₹)
4. Formatted exactly as requested
5. JSON-only output (no markdown, no explanations)

You have access to Indian stock market data and can provide real-time prices for major stocks, mutual funds, and ETFs.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: CONFIG.TEMPERATURE.PRICE_CHECK
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || errorData.message || 'Price check API request failed';

      if (response.status === 429 || errorMessage.toLowerCase().includes('rate limit')) {
        throw new Error('Rate limit reached for requests');
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    const message = data.choices[0]?.message;

    const content = message?.content || message?.reasoning_content;

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

    // Cache the result
    priceCache.set(symbol, {
      data: parsedData,
      timestamp: Date.now()
    });

    return parsedData;
  }, `Get price for ${symbol}`);
}