/**
 * Stock & Fund Analyzer Pro - Popup Script
 * Main logic for stock analysis, portfolio management, and price alerts
 * @version 2.2.1
 */

const ZAI_API_URL = 'https://api.z.ai/api/coding/paas/v4/chat/completions';
const SYMBOL_REGEX = /^[A-Z]{1,5}$/;

const CONFIG = {
  TEMPERATURE: {
    ANALYSIS: 0.5,
    PRICE_CHECK: 0.2,
    NEWS: 0.6,
    OPTIMIZATION: 0.5
  },
  CACHE_DURATION: 5 * 60 * 1000 // 5 minutes cache
};

let currentSymbol = null;
let debounceTimer = null;
let cachedElements = null;
let analysisCache = new Map();
let newsCache = null;
let newsCacheTime = 0;

/**
 * Gets API key from chrome storage
 * @returns {Promise<string>} API key or placeholder
 */
async function getApiKey() {
  try {
    const result = await chrome.storage.local.get(['apiKey']);
    const apiKey = result.apiKey || 'YOUR_ZAI_API_KEY';
    
    if (apiKey === 'YOUR_ZAI_API_KEY') {
      console.warn('API key is still placeholder. User needs to set actual key.');
    }
    
    return apiKey;
  } catch (error) {
    console.error('Error getting API key:', error);
    return 'YOUR_ZAI_API_KEY';
  }
}

function cacheElements() {
  if (cachedElements) return cachedElements;
  
  cachedElements = {
    symbolName: document.getElementById('symbolName'),
    symbolType: document.getElementById('symbolType'),
    price: document.getElementById('price'),
    change: document.getElementById('change'),
    volume: document.getElementById('volume'),
    marketCap: document.getElementById('marketCap'),
    peRatio: document.getElementById('peRatio'),
    high52w: document.getElementById('high52w'),
    low52w: document.getElementById('low52w'),
    overallScore: document.getElementById('overallScore'),
    growthScore: document.getElementById('growthScore'),
    valueScore: document.getElementById('valueScore'),
    safetyScore: document.getElementById('safetyScore'),
    growthBar: document.getElementById('growthBar'),
    valueBar: document.getElementById('valueBar'),
    safetyBar: document.getElementById('safetyBar'),
    suggestionList: document.getElementById('suggestionList'),
    analysisText: document.getElementById('analysisText'),
    bearTarget: document.getElementById('bearTarget'),
    baseTarget: document.getElementById('baseTarget'),
    bullTarget: document.getElementById('bullTarget'),
    copyReport: document.getElementById('copyReport'),
    exportCSV: document.getElementById('exportCSV'),
    exportJSON: document.getElementById('exportJSON'),
    results: document.getElementById('results'),
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    addToWatchlist: document.getElementById('addToWatchlist')
  };
  
  return cachedElements;
}

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupAnalyze();
  setupQuickSymbols();
  setupWatchlist();
  setupPortfolio();
  setupComparison();
  setupNews();
  setupModals();
  setupCustomPrompt();
  setupExportButtons();
  loadSavedData();
});

function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.add('hidden'));

      btn.classList.add('active');
      document.getElementById(`${btn.dataset.tab}-tab`).classList.remove('hidden');
    });
  });
}

function setupAnalyze() {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const symbolInput = document.getElementById('symbolInput');

  analyzeBtn.addEventListener('click', handleAnalyze);
  symbolInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAnalyze();
  });
}

function setupQuickSymbols() {
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('symbolInput').value = btn.dataset.symbol;
      handleAnalyze();
    });
  });
}

function setupWatchlist() {
  document.getElementById('addToWatchlist').addEventListener('click', () => {
    if (currentSymbol) toggleWatchlist(currentSymbol);
  });

  document.getElementById('setAlert').addEventListener('click', () => {
    if (currentSymbol) showAlertModal(currentSymbol);
  });
}

function setupPortfolio() {
  document.getElementById('addHolding').addEventListener('click', () => {
    document.getElementById('holdingModal').classList.remove('hidden');
  });

  document.getElementById('saveHolding').addEventListener('click', () => saveHolding());
  document.getElementById('cancelHolding').addEventListener('click', () => {
    document.getElementById('holdingModal').classList.add('hidden');
  });
}

function setupComparison() {
  document.getElementById('compareBtn').addEventListener('click', handleComparison);
}

function setupNews() {
  loadMarketNews();
}

function setupModals() {
  document.getElementById('saveAlert').addEventListener('click', saveAlert);
  document.getElementById('cancelAlert').addEventListener('click', () => {
    document.getElementById('alertModal').classList.add('hidden');
  });
}

function setupComparison() {
  document.getElementById('compareBtn').addEventListener('click', handleComparison);
}

function setupNews() {
  loadMarketNews();
}

function setupModals() {
  document.getElementById('saveAlert').addEventListener('click', saveAlert);
  document.getElementById('cancelAlert').addEventListener('click', () => {
    document.getElementById('alertModal').classList.add('hidden');
  });
}

function setupExportButtons() {
  document.getElementById('copyReport').addEventListener('click', copyReportToClipboard);
  document.getElementById('exportCSV').addEventListener('click', exportToCSV);
  document.getElementById('exportJSON').addEventListener('click', exportToJSON);
}

function setupPortfolio() {
  document.getElementById('addHolding').addEventListener('click', () => {
    document.getElementById('holdingModal').classList.remove('hidden');
  });

  document.getElementById('saveHolding').addEventListener('click', () => saveHolding());
  document.getElementById('cancelHolding').addEventListener('click', () => {
    document.getElementById('holdingModal').classList.add('hidden');
  });
}

