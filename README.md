# MuleShield AI - Enterprise Anti-Money Laundering & Fraud Detection System

MuleShield AI is a state-of-the-art, production-ready, domain-driven monorepo project designed for real-time transaction monitoring, money mule detection, case management, and compliance reporting.

## Project Structure

```
muleshield-ai/
├── apps/                        # Frontend applications (Next.js web and React Native mobile)
├── services/                    # Domain microservices (FastAPI)
├── databases/                   # Database configuration templates and schemas
├── ai/                          # AI/ML models, training pipelines, and feature stores
├── infrastructure/              # Infrastructure as Code (Terraform, Kubernetes, etc.)
├── monitoring/                  # Observability dashboards and logs configuration
├── docs/                        # Architectural diagrams and technical specifications
├── tests/                       # Global end-to-end and integration tests
├── .github/workflows/           # CI/CD pipelines
└── scripts/                     # Operational automation scripts
```

## Quick Start

1. Clone the repository
2. Set up local configurations:
   ```bash
   cp .env.example .env
   ```
3. Boot up the entire system locally:
   ```bash
   make up
   ```

## Development and Deployment

Refer to individual READMEs inside `apps/`, `services/`, and `databases/` for detailed instructions.
