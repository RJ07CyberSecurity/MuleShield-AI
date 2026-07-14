# Detection Engine

This FastAPI microservice contains domain services and API logic for handling **detection engine** tasks.

## Service Architecture

Following Clean Architecture principles:
- `app/`: FastAPI application startup, event handlers, and core middleware.
- `api/`: Controllers, endpoints, routes, and route dependency injection.
- `models/`: Database schema entities (SQLAlchemy/Beanie/Neo4j models).
- `schemas/`: Request/Response validation schemas (Pydantic objects).
- `repository/`: Data layer abstraction to support database operations.
- `services/`: Pure domain core and business rules implementation.
- `utils/`: Utilities specific to this service's scope.
- `tests/`: Automated unit and integration tests.
