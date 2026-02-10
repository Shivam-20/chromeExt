const STOCK_PATTERNS = [
  /\b[A-Z]{2,5}\b/g,
  /\$[A-Z]{2,5}\b/g
];

const COMMON_STOCKS = ['AAPL', 'GOOGL', 'GOOG', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'JNJ', 'WMT', 'PG', 'MA', 'HD', 'UNH', 'BAC', 'XOM', 'PFE', 'CSCO', 'KO', 'PEP', 'CVX', 'ABT', 'MRK', 'ADBE', 'CRM', 'NFLX', 'DIS', 'INTC', 'ORCL', 'AMD', 'NKE', 'PYPL', 'QCOM', 'T', 'VZ', 'IBM', 'BA', 'CAT', 'GE', 'HON', 'MMM', 'UPS', 'GS', 'MS', 'C'];

const MUTUAL_FUNDS = ['VFIAX', 'VTSAX', 'VBTLX', 'VGSLX', 'VWELX', 'FXAIX', 'SWPPX', 'VFINX', 'VIGAX', 'VGSLX', 'VTIAX', 'VBIAX', 'VMVAX', 'VSMAX', 'VEXAX', 'VGWAX', 'VEAIX', 'VEMAX', 'VTWAX'];

const EXCLUDE_WORDS = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HAD', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'HAS', 'HAVE', 'WILL', 'WITH', 'THIS', 'THAT', 'FROM', 'THEY', 'WOULD', 'THERE', 'THEIR', 'ABOUT', 'WHICH', 'WHEN', 'MAKE', 'LIKE', 'INTO', 'YEAR', 'YOUR', 'JUST', 'OVER', ' ALSO', 'AFTER', 'BEING', 'BEFORE', 'COULD', 'EVERY', 'FIRST', 'FOUND', 'GREAT', 'HOUSE', 'LARGE', 'LEARN', 'NEVER', 'OTHER', 'PLACE', 'PLANT', 'POINT', 'RIGHT', 'SMALL', 'SOUND', 'SPELL', 'STILL', 'STUDY', 'THEIR', 'THERE', 'THESE', 'THING', 'THINK', 'THREE', 'WATER', 'WHERE', 'WHICH', 'WORLD', 'WRITE', 'YEARS'];

function isFinancialSite() {
  const financialDomains = ['finance.yahoo.com', 'www.marketwatch.com', 'www.bloomberg.com', 'seekingalpha.com', 'www.cnbc.com', 'investorplace.com', 'www.fool.com', 'stocktwits.com', 'finance.google.com'];
  return financialDomains.some(domain => window.location.hostname.includes(domain));
}

function detectSymbols() {
  const symbols = new Set();
  const text = document.body.innerText;

  STOCK_PATTERNS.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      let symbol = match[0].replace('$', '').toUpperCase();

      if (isValidSymbol(symbol) && !symbols.has(symbol)) {
        symbols.add(symbol);
      }
    }
  });

  return Array.from(symbols);
}

function isValidSymbol(symbol) {
  if (EXCLUDE_WORDS.includes(symbol)) return false;
  if (symbol.length < 2 || symbol.length > 5) return false;
  if (!/^[A-Z]+$/.test(symbol)) return false;
  if (/^[A-Z]{1,1}[A-Z]{1,1}$/.test(symbol)) {
    return COMMON_STOCKS.includes(symbol) || MUTUAL_FUNDS.includes(symbol);
  }
  return true;
}

function createTooltip(symbol, x, y) {
  const tooltip = document.createElement('div');
  tooltip.className = 'stock-analyzer-tooltip';
  tooltip.innerHTML = `
    <div class="tooltip-header">
      <span class="tooltip-symbol">${symbol}</span>
      <button class="tooltip-close">×</button>
    </div>
    <div class="tooltip-loading">
      <div class="tooltip-spinner"></div>
      <span>Analyzing...</span>
    </div>
    <div class="tooltip-content hidden"></div>
    <button class="tooltip-analyze">🔍 Full Analysis</button>
  `;

  tooltip.style.position = 'absolute';
  tooltip.style.left = `${Math.min(x, window.innerWidth - 280)}px`;
  tooltip.style.top = `${Math.min(y, window.innerHeight - 300)}px`;

  document.body.appendChild(tooltip);

  tooltip.querySelector('.tooltip-close').addEventListener('click', () => {
    tooltip.remove();
  });

  tooltip.querySelector('.tooltip-analyze').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup', symbol });
    tooltip.remove();
  });

  fetchTooltipAnalysis(symbol, tooltip);

  return tooltip;
}

