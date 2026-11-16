-- WarLike Business / Cloudflare D1 — migration 0001.
-- Montants en centimes : jamais de FLOAT pour les sommes.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS business_tenants (
 id TEXT PRIMARY KEY,
 legal_name TEXT NOT NULL,
 country_code TEXT NOT NULL CHECK(length(country_code)=2),
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS business_memberships (
 tenant_id TEXT NOT NULL REFERENCES business_tenants(id) ON DELETE CASCADE,
 member_id TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('owner','admin','accountant','viewer')),
 PRIMARY KEY(tenant_id,member_id)
);
CREATE TABLE IF NOT EXISTS business_clients (
 id TEXT PRIMARY KEY,
 tenant_id TEXT NOT NULL REFERENCES business_tenants(id),
 name TEXT NOT NULL,
 email TEXT,
 billing_address TEXT,
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 archived_at TEXT,
 UNIQUE(id,tenant_id)
);
CREATE INDEX IF NOT EXISTS idx_business_clients_tenant ON business_clients(tenant_id,archived_at);
CREATE TABLE IF NOT EXISTS business_documents (
 id TEXT PRIMARY KEY,
 tenant_id TEXT NOT NULL REFERENCES business_tenants(id),
 client_id TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('quote','contract','invoice','credit_note')),
 status TEXT NOT NULL CHECK(status IN ('draft','issued','accepted','rejected','cancelled','paid')),
 reference TEXT,
 currency TEXT NOT NULL DEFAULT 'EUR' CHECK(length(currency)=3),
 subtotal_cents INTEGER NOT NULL CHECK(subtotal_cents>=0),
 tax_cents INTEGER NOT NULL CHECK(tax_cents>=0),
 total_cents INTEGER NOT NULL CHECK(total_cents=subtotal_cents+tax_cents),
 tax_snapshot_json TEXT NOT NULL CHECK(json_valid(tax_snapshot_json)),
 legal_snapshot_json TEXT NOT NULL CHECK(json_valid(legal_snapshot_json)),
 issued_at TEXT,
 due_at TEXT,
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 FOREIGN KEY (client_id,tenant_id) REFERENCES business_clients(id,tenant_id),
 UNIQUE(tenant_id,kind,reference),
 CHECK((status='draft' AND reference IS NULL AND issued_at IS NULL) OR (status<>'draft' AND reference IS NOT NULL AND issued_at IS NOT NULL)),
 UNIQUE(id,tenant_id)
);
CREATE INDEX IF NOT EXISTS idx_business_docs_tenant ON business_documents(tenant_id,kind,status);
CREATE TABLE IF NOT EXISTS business_document_lines (
 id TEXT PRIMARY KEY,
 document_id TEXT NOT NULL REFERENCES business_documents(id),
 position INTEGER NOT NULL,
 description TEXT NOT NULL,
 quantity_milli INTEGER NOT NULL CHECK(quantity_milli>0),
 unit_price_cents INTEGER NOT NULL CHECK(unit_price_cents>=0),
 tax_rate_basis_points INTEGER NOT NULL CHECK(tax_rate_basis_points BETWEEN 0 AND 10000),
 UNIQUE(document_id,position)
);
CREATE TABLE IF NOT EXISTS business_sequence (
 tenant_id TEXT NOT NULL REFERENCES business_tenants(id),
 series TEXT NOT NULL,
 next_number INTEGER NOT NULL CHECK(next_number>=1),
 PRIMARY KEY(tenant_id,series)
);
CREATE TABLE IF NOT EXISTS business_payments (
 id TEXT PRIMARY KEY,
 tenant_id TEXT NOT NULL,
 invoice_id TEXT NOT NULL,
 amount_cents INTEGER NOT NULL CHECK(amount_cents>0),
 currency TEXT NOT NULL CHECK(length(currency)=3),
 source TEXT NOT NULL CHECK(source IN ('manual','processor')),
 provider_reference TEXT,
 received_at TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 FOREIGN KEY(invoice_id,tenant_id) REFERENCES business_documents(id,tenant_id)
);
CREATE TABLE IF NOT EXISTS business_audit (
 id TEXT PRIMARY KEY,
 tenant_id TEXT NOT NULL REFERENCES business_tenants(id),
 actor_member_id TEXT NOT NULL,
 action TEXT NOT NULL,
 object_id TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_business_audit_tenant ON business_audit(tenant_id,created_at);
-- Les transitions, séries atomiques, règles TVA, paiements réels et verrouillage
-- des pièces émises doivent être appliqués par le service sécurisé avant production.
