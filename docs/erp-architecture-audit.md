# ERP Architecture Audit (Current Codebase)

## Current State
- Backend is Express + Sequelize model files and route handlers but key bootstrap/config files are missing (`config/db`, app entrypoint, dependency manifests).
- Frontend is React with JavaScript pages and dense ERP-like styling, but core app wiring files are missing (`main`, `router`, shared state, API client).
- AI OCR hooks exist in route/page call patterns, but there is no production ML serving architecture, queueing, observability, or model lifecycle.

## Architecture Weaknesses
1. **Broken runtime boundaries**: source tree references missing modules and cannot be reliably booted in a clean environment.
2. **No strong tenancy model**: no first-class multi-company/branch/financial-year context isolation.
3. **Weak RBAC**: binary admin checks only; no policy matrix for ERP roles.
4. **Thin data governance**: no consistent soft delete, event log, audit actor tracking, or immutable ledger patterns.
5. **Inconsistent transactional behavior**: ad-hoc transactions in routes, no domain service boundary.
6. **Scalability limits**: no Redis cache, no Celery queue, no API versioning strategy, no rate limiting.
7. **Frontend coupling**: pages do data + workflow + rendering in one file; no feature modules, no query/state boundaries.
8. **Missing enterprise ergonomics**: keyboard command registry, bulk import/export pipeline, print adapter abstraction, i18n framework are absent.

## Compatibility-Safe Upgrade Strategy
- Keep existing `backend/` and `frontend/` untouched for continuity.
- Introduce new production platform under `platform/` with clean contracts.
- Migrate module-by-module using anti-corruption adapters and dual-write/dual-read patterns where needed.

## Missing Core Modules Against Target
- Multi-company + branch + financial year switching
- Full accounting journals/ledger engine
- Inventory lot/batch ledger + expiry + dead stock intelligence
- Purchase return/credit note workflows with accounting impact
- Sales/POS printer abstractions and invoice compliance templates
- CRM intelligence scoring and credit risk model
- Route optimization + logistics planner
- BI semantic layer and AI query assistant
- RAG + vector index + governance controls
- OCR pipeline with confidence scoring and human-in-the-loop review