async function fetchTooltipAnalysis(symbol, tooltip) {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'quickAnalyze', symbol });
    
    if (response && response.data) {
      const data = response.data;
      const loading = tooltip.querySelector('.tooltip-loading');
      const content = tooltip.querySelector('.tooltip-content');
      
      loading.classList.add('hidden');
      content.classList.remove('hidden');
      
      const changeClass = data.change && data.change.includes('-') ? 'negative' : 'positive';
      
      content.innerHTML = `
        <div class="tooltip-price">${data.price || 'N/A'}</div>
        <div class="tooltip-change ${changeClass}">${data.change || 'N/A'}</div>
        <div class="tooltip-score">Score: ${data.overallScore || '--'}/100</div>
      `;
    }
  } catch (error) {
    tooltip.querySelector('.tooltip-loading').innerHTML = '<span>Analysis unavailable</span>';
  }
}

function highlightSymbols() {
  const symbols = detectSymbols();
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        if (node.parentElement.tagName.match(/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|SELECT)$/)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (node.textContent.trim().length === 0) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }

  textNodes.forEach(textNode => {
    const text = textNode.textContent;
    let modified = false;
    const fragments = [];
    let lastIndex = 0;

    STOCK_PATTERNS.forEach(pattern => {
      let match;
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(text)) !== null) {
        const symbol = match[0].replace('$', '').toUpperCase();
        
        if (isValidSymbol(symbol) && textNode.parentElement.className.indexOf('stock-symbol') === -1) {
          if (match.index > lastIndex) {
            fragments.push(document.createTextNode(text.slice(lastIndex, match.index)));
          }
          
          const span = document.createElement('span');
          span.className = 'stock-symbol';
          span.dataset.symbol = symbol;
          span.textContent = match[0];
          
          fragments.push(span);
          lastIndex = pattern.lastIndex;
          modified = true;
        }
      }
    });

    if (modified) {
      if (lastIndex < text.length) {
        fragments.push(document.createTextNode(text.slice(lastIndex)));
      }
      
      const fragment = document.createDocumentFragment();
      fragments.forEach(f => fragment.appendChild(f));
      textNode.parentNode.replaceChild(fragment, textNode);
    }
  });

  document.querySelectorAll('.stock-symbol').forEach(el => {
    if (!el.hasListener) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = el.getBoundingClientRect();
        createTooltip(el.dataset.symbol, rect.left + rect.width, rect.bottom + 5);
      });
      el.hasListener = true;
    }
  });
}

function injectStyles() {
  if (document.getElementById('stock-analyzer-styles')) return;

  const style = document.createElement('style');
  style.id = 'stock-analyzer-styles';
  style.textContent = `
    .stock-symbol {
      cursor: pointer;
      color: #667eea;
      font-weight: 600;
      border-bottom: 1px dotted #667eea;
      transition: all 0.2s;
      display: inline;
    }
    .stock-symbol:hover {
      background: rgba(102, 126, 234, 0.1);
      color: #764ba2;
    }
    .stock-analyzer-tooltip {
      position: fixed;
      z-index: 999999;
      background: #1e1e2e;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 16px;
      width: 260px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.4);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #e4e4e7;
    }
    .tooltip-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .tooltip-symbol {
      font-weight: 700;
      font-size: 1.1rem;
      color: white;
    }
    .tooltip-close {
      background: none;
      border: none;
      color: #71717a;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
    }
    .tooltip-close:hover {
      color: white;
    }
    .tooltip-loading {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 0;
      justify-content: center;
      color: #71717a;
    }
    .tooltip-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.1);
      border-top: 2px solid #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .tooltip-content {
      padding: 12px 0;
      border-top: 1px solid rgba(255,255,255,0.1);
      border-bottom: 1px solid rgba(255,255,255,0.1);
      margin: 12px 0;
    }
    .tooltip-price {
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
      margin-bottom: 4px;
    }
    .tooltip-change {
      font-size: 0.9rem;
      margin-bottom: 8px;
    }
    .tooltip-change.positive {
      color: #22c55e;
    }
    .tooltip-change.negative {
      color: #ef4444;
    }
    .tooltip-score {
      font-size: 0.8rem;
      color: #a1a1aa;
    }
    .tooltip-analyze {
      width: 100%;
      padding: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      margin-top: 8px;
      transition: transform 0.2s;
    }
    .tooltip-analyze:hover {
      transform: translateY(-1px);
    }
    .hidden {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggle') {
    highlightSymbols();
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    if (isFinancialSite()) {
      setTimeout(highlightSymbols, 1000);
    }
  });
} else {
  injectStyles();
  if (isFinancialSite()) {
    setTimeout(highlightSymbols, 1000);
  }
}

let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    if (isFinancialSite()) {
      setTimeout(highlightSymbols, 1000);
    }
  }
}).observe(document, { subtree: true, childList: true });