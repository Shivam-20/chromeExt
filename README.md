# 📊 Stock & Fund Analyzer Pro

An advanced Chrome extension powered by Z.AI that provides comprehensive stock and mutual fund analysis with portfolio tracking, price alerts, and intelligent comparison tools.

## ✨ New Features in v2.0

### 🎯 Enhanced Analysis
- **Scoring System**: Overall score (0-100) with breakdown for Growth, Value, and Safety
- **Extended Metrics**: Market cap, P/E ratio, 52-week high/low
- **Price Targets**: Bull, Base, and Bear case predictions
- **Quick Access**: One-click analysis for popular stocks

### 💼 Portfolio Management
- Track your holdings with buy price and shares
- Real-time portfolio value calculation
- Gain/loss percentage tracking
- Add/remove holdings easily

### 🔔 Smart Alerts
- Set price alerts (above/below target)
- Configurable alert frequency (15/30/60 min)
- Browser notifications when alerts trigger
- Sound notification option

### 📊 Stock Comparison
- Side-by-side comparison of two stocks
- Metric-by-metric winner highlighting
- AI-generated verdict summary

### 📰 Market News
- Latest market news integration
- Click to read full articles
- Time-stamped updates

### ⭐ Watchlist
- Add stocks to your watchlist
- Quick access from settings
- Persistent storage

### 🎨 Modern UI
- Beautiful dark theme
- Tab-based navigation
- Responsive design
- Real-time loading states

## Installation

### 1. Clone or Download

```bash
cd /root/Projects/Shivam-20/stock-fund-analyzer
```

### 2. Get Z.AI API Key

