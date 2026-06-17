CREATE TABLE IF NOT EXISTS disclosures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ref_number TEXT UNIQUE NOT NULL,
  edit_token TEXT UNIQUE NOT NULL,
  customer_email TEXT NOT NULL,
  event_date TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  phone TEXT,
  event_address TEXT,
  children_count INTEGER DEFAULT 0,
  children_json TEXT NOT NULL DEFAULT '[]',
  emergency_json TEXT NOT NULL DEFAULT '{}',
  waiver_accepted INTEGER DEFAULT 0,
  signer_name TEXT,
  sig_date TEXT,
  signature_b64 TEXT,
  initial_email_sent INTEGER DEFAULT 0,
  customer_email_sent INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_date ON disclosures(customer_email, event_date);