function setupComparison() {
  document.getElementById('compareBtn').addEventListener('click', handleComparison);
}

function setupNews() {
  loadMarketNews();
}

function setupModals() {
  document.getElementById('saveAlert').addEventListener('click', saveAlert);
  document.getElementById('cancelAlert').addEventListener('click', () => {
    document.getElementById('alertModal').classList.add('hidden');
  });
}

function setupCustomPrompt() {
  const toggleBtn = document.getElementById('togglePrompt');
  const promptContainer = document.getElementById('promptContainer');
  const optimizeBtn = document.getElementById('optimizePrompt');
  const clearBtn = document.getElementById('clearPrompt');
  const acceptBtn = document.getElementById('acceptOptimized');
  const rejectBtn = document.getElementById('rejectOptimized');
  const customPrompt = document.getElementById('customPrompt');

  toggleBtn.addEventListener('click', () => {
    if (promptContainer.classList.contains('hidden')) {
      promptContainer.classList.remove('hidden');
      toggleBtn.textContent = '- Hide';
    } else {
      promptContainer.classList.add('hidden');
      toggleBtn.textContent = '+ Add';
    }
  });

  optimizeBtn.addEventListener('click', async () => {
    const promptText = customPrompt.value.trim();
    if (!promptText) {
      showError('Please enter a prompt to optimize');
      return;
    }
    
    await optimizeUserPrompt(promptText);
  });

  clearBtn.addEventListener('click', () => {
    customPrompt.value = '';
    hideOptimizedPrompt();
  });

  acceptBtn.addEventListener('click', () => {
    const optimizedText = document.getElementById('optimizedPrompt').textContent;
    customPrompt.value = optimizedText;
    hideOptimizedPrompt();
  });

  rejectBtn.addEventListener('click', () => {
    hideOptimizedPrompt();
  });

  document.querySelectorAll('.prompt-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const currentText = customPrompt.value.trim();
      const newText = tag.dataset.text;
      
      if (currentText) {
        customPrompt.value = currentText + '; ' + newText;
      } else {
        customPrompt.value = newText;
      }
    });
  });
}

async function optimizeUserPrompt(userPrompt) {
  const optimizeBtn = document.getElementById('optimizePrompt');
  const optimizedContainer = document.getElementById('optimizedPromptContainer');
  const optimizedText = document.getElementById('optimizedPrompt');
  const explanationText = document.getElementById('optimizationExplanation');

  optimizeBtn.disabled = true;
  optimizeBtn.textContent = '✨ Optimizing...';

  try {
    const optimized = await getOptimizedPrompt(userPrompt);
    
    optimizedText.textContent = optimized.prompt;
    explanationText.innerHTML = `
      <strong>Why this works better:</strong> ${sanitizeHtml(optimized.explanation)}
    `;
    
    optimizedContainer.classList.remove('hidden');
  } catch (error) {
    console.error('Prompt optimization error:', error);
    showError('Failed to optimize prompt. Please try again.');
  } finally {
    optimizeBtn.disabled = false;
    optimizeBtn.textContent = '✨ Optimize Prompt';
  }
}

async function getOptimizedPrompt(userPrompt) {
  const prompt = `You are a prompt engineering expert specializing in financial analysis prompts.

Your task is to optimize the user's analysis prompt to get better results from an AI financial analyst.

User's current prompt:
"${userPrompt}"

Optimization guidelines:
1. Make it more specific and actionable
2. Add relevant financial context
3. Focus on what matters most (metrics, risk, opportunities)
4. Use professional financial terminology
5. Make it clear and concise
6. Ensure it can be effectively applied to stock/fund analysis

Return ONLY valid JSON:
{
  "prompt": "The optimized version of the user's prompt",
  "explanation": "Brief explanation (1-2 sentences) of why this optimized prompt will produce better results"
}

Example transformation:
Input: "look at dividends"
Output: "Analyze the dividend history, yield, and sustainability. Evaluate payout ratio and dividend growth rate over the past 5 years. Assess dividend safety and future growth potential."`;

  const apiKey = await getApiKey();
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
          content: 'You are an expert in prompt engineering for financial analysis. You transform vague prompts into precise, actionable analysis requests that produce high-quality financial insights.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: CONFIG.TEMPERATURE.OPTIMIZATION
    })
  });

  if (!response.ok) {
    throw new Error('Optimization API request failed');
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Invalid optimization response format');
  }

  return JSON.parse(jsonMatch[0]);
}

function hideOptimizedPrompt() {
  const optimizedContainer = document.getElementById('optimizedPromptContainer');
  optimizedContainer.classList.add('hidden');
}

/**
 * Analyzes a stock or fund symbol
 * @param {string} symbol - Stock/fund symbol (e.g., AAPL)
 * @returns {Promise<void>}
 */
async function handleAnalyze() {
  const symbol = document.getElementById('symbolInput').value.trim().toUpperCase();

  if (!symbol) {
    showError('Please enter a stock or fund symbol');
    return;
  }

  if (!SYMBOL_REGEX.test(symbol)) {
    showError('Invalid symbol format. Use 1-5 letters only (e.g., AAPL).');
    return;
  }

  currentSymbol = symbol;
  showLoading(true);
  hideError();

  try {
    const analysis = await analyzeWithAI(symbol);
    
    if (!analysis || typeof analysis !== 'object') {
      throw new Error('Invalid analysis data received');
    }
    
    displayResults(symbol, analysis);
    updateWatchlistButton(symbol);
  } catch (error) {
    console.error('Analysis error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    if (error.message.includes('API') || error.message.includes('fetch')) {
      showError('Unable to connect to analysis service. Please check your API key and try again.');
    } else if (error.message.includes('Invalid') || error.message.includes('format')) {
      showError('Received invalid data from analysis service.');
    } else {
      showError(`Analysis failed: ${error.message}`);
    }
  } finally {
    showLoading(false);
  }
}

