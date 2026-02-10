# 🎉 Changelog

All notable changes to Stock & Fund Analyzer Pro.

## [2.0.0] - 2025-02-10

### 🎉 Major Release - Complete Overhaul

### ✨ New Features

#### 📊 Enhanced Analysis
- **Scoring System**: Overall score (0-100) with three component scores:
  - Growth Score
  - Value Score
  - Safety Score
- **Extended Metrics**:
  - Market Cap
  - P/E Ratio
  - 52-Week High
  - 52-Week Low
- **Price Targets**:
  - Bear Case
  - Base Case
  - Bull Case
- **Quick Access Buttons**: One-click analysis for popular symbols
- **Visual Score Bars**: Animated progress bars for each score component

#### 💼 Portfolio Management (NEW)
- Add holdings with symbol, shares, and buy price
- Real-time portfolio value calculation
- Individual holding performance tracking
- Total portfolio summary with gain/loss
- Remove holdings functionality
- Persistent storage

#### 🔔 Smart Alerts (NEW)
- Set price alerts (above/below target price)
- Configurable alert frequency:
  - Every 15 minutes
  - Every 30 minutes
  - Every 60 minutes
- Browser notifications when alerts trigger
- Optional sound notifications
- Alert management in settings

#### 📊 Stock Comparison (NEW)
- Side-by-side comparison of two stocks
- Metric-by-metric comparison with winner highlighting
- Compared metrics:
  - Price
  - Change %
  - P/E Ratio
  - Market Cap
  - Growth Score
  - Value Score
  - Safety Score
  - Overall Score
- AI-generated verdict summary

#### 📰 Market News (NEW)
- Latest market news integration
- AI-curated financial news
- Click-to-read functionality
- Time-stamped articles
- Source attribution

#### ⭐ Watchlist (NEW)
- Add stocks to watchlist
- Toggle watchlist status from analysis view
- View all watchlist items in settings
- Remove items from watchlist
- Persistent storage

#### ⚙️ Settings Page (NEW)
- **API Configuration**: Set Z.AI API key
- **Alert Settings**: Configure frequency and sound
- **Watchlist Management**: View and remove items
- **Display Preferences**:
  - Dark mode toggle
  - Show/hide scores
  - Auto-refresh toggle
- **Data Management**:
  - Export data as JSON
  - Clear all data

#### 🎨 UI/UX Improvements
- Modern dark theme design
- Tab-based navigation system
- Four main tabs: Analyze, Portfolio, Compare, News
- Animated loading spinner
- Modal dialogs for alerts and holdings
- Better color scheme with purple gradients
- Responsive design improvements
- Hidden/visible states for better UX

#### 🖱️ Content Script Enhancements
- Improved symbol detection with exclusion list
- Common stocks and mutual funds recognition
- Interactive tooltips on highlighted symbols
- Quick analysis in tooltips
- Click-to-full-analysis functionality
- Financial site detection
- SPA (Single Page App) support with mutation observer

### 🔧 Technical Changes

#### Manifest Updates
- Version bumped to 2.0.0
- Added `alarms` permission for scheduled checks
- Added `notifications` permission for browser alerts
- Added `options_page` for settings page
- Updated name to "Stock & Fund Analyzer Pro"
- Enhanced description

#### Background Service Worker
- Alert checking system with `chrome.alarms`
- Notification integration
- Quick analysis message handling
- Popup open action

#### Popup Logic
- Tab navigation system
- Portfolio CRUD operations
- Comparison logic
- News fetching
- Modal management
- Enhanced analysis display
- Score bar animations
- Local storage integration

#### Content Script
- Enhanced symbol detection patterns
- Exclusion word list to reduce false positives
- Common stocks and mutual funds arrays
- Financial site detection
- Tooltip creation and management
- Quick analysis via message passing
- Mutation observer for SPA support
- Inline style injection

### 📝 Documentation
- Completely rewritten README with:
  - Feature breakdown
  - Usage guide for each tab
  - Troubleshooting section
  - Tips and best practices
  - Keyboard shortcuts
  - Roadmap section
  - Privacy information
- Added this changelog
- Added icons README

### 🎯 Improvements

#### Analysis Quality
- More detailed prompts for better AI responses
- Structured JSON output format
- Enhanced metrics collection
- Better sentiment analysis

#### User Experience
- Clearer visual feedback
- Better loading states
- Improved error messages
- More intuitive navigation
- Persistent user preferences

#### Performance
- Optimized symbol detection
- Efficient storage operations
- Batch operations where possible
- Debounced content script actions

### 🐛 Bug Fixes
- Fixed symbol detection false positives
- Improved tooltip positioning
- Better handling of invalid symbols
- Fixed storage persistence issues
- Improved error handling throughout

### 📦 File Changes

#### New Files
- `options.html` - Settings page
- `options.js` - Settings logic
- `icons/README.txt` - Icon documentation
- `CHANGELOG.md` - This file

#### Updated Files
- `manifest.json` - New permissions and configuration
- `popup.html` - Complete UI overhaul
- `popup.css` - New styling system
- `popup.js` - Enhanced functionality
- `background.js` - Alert system
- `content.js` - Improved detection
- `README.md` - Comprehensive documentation

---

## [1.0.0] - Initial Release

### Features
- Basic stock/fund analysis
- AI suggestions
- Simple metrics display
- Content script symbol highlighting
- Popup interface

---

## Future Plans

See README.md roadmap section for upcoming features.