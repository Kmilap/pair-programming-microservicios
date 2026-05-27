"""
B5 — Análisis pedagógico post-sesión.

POST /ai/analyze
  Body: { sessionId, exerciseTitle, code, durationSeconds }
  Returns: { summary, code_quality, collaboration, suggestions, highlights, source, sessionId }

Usa el mismo Circuit Breaker que /suggest y /review.
"""

import json
import pybreaker
from fastapi import APIRouter
from pydantic import BaseModel

from ..services.anthropic_client import call_claude

router = APIRouter()


class AnalyzeRequest(BaseModel):
    sessionId: str
    exerciseTitle: str
    code: str
    durationSeconds: int = 0


def _fallback_report(session_id: str, reason: str = "Circuit Breaker activo") -> dict:
    return {
        "summary": f"Análisis no disponible — {reason}. Inténtalo de nuevo en unos momentos.",
        "code_quality": {"score": 0, "feedback": "No disponible"},
        "collaboration": {"score": 0, "feedback": "No disponible"},
        "suggestions": [],
        "highlights": [],
        "source": "fallback",
        "sessionId": session_id,
    }


@router.post("/analyze")
def analyze(req: AnalyzeRequest):
    """
    Genera un reporte pedagógico estructurado de una sesión de pair programming.
    Usado por el microservicio Notifications para implementar el diferenciador B5.
    """
    minutes = req.durationSeconds // 60
    seconds = req.durationSeconds % 60

    prompt = f"""Eres un profesor universitario de programación evaluando una sesión de pair programming.

Ejercicio: {req.exerciseTitle}
Duración de la sesión: {minutes} minutos {seconds} segundos
Código producido por los estudiantes:
```
{req.code[:4000]}
```

Analiza la sesión pedagógicamente y devuelve ÚNICAMENTE el siguiente JSON sin texto adicional, sin bloques markdown ni comentarios:
{{
  "summary": "Resumen pedagógico de la sesión en 2-3 oraciones. Menciona el ejercicio y el progreso.",
  "code_quality": {{
    "score": 7,
    "feedback": "Evaluación constructiva de la calidad del código: estructura, legibilidad, patrones usados."
  }},
  "collaboration": {{
    "score": 8,
    "feedback": "Evaluación del trabajo en equipo basada en la duración y el progreso visto en el código."
  }},
  "suggestions": [
    "Primera mejora concreta y accionable para los estudiantes",
    "Segunda mejora concreta y accionable"
  ],
  "highlights": [
    "Primer punto positivo destacable de la sesión",
    "Segundo punto positivo destacable"
  ]
}}

Los scores van de 0 a 10. Sé constructivo, específico y usa lenguaje para estudiantes universitarios."""

    try:
        raw = call_claude(prompt)

        # Limpiar posibles bloques markdown que el modelo a veces incluye
        raw = raw.strip()
        if raw.startswith("```"):
            parts = raw.split("```")
            # Tomar el contenido dentro del bloque
            raw = parts[1] if len(parts) > 1 else raw
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

        report = json.loads(raw)

        return {**report, "source": "ai", "sessionId": req.sessionId}

    except pybreaker.CircuitBreakerError:
        return _fallback_report(req.sessionId, "Motor de IA con Circuit Breaker abierto")

    except json.JSONDecodeError as e:
        # El modelo respondió pero no como JSON válido — guardar respuesta como summary
        return {
            "summary": raw[:500] if raw else "Error al procesar el análisis.",
            "code_quality": {"score": 0, "feedback": "No disponible"},
            "collaboration": {"score": 0, "feedback": "No disponible"},
            "suggestions": [],
            "highlights": [],
            "source": "error",
            "sessionId": req.sessionId,
        }

    except Exception as e:
        return _fallback_report(req.sessionId, f"Error inesperado: {str(e)[:100]}")