/**
 * Performs AI analysis of a stock/fund symbol
 * @param {string} symbol - Stock/fund symbol
 * @returns {Promise<Object>} Analysis data with metrics, scores, and suggestions
 * @throws {Error} If API request fails or returns invalid data
 */
async function analyzeWithAI(symbol) {
  const currentDate = new Date().toISOString().split('T')[0];
  const customPrompt = document.getElementById('customPrompt').value.trim();
  const apiKey = await getApiKey();
  
  let customFocus = '';
  if (customPrompt) {
    customFocus = `

CUSTOM ANALYSIS FOCUS:
The user has requested specific focus areas for this analysis:
"${customPrompt}"

Please prioritize these aspects in your:
1. Suggestions - make them relevant to the custom focus
2. Analysis summary - address the specific concerns mentioned
3. Scores - weight scores according to the focus area
`;
  }
  
  const prompt = `You are a senior financial analyst. Analyze ${symbol} thoroughly and provide the following data:

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no explanations outside JSON.

{
  "type": "stock|fund|etf",
  "name": "Complete company/fund name",
  "exchange": "NASDAQ/NYSE/Other",
  "sector": "Technology/Healthcare/Finance/Consumer/Energy/etc",
  "price": "Current price with $ sign (e.g., $185.92)",
  "change": "Daily change % with sign (e.g., +2.34% or -1.15%)",
  "volume": "Volume with format (e.g., 45.2M or 1.5B)",
  "marketCap": "Market cap with format (e.g., $2.5T or $850B)",
  "peRatio": "P/E ratio (e.g., 28.5)",
  "high52w": "52-week high with $ (e.g., $198.50)",
  "low52w": "52-week low with $ (e.g., $145.20)",
  "dividendYield": "Dividend yield % or N/A",
  "beta": "Beta value (e.g., 1.25)",
  "analystRating": "Buy/Hold/Sell with firm name (e.g., 'Buy - Goldman Sachs')",
  "priceTarget": "Analyst 12-month price target",
  "expenseRatio": "Expense ratio % (for ETFs/funds)",
  "topHoldings": "Top 5 holdings (comma-separated)",
  "etfType": "Type of ETF (e.g., 'Equity', 'Bond', 'Commodity', 'International')",
  "overallScore": 0-100,
  "growthScore": 0-100,
  "valueScore": 0-100,
  "safetyScore": 0-100,
  "suggestions": [
    {"text": "Specific actionable insight", "sentiment": "positive|negative|neutral", "category": "entry|exit|hold|risk|opportunity"},
    {"text": "Another specific insight", "sentiment": "positive|negative|neutral", "category": "entry|exit|hold|risk|opportunity"},
    {"text": "Third specific insight", "sentiment": "positive|negative|neutral", "category": "entry|exit|hold|risk|opportunity"}
  ],
  "analysis": "2-3 sentences covering recent performance, current trend, and key drivers. Be specific with numbers if possible.",
  "bearTarget": "Price with $ (e.g., $165)",
  "baseTarget": "Price with $ (e.g., $195)",
  "bullTarget": "Price with $ (e.g., $230)"
}

REQUIREMENTS:
- Use REAL market data as of ${currentDate}
- Scores should be justified by fundamentals and technicals
- Suggestions must be specific and actionable
- Price targets should have 20-30% range from current price
- If ${symbol} is an ETF, include expense ratio and top holdings
- Include Wall Street analyst ratings and price targets when available
- If ${symbol} is not a real ticker, analyze it as a hypothetical stock and mark type as "stock"
${customFocus}

Return ONLY the JSON object.`;

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
          content: `You are a Wall Street senior financial analyst with 20+ years experience. You have access to current market data and specialize in:
- Fundamental analysis (P/E, growth rates, earnings)
- Technical analysis (trends, support/resistance, momentum)
- Risk assessment (beta, volatility, sector exposure)
- Investment recommendations (entry/exit points, portfolio fit)

ANALYSIS GUIDELINES:
1. Provide accurate, real market data
2. Use specific numbers and percentages
3. Score based on: fundamentals (40%), technicals (30%), sentiment (30%)
4. Give actionable suggestions with clear reasoning
5. Price targets: Bear (downside risk), Base (expected), Bull (optimistic)
6. Be objective - acknowledge both risks and opportunities
7. Return ONLY valid JSON, no formatting
8. When custom focus is provided, prioritize those aspects in analysis

Current date: ${currentDate}`
        },
        { role: 'user', content: prompt }
      ],
      temperature: CONFIG.TEMPERATURE.ANALYSIS
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'AI API request failed';
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error?.message || errorMessage;
    } catch (e) {
      errorMessage = errorText || errorMessage;
    }
    
    console.error('API Error Response:', errorMessage);
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('Invalid API response: No content returned');
  }
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Invalid AI response format');
  }

  const parsedData = JSON.parse(jsonMatch[0]);
  
  if (!parsedData || typeof parsedData !== 'object') {
    throw new Error('Invalid parsed data structure');
  }
  
  return parsedData;
}

/**
 * Sanitizes HTML to prevent XSS attacks
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
function sanitizeHtml(html) {
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
}

/**
 * Displays analysis results in the UI
 * @param {string} symbol - Stock/fund symbol
 * @param {Object} data - Analysis data
 */
