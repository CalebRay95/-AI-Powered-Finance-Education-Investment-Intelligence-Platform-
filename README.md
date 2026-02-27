<<<<<<< HEAD
# FinX — AI-Powered Finance Education & Investment Intelligence Platform
=======
#  AI-Powered Finance Education & Investment Intelligence Platform
>>>>>>> c84d8eb3aeac38fa711d49cc1c435dde791776fb

> **CODENEXUS Hackathon** | Full-Stack Financial Ecosystem

A unified, scalable web platform that bridges financial education, real-time market intelligence, and AI-driven advisory — all within a single environment.

---

## Problem Statement

Despite increased access to financial markets, a critical gap exists between financial learning and real-world application. Most individuals understand theoretical concepts but struggle to:

- Interpret market movements
- Analyse the impact of financial news on stock prices
- Build and manage portfolios with proper risk controls

Existing platforms separate learning, trading tools, and advisory systems.  
**FinX** solves this by integrating all three into one intelligent ecosystem.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 (JSX) + TailwindCSS + Vite |
| **Backend** | Node.js 18 + Express.js (ES Modules) |
| **Database** | MongoDB 8.x + Mongoose ODM |
| **ML / AI** | Python 3.11 + FastAPI + Uvicorn |
| **AI Language Model** | Google Gemini (`google-genai` SDK v1.65+) |
| **Stock Prediction** | XGBoost + LSTM (TensorFlow / Keras) |
| **Sentiment Analysis** | FinBERT (HuggingFace Transformers) + VADER |
| **Performance Core** | C++17 via Node.js N-API |
| **Real-time** | Socket.IO (WebSocket) |
| **Authentication** | JWT (jsonwebtoken) + bcrypt |
| **Package Manager (Python)** | `uv` (fast Rust-based pip replacement) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend  :5173                       │
│            React 18 + TailwindCSS + Vite                    │
│  Auth │ Academy │ Playground │ News │ Portfolio │ Advisor   │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST + WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│              Node.js / Express  :5000                       │
│      Auth │ Portfolio │ News │ Prediction │ Advisor         │
│                     Socket.IO                               │
└──────┬──────────────────────────┬───────────────────────────┘
       │ Mongoose                 │ HTTP (axios)
┌──────▼──────┐        ┌──────────▼────────────────┐
│  MongoDB     │        │   Python FastAPI  :8000   │
│  :27017      │        │  - /prediction            │
│  Users       │        │  - /advisor/chat (SSE)    │
│  Portfolios │        │  - /news/live (FinBERT)   │
│  Predictions │        │  - /explanation           │
│  NewsCache   │        │  - /portfolio/analyze     │
└─────────────┘        └──────────┬────────────────┘
                                   │ subprocess
                          ┌────────▼────────┐
                          │  C++ Core Lib   │
                          │  risk_engine    │
                          │  quant_math     │
                          │  backtester     │
                          └─────────────────┘
