# SecureChain - Bitcoin Fraud Detection Platform

A modern, AI-powered Bitcoin wallet risk analysis tool with real-time blockchain analytics and an elegant analyst dashboard.

## 🔍 Overview

SecureChain is a full-stack Bitcoin fraud intelligence platform combining FastAPI microservices with a sleek React dashboard. The system ingests on-chain data, applies ensemble machine-learning models, and surfaces real-time risk signals so compliance teams can investigate wallets, export evidence packs, and share findings within minutes.

## 🚀 Key Features

- **🧠 Ensemble ML Detector**: Gradient boosting, neural networks, and anomaly models tuned for crypto scam signatures
- **⚡ Fast Analysis API**: Production-ready analysis endpoints with rate-limit awareness and graceful fallbacks
- **📊 Modern Dashboard**: React + Material UI with real-time charts, risk visualization, and dark/light themes
- **📈 Evidence Generation**: One-click PDF and XLSX reports with risk factors, charts, and timeline visuals
- **🔗 Blockchain Enrichment**: BlockCypher integration, fraud databases, and network topology insights
- **🛡️ Risk Stratification**: Seven-tier risk levels (`VERY_LOW` → `CRITICAL`) with confidence scoring

## 🎨 Design System

BitTrace features a modern, premium UI with:

- **Color Palette**: Emerald/Teal primary (#10b981) with Electric Violet secondary (#6366f1)
- **Typography**: Outfit (headings/UI) + IBM Plex Mono (code/numbers)
- **Components**: Pill-shaped buttons, 24px rounded cards, glassmorphism effects
- **Themes**: Deep slate dark mode (#030712) and clean white light mode (#f8fafc)
- **Charts**: Balance history and inflow/outflow visualization with Recharts

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | FastAPI, Uvicorn, Python 3.10+ |
| **ML** | scikit-learn, XGBoost, LightGBM, ensemble models |
| **Blockchain** | BlockCypher API, pandas, numpy |
| **Frontend** | React 19, Vite, Material UI v6, TypeScript |
| **Charts** | Recharts with custom gradients |
| **Reports** | jsPDF, XLSX, html2canvas |

## 📁 Project Structure

```
bitscan/
├── backend/
│   ├── api/                # FastAPI routers and endpoints
│   ├── blockchain/         # Blockchain analyzer and clients
│   ├── data/               # Trained models and cache
│   ├── ml/                 # Enhanced fraud detectors
│   └── main.py             # Application entry point
├── frontend/
│   ├── src/
│   │   ├── components/     # SecureTraceNav, charts, modals
│   │   ├── services/       # API client
│   │   ├── themes/         # MUI theme configuration
│   │   ├── utils/          # Report generators
│   │   └── App.tsx         # Main application
│   ├── index.html
│   └── vite.config.ts
└── README.md
```

## 🚦 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Optional: BlockCypher API token for higher rate limits

### 1. Clone and setup backend

```bash
git clone https://github.com/yourusername/bitscan.git
cd bitscan/backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
python start_server.py
```

Backend runs at `http://localhost:8000` with docs at `/docs`.

### 2. Setup frontend

```bash
cd ../frontend
npm install
npm run dev
```

Dashboard runs at `http://localhost:5173`.

## 🔧 Configuration

### Backend `.env`

```env
BLOCKCYPHER_API_TOKEN=your_api_token_here
MODEL_THRESHOLD=0.5
BITCOIN_NETWORK=main
MAX_TRANSACTION_DEPTH=5
```

### Frontend `.env`

```env
VITE_DEV_PROXY_TARGET=http://127.0.0.1:8000
```

## 📖 API Endpoints

All endpoints prefixed with `/api/v1`:

| Endpoint | Description |
|----------|-------------|
| `GET /analyze/{address}` | Comprehensive wallet analysis |
| `GET /analyze-fast/{address}` | Quick analysis (limited data) |
| `GET /wallet/{address}/timeseries` | Historical chart data |
| `POST /batch` | Batch risk evaluation |
| `GET /health` | Health check |

### Example Response

```json
{
  "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "risk_score": 0.12,
  "risk_level": "MINIMAL",
  "confidence": 0.94,
  "risk_factors": [],
  "positive_indicators": ["Address in known database"],
  "analysis_summary": {
    "transaction_count": 3736,
    "total_received_btc": 68.12,
    "current_balance_btc": 0.0
  }
}
```

## 🤖 Machine Learning

The ensemble model (`ml/enhanced_fraud_detector.py`) combines:

- RandomForest, GradientBoosting, ExtraTrees, LightGBM, XGBoost
- MLP neural network for complex pattern detection
- IsolationForest for anomaly scoring

### Features Detected

- Mixing service usage
- Rapid fund movement patterns
- High fan-out transactions
- Round amount anomalies
- Cluster behavior analysis

## 🧪 Testing

```bash
# Backend health check
curl http://localhost:8000/api/v1/health

# Frontend build
cd frontend && npm run build
```

---

**⚠️ Disclaimer**: SecureChain is for analysis and education purposes. Always conduct your own research before making cryptocurrency decisions.