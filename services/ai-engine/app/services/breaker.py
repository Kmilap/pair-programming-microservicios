import pybreaker

# Circuit Breaker: abre tras 3 fallos consecutivos, intenta reset en 30s.
# Patrón #5 del sprint — evidenciable en el Test del Mono.
_storage = pybreaker.CircuitMemoryStorage(pybreaker.STATE_CLOSED)

ai_breaker = pybreaker.CircuitBreaker(
    fail_max=3,
    reset_timeout=30,
    state_storage=_storage,
    name="anthropic_breaker",
)