function displayResults(symbol, data) {
  if (!data || typeof data !== 'object') {
    showError('Invalid analysis data');
    return;
  }

  currentAnalysisData = data;
  currentSymbol = symbol;

  const elements = cacheElements();
  
  elements.symbolName.textContent = data.name || symbol;
  
  const typeBadge = elements.symbolType;
  typeBadge.textContent = data.type || 'Unknown';
  typeBadge.className = `badge ${data.type}`;

  elements.price.textContent = data.price || 'N/A';
  elements.change.textContent = data.change || 'N/A';
  elements.volume.textContent = data.volume || 'N/A';
  elements.marketCap.textContent = data.marketCap || 'N/A';
  elements.peRatio.textContent = data.peRatio || 'N/A';
  elements.high52w.textContent = data.high52w || 'N/A';
  elements.low52w.textContent = data.low52w || 'N/A';

  // Display additional fields
  if (data.analystRating) {
    let analystDiv = elements.results.querySelector('.analyst-rating');
    if (!analystDiv) {
      const suggestionsSection = elements.results.querySelector('.suggestions');
      if (suggestionsSection) {
        analystDiv = document.createElement('div');
        analystDiv.className = 'analyst-rating';
        analystDiv.innerHTML = `
          <h3>📊 Analyst Rating</h3>
          <div class="rating-badge">${data.analystRating}</div>
        `;
        suggestionsSection.parentNode.insertBefore(analystDiv, suggestionsSection);
      }
    }
  }

  if (data.priceTarget) {
    let targetDiv = elements.results.querySelector('.price-target');
    if (!targetDiv) {
      const suggestionsSection = elements.results.querySelector('.suggestions');
      if (suggestionsSection) {
        targetDiv = document.createElement('div');
        targetDiv.className = 'price-target';
        targetDiv.innerHTML = `
          <h3>🎯 Analyst Target</h3>
          <div class="target-value">${data.priceTarget}</div>
        `;
        suggestionsSection.parentNode.insertBefore(targetDiv, suggestionsSection);
      }
    }
  }

  if (data.expenseRatio || data.topHoldings) {
    let etfDiv = elements.results.querySelector('.etf-info');
    if (!etfDiv && (data.type === 'etf' || data.type === 'fund')) {
      const targetsSection = elements.results.querySelector('.targets');
      if (targetsSection) {
        etfDiv = document.createElement('div');
        etfDiv.className = 'etf-info';
        etfDiv.innerHTML = `
          <h3>📈 ETF/Fund Info</h3>
          <div class="etf-details">
            ${data.expenseRatio ? `<div class="etf-detail"><span class="label">Expense Ratio:</span><span class="value">${data.expenseRatio}</span></div>` : ''}
            ${data.topHoldings ? `<div class="etf-detail"><span class="label">Top Holdings:</span><span class="value">${data.topHoldings}</span></div>` : ''}
            ${data.etfType ? `<div class="etf-detail"><span class="label">Type:</span><span class="value">${data.etfType}</span></div>` : ''}
          </div>
        `;
        targetsSection.parentNode.insertBefore(etfDiv, targetsSection);
      }
    }
  }

  elements.overallScore.textContent = data.overallScore || '--';
  elements.growthScore.textContent = data.growthScore || '--';
  elements.valueScore.textContent = data.valueScore || '--';
  elements.safetyScore.textContent = data.safetyScore || '--';

  elements.growthBar.style.width = `${data.growthScore || 0}%`;
  elements.valueBar.style.width = `${data.valueScore || 0}%`;
  elements.safetyBar.style.width = `${data.safetyScore || 0}%`;

  elements.suggestionList.innerHTML = '';

  if (data.suggestions && Array.isArray(data.suggestions)) {
    data.suggestions.forEach(suggestion => {
      const div = document.createElement('div');
      div.className = `suggestion-item ${suggestion.sentiment || 'neutral'}`;
      const textSpan = document.createElement('span');
      textSpan.textContent = suggestion.text || '';
      div.appendChild(textSpan);
      elements.suggestionList.appendChild(div);
    });
  }

  elements.analysisText.textContent = data.analysis || 'No analysis available.';
  elements.bearTarget.textContent = data.bearTarget || '--';
  elements.baseTarget.textContent = data.baseTarget || '--';
  elements.bullTarget.textContent = data.bullTarget || '--';

  elements.results.classList.remove('hidden');
}

/**
 * Compares two stocks side-by-side
 * @returns {Promise<void>}
 */
async function handleComparison() {
  const symbol1Input = document.getElementById('compare1');
  const symbol2Input = document.getElementById('compare2');
  
  const symbol1 = symbol1Input.value.trim().toUpperCase();
  const symbol2 = symbol2Input.value.trim().toUpperCase();

  if (!symbol1 || !symbol2) {
    showError('Enter two symbols to compare');
    return;
  }

  if (!SYMBOL_REGEX.test(symbol1)) {
    showError('Invalid symbol format for first stock. Use 1-5 letters only.');
    return;
  }

  if (!SYMBOL_REGEX.test(symbol2)) {
    showError('Invalid symbol format for second stock. Use 1-5 letters only.');
    return;
  }

  if (symbol1 === symbol2) {
    showError('Please enter two different symbols to compare');
    return;
  }

  showLoading(true);
  hideError();

  try {
    const [data1, data2] = await Promise.all([
      analyzeWithAI(symbol1),
      analyzeWithAI(symbol2)
    ]);

    if (!data1 || !data2) {
      throw new Error('Invalid comparison data received');
    }

    displayComparison(symbol1, data1, symbol2, data2);
  } catch (error) {
    console.error('Comparison error:', error);
    showError('Comparison failed. Please try again.');
  } finally {
    showLoading(false);
  }
}

