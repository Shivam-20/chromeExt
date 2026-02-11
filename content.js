const STOCK_PATTERNS = [
  /\b[A-Z]{2,5}\b/g,
  /₹[A-Z]{2,5}\b/g
];

const COMMON_STOCKS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR', 'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK', 'LT', 'AXISBANK', 'BAJFINANCE', 'ASIANPAINT', 'MARUTI', 'HCLTECH', 'SUNPHARMA', 'TITAN', 'DMART', 'WIPRO', 'ULTRACEMCO', 'JSWSTEEL', 'TATAMOTORS', 'TATASTEEL', 'ADANIENT', 'ADANIGREEN', 'POWERGRID', 'NTPC', 'ONGC', 'COALINDIA', 'BPCL', 'IOC', 'HEROMOTOCO', 'EICHERMOT', 'DRREDDY', 'CIPLA', 'BAJAJFINSV', 'DIVISLAB', 'BRITANNIA', 'GRASIM', 'UPL', 'SHREECEM', 'NESTLEIND', 'HDFC', 'TECHM'];

const MUTUAL_FUNDS = ['AXISBLUECHIP', 'MIRAEASSET', 'PARAGPARIKH', 'SBI SMALL CAP', 'HDFC INDEX', 'ICICI PRU BLUECHIP', 'KOTAK BLUECHIP', 'UTI NIFTY', 'NIPPON SMALL CAP', 'CANARA ROBECO', 'DSP TAX SAVER', 'FRANKLIN INDIA', 'IDFC GOVT', 'INVESCO INDIA', 'L&T INDIA', 'MAHINDRA MANULITE', 'QUANT ACTIVE', 'SUNDARAM LARGE'];

const ETFS = ['NIFTYBEES', 'JUNIORBEES', 'BANKBEES', 'GOLDBEES', 'LIQUIDBEES', 'NIFTYIT', 'PSUBNKBEES', 'CPSEETF', 'BHARAT22', 'MIDCAPBEES', 'NIFTY100', 'NIFTY200', 'NIFTY500', 'SENSEXETF', 'ICICINIFTY', 'HDFCSENSEX', 'SBIETF', 'KOTAKNIFTY'];

const FUTURES = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];

const CRYPTO = ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'DOGE', 'SOL', 'DOT', 'MATIC', 'AVAX'];

const EXCLUDE_WORDS = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HAD', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'HAS', 'HAVE', 'WILL', 'WITH', 'THIS', 'THAT', 'FROM', 'THEY', 'WOULD', 'THERE', 'THEIR', 'ABOUT', 'WHICH', 'WHEN', 'MAKE', 'LIKE', 'INTO', 'YEAR', 'YOUR', 'JUST', 'OVER', ' ALSO', 'AFTER', 'BEING', 'BEFORE', 'COULD', 'EVERY', 'FIRST', 'FOUND', 'GREAT', 'HOUSE', 'LARGE', 'LEARN', 'NEVER', 'OTHER', 'PLACE', 'PLANT', 'POINT', 'RIGHT', 'SMALL', 'SOUND', 'SPELL', 'STILL', 'STUDY', 'THEIR', 'THERE', 'THESE', 'THING', 'THINK', 'THREE', 'WATER', 'WHERE', 'WHICH', 'WORLD', 'WRITE', 'YEARS'];

let activeTooltips = new Set();

function isFinancialSite() {
  const financialDomains = ['moneycontrol.com', 'economictimes.indiatimes.com', 'livemint.com', 'business-standard.com', 'nseindia.com', 'bseindia.com', 'tickertape.in', 'screener.in', 'trendlyne.com', 'morningstar.in', 'valuepickr.com', 'zeebiz.com'];
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
    return COMMON_STOCKS.includes(symbol) || MUTUAL_FUNDS.includes(symbol) || ETFS.includes(symbol);
  }
  return true;
}

function detectSymbolType(symbol) {
  if (COMMON_STOCKS.includes(symbol)) return 'stock';
  if (MUTUAL_FUNDS.includes(symbol)) return 'fund';
  if (ETFS.includes(symbol)) return 'etf';
  if (FUTURES.includes(symbol)) return 'future';
  if (CRYPTO.includes(symbol)) return 'crypto';
  return 'unknown';
}

function createTooltip(symbol, x, y) {
  const tooltip = document.createElement('div');
  tooltip.className = 'stock-analyzer-tooltip';
  
  const headerDiv = document.createElement('div');
  headerDiv.className = 'tooltip-header';
  
  const symbolSpan = document.createElement('span');
  symbolSpan.className = 'tooltip-symbol';
  symbolSpan.textContent = symbol;
  
  const closeButton = document.createElement('button');
  closeButton.className = 'tooltip-close';
  closeButton.textContent = '×';
  closeButton.addEventListener('click', () => {
    tooltip.remove();
  });
  
  headerDiv.appendChild(symbolSpan);
  headerDiv.appendChild(closeButton);
  
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'tooltip-loading';
  
  const spinnerDiv = document.createElement('div');
  spinnerDiv.className = 'tooltip-spinner';
  
  const loadingSpan = document.createElement('span');
  loadingSpan.textContent = 'Analyzing...';
  
  loadingDiv.appendChild(spinnerDiv);
  loadingDiv.appendChild(loadingSpan);
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'tooltip-content hidden';
  
  const analyzeButton = document.createElement('button');
  analyzeButton.className = 'tooltip-analyze';
  analyzeButton.textContent = '🔍 Full Analysis';
  analyzeButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openPopup', symbol }).catch(err => {
      console.error('Failed to open popup:', err);
    });
    tooltip.remove();
  });
  
  tooltip.appendChild(headerDiv);
  tooltip.appendChild(loadingDiv);
  tooltip.appendChild(contentDiv);
  tooltip.appendChild(analyzeButton);

  tooltip.style.position = 'absolute';
  tooltip.style.left = `${Math.min(x, window.innerWidth - 280)}px`;
  tooltip.style.top = `${Math.min(y, window.innerHeight - 300)}px`;

  document.body.appendChild(tooltip);

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
      
      if (!loading || !content) return;
      
      loading.classList.add('hidden');
      content.classList.remove('hidden');
      
      const changeClass = data.change && data.change.includes('-') ? 'negative' : 'positive';
      
      const priceDiv = document.createElement('div');
      priceDiv.className = 'tooltip-price';
      priceDiv.textContent = data.price || 'N/A';
      
      const changeDiv = document.createElement('div');
      changeDiv.className = `tooltip-change ${changeClass}`;
      changeDiv.textContent = data.change || 'N/A';
      
      const scoreDiv = document.createElement('div');
      scoreDiv.className = 'tooltip-score';
      scoreDiv.textContent = `Score: ${data.overallScore || '--'}/100`;
      
      content.appendChild(priceDiv);
      content.appendChild(changeDiv);
      content.appendChild(scoreDiv);
    }
  } catch (error) {
    console.error('Tooltip analysis error:', error);
    const loading = tooltip.querySelector('.tooltip-loading');
    if (loading) {
      loading.innerHTML = '<span>Analysis unavailable</span>';
    }
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