```

---

## Features

### 1. User Authentication
- Secure JWT-based login / registration
- Password hashing with bcrypt
- `authMiddleware.js` protects all private routes

### 2. Finance Academy (3-tab Learning Centre)
- **Courses tab** — 8 structured modules (Market Fundamentals → Risk Management) with interactive multi-choice quizzes, progress bars, and graded results
- **Books & Library tab** — 22 hand-curated finance books and novels (The Intelligent Investor, Flash Boys, The Big Short, The Psychology of Money, …) with cover art, genre tags, page count, and expandable summaries. Search + genre filter
- **Flashcards tab** — 5 flip-card decks (Market Basics · Technical Analysis · Valuation Ratios · Risk & Portfolio · Crypto & DeFi) totalling 52 cards, with dot-navigation, seen-progress tracker, and deck reset

### 3. Stock Prediction Playground
- Paper-trading arena — predict directional movement (UP / DOWN) without real money
- `XGBoost` + `LSTM` hybrid model trained on FAANG + NIFTY-50 historical data
- AI vs. user prediction comparison with Gemini-generated explanations
- C++ backtesting engine for fast historical strategy simulation

### 4. Financial News Intelligence
- Live RSS + NewsAPI feed with automatic ML-driven sentiment analysis
- **FinBERT** (HuggingFace) for financial tone; VADER as fallback
- Sentiment heatmaps and ticker-correlation timelines
- 30-minute MongoDB caching layer to reduce API calls

### 5. Portfolio Analyser
- Add holdings by ticker (alias normalisation: AMAZON→AMZN, APPLE→AAPL …)
- Recharts pie (allocation) + line (performance) + bar (risk) charts
- C++ `risk_engine` computes Sharpe ratio, VaR, and portfolio Beta in real-time
- Monte Carlo simulation via `quant_math` for forward stress testing

### 6. AI Financial Advisor (Gemini SSE Streaming)
- Conversational chatbot powered by **Google Gemini 2.0 Flash** (`google-genai` SDK)
- Server-Sent Events streaming (`/advisor/chat/stream`) for token-by-token delivery
- Context-aware responses referencing current news and portfolio state

### 7. Community Hub
- Real-time community chat via Socket.IO
- Chat history stored in MongoDB `Message` collection
- Threaded discussion accessible from the sidebar

---

## Repository Structure

```
FinX/
├── client/               # React 18 + Vite frontend
│   └── src/
│       ├── pages/        # Academy, Dashboard, Portfolio, Advisor, …
│       ├── components/   # Sidebar, DashboardLayout
│       ├── context/      # AuthContext (JWT)
│       └── utils/        # api.js (axios), socket.js
├── server/               # Node.js / Express backend
│   ├── routes/           # auth, portfolio, news, prediction, advisor
│   ├── models/           # Mongoose schemas
│   ├── socket/           # chatHandler.js (Socket.IO)
│   ├── services/         # coreEngine.js (C++ bridge)
│   └── config/db.js      # Resilient MongoDB connection (auto-retry)
├── ml-service/           # Python FastAPI microservice
│   ├── routers/          # prediction, advisor, news, explanation, portfolio_ai
│   ├── models/           # XGBoost + LSTM stock model
│   └── main.py           # FastAPI app entry, loads .env
├── core-engine/          # C++ risk & quant engine
│   ├── src/              # backtester.cpp, quant_math.cpp, risk_engine.cpp
│   └── include/          # header files
└── docs/
    └── postman_collection.json
```

---

## Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18 |
| MongoDB | 6+ (local) or Atlas |
| Python | ≥ 3.10 |
| `uv` (Python pkg mgr) | latest (`pip install uv`) |
| CMake + C++17 compiler | GCC / MSVC / Clang |

---

### 1. Clone

```bash
git clone https://github.com/your-org/finx.git
cd finx
```

---

### 2. Environment Variables

#### `server/.env`
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/finx
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
ML_SERVICE_URL=http://localhost:8000
NEWS_API_KEY=your_newsapi_org_key
```

#### `ml-service/.env`
```env
GEMINI_API_KEY=your_google_ai_studio_key
NEWS_API_KEY=your_newsapi_org_key
```

---

### 3. MongoDB (Local)

MongoDB can OOM-crash on machines with low RAM. Always start with a bounded cache:

```powershell
# Windows — start with 256 MB WiredTiger cache
Start-Process "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" `
  -ArgumentList "--dbpath C:\Users\$env:USERNAME\mongodb-data --logpath C:\Users\$env:USERNAME\mongodb-log\mongod.log --logappend --wiredTigerCacheSizeGB 0.25" `
  -WindowStyle Hidden
```

To make this permanent, edit `C:\Program Files\MongoDB\Server\8.2\bin\mongod.cfg`:
```yaml
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 0.25
```

---

### 4. Backend

```bash
cd server
npm install
npm run dev          # nodemon — auto-restarts on file change
```

Server exposes `http://localhost:5000`.  
On MongoDB disconnect the server **retries** automatically (no crash / EADDRINUSE loop).

> **One-command start:** `npm run dev` inside `server/` also auto-spawns the ML service on `:8000` — no separate terminal needed.

---

### 5. Frontend

```bash
cd client
npm install
npm run dev          # Vite HMR at http://localhost:5173
```

---

### 6. ML Microservice

The project uses `uv` for fast, reproducible Python package management.

> **Auto-spawned:** `npm run dev` inside `server/` boots the ML service automatically. Only run this manually if you are working on the ML service in isolation.

```bash
cd ml-service

# Create venv and install deps (first time only)
uv venv .venv
uv pip install -r requirements.txt --python .venv/Scripts/python.exe

# Optional: install FinBERT (large download ~500 MB)
uv pip install transformers torch --python .venv/Scripts/python.exe

# Start FastAPI manually (optional — auto-started by Node server)
.venv/Scripts/python.exe -m uvicorn main:app --reload --port 8000
```

> `transformers` is imported lazily — the service starts even without it, with VADER as fallback sentiment engine.