/**
 * Displays comparison results between two stocks
 * @param {string} symbol1 - First stock symbol
 * @param {Object} data1 - First stock data
 * @param {string} symbol2 - Second stock symbol
 * @param {Object} data2 - Second stock data
 */
function displayComparison(symbol1, data1, symbol2, data2) {
  document.getElementById('comp1Name').textContent = symbol1;
  document.getElementById('comp2Name').textContent = symbol2;

  const metrics = [
    { label: 'Price', key: 'price', numeric: true },
    { label: 'Change %', key: 'change', numeric: true },
    { label: 'P/E Ratio', key: 'peRatio', numeric: true },
    { label: 'Market Cap', key: 'marketCap', numeric: false },
    { label: 'Growth Score', key: 'growthScore', numeric: true },
    { label: 'Value Score', key: 'valueScore', numeric: true },
    { label: 'Safety Score', key: 'safetyScore', numeric: true },
    { label: 'Overall Score', key: 'overallScore', numeric: true }
  ];

  const tbody = document.getElementById('comparisonBody');
  tbody.innerHTML = '';

  metrics.forEach(metric => {
    const val1 = data1[metric.key] || 'N/A';
    const val2 = data2[metric.key] || 'N/A';

    let winner = '-';
    if (metric.numeric && val1 !== 'N/A' && val2 !== 'N/A') {
      const num1 = parseFloat(val1.replace(/[^0-9.-]/g, ''));
      const num2 = parseFloat(val2.replace(/[^0-9.-]/g, ''));
      if (!isNaN(num1) && !isNaN(num2)) {
        winner = num1 > num2 ? symbol1 : (num2 > num1 ? symbol2 : 'Tie');
      }
    }

    const row = document.createElement('tr');
    
    const tdLabel = document.createElement('td');
    tdLabel.textContent = metric.label;
    
    const tdVal1 = document.createElement('td');
    tdVal1.textContent = val1;
    
    const tdVal2 = document.createElement('td');
    tdVal2.textContent = val2;
    
    const tdWinner = document.createElement('td');
    tdWinner.textContent = winner;
    if (winner === symbol1 || winner === symbol2) {
      tdWinner.className = 'winner';
    }
    
    row.appendChild(tdLabel);
    row.appendChild(tdVal1);
    row.appendChild(tdVal2);
    row.appendChild(tdWinner);
    
    tbody.appendChild(row);
  });

  const winnerCells = tbody.querySelectorAll('td.winner');
  const winnerCount1 = Array.from(winnerCells).filter(td => td.textContent === symbol1).length;
  const winnerCount2 = Array.from(winnerCells).filter(td => td.textContent === symbol2).length;

  const verdict = winnerCount1 > winnerCount2 
    ? `${symbol1} appears stronger with ${winnerCount1} winning metrics vs ${winnerCount2}.`
    : (winnerCount2 > winnerCount1 
      ? `${symbol2} appears stronger with ${winnerCount2} winning metrics vs ${winnerCount1}.`
      : 'Both symbols show comparable strength across metrics.');

  document.getElementById('comparisonVerdict').textContent = verdict;
  document.getElementById('compareResults').classList.remove('hidden');
}

/**
 * Loads market news and displays it with sentiment analysis
 * @returns {Promise<void>}
 */
async function loadMarketNews() {
  const newsList = document.getElementById('newsList');
  newsList.innerHTML = '<p class="empty-state">Loading news...</p>';

  try {
    const news = await fetchMarketNews();
    
    if (!news || !Array.isArray(news)) {
      newsList.innerHTML = '<p class="empty-state">Unable to load news. Please try again.</p>';
      return;
    }
    
    newsList.innerHTML = '';

    news.forEach(item => {
      if (!item || !item.title) return;
      
      const sentiment = analyzeSentiment(item.title, item.summary || '');
      
      const div = document.createElement('div');
      div.className = 'news-item';
      div.setAttribute('data-sentiment', sentiment);
      
      const titleDiv = document.createElement('div');
      titleDiv.className = 'news-title';
      titleDiv.textContent = item.title || '';
      
      const sentimentBadge = document.createElement('span');
      sentimentBadge.className = `sentiment-badge sentiment-${sentiment}`;
      sentimentBadge.textContent = sentiment.toUpperCase();
      
      const sourceDiv = document.createElement('div');
      sourceDiv.className = 'news-source';
      
      const sourceSpan = document.createElement('span');
      sourceSpan.textContent = item.source || 'Unknown';
      
      const timeSpan = document.createElement('span');
      timeSpan.className = 'news-time';
      timeSpan.textContent = item.time || '';
      
      sourceDiv.appendChild(sentimentBadge);
      sourceDiv.appendChild(sourceSpan);
      sourceDiv.appendChild(timeSpan);
      
      div.appendChild(titleDiv);
      div.appendChild(sourceDiv);
      
      const url = item.url;
      if (url && typeof url === 'string') {
        div.addEventListener('click', () => {
          chrome.tabs.create({ url }).catch(err => {
            console.error('Failed to open tab:', err);
          });
        });
      }
      
      newsList.appendChild(div);
    });
    
    if (newsList.children.length === 0) {
      newsList.innerHTML = '<p class="empty-state">No news available at this time.</p>';
    }
  } catch (error) {
    console.error('News loading error:', error);
    newsList.innerHTML = '<p class="empty-state">Unable to load news. Please try again later.</p>';
  }
}

