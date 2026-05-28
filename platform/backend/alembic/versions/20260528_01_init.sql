-- Initial schema for ERP transaction engines (PostgreSQL)
-- (truncated baseline) + idempotency table

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  branch_id VARCHAR(36) NOT NULL,
  scope VARCHAR(50) NOT NULL,
  key VARCHAR(120) NOT NULL,
  response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT uq_idempotency_scope_key UNIQUE(company_id, branch_id, scope, key)
);
