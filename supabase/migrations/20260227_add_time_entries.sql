-- Migration: add time_entries table
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

CREATE TABLE IF NOT EXISTS time_entries (
  id            UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID           NOT NULL REFERENCES projects(id)    ON DELETE CASCADE,
  freelancer_id UUID           NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,
  milestone_id  UUID                    REFERENCES milestones(id)  ON DELETE SET NULL,
  hours         DECIMAL(6, 2)  NOT NULL CHECK (hours > 0),
  description   TEXT           NOT NULL,
  date          TIMESTAMPTZ    NOT NULL,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_time_entries_project_id    ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_freelancer_id ON time_entries(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date          ON time_entries(date DESC);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_entries: participants read"
  ON time_entries FOR SELECT
  USING (
    is_project_client(project_id)
    OR is_project_freelancer(project_id)
  );

CREATE POLICY "time_entries: freelancer insert"
  ON time_entries FOR INSERT
  WITH CHECK (
    freelancer_id = auth.uid()
    AND is_project_freelancer(project_id)
  );

CREATE POLICY "time_entries: freelancer own"
  ON time_entries FOR ALL
  USING (freelancer_id = auth.uid());

CREATE POLICY "time_entries: admin all"
  ON time_entries FOR ALL
  USING (is_admin());
