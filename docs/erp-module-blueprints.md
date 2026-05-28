# ERP Module Blueprints (Production Specification)

Each module below includes: folder structure, backend APIs, schema, frontend pages, reusable UI, state, services, validation, tests, deployment notes.

## 1) Authentication & RBAC
- **Structure**: `platform/backend/app/models/auth.py`, `schemas/auth.py`, `services/auth_service.py`, `api/v1/endpoints/auth.py`, `platform/frontend/src/features/auth/*`
- **APIs**: `POST /api/v1/auth/login`, `POST /auth/refresh` (next), `POST /auth/logout` (next), `GET /auth/me` (next)
- **DB**: `users`, `roles`, `role_permissions`, session/audit tables
- **Pages**: Login, user-role assignment, permission matrix
- **UI Components**: role chips, permission grid, policy diff modal
- **State**: auth token + active tenant context store (Zustand)
- **Services**: password policy, JWT issue/verify, permission resolver
- **Validation**: strong password, lockout policy, JWT claims validation
- **Tests**: auth integration, role boundary tests, token expiry tests
- **Deploy**: rotate JWT secret, enforce HTTPS-only cookies for refresh token

## 2) Company Management
- **Structure**: `models/tenant.py`, `endpoints/companies.py`, `frontend/features/company/*`
- **APIs**: company CRUD, branch CRUD, financial year activate/switch
- **DB**: `companies`, `branches`, `financial_years`, user-tenant mappings
- **Pages**: Company setup wizard, branch admin, FY selector
- **UI**: company switcher, branch pill switch, FY ribbon
- **State**: active company/branch/FY in global context store
- **Services**: tenant context enforcement and policy checks
- **Validation**: GSTIN/PAN/state code checks
- **Tests**: cross-tenant isolation tests
- **Deploy**: tenant context required in API gateway/middleware

## 3) Inventory Management
- **Structure**: `models/inventory.py`, `endpoints/inventory.py`, `frontend/features/inventory/*`
- **APIs**: item master, batch ledger, near-expiry alerts, dead-stock analytics
- **DB**: `items`, `item_batches`, `stock_movements` (next), `reorder_rules` (next)
- **Pages**: item master, batch explorer, expiry dashboard
- **UI**: barcode input, rack heatmap, stock cards
- **State**: query cache via React Query + table filters
- **Services**: stock availability, reorder suggestions
- **Validation**: non-negative stock, batch uniqueness per item
- **Tests**: posting/rollback stock integrity tests
- **Deploy**: partition stock movements by fiscal year for scale

## 4) Purchase Management
- **Structure**: `models/purchase.py`, service `purchase_posting.py` (next), frontend purchase features
- **APIs**: purchase invoice, return, credit/debit notes, vendor ranking
- **DB**: `purchase_invoices`, `purchase_lines`, `purchase_returns`, tax breakup
- **Pages**: purchase entry, invoice OCR review, vendor dashboard
- **UI**: dense line editor, GST split panel
- **State**: draft invoice store + optimistic save
- **Services**: posting engine + GST computation + landed-cost allocation
- **Validation**: invoice duplicate guard, GST consistency checks
- **Tests**: posting idempotency + journal reconciliation
- **Deploy**: OCR workers via Celery queue

## 5) Sales Management
- **Structure**: `models/sales.py` + `services/sales_posting.py` (next)
- **APIs**: POS billing, sales return, dynamic pricing
- **DB**: `sales_invoices`, `sales_lines`, payment/outstanding links
- **Pages**: POS, invoice browser, return desk
- **UI**: keyboard bill grid, payment split modal, thermal-print panel
- **State**: POS draft session with keyboard command layer
- **Services**: invoice numbering, stock deduction, discount engine
- **Validation**: credit limit checks, mandatory batch tracing
- **Tests**: high-concurrency billing tests
- **Deploy**: queue print/PDF generation for resilience

## 6) Accounting
- **Structure**: `models/accounting.py`, reporting services (next)
- **APIs**: journal, ledger, trial balance, P&L, balance sheet
- **DB**: `ledger_accounts`, `journal_entries`, `journal_lines`
- **Pages**: voucher entry, ledger explorer, financial statements
- **UI**: debit/credit grid, drilldown report tree
- **State**: report parameter state + cached snapshots
- **Services**: double-entry validation engine
- **Validation**: debit=credit enforced; period lock checks
- **Tests**: financial statement integrity snapshots
- **Deploy**: materialized views for MIS speed

## 7) CRM & Customer Intelligence
- **Structure**: customer domain + AI scoring service modules (next)
- **APIs**: profile, purchase behavior, segmentation, risk score
- **DB**: customer master + features table + score history
- **Pages**: customer 360, credit watchlist
- **UI**: risk badge, trend sparkline, recommendation panel
- **State**: customer profile cache + insight timeline
- **Services**: feature generation + score model inference
- **Validation**: explainability metadata required for score publish
- **Tests**: model drift and score regression checks
- **Deploy**: model version pinning in inference service

## 8) Warehouse & Logistics
- **Structure**: dispatch and route optimization modules (next)
- **APIs**: dispatch assignment, route ETA, bottleneck alerts
- **DB**: dispatch jobs, route plans, delivery events
- **Pages**: dispatch board, route monitor
- **UI**: route gantt/map panel, SLA alerts
- **State**: live dispatch polling/query subscriptions
- **Services**: graph-based optimizer + ETA predictor
- **Validation**: geofence and status transition guards
- **Tests**: route optimizer quality and SLA tests
- **Deploy**: async optimization queue with retry policies

## 9) Analytics Dashboard
- **Structure**: analytics API layer + dashboard feature pages
- **APIs**: MIS KPIs, trend series, product intelligence, heatmaps
- **DB**: fact tables/materialized views/cache keys
- **Pages**: executive dashboard, product dashboard
- **UI**: dense cards, terminal-style trend widgets
- **State**: React Query prefetch + interval refresh
- **Services**: KPI aggregation, drilldown routing
- **Validation**: query budget and guardrails
- **Tests**: KPI consistency tests vs source ledgers
- **Deploy**: background refresh and cache warming

## 10) AI Features
- **Structure**: dedicated `ai-service` worker/API package (next phase)
- **APIs**: RAG ask, OCR extract, forecast run, anomaly detect, recommendations
- **DB**: vector index metadata, model outputs, annotation/review logs
- **Pages**: AI copilot, OCR review queue, forecast workbench
- **UI**: chat panel, confidence tags, explainability sidecar
- **State**: streaming chat state + job status state
- **Services**: embedding pipeline, retrieval, inference orchestrator
- **Validation**: PII redaction + source citation requirements
- **Tests**: eval suites for OCR, RAG answer quality, forecast error thresholds
- **Deploy**: separate autoscaling workers and GPU optional profile
