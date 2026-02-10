const ZAI_API_KEY = 'YOUR_ZAI_API_KEY';
const ZAI_API_URL = 'https://api.z.ai/v1/chat/completions';

let currentSymbol = null;

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
      alert('Please enter a prompt to optimize');
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
      <strong>Why this works better:</strong> ${optimized.explanation}
    `;
    
    optimizedContainer.classList.remove('hidden');
  } catch (error) {
    alert('Failed to optimize prompt: ' + error.message);
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
          content: 'You are an expert in prompt engineering for financial analysis. You transform vague prompts into precise, actionable analysis requests that produce high-quality financial insights.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5
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

async function handleAnalyze() {
  const symbol = document.getElementById('symbolInput').value.trim().toUpperCase();

  if (!symbol) {
    showError('Please enter a stock or fund symbol');
    return;
  }

  currentSymbol = symbol;
  showLoading(true);
  hideError();

  try {
    const analysis = await analyzeWithAI(symbol);
    displayResults(symbol, analysis);
    updateWatchlistButton(symbol);
  } catch (error) {
    showError('Analysis failed: ' + error.message);
  } finally {
    showLoading(false);
  }
}

async function analyzeWithAI(symbol) {
  const currentDate = new Date().toISOString().split('T')[0];
  const customPrompt = document.getElementById('customPrompt').value.trim();
  
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
- If ${symbol} is not a real ticker, analyze it as a hypothetical stock and mark type as "stock"
${customFocus}

Return ONLY the JSON object.`;

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
      temperature: 0.5
    })
  });

  if (!response.ok) throw new Error('AI API request failed');

  const data = await response.json();
  const content = data.choices[0].message.content;
  const jsonMatch = content.match(/\{[\s\S]*\}/);

  if (!jsonMatch) throw new Error('Invalid AI response format');

  return JSON.parse(jsonMatch[0]);
}

function displayResults(symbol, data) {
  document.getElementById('symbolName').textContent = data.name || symbol;
  
  const typeBadge = document.getElementById('symbolType');
  typeBadge.textContent = data.type || 'Unknown';
  typeBadge.className = `badge ${data.type}`;

  document.getElementById('price').textContent = data.price || 'N/A';
  document.getElementById('change').textContent = data.change || 'N/A';
  document.getElementById('volume').textContent = data.volume || 'N/A';
  document.getElementById('marketCap').textContent = data.marketCap || 'N/A';
  document.getElementById('peRatio').textContent = data.peRatio || 'N/A';
  document.getElementById('high52w').textContent = data.high52w || 'N/A';
  document.getElementById('low52w').textContent = data.low52w || 'N/A';

  document.getElementById('overallScore').textContent = data.overallScore || '--';
  document.getElementById('growthScore').textContent = data.growthScore || '--';
  document.getElementById('valueScore').textContent = data.valueScore || '--';
  document.getElementById('safetyScore').textContent = data.safetyScore || '--';

  document.getElementById('growthBar').style.width = `${data.growthScore || 0}%`;
  document.getElementById('valueBar').style.width = `${data.valueScore || 0}%`;
  document.getElementById('safetyBar').style.width = `${data.safetyScore || 0}%`;

  const suggestionList = document.getElementById('suggestionList');
  suggestionList.innerHTML = '';

  if (data.suggestions) {
    data.suggestions.forEach(suggestion => {
      const div = document.createElement('div');
      div.className = `suggestion-item ${suggestion.sentiment || 'neutral'}`;
      div.innerHTML = `<span>${suggestion.text}</span>`;
      suggestionList.appendChild(div);
    });
  }

  document.getElementById('analysisText').textContent = data.analysis || 'No analysis available.';
  document.getElementById('bearTarget').textContent = data.bearTarget || '--';
  document.getElementById('baseTarget').textContent = data.baseTarget || '--';
  document.getElementById('bullTarget').textContent = data.bullTarget || '--';

  document.getElementById('results').classList.remove('hidden');
}

async function handleComparison() {
  const symbol1 = document.getElementById('compare1').value.trim().toUpperCase();
  const symbol2 = document.getElementById('compare2').value.trim().toUpperCase();

  if (!symbol1 || !symbol2) {
    showError('Enter two symbols to compare');
    return;
  }

  showLoading(true);
  hideError();

  try {
    const [data1, data2] = await Promise.all([
      analyzeWithAI(symbol1),
      analyzeWithAI(symbol2)
    ]);

    displayComparison(symbol1, data1, symbol2, data2);
  } catch (error) {
    showError('Comparison failed: ' + error.message);
  } finally {
    showLoading(false);
  }
}

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
      const num1 = parseFloat(val1);
      const num2 = parseFloat(val2);
      winner = num1 > num2 ? symbol1 : (num2 > num1 ? symbol2 : 'Tie');
    }

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${metric.label}</td>
      <td>${val1}</td>
      <td>${val2}</td>
      <td class="${winner === symbol1 ? 'winner' : (winner === symbol2 ? 'winner' : '')}">${winner}</td>
    `;
    tbody.appendChild(row);
  });

  const winnerCount1 = Array.from(tbody.querySelectorAll('td.winner')).filter(td => td.textContent === symbol1).length;
  const winnerCount2 = Array.from(tbody.querySelectorAll('td.winner')).filter(td => td.textContent === symbol2).length;

  const verdict = winnerCount1 > winnerCount2 
    ? `${symbol1} appears stronger with ${winnerCount1} winning metrics vs ${winnerCount2}.`
    : (winnerCount2 > winnerCount1 
      ? `${symbol2} appears stronger with ${winnerCount2} winning metrics vs ${winnerCount1}.`
      : 'Both symbols show comparable strength across metrics.');

  document.getElementById('comparisonVerdict').textContent = verdict;
  document.getElementById('compareResults').classList.remove('hidden');
}

async function loadMarketNews() {
  const newsList = document.getElementById('newsList');
  newsList.innerHTML = '<p class="empty-state">Loading news...</p>';

  try {
    const news = await fetchMarketNews();
    newsList.innerHTML = '';

    news.forEach(item => {
      const div = document.createElement('div');
      div.className = 'news-item';
      div.innerHTML = `
        <div class="news-title">${item.title}</div>
        <div class="news-source">
          <span>${item.source}</span>
          <span class="news-time">${item.time}</span>
        </div>
      `;
      div.addEventListener('click', () => chrome.tabs.create({ url: item.url }));
      newsList.appendChild(div);
    });
  } catch (error) {
    newsList.innerHTML = '<p class="empty-state">Unable to load news</p>';
  }
}

async function fetchMarketNews() {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
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
      'Authorization': `Bearer ${ZAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
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
      temperature: 0.6
    })
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  const jsonMatch = content.match(/\[[\s\S]*\]/);

  return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
}

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