/**
 * Analyzes sentiment of news title and summary
 * @param {string} title - News title
 * @param {string} summary - News summary
 * @returns {string} Sentiment: 'bullish', 'bearish', or 'neutral'
 */
function analyzeSentiment(title, summary) {
  const text = (title + ' ' + summary).toLowerCase();
  
  const bullishWords = ['up', 'rise', 'gain', 'growth', 'beat', 'positive', 'increase', 'rally', 'surge', 'profit', 'strong', 'record', 'outperform', 'upgrade', 'bull', 'buy', 'breakthrough'];
  const bearishWords = ['down', 'fall', 'drop', 'loss', 'decline', 'miss', 'negative', 'decrease', 'plunge', 'slump', 'sell', 'weak', 'cut', 'underperform', 'downgrade', 'bear', 'concern', 'risk', 'warning'];
  
  let bullishCount = 0;
  let bearishCount = 0;
  
  bullishWords.forEach(word => {
    if (text.includes(word)) bullishCount++;
  });
  
  bearishWords.forEach(word => {
    if (text.includes(word)) bearishCount++;
  });
  
  if (bullishCount > bearishCount) return 'bullish';
  if (bearishCount > bullishCount) return 'bearish';
  return 'neutral';
}

/**
 * Fetches market news from AI API with caching
 * @returns {Promise<Array>} Array of news items
 * @throws {Error} If API request fails or returns invalid data
 */
async function fetchMarketNews() {
  const cacheKey = 'news';
  const now = Date.now();
  
  if (newsCache && newsCacheTime && (now - newsCacheTime) < CONFIG.CACHE_DURATION) {
    console.log('Using cached news data');
    return newsCache;
  }
  
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const apiKey = await getApiKey();
  
  const prompt = `Provide 5 of the most important recent stock market news items that investors should know about.

Focus on:
1. Major earnings reports
2. Economic indicators (Fed decisions, inflation data, jobs)
3. Tech industry developments
4. Market-moving events
5. Sector-specific trends

Return ONLY valid JSON array:

[
  {
    "title": "News headline",
    "source": "Bloomberg/Reuters/CNBC/WSJ/etc",
    "time": "Time relative to now (e.g., '2 hours ago', 'Today', 'Yesterday')",
    "url": "https://example.com/article",
    "impact": "high|medium|low",
    "summary": "One sentence summary"
  }
]

News date context: ${today}
Use real recent news when available. If real data not accessible, create highly realistic news based on current market conditions.`;

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
          content: `You are a senior financial journalist working for a major news outlet. Your job is to:
1. Identify the most market-relevant news
2. Write compelling, accurate headlines
3. Provide context on why it matters
4. Be concise and actionable

News items should be:
- Recent (within 24-48 hours when possible)
- Market-moving or significant
- From credible sources
- Clearly explained

Return ONLY valid JSON arrays.` 
        },
        { role: 'user', content: prompt }
      ],
      temperature: CONFIG.TEMPERATURE.NEWS
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'News API request failed');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('Invalid news API response: No content returned');
  }
  
  const jsonMatch = content.match(/\[[\s\S]*\]/);

  if (!jsonMatch) {
    throw new Error('Invalid news response format');
  }

  const parsedNews = JSON.parse(jsonMatch[0]);
  
  if (!Array.isArray(parsedNews)) {
    throw new Error('Invalid news data structure');
  }
  
  newsCache = parsedNews;
  newsCacheTime = now;
  
  return parsedNews;
}

/**
 * Toggles a symbol in the watchlist
 * @param {string} symbol - Stock/fund symbol
 */
function toggleWatchlist(symbol) {
  chrome.storage.local.get(['watchlist'], (result) => {
    let watchlist = result.watchlist || [];

    if (watchlist.includes(symbol)) {
      watchlist = watchlist.filter(s => s !== symbol);
    } else {
      watchlist.push(symbol);
    }

    chrome.storage.local.set({ watchlist });
    updateWatchlistButton(symbol);
  });
}

/**
 * Updates the watchlist button state
 * @param {string} symbol - Stock/fund symbol
 */
function updateWatchlistButton(symbol) {
  const btn = document.getElementById('addToWatchlist');

  chrome.storage.local.get(['watchlist'], (result) => {
    const watchlist = result.watchlist || [];
    if (watchlist.includes(symbol)) {
      btn.classList.add('active');
      btn.textContent = '⭐ Watching';
    } else {
      btn.classList.remove('active');
      btn.textContent = '⭐ Watch';
    }
  });
}

/**
 * Shows the alert configuration modal
 * @param {string} symbol - Stock/fund symbol
 */
function showAlertModal(symbol) {
  document.getElementById('alertSymbol').value = symbol;
  document.getElementById('alertPrice').value = '';
  document.getElementById('alertModal').classList.remove('hidden');
}

/**
 * Saves a price alert
 * @returns {void}
 */
function saveAlert() {
  const symbol = document.getElementById('alertSymbol').value.trim().toUpperCase();
  const priceInput = document.getElementById('alertPrice').value;
  const type = document.getElementById('alertType').value;

  if (!symbol) {
    showError('Invalid symbol for alert');
    return;
  }

  if (!priceInput) {
    showError('Please enter a target price');
    return;
  }

  const price = parseFloat(priceInput);
  if (isNaN(price) || price <= 0) {
    showError('Please enter a valid positive price');
    return;
  }

  chrome.storage.local.get(['alerts'], (result) => {
    const alerts = result.alerts || [];
    alerts.push({ symbol, price, type, created: Date.now() });
    chrome.storage.local.set({ alerts });

    chrome.alarms.create(`alert-${Date.now()}`, {
      periodInMinutes: 60
    });

    document.getElementById('alertModal').classList.add('hidden');
    showError('Alert created successfully!', true);
  });
}

