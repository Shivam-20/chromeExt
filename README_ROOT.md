# Stock & Fund Analyzer Pro

A powerful Chrome extension that provides AI-powered stock and mutual fund analysis with portfolio tracking, price alerts, and intelligent comparison tools.

## 🌟 Features

### 📊 Advanced Analysis
- Comprehensive stock/fund analysis with AI insights
- Scoring system (0-100) with Growth, Value, Safety breakdowns
- Extended metrics: Market Cap, P/E Ratio, 52-week range
- Price targets: Bear/Base/Bull cases
- **AI-powered prompt optimization** for custom analysis

### 💼 Portfolio Management
- Track holdings with shares and buy price
- Real-time portfolio value calculation
- Gain/loss percentage tracking
- Easy add/remove functionality

### 🔔 Smart Alerts
- Set price alerts (above/below targets)
- Configurable frequency (15/30/60 min)
- Browser notifications with sound option

### 📊 Comparison Tool
- Side-by-side stock comparison
- Metric-by-metric winner highlighting
- AI-generated verdict summaries

### 📰 Market News
- Latest financial news aggregation
- AI-curated with impact levels

### ⭐ Watchlist
- Add stocks to watchlist
- Persistent storage

### ⚙️ Settings
- API key configuration
- Alert & display preferences
- Data export/clear options

## 🚀 Quick Start

### Installation

1. **Clone this repository**
   ```bash
   git clone <repository-url>
   cd stock-fund-analyzer
   ```

2. **Get Z.AI API Key**
   - Visit https://z.ai
   - Sign up and generate API key

3. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select this directory

4. **Configure API Key**
   - Click extension icon
   - Go to ⚙️ Settings
   - Enter your Z.AI API key

## 📁 Project Structure

```
stock-fund-analyzer/
├── manifest.json          # Extension v3 configuration
├── popup.html             # Main popup UI
├── popup.css              # Styling
├── popup.js               # Main logic + prompt optimization
├── background.js          # Service worker + alerts
├── content.js             # Content script for symbol highlighting
├── options.html           # Settings page
├── options.js             # Settings logic
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md              # This file
├── CHANGELOG.md           # Version history
├── PROMPT_IMPROVEMENTS.md # AI prompt enhancements
└── PROMPT_OPTIMIZATION.md # Prompt optimizer feature docs
```

## 🎯 Usage

### Basic Analysis
1. Enter a stock symbol (e.g., AAPL, TSLA)
2. Click "🔍 Analyze"
3. View comprehensive analysis with scores and suggestions

### Custom Focus
1. Click "+ Add" (Custom Analysis Focus)
2. Enter your focus area or use quick tags
3. Click "✨ Optimize Prompt" for AI improvement
4. Accept optimized version
5. Analyze with customized insights

### Portfolio Tracking
1. Go to Portfolio tab
2. Click "+ Add"
3. Enter symbol, shares, and buy price
4. Track performance

### Compare Stocks
1. Go to Compare tab
2. Enter two symbols
3. Click "Compare"
4. View side-by-side analysis

## 🔧 Configuration

### API Key

**Option A: Via Settings (Recommended)**
- Extension → ⚙️ Settings → Enter API key

**Option B: Manual**
Replace `YOUR_ZAI_API_KEY` in:
- `popup.js` (line 1)
- `background.js` (line 72)

### Alert Frequency

Settings → Alert Settings → Choose frequency:
- Every 15 minutes
- Every 30 minutes
- Every 60 minutes

## 📊 AI Features

### Prompt Optimization
The extension includes an AI-powered prompt optimizer that transforms simple prompts into detailed, actionable requests:

```
Input:  "look at dividends"
Output: "Analyze the dividend history, yield, and sustainability. 
        Evaluate payout ratio and dividend growth rate over the 
        past 5 years. Assess dividend safety and future growth potential."
```

### Enhanced Analysis Prompts
- Expert role: "Senior financial analyst with 20+ years"
- Strict JSON output requirements
- Current date injection for accuracy
- Custom focus integration

### Market News
- AI-curated financial news
- Impact level classification
- Real-time relevance

## 🔒 Privacy & Security

- All data stored locally in browser
- No external tracking or analytics
- Direct API calls to Z.AI
- Export data anytime
- Clear data option available

## ⚠️ Disclaimer

This extension provides AI-generated analysis for educational purposes only. Not financial advice. Always do your own research and consult with a qualified financial advisor before making investment decisions.

## 📄 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📞 Support

For issues or questions:
- Check [README.md](./README.md) for detailed documentation
- Review [PROMPT_OPTIMIZATION.md](./PROMPT_OPTIMIZATION.md) for prompt optimization guide
- Ensure API key is properly configured

## 🎉 Credits

Built with ❤️ using:
- [Z.AI](https://z.ai) - AI-powered analysis
- Chrome Extension Manifest V3
- Vanilla JavaScript

---

**Version:** 2.0.0  
**Last Updated:** 2025-02-10