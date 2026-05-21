# Pair Programming Asistido por IA — Fase 2

Sistema de microservicios para sesiones de pair programming con asistencia de IA, desarrollado como parcial de Arquitectura de Software (UNAB, mayo 2026).

**Equipo:**
- Nicole Camila Niño Ariza (Backend)
- Noel Santiago Méndez Jaimes (Frontend)

**Docentes:** Mg. Fabian Suarez · Mg. Javier Pinzón

---

## Arquitectura

5 microservicios + Traefik (gateway) + RabbitMQ (broker) + Redis + Frontend:

| Servicio | Stack | Puerto | Base de datos |
|---|---|---|---|
| Auth | Laravel 12 · PHP 8.3 | 8000 | PostgreSQL |
| Pair Programming | Laravel 12 · PHP 8.3 | 8000 | PostgreSQL |
| Editor Colaborativo | Node 24 · Yjs | 1234 | Redis |
| AI Engine | Python 3.12 · FastAPI | 8000 | PostgreSQL |
| Notifications | Laravel 12 · PHP 8.3 | 8000 | SQLite |

---

## Requisitos previos

- Docker Desktop con WSL2 integration (Windows) o Docker Engine (Linux/Mac)
- Git
- 8 GB de RAM disponibles para Docker

---

## Levantar el proyecto

```bash
# 1. Clonar
git clone git@github.com:Kmilap/pair-programming-microservicios.git
cd pair-programming-microservicios

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con valores reales (al menos ANTHROPIC_API_KEY)

# 3. Levantar todo
docker compose up --build
```

**Accesos:**
- Frontend: http://localhost:5173
- API Gateway: http://localhost
- Traefik UI: http://localhost:8080
- RabbitMQ UI: http://localhost:15672

---

## Estado del proyecto

🚧 En desarrollo activo. Última actualización: Día 1 (estructura + infraestructura).

---

## Documentación adicional

- [Plan de Sprint](./docs/SCRUM_Pair_Programming_Fase2.md)
- [Contratos de API](./docs/contracts.md)
- [Bitácora diaria](./docs/daily-log.md)