function showAlertModal(symbol) {
  document.getElementById('alertSymbol').value = symbol;
  document.getElementById('alertPrice').value = '';
  document.getElementById('alertModal').classList.remove('hidden');
}

function saveAlert() {
  const symbol = document.getElementById('alertSymbol').value;
  const price = document.getElementById('alertPrice').value;
  const type = document.getElementById('alertType').value;

  if (!price) {
    alert('Please enter a target price');
    return;
  }

  chrome.storage.local.get(['alerts'], (result) => {
    const alerts = result.alerts || [];
    alerts.push({ symbol, price: parseFloat(price), type, created: Date.now() });
    chrome.storage.local.set({ alerts });

    chrome.alarms.create(`alert-${Date.now()}`, {
      periodInMinutes: 60
    });

    document.getElementById('alertModal').classList.add('hidden');
    alert('Alert created successfully!');
  });
}

function saveHolding() {
  const symbol = document.getElementById('holdingSymbol').value.trim().toUpperCase();
  const shares = parseFloat(document.getElementById('holdingShares').value);
  const price = parseFloat(document.getElementById('holdingPrice').value);

  if (!symbol || !shares || !price) {
    alert('Please fill all fields');
    return;
  }

  chrome.storage.local.get(['portfolio'], (result) => {
    const portfolio = result.portfolio || [];
    portfolio.push({ symbol, shares, buyPrice: price, added: Date.now() });
    chrome.storage.local.set({ portfolio });

    document.getElementById('holdingModal').classList.add('hidden');
    loadPortfolio();
  });
}

function loadPortfolio() {
  chrome.storage.local.get(['portfolio'], (result) => {
    const portfolio = result.portfolio || [];
    const list = document.getElementById('portfolioList');

    if (portfolio.length === 0) {
      list.innerHTML = '<p class="empty-state">No holdings yet. Add stocks to track!</p>';
      return;
    }

    list.innerHTML = '';
    let totalValue = 0;
    let totalCost = 0;

    portfolio.forEach((holding, index) => {
      const currentValue = holding.shares * (holding.currentPrice || holding.buyPrice);
      const cost = holding.shares * holding.buyPrice;
      const change = ((currentValue - cost) / cost * 100).toFixed(2);

      totalValue += currentValue;
      totalCost += cost;

      const div = document.createElement('div');
      div.className = 'holding-item';
      div.innerHTML = `
        <div class="holding-info">
          <div class="holding-symbol">${holding.symbol}</div>
          <div class="holding-shares">${holding.shares} shares @ $${holding.buyPrice}</div>
        </div>
        <div class="holding-value">
          <div class="holding-price">$${currentValue.toFixed(2)}</div>
          <div class="holding-change ${parseFloat(change) >= 0 ? 'positive' : 'negative'}">${parseFloat(change) >= 0 ? '+' : ''}${change}%</div>
        </div>
        <div class="holding-actions">
          <button data-index="${index}">✕</button>
        </div>
      `;

      div.querySelector('button').addEventListener('click', () => removeHolding(index));
      list.appendChild(div);
    });

    const totalChange = totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100).toFixed(2) : 0;
    document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
    document.getElementById('totalChange').textContent = `$${(totalValue - totalCost).toFixed(2)} (${parseFloat(totalChange) >= 0 ? '+' : ''}${totalChange}%)`;
  });
}

function removeHolding(index) {
  chrome.storage.local.get(['portfolio'], (result) => {
    const portfolio = result.portfolio || [];
    portfolio.splice(index, 1);
    chrome.storage.local.set({ portfolio });
    loadPortfolio();
  });
}

function loadSavedData() {
  loadPortfolio();
}

function showLoading(show) {
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  
  if (show) {
    loading.classList.remove('hidden');
    results.classList.add('hidden');
  } else {
    loading.classList.add('hidden');
  }
}

function showError(message) {
  const error = document.getElementById('error');
  error.textContent = message;
  error.classList.remove('hidden');
  document.getElementById('results').classList.add('hidden');
}

function hideError() {
  document.getElementById('error').classList.add('hidden');
}