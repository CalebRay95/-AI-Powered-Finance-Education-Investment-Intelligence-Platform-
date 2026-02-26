#  AI-Powered Finance Education & Investment Intelligence Platform

> **CODENEXUS Hackathon** | Full-Stack Financial Ecosystem

A unified, scalable web platform that bridges financial education, real-time market intelligence, and AI-driven advisory — all within a single environment.

---

## Problem Statement

Despite increased access to financial markets, a critical gap exists between financial learning and real-world application. Most individuals understand theoretical concepts but struggle to:

- Interpret market movements
- Analyze the impact of financial news
- Manage portfolios effectively

Existing platforms separate learning, trading tools, and advisory systems.  
**GIFT** solves this by integrating all these into one intelligent ecosystem.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js (JSX), TailwindCSS |
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
git clone https://github.com/your-org/gift.git
cd gift
```

---

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/gift

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
pip install -r requirements.txt
# 1. Install N



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