/**
 * Saves a holding to the portfolio
 * @returns {void}
 */
function saveHolding() {
  const symbolInput = document.getElementById('holdingSymbol');
  const sharesInput = document.getElementById('holdingShares');
  const priceInput = document.getElementById('holdingPrice');
  
  const symbol = symbolInput.value.trim().toUpperCase();
  const shares = parseFloat(sharesInput.value);
  const price = parseFloat(priceInput.value);

  if (!symbol) {
    showError('Please enter a stock symbol');
    return;
  }

  if (!SYMBOL_REGEX.test(symbol)) {
    showError('Invalid symbol format. Use 1-5 letters only.');
    return;
  }

  if (!shares || shares <= 0 || isNaN(shares)) {
    showError('Please enter a valid number of shares');
    return;
  }

  if (!price || price <= 0 || isNaN(price)) {
    showError('Please enter a valid buy price');
    return;
  }

  chrome.storage.local.get(['portfolio'], (result) => {
    const portfolio = result.portfolio || [];
    portfolio.push({ symbol, shares, buyPrice: price, added: Date.now() });
    chrome.storage.local.set({ portfolio });

    document.getElementById('holdingModal').classList.add('hidden');
    symbolInput.value = '';
    sharesInput.value = '';
    priceInput.value = '';
    loadPortfolio();
  });
}

/**
 * Loads and displays portfolio holdings
 * @returns {void}
 */
function loadPortfolio() {
  chrome.storage.local.get(['portfolio'], (result) => {
    const portfolio = result.portfolio || [];
    const list = document.getElementById('portfolioList');

    if (!portfolio || portfolio.length === 0) {
      list.innerHTML = '<p class="empty-state">No holdings yet. Add stocks to track!</p>';
      return;
    }

    list.innerHTML = '';
    let totalValue = 0;
    let totalCost = 0;

    portfolio.forEach((holding, index) => {
      if (!holding || typeof holding !== 'object') return;
      
      const currentValue = holding.shares * (holding.currentPrice || holding.buyPrice);
      const cost = holding.shares * (holding.buyPrice || 0);
      const change = cost > 0 ? ((currentValue - cost) / cost * 100).toFixed(2) : '0.00';

      totalValue += currentValue;
      totalCost += cost;

      const div = document.createElement('div');
      div.className = 'holding-item';
      
      const infoDiv = document.createElement('div');
      infoDiv.className = 'holding-info';
      
      const symbolDiv = document.createElement('div');
      symbolDiv.className = 'holding-symbol';
      symbolDiv.textContent = holding.symbol || 'N/A';
      
      const sharesDiv = document.createElement('div');
      sharesDiv.className = 'holding-shares';
      sharesDiv.textContent = `${holding.shares || 0} shares @ $${(holding.buyPrice || 0).toFixed(2)}`;
      
      infoDiv.appendChild(symbolDiv);
      infoDiv.appendChild(sharesDiv);
      
      const valueDiv = document.createElement('div');
      valueDiv.className = 'holding-value';
      
      const priceDiv = document.createElement('div');
      priceDiv.className = 'holding-price';
      priceDiv.textContent = `$${currentValue.toFixed(2)}`;
      
      const changeDiv = document.createElement('div');
      changeDiv.className = `holding-change ${parseFloat(change) >= 0 ? 'positive' : 'negative'}`;
      changeDiv.textContent = `${parseFloat(change) >= 0 ? '+' : ''}${change}%`;
      
      valueDiv.appendChild(priceDiv);
      valueDiv.appendChild(changeDiv);
      
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'holding-actions';
      
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', () => removeHolding(index));
      
      actionsDiv.appendChild(removeBtn);
      
      div.appendChild(infoDiv);
      div.appendChild(valueDiv);
      div.appendChild(actionsDiv);
      
      list.appendChild(div);
    });

    const totalChange = totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100).toFixed(2) : '0.00';
    document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
    document.getElementById('totalChange').textContent = `$${(totalValue - totalCost).toFixed(2)} (${parseFloat(totalChange) >= 0 ? '+' : ''}${totalChange}%)`;
  });
}

/**
 * Removes a holding from the portfolio
 * @param {number} index - Index of holding to remove
 * @returns {void}
 */
function removeHolding(index) {
  chrome.storage.local.get(['portfolio'], (result) => {
    const portfolio = result.portfolio || [];
    if (index >= 0 && index < portfolio.length) {
      portfolio.splice(index, 1);
      chrome.storage.local.set({ portfolio });
      loadPortfolio();
    }
  });
}

/**
 * Loads saved data on initialization
 * @returns {void}
 */
function loadSavedData() {
  loadPortfolio();
}

/**
 * Shows or hides loading state
 * @param {boolean} show - Whether to show loading
 * @returns {void}
 */
function showLoading(show) {
  const elements = cacheElements();
  
  if (show) {
    elements.loading.classList.remove('hidden');
    elements.results.classList.add('hidden');
  } else {
    elements.loading.classList.add('hidden');
  }
}

/**
 * Displays an error message
 * @param {string} message - Error message to display
 * @param {boolean} isSuccess - If true, shows success message
 * @returns {void}
 */
