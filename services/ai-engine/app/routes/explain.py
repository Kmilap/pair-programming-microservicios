import pybreaker
from fastapi import APIRouter
from pydantic import BaseModel

from ..services.anthropic_client import call_claude, fallback_suggestion

router = APIRouter()


class ExplainRequest(BaseModel):
    sessionId: str
    code: str


@router.post("/explain")
def explain(req: ExplainRequest):
    prompt = (
        "Eres un tutor de programación. Explica el siguiente código de forma clara y didáctica "
        "para un estudiante universitario. Describe qué hace cada parte relevante, "
        "el propósito general y cualquier patrón o técnica importante. "
        "Responde en español, con párrafos cortos.\n\n"
        f"Código:\n```\n{req.code[:3000]}\n```"
    )
    try:
        text = call_claude(prompt)
        return {"suggestion": text, "source": "ai", "sessionId": req.sessionId}
    except pybreaker.CircuitBreakerError:
        return {**fallback_suggestion(), "sessionId": req.sessionId}
    except Exception:
        return {**fallback_suggestion(), "sessionId": req.sessionId}
