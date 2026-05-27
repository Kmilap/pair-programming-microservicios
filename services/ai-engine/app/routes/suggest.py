import pybreaker
from fastapi import APIRouter
from pydantic import BaseModel

from ..services.anthropic_client import call_claude, fallback_suggestion

router = APIRouter()


class SuggestRequest(BaseModel):
    sessionId: str
    code: str
    question: str


@router.post("/suggest")
def suggest(req: SuggestRequest):
    prompt = (
        "Eres un tutor de programación experto ayudando a estudiantes universitarios.\n"
        f"El estudiante está trabajando en el siguiente código:\n\n```\n{req.code[:3000]}\n```\n\n"
        f"Pregunta del estudiante: {req.question}\n\n"
        "Proporciona una sugerencia clara, didáctica y concisa en español. "
        "No escribas el código completo; guía al estudiante paso a paso."
    )
    system = (
        "Eres un tutor de programación que guía sin revelar soluciones completas. "
        "Usa ejemplos simples, sé conciso y responde siempre en español."
    )
    try:
        text = call_claude(prompt, system=system)
        return {"suggestion": text, "source": "ai", "sessionId": req.sessionId}
    except pybreaker.CircuitBreakerError:
        return {**fallback_suggestion(), "sessionId": req.sessionId}
    except Exception:
        return {**fallback_suggestion(), "sessionId": req.sessionId}
