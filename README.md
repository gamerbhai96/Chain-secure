# BitScan - Bitcoin Scam Pattern Analyzer


## 🔍 Overview

BitScan is a full-stack Bitcoin scam intelligence platform combining FastAPI microservices with a modern React analyst dashboard. The system ingests on-chain data, applies ensemble machine-learning models, and surfaces real-time risk signals so compliance teams can investigate wallets, export evidence packs, and share findings within minutes.

## 🚀 Key Features

- **🧠 Ensemble ML Detector**: Gradient boosting, neural networks, and anomaly models tuned for crypto scam signatures
- **⚡ Fast Analysis API**: Production-ready `/analyze-fast` endpoint with rate-limit awareness and graceful fallbacks
- **📊 Analyst Dashboard**: React + Material UI experience with risk cards, history, FAQ, and interactive charts
- **📈 Evidence Generation**: One-click PDF and XLSX reports including risk factors, limitations, timeline visuals
- **🔗 Blockchain Enrichment**: BlockCypher integration, fraud databases, and network topology insights
- **🛡️ Risk Stratification**: Seven-tier risk levels (`VERY_LOW` → `CRITICAL`) with confidence scoring and indicators

## 🛠️ Technology Stack

- **Backend & Services**: FastAPI, Uvicorn, Python 3.10+, asyncio
- **Machine Learning**: scikit-learn, XGBoost, LightGBM, imbalanced-learn, custom ensemble logic
- **Blockchain & Data**: BlockCypher API, pandas, numpy, caching utilities
- **Frontend**: React 19, Vite, Material UI, React Query, Recharts, jsPDF, XLSX
- **Visualization & Reporting**: Recharts components, custom PDF/Excel generators, html2canvas
- **Tooling**: TypeScript, ESLint, python-dotenv

## 📁 Project Structure

```
bitscan/
├── backend/
│   ├── api/                # FastAPI routers, health, analysis endpoints
│   ├── blockchain/         # Blockchain analyzer and client orchestration
│   ├── data/               # External API clients, cached datasets, trained models/
│   ├── ml/                 # Enhanced fraud detectors, feature extraction
│   ├── utils/              # Helpers for scoring, caching, validation
│   └── main.py             # FastAPI application entry point
├── frontend/
│   ├── src/
│   │   ├── components/     # SecureTraceNav, charts, modals, layout
│   │   ├── services/       # Axios API client configuration
│   │   ├── utils/          # Report generators and helpers
│   │   └── App.tsx         # SPA root with routing & theme switcher
│   ├── index.html          # Vite entry point
│   ├── package.json        # Frontend dependencies & scripts
│   └── vite.config.ts
├── datasets/               # Optional training datasets (external download)
├── data/                   # Persisted models, cache, exports (gitignored)
├── .env.example            # Backend environment template
└── README.md               # Project documentation
```

## 🚦 Quick Start

### Prerequisites

- Python 3.10 or higher
- Node.js 18+ and npm (or pnpm)
- Git
- Optional BlockCypher API token for higher rate limits

### 1. Clone the repository

```bash
git clone https://github.com/bitscan/bitscan.git
cd bitscan
```

### 2. Backend setup (FastAPI)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
# Windows (PowerShell)
copy ..\.env.example .env    # update credentials and thresholds
# macOS/Linux
# cp ../.env.example .env
uvicorn main:app --reload
```

Run these commands from the repository root. The backend hosts REST endpoints at `http://localhost:8000/api/v1` with interactive docs at `http://localhost:8000/docs`.

### 3. Frontend setup (React dashboard)

```bash
cd ../frontend
npm install
echo VITE_API_URL=http://localhost:8000/api/v1 > .env
npm run dev
```

Visit the analyst dashboard at `http://localhost:5173` (Vite will print the exact URL). The SPA talks to FastAPI via `VITE_API_URL`; add additional keys to `frontend/.env` as needed.

## 🔧 Configuration

### Backend `.env`

