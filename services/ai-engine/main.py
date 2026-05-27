from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import suggest, review, explain
from app.services.breaker import ai_breaker

app = FastAPI(
    title="AI Engine — Pair Programming Microservicios",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(suggest.router, prefix="/ai")
app.include_router(review.router, prefix="/ai")
app.include_router(explain.router, prefix="/ai")


@app.get("/ai/health")
def health():
    return {
        "status": "ok",
        "service": "ai-engine",
        "circuit_breaker_state": ai_breaker.current_state,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/ai/circuit-status")
def circuit_status():
    """Expone el estado interno del Circuit Breaker — útil para el Test del Mono."""
    return {
        "state": ai_breaker.current_state,
        "fail_counter": ai_breaker.fail_counter,
        "name": ai_breaker.name,
        "fail_max": ai_breaker.fail_max,
        "reset_timeout": ai_breaker.reset_timeout,
    }