1. Go to [Z.AI](https://z.ai) and sign up
2. Navigate to API keys section
3. Generate a new API key
4. Copy the key

### 3. Configure API Key

**Option A: Via Settings Page**
1. Load the extension in Chrome
2. Click extension icon → ⚙️ Settings
3. Enter your Z.AI API key
4. Click "Save API Key"

**Option B: Manually**
Open `popup.js`, `background.js`, and `options.js` then replace `YOUR_ZAI_API_KEY`:

```javascript
const ZAI_API_KEY = 'your-actual-api-key-here';
```

### 4. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `stock-fund-analyzer` directory

### 5. Create Icons (Optional)

Create an `icons` folder and add:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

## Usage Guide

### 🔍 Analyze Tab

**Basic Analysis:**
1. Enter a stock symbol (e.g., AAPL, TSLA) or mutual fund (e.g., VFIAX)
2. Click "🔍 Analyze" or press Enter
3. View comprehensive analysis including:
   - Current price, daily change, volume
   - Market cap, P/E ratio, 52-week range
   - Overall score with Growth/Value/Safety breakdown
   - AI suggestions with sentiment indicators
   - Price targets (Bull/Base/Bear)

**Quick Analysis:**
- Click any quick symbol button (AAPL, GOOGL, TSLA, VFIAX)

**Watchlist & Alerts:**
- Click "⭐ Watch" to add to watchlist
- Click "🔔 Alert" to set a price alert

### 💼 Portfolio Tab

**Add Holdings:**
1. Go to Portfolio tab
2. Click "+ Add"
3. Enter symbol, number of shares, and buy price
4. Click "Add"

**View Portfolio:**
- Total portfolio value
- Today's gain/loss percentage
- Individual holding performance
- Remove holdings with ✕ button

### 📊 Compare Tab

**Compare Two Stocks:**
1. Enter two symbols
2. Click "Compare"
3. View side-by-side metrics
4. See winner for each metric
5. Read AI verdict summary

### 📰 News Tab

- View latest market news
- Click any article to read full story
- Auto-refreshes on tab switch

### ⚙️ Settings Page

Click the ⚙️ icon in popup header:

**API Configuration:**
- Set your Z.AI API key

**Alert Settings:**
- Choose check frequency (15/30/60 min)
- Enable/disable sound notifications
- View and remove active alerts

**Watchlist Management:**
- View all watchlist items
- Remove items with × button

**Display Preferences:**
- Dark mode toggle
- Show/hide analysis scores
- Auto-refresh toggle

**Data Management:**
- Export all data as JSON
- Clear all data (reset)

## Features Breakdown

### Analysis Metrics

**Basic Metrics:**
- Current price
- Daily change %
- Trading volume

**Extended Metrics:**
- Market capitalization
- P/E ratio
- 52-week high
- 52-week low

**Score Breakdown (0-100):**
- Growth Score: Future growth potential
- Value Score: Current valuation attractiveness
- Safety Score: Risk and stability assessment
- Overall Score: Weighted composite

### AI Suggestions

Each suggestion includes:
- Actionable insight
- Sentiment indicator:
  - 🟢 Positive: Buy signals, opportunities
  - 🔴 Negative: Sell signals, warnings
  - 🟡 Neutral: Hold recommendations

### Price Targets

- **Bear Case**: Pessimistic scenario
- **Base Case**: Expected outcome
- **Bull Case**: Optimistic scenario

### Content Detection

On financial websites (Yahoo Finance, Bloomberg, MarketWatch, etc.):
- Stock symbols are automatically highlighted
- Click any highlighted symbol for quick tooltip
- View price, change, and score instantly
- Click "Full Analysis" for detailed view

## Example Symbols

### Popular Stocks
- **AAPL** - Apple Inc.
- **GOOGL** - Alphabet/Google
- **MSFT** - Microsoft
- **TSLA** - Tesla
- **AMZN** - Amazon
- **NVDA** - NVIDIA
- **META** - Meta Platforms
- **JPM** - JPMorgan Chase

### Mutual Funds
- **VFIAX** - Vanguard 500 Index
- **VTSAX** - Vanguard Total Stock Market
- **FXAIX** - Fidelity 500 Index
- **SWPPX** - Schwab S&P 500 Index
- **VWELX** - Vanguard Wellington
- **VGSLX** - Vanguard Real Estate

## File Structure

```
stock-fund-analyzer/
├── manifest.json       # Extension v3 configuration
├── popup.html          # Main popup UI
├── popup.css           # Styling
├── popup.js            # Main logic
├── background.js       # Service worker + alerts
├── content.js          # Page content scanner
├── options.html        # Settings page
├── options.js          # Settings logic
├── icons/              # Extension icons
└── README.md           # This file
```

## API Integration

The extension uses Z.AI's Chat Completions API:

- **Endpoint**: `https://api.z.ai/v1/chat/completions`
- **Model**: `gpt-4`
- **Features**:
  - Stock analysis
  - Fund analysis
  - Price prediction
  - Market news aggregation
  - Comparison reports

## Permissions Required

- `activeTab` - Access current tab content
- `storage` - Save preferences, portfolio, alerts
- `tabs` - Send messages between components
- `alarms` - Scheduled price alert checks
- `notifications` - Browser notifications
- `https://*/*` - Access financial websites
- `https://api.z.ai/*` - Call Z.AI API

## Troubleshooting

### Analysis Fails
- ✅ Verify API key is set in Settings
- ✅ Check internet connection
- ✅ Ensure Z.AI account has credits
- ✅ Try a different symbol

### Alerts Not Triggering
- ✅ Check alert frequency in Settings
- ✅ Verify notifications are enabled in Chrome
- ✅ Ensure extension is not paused

### Portfolio Not Saving
- ✅ Check browser storage permissions
- ✅ Try reloading the extension
- ✅ Export data as backup

### Icons Not Showing
- ✅ Create icon files in `icons/` folder
- ✅ Reload extension after adding icons
- ✅ Ensure correct naming (icon16.png, etc.)

### Content Detection Not Working
- ✅ Refresh the page after installing
- ✅ Check if site is in financial site list
- ✅ Verify symbols match detection pattern

## Tips & Best Practices

### Getting Better Analysis
1. Use well-known stocks for more accurate data
2. Compare multiple stocks before investing
3. Review both positive and negative suggestions
4. Check price targets for range expectations

### Managing Alerts
1. Set realistic price targets
2. Use different alerts for buy/sell signals
3. Regularly review and clean up old alerts
4. Consider volatility when setting thresholds

### Portfolio Tracking
1. Update holdings after trades
2. Review portfolio performance weekly
3. Export data periodically for backup
4. Use comparison tool before adding new positions

## Keyboard Shortcuts

- **Enter** - Submit symbol for analysis
- **Click symbol** - Quick tooltip on highlighted symbols
- **⚙️** - Open settings page

## Roadmap

Coming soon:
- [ ] Historical price charts
- [ ] Technical indicators (RSI, MACD)
- [ ] Dividend tracking
- [ ] Sector analysis
- [ ] Earnings calendar
- [ ] Social sentiment integration
- [ ] Multiple watchlists
- [ ] Portfolio rebalancing suggestions
- [ ] Tax gain/loss harvesting
- [ ] Import from brokerages

## Privacy & Data

- All data stored locally in your browser
- No external tracking or analytics
- API calls sent directly to Z.AI
- Export your data anytime
- Clear data option in Settings

## Disclaimer

This extension provides AI-generated analysis for educational purposes only. Not financial advice. Always do your own research and consult with a qualified financial advisor before making investment decisions. Past performance does not guarantee future results.

## License

MIT License

## Support

For issues, questions, or feature requests:
- Check Settings page for configuration options
- Review this README for usage instructions
- Ensure API key is properly configured
- Verify all permissions are granted

---

**Version:** 2.0.0  
**Last Updated:** 2025-02-10