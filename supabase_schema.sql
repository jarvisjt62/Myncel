-- ============================================================
-- SENTINEL — Complete Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up all tables
-- ============================================================

-- ─────────────────────────────────────────
-- 1. ORGANIZATIONS (companies using Sentinel)
-- ─────────────────────────────────────────
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  industry    TEXT DEFAULT 'Manufacturing',
  plan        TEXT DEFAULT 'trial',        -- trial | starter | growth | professional
  trial_ends  DATE DEFAULT (NOW() + INTERVAL '90 days'),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 2. PROFILES (extends Supabase auth.users)
-- ─────────────────────────────────────────
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  full_name       TEXT,
  role            TEXT DEFAULT 'technician',  -- admin | manager | technician
  email           TEXT,
  phone           TEXT,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────
-- 3. FACILITIES (factory locations)
-- ─────────────────────────────────────────
CREATE TABLE facilities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,               -- "Main Plant", "Warehouse B"
  address     TEXT,
  city        TEXT,
  state       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 4. EQUIPMENT (the machines being monitored)
-- ─────────────────────────────────────────
CREATE TABLE equipment (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID REFERENCES organizations(id) ON DELETE CASCADE,
  facility_id         UUID REFERENCES facilities(id),
  name                TEXT NOT NULL,             -- "CNC Machine #1"
  model               TEXT,                      -- "Haas VF-2"
  manufacturer        TEXT,
  serial_number       TEXT,
  location            TEXT,                      -- "Building A, Line 2"
  installed_date      DATE,
  warranty_expiry     DATE,
  asset_tag           TEXT UNIQUE,
  status              TEXT DEFAULT 'active',     -- active | inactive | decommissioned
  notes               TEXT,
  image_url           TEXT,
  purchase_cost       DECIMAL(10,2),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 5. MAINTENANCE SCHEDULES (recurring tasks)
-- ─────────────────────────────────────────
CREATE TABLE maintenance_schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id    UUID REFERENCES equipment(id) ON DELETE CASCADE,
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,               -- "Oil Change"
  description     TEXT,
  interval_type   TEXT DEFAULT 'days',         -- days | weeks | months | hours
  interval_value  INTEGER NOT NULL,            -- e.g. 30 (for every 30 days)
  priority        TEXT DEFAULT 'medium',       -- low | medium | high | critical
  assigned_to     UUID REFERENCES profiles(id),
  estimated_mins  INTEGER,                     -- estimated time to complete
  last_completed  DATE,
  next_due        DATE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-calculate next_due on insert/update
CREATE OR REPLACE FUNCTION calculate_next_due()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_completed IS NOT NULL THEN
    IF NEW.interval_type = 'days' THEN
      NEW.next_due := NEW.last_completed + (NEW.interval_value || ' days')::INTERVAL;
    ELSIF NEW.interval_type = 'weeks' THEN
      NEW.next_due := NEW.last_completed + (NEW.interval_value * 7 || ' days')::INTERVAL;
    ELSIF NEW.interval_type = 'months' THEN
      NEW.next_due := NEW.last_completed + (NEW.interval_value || ' months')::INTERVAL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_schedule_update
  BEFORE INSERT OR UPDATE ON maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION calculate_next_due();

-- ─────────────────────────────────────────
-- 6. WORK ORDERS (actual maintenance tasks)
-- ─────────────────────────────────────────
CREATE TABLE work_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  equipment_id    UUID REFERENCES equipment(id),
  schedule_id     UUID REFERENCES maintenance_schedules(id),
  title           TEXT NOT NULL,
  description     TEXT,
  priority        TEXT DEFAULT 'medium',       -- low | medium | high | critical
  status          TEXT DEFAULT 'open',         -- open | in_progress | completed | cancelled
  assigned_to     UUID REFERENCES profiles(id),
  due_date        DATE,
  completed_at    TIMESTAMPTZ,
  completed_by    UUID REFERENCES profiles(id),
  completion_notes TEXT,
  parts_used      TEXT,
  labor_mins      INTEGER,
  labor_cost      DECIMAL(8,2),
  parts_cost      DECIMAL(8,2),
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 7. WORK ORDER PHOTOS (before/after images)
-- ─────────────────────────────────────────
CREATE TABLE work_order_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  caption       TEXT,
  photo_type    TEXT DEFAULT 'during',    -- before | during | after
  uploaded_by   UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 8. DOWNTIME INCIDENTS (unplanned failures)
-- ─────────────────────────────────────────
CREATE TABLE downtime_incidents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  equipment_id    UUID REFERENCES equipment(id),
  reported_by     UUID REFERENCES profiles(id),
  title           TEXT NOT NULL,
  description     TEXT,
  cause           TEXT,
  started_at      TIMESTAMPTZ NOT NULL,
  resolved_at     TIMESTAMPTZ,
  downtime_mins   INTEGER,               -- calculated: resolved_at - started_at
  estimated_cost  DECIMAL(10,2),
  work_order_id   UUID REFERENCES work_orders(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 9. PARTS INVENTORY (spare parts tracking)
-- ─────────────────────────────────────────
CREATE TABLE parts_inventory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,           -- "Oil Filter - Haas VF-2"
  part_number     TEXT,
  supplier        TEXT,
  quantity        INTEGER DEFAULT 0,
  min_quantity    INTEGER DEFAULT 1,       -- alert when stock falls below this
  unit_cost       DECIMAL(8,2),
  location        TEXT,                    -- where it's stored
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 10. NOTIFICATIONS LOG
-- ─────────────────────────────────────────
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES profiles(id),
  type          TEXT NOT NULL,             -- maintenance_due | overdue | work_order_assigned | downtime
  title         TEXT NOT NULL,
  message       TEXT,
  reference_id  UUID,                      -- work_order_id or equipment_id
  is_read       BOOLEAN DEFAULT FALSE,
  sent_email    BOOLEAN DEFAULT FALSE,
  sent_sms      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Users can only see data from their own organization
-- ─────────────────────────────────────────

ALTER TABLE organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities         ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment          ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_photos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE downtime_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_inventory    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's org_id
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS: organizations
CREATE POLICY "Users see own org" ON organizations
  FOR ALL USING (id = get_user_org_id());

-- RLS: profiles
CREATE POLICY "Users see own org profiles" ON profiles
  FOR ALL USING (org_id = get_user_org_id());

-- RLS: facilities
CREATE POLICY "Users see own org facilities" ON facilities
  FOR ALL USING (org_id = get_user_org_id());

-- RLS: equipment
CREATE POLICY "Users see own org equipment" ON equipment
  FOR ALL USING (org_id = get_user_org_id());

-- RLS: maintenance_schedules
CREATE POLICY "Users see own org schedules" ON maintenance_schedules
  FOR ALL USING (org_id = get_user_org_id());

-- RLS: work_orders
CREATE POLICY "Users see own org work orders" ON work_orders
  FOR ALL USING (org_id = get_user_org_id());

-- RLS: downtime_incidents
CREATE POLICY "Users see own org incidents" ON downtime_incidents
  FOR ALL USING (org_id = get_user_org_id());

-- RLS: parts_inventory
CREATE POLICY "Users see own org parts" ON parts_inventory
  FOR ALL USING (org_id = get_user_org_id());

-- RLS: notifications
CREATE POLICY "Users see own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- ─────────────────────────────────────────
-- USEFUL VIEWS
-- ─────────────────────────────────────────

-- View: Equipment with maintenance status
CREATE VIEW equipment_maintenance_status AS
SELECT
  e.id,
  e.name AS equipment_name,
  e.location,
  e.org_id,
  ms.name AS task_name,
  ms.next_due,
  ms.priority,
  ms.last_completed,
  CASE
    WHEN ms.next_due < CURRENT_DATE THEN 'overdue'
    WHEN ms.next_due <= CURRENT_DATE + INTERVAL '3 days' THEN 'warning'
    ELSE 'ok'
  END AS status,
  (ms.next_due - CURRENT_DATE) AS days_until_due
FROM equipment e
LEFT JOIN maintenance_schedules ms ON ms.equipment_id = e.id
WHERE ms.is_active = TRUE;

-- View: Monthly maintenance cost summary
CREATE VIEW monthly_cost_summary AS
SELECT
  org_id,
  DATE_TRUNC('month', completed_at) AS month,
  COUNT(*) AS completed_orders,
  SUM(labor_cost) AS total_labor_cost,
  SUM(parts_cost) AS total_parts_cost,
  SUM(labor_cost + parts_cost) AS total_cost
FROM work_orders
WHERE status = 'completed'
GROUP BY org_id, DATE_TRUNC('month', completed_at);

-- ─────────────────────────────────────────
-- SEED DATA (for testing / demo)
-- ─────────────────────────────────────────

-- Demo organization
INSERT INTO organizations (id, name, industry, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'Acme Manufacturing Co.', 'Manufacturing', 'trial');

-- Demo facility
INSERT INTO facilities (id, org_id, name, city, state)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Main Plant', 'Cleveland', 'OH'
);

-- Demo equipment
INSERT INTO equipment (org_id, facility_id, name, model, manufacturer, location, installed_date) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'CNC Machine #1', 'Haas VF-2', 'Haas Automation', 'Building A, Line 1', '2021-03-15'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Conveyor Belt B', 'Hytrol E-Z', 'Hytrol', 'Building B', '2020-06-01'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Hydraulic Press #2', 'Greenerd 50T', 'Greenerd', 'Building A, Line 2', '2019-11-20'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Air Compressor', 'Ingersoll R110i', 'Ingersoll Rand', 'Utility Room', '2022-01-10'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Forklift #3', 'Toyota 8FGU25', 'Toyota', 'Warehouse', '2020-09-05');