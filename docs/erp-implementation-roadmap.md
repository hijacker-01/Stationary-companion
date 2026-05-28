# ERP Implementation Roadmap (Production Track)

## Target Topology
- **UI**: React + TypeScript + Tailwind + shadcn, command-palette + keyboard-first workflows
- **API**: FastAPI + SQLAlchemy 2 + Pydantic v2, versioned REST (`/api/v1`)
- **Data**: PostgreSQL, Redis, Alembic migrations, audit/event tables
- **Async/AI**: Celery workers for OCR, forecasting, anomaly detection, recommendation jobs
- **Ops**: Docker Compose local stack, Nginx edge, CI pipeline (lint/test/build/security)

## Module Delivery Plan

### Phase 1: Platform Foundation (current commit scope)
- Auth + RBAC scaffolding
- Tenant/company/branch + context headers
- Core inventory entities with batch/expiry and alert endpoint
- API versioning, pagination DTO, structured logging
- Modern frontend shell layout with left nav + right quick panel

### Phase 2: Transaction Engines
- Purchase + sales posting services with atomic inventory + accounting entries
- GST rule engine and invoice numbering service
- Credit/debit note lifecycle

### Phase 3: Finance + Analytics
- Journal/ledger/trial balance/P&L/balance sheet APIs
- MIS snapshots and metrics warehouse materialized views

### Phase 4: AI/Automation
- OCR ingestion queue + review UI
- RAG assistant over governed ERP semantic layer
- Forecasting, anomaly detection, reorder recommendations

### Phase 5: Scale/Enterprise Hardening
- Rate limiting, policy engine hardening, observability SLOs
- Bulk import/export with validation pipelines
- Thermal printer/PDF templates, multilingual packs

## Module-by-Module Implementation Checklist
For each ERP module: folder structure, DB schema, API contracts, service layer, frontend pages, shared components, validation, tests, deployment notes are tracked in this order:
1. Authentication & RBAC
2. Company Management
3. Inventory Management
4. Purchase Management
5. Sales Management
6. Accounting
7. CRM Intelligence
8. Warehouse & Logistics
9. Analytics
10. AI Services