```env
# BlockCypher API (optional but recommended)
BLOCKCYPHER_API_TOKEN=your_api_token_here

# Application settings
FASTAPI_SECRET_KEY=your_secret_key_here
DATABASE_URL=sqlite:///bitscan.db

# ML Model tuning
MODEL_THRESHOLD=0.5
RISK_SCORE_WEIGHTS_HIGH=0.8
RISK_SCORE_WEIGHTS_MEDIUM=0.5
RISK_SCORE_WEIGHTS_LOW=0.2

# Blockchain settings
BITCOIN_NETWORK=main
MAX_TRANSACTION_DEPTH=5
MAX_WALLET_ANALYSIS_COUNT=1000
```

### Frontend `.env`

```env
# API base used by the React SPA
VITE_API_URL=http://localhost:8000/api/v1

# Optional feature flags
VITE_ENABLE_FAQ=true
```

## 📖 API Usage

All endpoints are prefixed with `/api/v1`.

- **Comprehensive analysis (UI default for richer risk factors)**
  ```bash
  curl "http://localhost:8000/api/v1/analyze/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?depth=2&include_detailed=true"
  ```

- **Fast analysis (limited data, lower latency)**
  ```bash
  curl "http://localhost:8000/api/v1/analyze-fast/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
  ```
  Note: Fast mode may return placeholder flags (e.g., "Fast analysis - limited data available"). The UI uses the comprehensive endpoint for more informative risk factors.

- **Wallet time-series for charts**
  ```bash
  curl "http://localhost:8000/api/v1/wallet/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa/timeseries?days=90&granularity=day"
  ```

- **Batch risk evaluation**
  ```bash
  curl -X POST "http://localhost:8000/api/v1/batch" \
    -H "Content-Type: application/json" \
    -d '{
      "addresses": ["address1", "address2", "address3"],
      "depth": 1,
      "include_detailed": false
    }'
  ```

- **Health and rate-limit status**
  ```bash
  curl "http://localhost:8000/api/v1/health"
  curl "http://localhost:8000/api/v1/rate-limit-status"
  ```

Sample response snippet:

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
  },
  "timestamp": "2025-01-06T08:45:17.123456"
}
```

See `backend/api/routes.py` for complete request/response schemas and explore the live OpenAPI docs at `http://localhost:8000/docs`.

## 🤖 Machine Learning Models

The enhanced ensemble in `backend/ml/enhanced_fraud_detector.py` blends:

- RandomForest, GradientBoosting, ExtraTrees, LightGBM, XGBoost
- MLP neural network for complex behavior detection
- IsolationForest anomaly scoring with sigmoid calibration

Key capabilities:

- **Dynamic weighting**: Confidence-aware blending of model probabilities
- **Fraud pattern registry**: Ransomware, mixer, ponzi, exit scam heuristics
- **Risk thresholds**: `VERY_LOW`, `MINIMAL`, `LOW`, `MEDIUM`, `ELEVATED`, `HIGH`, `CRITICAL`
- **Fallback logic**: Deterministic scoring for empty wallets or API timeouts

### Feature Engineering

Exactly 20 normalized features covering transaction counts, ratios, address entropy, temporal signals, and derived fraud indicators (see `_extract_features`).

## 🔍 Fraud Detection Techniques

### Pattern Recognition

- **Mixing Service Detection**: Identifies use of Bitcoin mixers
- **Rapid Fund Movement**: Detects quick consecutive transactions
- **High Fan-out**: Flags addresses with many output destinations
- **Cluster Analysis**: Groups related addresses under common control
- **Round Amount Detection**: Identifies suspiciously round transaction amounts


## 🧪 Testing

- **Backend smoke test**
  ```bash
  cd backend
  uvicorn main:app --reload
  ```
  Exercise `/api/v1/health`, `/api/v1/analyze-fast/{address}`, and `/docs` to confirm dependencies are loaded.

- **Frontend quality checks**
  ```bash
  cd frontend
  npm run lint
  npm run build
  ```

Add automated tests under `backend/tests/` or `frontend/src/__tests__/` as the project evolves. Monitor FastAPI logs for rate-limit warnings when load-testing.




---

**⚠️ Disclaimer**: BitScan is a tool for analysis and education. Always conduct your own research and due diligence before making any cryptocurrency investments or transactions.