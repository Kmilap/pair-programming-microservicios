import json
import pybreaker
from fastapi import APIRouter
from pydantic import BaseModel

from ..services.anthropic_client import call_claude, fallback_review

router = APIRouter()


class ReviewRequest(BaseModel):
    sessionId: str
    code: str


def _parse_json_comments(raw: str) -> list:
    raw = raw.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1] if len(parts) > 1 else raw
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


@router.post("/review")
def review(req: ReviewRequest):
    prompt = (
        "Eres un profesor de programación revisando código de un estudiante universitario.\n"
        "Devuelve ÚNICAMENTE un JSON válido (sin texto adicional, sin bloques markdown) con este formato:\n"
        '[{"line": 1, "comment": "comentario aquí"}, ...]\n\n'
        "Solo incluye líneas con algo relevante: errores, mejoras de eficiencia o buenas prácticas. "
        "Máximo 8 comentarios. Responde siempre en español.\n\n"
        f"Código a revisar:\n{req.code[:3000]}"
    )
    try:
        raw = call_claude(prompt)
        comments = _parse_json_comments(raw)
        return {"comments": comments, "source": "ai", "sessionId": req.sessionId}
    except pybreaker.CircuitBreakerError:
        return {**fallback_review(), "sessionId": req.sessionId}
    except json.JSONDecodeError:
        # Claude devolvió texto no-JSON — tratarlo como sugerencia textual
        return {
            "comments": [{"line": 0, "comment": raw}],
            "source": "ai",
            "sessionId": req.sessionId,
        }
    except Exception:
        return {**fallback_review(), "sessionId": req.sessionId}
