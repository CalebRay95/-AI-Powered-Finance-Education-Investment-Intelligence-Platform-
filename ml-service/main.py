from pathlib import Path
from dotenv import load_dotenv
# Always resolve .env relative to THIS file (main.py lives in ml-service/).
# This works regardless of the cwd that uvicorn was launched from.
load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import prediction
from routers import news
from routers import explanation
from routers import portfolio_ai

# ---------------------------------------------------------------------------
# Router imports — uncomment as each phase delivers the router module.
# ---------------------------------------------------------------------------
from routers import advisor

app = FastAPI(
    title="GIFT ML Service",
    description="Machine learning microservice for stock prediction, news sentiment, and AI advisory.",
    version="0.1.0",
)

# ── CORS (dev mode — restrict origins in production) ──────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Router registrations ──────────────────────────────────────────────────────
app.include_router(prediction.router,  prefix="/prediction",  tags=["Prediction"])
app.include_router(news.router,        prefix="/news",        tags=["News"])
app.include_router(explanation.router, prefix="/explanation", tags=["Explanation"])
app.include_router(portfolio_ai.router,prefix="/portfolio",   tags=["Portfolio AI"])
# Uncomment each block as the corresponding phase delivers the router.
#
app.include_router(advisor.router,     prefix="/advisor",    tags=["Advisor"])


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "GIFT ML Service"}
