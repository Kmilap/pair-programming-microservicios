import anthropic
from .breaker import ai_breaker
from ..config import settings

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)


@ai_breaker
def call_claude(prompt: str, system: str | None = None) -> str:
    kwargs: dict = {
        "model": settings.anthropic_model,
        "max_tokens": 1024,
        "messages": [{"role": "user", "content": prompt}],
    }
    if system:
        kwargs["system"] = system
    response = _client.messages.create(**kwargs)
    return response.content[0].text


def fallback_suggestion() -> dict:
    return {
        "suggestion": (
            "El Motor de IA no está disponible en este momento. "
            "El Circuit Breaker está abierto tras detectar fallos. "
            "Intenta de nuevo en 30 segundos."
        ),
        "source": "fallback",
    }


def fallback_review() -> dict:
    return {
        "comments": [],
        "source": "fallback",
        "message": "El Motor de IA no está disponible. Circuit Breaker activo.",
    }
