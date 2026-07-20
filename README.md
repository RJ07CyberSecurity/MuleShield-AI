# MuleShield AI - Enterprise Anti-Money Laundering & Fraud Detection System

MuleShield AI is a state-of-the-art, production-ready, domain-driven monorepo project designed for real-time transaction monitoring, money mule detection, case management, and compliance reporting.

## Project Structure

```
muleshield-ai/
├── apps/                        # Frontend applications (Next.js web and React Native mobile)
├── backend/                     # Backend ecosystem
│   ├── services/                # Domain microservices (FastAPI)
│   └── shared/                  # Enterprise shared common library
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

Refer to individual READMEs inside `apps/`, `backend/`, and `databases/` for detailed instructions.

---

## Ingestion, Detection & AI Reporting Slice

This project now implements a fully integrated end-to-end slice for file statements ingestion, batch KYC/transactions API ingestion, explainable risk scoring, interactive network graphing, and compliance case lifecycle controls:

### 1. Backend Services & API Endpoints
All endpoints are proxied transparently through the API Gateway at port `8000`:
*   **API Gateway (`:8000`)**:
    *   `GET /metrics` - Exposes real-time request counts and average latency metrics per microservice in standard Prometheus format.
*   **Ingestion Service (`:8004`)**:
    *   `POST /api/v1/ingestion/upload` - Accepts `.csv` and `.pdf` bank statement statement files up to 25MB. Performs batch schema validation, deduplication check (fingerprints), and stores them with `STAGED` status.
    *   `POST /api/v1/ingestion/{id}/confirm` - Updates transaction status to `CONFIRMED`, registers new accounts dynamically, and auto-spawns risk detection analysis.
    *   `GET /api/v1/ingestion/{id}/summary` - Returns aggregated batch statistics (counts, volume, date ranges, linked flagged alert counts).
    *   `POST /api/v1/ingest/kyc` - Batch API to upload KYC records, auto-seeding bank customer nodes.
    *   `POST /api/v1/ingest/transactions` - Batch API to ingest transactional logs, validating duplicates and auto-triggering detection.
*   **Detection Engine (`:8005`)**:
    *   `POST /api/v1/detection/run` - Runs composite orchestrator: 50% Rule Engine (R1 to R10), 30% ML Inference (XGBoost/Isolation Forest + SHAP contributors), 20% Graph PageRank (Neo4j degree centrality).
    *   `GET /api/v1/detection/flagged?ingestion_id=...` - Returns ranked flagged accounts with explainable factors details.
*   **Customer & Case Service (`:8002`)**:
    *   `GET /api/v1/cases/{id}` - Case details. Triggers an immutable audit log entry logging PII lookup queries.
    *   `POST /api/v1/cases/{id}/freeze-account` - Enforces compliance officer human-in-the-loop validation (requires officer role check) to freeze account assets, logging details to case timelines and the audit logs ledger.
*   **Reporting Service (`:8006`)**:
    *   `POST /api/v1/reports/generate` - Invokes Claude Sonnet 3.5 with strict data boundaries (fallback to deterministic templates if `ANTHROPIC_API_KEY` is missing) to draft SAR report files.
    *   `GET /api/v1/reports/{id}/download?format=pdf|docx` - Streams report files. PDF rendering uses `WeasyPrint` with an automated `ReportLab` fallback. Word files are compiled via `python-docx`.

### 2. Frontend React Components (ShadCN, Tailwind CSS, Framer Motion)
*   `<AccountDataUploader />` - Premium drag-and-drop / select interface, upload state transitions, quarantined validation reports list, and table row previews.
*   `<NetworkGraph />` - Interactive Cytoscape.js canvas rendering multi-hop relationships (customers, devices, shared IPs, transfer counterparties) with node selection highlighting and drag-and-zoom capabilities.
*   `<FlaggedAccountsTable />` - Sortable anomalies registry tables, threat severity badges, factor reason lists, client-side search, and drop-down severity filters.
*   `<ReportGenerator />` - Panel card offering instant draft generation triggers, text previews, and PDF/DOCX downloads.

### 3. Verification & Scripts
*   **Generate PDF Statement Fixture**:
    ```bash
    python scripts/generate_pdf_fixture.py
    ```
*   **Seed Synthetic Compliance Database**:
    ```bash
    python scripts/generate_synthetic_data.py
    ```
*   **Run Test Suite**:
    ```bash
    python -m pytest tests/test_feature_slice.py
    ```