---

### 7. C++ Core Engine

```bash
cd core-engine
mkdir build && cd build
cmake ..
cmake --build . --config Release
```

The compiled module is loaded by `server/services/coreEngine.js` via Node.js N-API.

---

## MongoDB Schemas

### User
```js
{ name, email, passwordHash, learningProgress: [Object], predictionHistory: [ObjectId] }
```

### Portfolio
```js
{ userId, holdings: [{ ticker, quantity, avgBuyPrice }], riskScore, lastAnalyzed }
```

### Prediction
```js
{ userId, ticker, userPrediction, aiPrediction, actualOutcome, explanation, timestamp }
```

### NewsCache
```js
{ query, articles: [Object], fetchedAt, expiresAt }
```

---

## REST API Reference

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/portfolio/holdings` | Get user portfolio |
| POST | `/api/portfolio/analyze` | C++ risk analysis |
| GET | `/api/news/live?q=<query>` | FinBERT-scored live news |
| POST | `/api/prediction/submit` | Submit user prediction |
| GET | `/api/prediction/ai/:ticker` | XGBoost+LSTM forecast |
| POST | `/api/advisor/chat` | Gemini chat (blocking) |
| GET | `/api/advisor/chat/stream` | Gemini SSE stream |

> Full Postman collection: `docs/postman_collection.json`

---

## C++ Core Engine Modules

| Module | Responsibility |
|---|---|
| `risk_engine.cpp` | Portfolio VaR, Sharpe Ratio, Beta, correlation matrix |
| `quant_math.cpp` | Statistical functions, Monte Carlo simulation |
| `backtester.cpp` | Historical strategy backtesting with P&L reporting |

---

## Known Setup Notes

- **GEMINI**: Uses the new `google-genai` SDK (v1.65+). The old `google-generativeai` package is deprecated — do not install it.
- **Transformers / FinBERT**: Not bundled in `requirements.txt` due to large size. Install separately if needed; news sentiment falls back to VADER automatically.
- **MongoDB cache**: Always start with `--wiredTigerCacheSizeGB 0.25` on machines with < 8 GB RAM to prevent OOM crashes.
- **Server resilience**: `server/config/db.js` retries MongoDB connection every 5 s instead of crashing. `server/index.js` exits with a clear error on `EADDRINUSE` (no longer retries — kill the blocking PID manually).
- **ML auto-spawn**: `npm run dev` inside `server/` automatically boots the Python FastAPI service on `:8000` as a managed child process — no separate terminal required. It restarts up to 5× on crash and shuts down cleanly with the Node process.

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit with clear messages: `git commit -m "feat: add portfolio risk engine"`
4. Push and open a Pull Request

| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **ML / AI Engine** | Python (FastAPI microservice) |
| **Performance Core** | C++ (compiled modules via Node.js N-API / WebAssembly) |
| **Real-time** | Socket.IO |
| **Authentication** | JWT, bcrypt / Web3 wallet (Bonus) |
| **Version Control** | Git + GitHub |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                        Frontend                         │
│              React (JSX) + TailwindCSS                  │
│   Auth │ Learning │ Playground │ News │ Portfolio │ Chat │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API / WebSocket
┌──────────────────────▼──────────────────────────────────┐
│                   Backend (Node.js / Express)            │
│        Auth │ User │ Portfolio │ News │ Prediction       │
└──────┬─────────────────────────┬───────────────────────-┘
       │                         │
┌──────▼──────┐        ┌─────────▼──────────┐
│  MongoDB     │        │  Python FastAPI     │
│  (Mongoose) │        │  ML Microservice    │
│  Users       │        │  - Stock Prediction │
│  Portfolios │        │  - News Sentiment   │
│  News Cache │        │  - Strategy AI      │
│  Predictions│        └─────────┬───────────┘
└─────────────┘                  │
                        ┌────────▼────────┐
                        │  C++ Core Lib   │
                        │  - Risk Engine  │
                        │  - Quant Math   │
                        │  - Backtesting  │
                        └─────────────────┘
```

---

## Features

### 1. User Authentication & Profiles
- Secure JWT-based login/signup
- Track learning progress, prediction history, and portfolio insights
- **Bonus:** Web3 decentralized login via crypto wallet (MetaMask)

### 2. Finance Learning & Assessment Module
- Structured courses covering fundamental and advanced financial concepts
- Interactive quizzes and assessments
- Real-time progress tracking per user (stored in MongoDB)