function showError(message, isSuccess = false) {
  const elements = cacheElements();
  elements.error.textContent = message;
  elements.error.classList.remove('hidden');
  
  if (isSuccess) {
    elements.error.style.background = 'rgba(34, 197, 94, 0.1)';
    elements.error.style.borderColor = 'rgba(34, 197, 94, 0.2)';
    elements.error.style.color = '#86efac';
  } else {
    elements.error.style.background = 'rgba(239, 68, 68, 0.1)';
    elements.error.style.borderColor = 'rgba(239, 68, 68, 0.2)';
    elements.error.style.color = '#fca5a5';
  }
  
  elements.results.classList.add('hidden');
  
  if (isSuccess) {
    setTimeout(() => {
      elements.error.classList.add('hidden');
    }, 3000);
  }
}

let currentAnalysisData = null;

/**
 * Copies current analysis report to clipboard
 * @returns {void}
 */
function copyReportToClipboard() {
  if (!currentAnalysisData || !currentSymbol) {
    showError('No analysis data to export');
    return;
  }

  const data = currentAnalysisData;
  const report = `
Stock & Fund Analyzer Pro - Analysis Report
===============================================

${data.name || currentSymbol} (${data.type || 'Unknown'})
Generated: ${new Date().toLocaleString()}

MARKET DATA
-----------
Price: ${data.price || 'N/A'}
Change: ${data.change || 'N/A'}
Volume: ${data.price || 'N/A'}
Market Cap: ${data.marketCap || 'N/A'}
P/E Ratio: ${data.peRatio || 'N/A'}
52W High: ${data.high52w || 'N/A'}
52W Low: ${data.low52w || 'N/A'}
Dividend Yield: ${data.dividendYield || 'N/A'}
Beta: ${data.beta || 'N/A'}

SCORES
------
Overall: ${data.overallScore || '--'}/100
Growth: ${data.growthScore || '--'}/100
Value: ${data.valueScore || '--'}/100
Safety: ${data.safetyScore || '--'}/100

PRICE TARGETS
-------------
Bear Case: ${data.bearTarget || '--'}
Base Case: ${data.baseTarget || '--'}
Bull Case: ${data.bullTarget || '--'}

AI SUGGESTIONS
--------------
${data.suggestions && data.suggestions.length > 0 
  ? data.suggestions.map((s, i) => `${i + 1}. ${s.text} (${s.sentiment})`).join('\n')
  : 'No suggestions available'}

ANALYSIS
--------
${data.analysis || 'No analysis available.'}

===============================================
Generated by Stock & Fund Analyzer Pro
https://github.com/Shivam-20/chromeExt
`.trim();

  navigator.clipboard.writeText(report).then(() => {
    showError('Report copied to clipboard!', true);
  }).catch(() => {
    showError('Failed to copy report');
  });
}

/**
 * Exports current analysis to CSV format
 * @returns {void}
 */
function exportToCSV() {
  if (!currentAnalysisData || !currentSymbol) {
    showError('No analysis data to export');
    return;
  }

  const data = currentAnalysisData;
  const csv = [
    'Symbol,Name,Type,Price,Change,Volume,Market Cap,P/E Ratio,52W High,52W Low,Dividend Yield,Beta,Overall Score,Growth Score,Value Score,Safety Score,Bear Target,Base Target,Bull Target,Analysis',
    [
      currentSymbol,
      `"${(data.name || '').replace(/"/g, '""')}"`,
      data.type || '',
      data.price || '',
      data.change || '',
      data.volume || '',
      data.marketCap || '',
      data.peRatio || '',
      data.high52w || '',
      data.low52w || '',
      data.dividendYield || '',
      data.beta || '',
      data.overallScore || '',
      data.growthScore || '',
      data.valueScore || '',
      data.safetyScore || '',
      data.bearTarget || '',
      data.baseTarget || '',
      data.bullTarget || '',
      `"${(data.analysis || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ].join(',')
  ].join('\n');

  downloadFile(csv, `${currentSymbol}_analysis.csv`, 'text/csv');
  showError('CSV exported successfully!', true);
}

/**
 * Exports current analysis to JSON format
 * @returns {void}
 */
function exportToJSON() {
  if (!currentAnalysisData || !currentSymbol) {
    showError('No analysis data to export');
    return;
  }

  const exportData = {
    symbol: currentSymbol,
    name: currentAnalysisData.name,
    type: currentAnalysisData.type,
    analysis: {
      price: currentAnalysisData.price,
      change: currentAnalysisData.change,
      volume: currentAnalysisData.volume,
      marketCap: currentAnalysisData.marketCap,
      peRatio: currentAnalysisData.peRatio,
      high52w: currentAnalysisData.high52w,
      low52w: currentAnalysisData.low52w,
      dividendYield: currentAnalysisData.dividendYield,
      beta: currentAnalysisData.beta
    },
    scores: {
      overall: currentAnalysisData.overallScore,
      growth: currentAnalysisData.growthScore,
      value: currentAnalysisData.valueScore,
      safety: currentAnalysisData.safetyScore
    },
    targets: {
      bear: currentAnalysisData.bearTarget,
      base: currentAnalysisData.baseTarget,
      bull: currentAnalysisData.bullTarget
    },
    suggestions: currentAnalysisData.suggestions,
    analysis: currentAnalysisData.analysis,
    generatedAt: new Date().toISOString()
  };

  downloadFile(JSON.stringify(exportData, null, 2), `${currentSymbol}_analysis.json`, 'application/json');
  showError('JSON exported successfully!', true);
}

/**
 * Downloads a file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 * @returns {void}
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Hides error message
 * @returns {void}
 */
function hideError() {
  const elements = cacheElements();
  elements.error.classList.add('hidden');
}