### 3. Stock Prediction Playground
- Paper-trading arena — users predict stock movement without real money
- Compare user predictions vs. AI/ML-generated predictions vs. actual outcomes
- Intelligent explanations generated for every outcome (match or mismatch)
- C++ powered backtesting engine for fast historical simulation

### 4. Financial News Intelligence Module
- Live financial news feed with ML-driven sentiment analysis
- Visual demonstration of news impact on market price movement
- Heatmaps, timelines, and correlation charts (JSX + charting libs)

### 5. Portfolio Analyzer
- Upload or manually enter portfolio holdings
- Insights on allocation, performance metrics, and risk exposure
- C++ risk calculation engine for high-performance quantitative analysis

### 6. AI Financial Strategy Advisor (Chatbot)
- Conversational AI chatbot powered by LLM
- Draws insights from News Module, Portfolio Analyzer, and Stock Playground
- Answers personalized finance queries and suggests investment strategies

### 7. Community Hub *(Bonus)*
- Real-time community chat using Socket.IO
- Users share trading insights, tips, and analysis
- Threaded discussion boards


## Getting Started

### Prerequisites

- Node.js >= 18.x
- MongoDB (local or Atlas)
- Python >= 3.10
- CMake + C++17 compiler (GCC / MSVC / Clang)
- npm / yarn

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/finx.git
cd finx
```

---

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/finx

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# ML Service
ML_SERVICE_URL=http://localhost:8000

# News API
NEWS_API_KEY=your_newsapi_key

# Stock Data
STOCK_API_KEY=your_alpha_vantage_or_yahoo_key

# Web3 (optional)
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/your_project_id
```

---

### 3. Backend Setup

```bash
cd server
npm install
npm run dev
```

---

### 4. Frontend Setup

```bash
cd client
npm install
npm run dev
```

---

### 5. ML Microservice Setup

```bash
cd ml-service

# Create venv and install all deps (including google-genai for Gemini AI)
uv venv .venv
uv pip install -r requirements.txt --python .venv/Scripts/python.exe

# ML service is automatically started by the Node server —
# only run this manually for isolated ML development:
.venv/Scripts/python.exe -m uvicorn main:app --reload --port 8000
```

---

### 6. C++ Core Engine Build

```bash
cd core-engine
mkdir build && cd build
cmake ..
cmake --build . --config Release
```

---

## MongoDB Schemas

### User
```js
{
  name: String,
  email: String,
  passwordHash: String,
  walletAddress: String,       // Web3 bonus
  learningProgress: [Object],
  predictionHistory: [ObjectId],
  createdAt: Date
}
```

### Portfolio
```js
{
  userId: ObjectId,
  holdings: [{ ticker: String, quantity: Number, avgBuyPrice: Number }],
  riskScore: Number,
  lastAnalyzed: Date
}
```

### Prediction
```js
{
  userId: ObjectId,
  ticker: String,
  userPrediction: String,       // "UP" | "DOWN"
  aiPrediction: String,
  actualOutcome: String,
  explanation: String,
  timestamp: Date
}
```

---

## C++ Core Engine

The C++ engine handles computationally intensive tasks exposed to Node.js via N-API:

| Module | Responsibility |
|---|---|
| `risk_engine.cpp` | Portfolio VaR, Sharpe Ratio, Beta calculation |
| `quant_math.cpp` | Statistical analysis, Monte Carlo simulation |
| `backtester.cpp` | Historical strategy backtesting engine |

---

## API Endpoints (REST)

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & receive JWT |
| GET | `/api/portfolio/:userId` | Get user portfolio |
| POST | `/api/portfolio/analyze` | Run C++ risk analysis |
| GET | `/api/news/live` | Fetch & analyze live news |
| POST | `/api/prediction/submit` | Submit user prediction |
| GET | `/api/prediction/ai/:ticker` | Get AI stock prediction |
| POST | `/api/advisor/chat` | Chat with AI advisor |

> Full Postman documentation available in `/docs/postman_collection.json`

---

## API Documentation (Postman)

Import `docs/postman_collection.json` into Postman.  
Set the `baseUrl` collection variable to your server URL and run **Login** to auto-populate `{{token}}`.


### Bonus Features Targeted

- [x] Web3 Authentication (crypto wallet login)
- [x] Live Deployment (public demo URL)
- [x] Enhanced Interactive Visualizations
- [x] Community Build Up (real-time chat)

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit with meaningful messages: `git commit -m "feat: add portfolio risk engine"`
4. Push and open a Pull Request

---
