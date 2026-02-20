-- =============================================================
-- Freelancer-Client Dashboard – Initial Schema
-- =============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- GIN trigram index on skills.name
CREATE EXTENSION IF NOT EXISTS "unaccent";    -- Accent-insensitive search

-- =============================================================
-- ENUMS
-- =============================================================

CREATE TYPE user_role AS ENUM ('CLIENT', 'FREELANCER', 'ADMIN');

CREATE TYPE availability_status AS ENUM ('AVAILABLE', 'BUSY', 'UNAVAILABLE');

CREATE TYPE proficiency_level AS ENUM ('BEGINNER', 'INTERMEDIATE', 'EXPERT');

CREATE TYPE project_status AS ENUM (
  'DRAFT',
  'OPEN',
  'IN_PROGRESS',
  'REVIEW',
  'COMPLETED',
  'CANCELLED',
  'DISPUTED'
);

CREATE TYPE project_type AS ENUM ('FIXED', 'HOURLY');

CREATE TYPE bid_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

CREATE TYPE milestone_status AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'SUBMITTED',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE transaction_type AS ENUM ('MILESTONE_PAYMENT', 'REFUND', 'PLATFORM_FEE');

CREATE TYPE transaction_status AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'FROZEN'
);

CREATE TYPE file_type AS ENUM ('DELIVERABLE', 'PORTFOLIO', 'ATTACHMENT');

CREATE TYPE dispute_status AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED');

CREATE TYPE notification_type AS ENUM (
  'BID_RECEIVED',
  'BID_ACCEPTED',
  'BID_REJECTED',
  'MILESTONE_SUBMITTED',
  'MILESTONE_APPROVED',
  'MILESTONE_REJECTED',
  'PROJECT_COMPLETED',
  'DISPUTE_FILED',
  'DISPUTE_RESOLVED',
  'PAYMENT_RECEIVED',
  'REVIEW_RECEIVED'
);

-- =============================================================
-- TABLES
-- =============================================================

-- users: public profile record, mirrored from auth.users via trigger.
-- Single-table inheritance via the `role` discriminator column.
-- CLIENT and FREELANCER sub-types extend this table (1-to-1).
CREATE TABLE users (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL UNIQUE,
  role        user_role   NOT NULL DEFAULT 'FREELANCER',
  first_name  TEXT        NOT NULL DEFAULT '',
  last_name   TEXT        NOT NULL DEFAULT '',
  avatar_url  TEXT,
  bio         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- clients: CLIENT-specific attributes (extends users 1-to-1)
CREATE TABLE clients (
  id           UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT,
  website      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- freelancers: FREELANCER-specific attributes (extends users 1-to-1)
-- rating and completed_projects_count are denormalised caches maintained
-- by the recalculate_freelancer_rating() trigger for query performance.
CREATE TABLE freelancers (
  id                      UUID                NOT NULL PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  hourly_rate             DECIMAL(10, 2)      CHECK (hourly_rate > 0),
  availability_status     availability_status NOT NULL DEFAULT 'AVAILABLE',
  portfolio_url           TEXT,
  rating                  DECIMAL(3, 2)       NOT NULL DEFAULT 0.00
                            CHECK (rating >= 0 AND rating <= 5),
  completed_projects_count INT                NOT NULL DEFAULT 0
                            CHECK (completed_projects_count >= 0),
  on_time_delivery_rate   DECIMAL(5, 2)       NOT NULL DEFAULT 0.00
                            CHECK (on_time_delivery_rate >= 0 AND on_time_delivery_rate <= 100),
  created_at              TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- skills: normalised skill catalogue (admin-managed)
CREATE TABLE skills (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL UNIQUE,
  category   TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- freelancer_skills: M:N between freelancers and skills
CREATE TABLE freelancer_skills (
  freelancer_id       UUID              NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,
  skill_id            UUID              NOT NULL REFERENCES skills(id)      ON DELETE CASCADE,
  proficiency_level   proficiency_level NOT NULL DEFAULT 'INTERMEDIATE',
  years_of_experience INT               CHECK (years_of_experience >= 0),
  PRIMARY KEY (freelancer_id, skill_id)
);

-- projects: core entity representing a client's posted job
CREATE TABLE projects (
  id            UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id     UUID           NOT NULL REFERENCES clients(id)     ON DELETE RESTRICT,
  freelancer_id UUID                    REFERENCES freelancers(id) ON DELETE SET NULL,
  title         TEXT           NOT NULL,
  description   TEXT           NOT NULL,
  budget_min    DECIMAL(12, 2) NOT NULL CHECK (budget_min >= 0),
  budget_max    DECIMAL(12, 2) NOT NULL CHECK (budget_max >= budget_min),
  deadline      TIMESTAMPTZ    NOT NULL,
  status        project_status NOT NULL DEFAULT 'DRAFT',
  project_type  project_type   NOT NULL DEFAULT 'FIXED',
  -- agreed_rate is set when a bid is accepted (NULL until then)
  agreed_rate   DECIMAL(10, 2)          CHECK (agreed_rate > 0),
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  -- A freelancer must be assigned for any non-DRAFT/OPEN state
  CONSTRAINT chk_freelancer_assigned_when_active
    CHECK (status IN ('DRAFT', 'OPEN') OR freelancer_id IS NOT NULL)
);

-- project_skills: M:N between projects and skills (required skills)
CREATE TABLE project_skills (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id   UUID NOT NULL REFERENCES skills(id)   ON DELETE CASCADE,
  PRIMARY KEY (project_id, skill_id)
);

-- bids: a freelancer's offer on an OPEN project
CREATE TABLE bids (
  id                      UUID       PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id              UUID       NOT NULL REFERENCES projects(id)    ON DELETE CASCADE,
  freelancer_id           UUID       NOT NULL REFERENCES freelancers(id) ON DELETE CASCADE,
  proposed_rate           DECIMAL(10, 2) NOT NULL CHECK (proposed_rate > 0),
  estimated_duration_days INT        NOT NULL CHECK (estimated_duration_days > 0),
  cover_letter            TEXT       NOT NULL,
  status                  bid_status NOT NULL DEFAULT 'PENDING',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One bid per freelancer per project
  UNIQUE (project_id, freelancer_id)
);

-- milestones: ordered work packages within a project
CREATE TABLE milestones (
  id           UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id   UUID             NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title        TEXT             NOT NULL,
  description  TEXT,
  amount       DECIMAL(12, 2)   NOT NULL CHECK (amount > 0),
  due_date     TIMESTAMPTZ      NOT NULL,
  -- order_index determines display and execution order (0-based)
  order_index  INT              NOT NULL CHECK (order_index >= 0),
  status       milestone_status NOT NULL DEFAULT 'PENDING',
  submitted_at TIMESTAMPTZ,
  approved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, order_index)
);

-- transactions: financial audit trail for all money movements
CREATE TABLE transactions (
  id             UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id     UUID               NOT NULL REFERENCES projects(id)    ON DELETE RESTRICT,
  milestone_id   UUID                        REFERENCES milestones(id)  ON DELETE SET NULL,
  client_id      UUID               NOT NULL REFERENCES clients(id)     ON DELETE RESTRICT,
  freelancer_id  UUID               NOT NULL REFERENCES freelancers(id) ON DELETE RESTRICT,
  amount         DECIMAL(12, 2)     NOT NULL CHECK (amount > 0),
  type           transaction_type   NOT NULL,
  status         transaction_status NOT NULL DEFAULT 'PENDING',
  payment_method TEXT,
  created_at     TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- files: deliverables, portfolio items, and general attachments
CREATE TABLE files (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploader_id  UUID        NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  project_id   UUID                 REFERENCES projects(id)   ON DELETE CASCADE,
  milestone_id UUID                 REFERENCES milestones(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  -- Storage bucket path; presigned URLs generated at query time
  file_path    TEXT        NOT NULL,
  file_size    BIGINT      NOT NULL CHECK (file_size > 0),
  mime_type    TEXT        NOT NULL,
  file_type    file_type   NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- disputes: formal escalation when project work is contested
CREATE TABLE disputes (
  id               UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id       UUID           NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  filed_by_id      UUID           NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
  resolved_by_id   UUID                    REFERENCES users(id)    ON DELETE SET NULL,
  reason           TEXT           NOT NULL,
  status           dispute_status NOT NULL DEFAULT 'OPEN',
  resolution_notes TEXT,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ
);

-- reviews: post-completion ratings (client→freelancer and freelancer→client)
CREATE TABLE reviews (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id       UUID        NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  reviewer_id      UUID        NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
  reviewee_id      UUID        NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
  rating           INT         NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment          TEXT,
  on_time_delivery BOOLEAN,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One review per (project, reviewer) pair
  UNIQUE (project_id, reviewer_id)
);

-- project_state_history: immutable audit trail of every status transition.
-- Populated exclusively by the record_project_state_change() trigger.
CREATE TABLE project_state_history (
  id            UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID           NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_status   project_status,          -- NULL when project is first created
  to_status     project_status NOT NULL,
  changed_by_id UUID                    REFERENCES users(id) ON DELETE SET NULL,
  reason        TEXT,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- notifications: per-user event inbox
CREATE TABLE notifications (
  id         UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  title      TEXT              NOT NULL,
  message    TEXT              NOT NULL,
  is_read    BOOLEAN           NOT NULL DEFAULT FALSE,
  -- Flexible payload for deep-linking (project_id, bid_id, etc.)
  metadata   JSONB             NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- =============================================================
-- INDEXES
-- =============================================================

-- users
CREATE INDEX idx_users_role  ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- freelancers – scoring / filtering for matching algorithm
CREATE INDEX idx_freelancers_rating        ON freelancers(rating DESC);
CREATE INDEX idx_freelancers_hourly_rate   ON freelancers(hourly_rate);
CREATE INDEX idx_freelancers_availability  ON freelancers(availability_status)
  WHERE availability_status = 'AVAILABLE';

-- skills – full-text / fuzzy search
CREATE INDEX idx_skills_name_trgm ON skills USING GIN (name gin_trgm_ops);
CREATE INDEX idx_skills_category  ON skills(category);

-- freelancer_skills – skill-based matching
CREATE INDEX idx_freelancer_skills_skill_id      ON freelancer_skills(skill_id);
CREATE INDEX idx_freelancer_skills_freelancer_id ON freelancer_skills(freelancer_id);
-- GIN index for skill-set intersection queries (equivalent to GIN on a skills[] array column).
-- The schema normalises skills into this junction table (3NF) instead of storing a denormalised
-- TEXT[]/UUID[] array on freelancer_profiles. Wrapping skill_id in ARRAY[] exposes the GIN
-- array-containment operators (@>, &&) for queries like:
--   WHERE ARRAY[skill_id] && ARRAY['<uuid-a>', '<uuid-b>']::UUID[]
CREATE INDEX idx_freelancer_skills_gin ON freelancer_skills USING GIN ((ARRAY[skill_id]));

-- projects
CREATE INDEX idx_projects_client_id    ON projects(client_id);
CREATE INDEX idx_projects_freelancer_id ON projects(freelancer_id);
CREATE INDEX idx_projects_status       ON projects(status);
CREATE INDEX idx_projects_created_at   ON projects(created_at DESC);
CREATE INDEX idx_projects_deadline     ON projects(deadline);
-- Partial index: browsing the OPEN projects marketplace (most common read path)
CREATE INDEX idx_projects_open         ON projects(created_at DESC, budget_max)
  WHERE status = 'OPEN';

-- project_skills – matching queries
CREATE INDEX idx_project_skills_skill_id   ON project_skills(skill_id);
CREATE INDEX idx_project_skills_project_id ON project_skills(project_id);

-- bids
CREATE INDEX idx_bids_project_id    ON bids(project_id);
CREATE INDEX idx_bids_freelancer_id ON bids(freelancer_id);
CREATE INDEX idx_bids_status        ON bids(status);
CREATE INDEX idx_bids_created_at    ON bids(created_at DESC);

-- milestones
CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_milestones_status     ON milestones(status);
CREATE INDEX idx_milestones_due_date   ON milestones(due_date);

-- transactions
CREATE INDEX idx_transactions_project_id    ON transactions(project_id);
CREATE INDEX idx_transactions_client_id     ON transactions(client_id);
CREATE INDEX idx_transactions_freelancer_id ON transactions(freelancer_id);
CREATE INDEX idx_transactions_status        ON transactions(status);
CREATE INDEX idx_transactions_created_at    ON transactions(created_at DESC);

-- files
CREATE INDEX idx_files_project_id   ON files(project_id);
CREATE INDEX idx_files_milestone_id ON files(milestone_id);
CREATE INDEX idx_files_uploader_id  ON files(uploader_id);
CREATE INDEX idx_files_file_type    ON files(file_type);

-- disputes
CREATE INDEX idx_disputes_project_id ON disputes(project_id);
CREATE INDEX idx_disputes_status     ON disputes(status);

-- reviews
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_project_id  ON reviews(project_id);

-- project_state_history
CREATE INDEX idx_project_state_history_project_id ON project_state_history(project_id);
CREATE INDEX idx_project_state_history_created_at ON project_state_history(created_at DESC);

-- notifications – user inbox queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
-- Partial index for unread notifications (the common UI query)
CREATE INDEX idx_notifications_unread  ON notifications(user_id, created_at DESC)
  WHERE is_read = FALSE;

-- =============================================================
-- HELPER FUNCTIONS (used by triggers & RLS policies)
-- =============================================================

-- Generic updated_at updater
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Returns the role of the currently authenticated user
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$;

-- TRUE if the current user is an ADMIN
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  )
$$;

-- TRUE if the current user is the CLIENT of the given project
CREATE OR REPLACE FUNCTION is_project_client(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id AND client_id = auth.uid()
  )
$$;

-- TRUE if the current user is the assigned FREELANCER of the given project
CREATE OR REPLACE FUNCTION is_project_freelancer(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id AND freelancer_id = auth.uid()
  )
$$;

-- =============================================================
-- TRIGGERS
-- =============================================================

-- updated_at triggers
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_freelancers_updated_at
  BEFORE UPDATE ON freelancers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_bids_updated_at
  BEFORE UPDATE ON bids
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------
-- Sync public.users + sub-profile when a row is created in auth.users
-- -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_role user_role;
BEGIN
  v_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'FREELANCER'
  );

  INSERT INTO users (id, email, role, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name',  '')
  );

  IF v_role = 'CLIENT' THEN
    INSERT INTO clients (id) VALUES (NEW.id);
  ELSIF v_role = 'FREELANCER' THEN
    INSERT INTO freelancers (id) VALUES (NEW.id);
  END IF;
  -- ADMIN role: no sub-profile row needed

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- -----------------------------------------------------------------
-- Append a row to project_state_history on every status change
-- -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION record_project_state_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO project_state_history
      (project_id, from_status, to_status, changed_by_id)
    VALUES
      (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_project_state_history
  AFTER UPDATE OF status ON projects
  FOR EACH ROW EXECUTE FUNCTION record_project_state_change();

-- -----------------------------------------------------------------
-- Enforce valid project status transition graph.
-- A pure CHECK constraint cannot access OLD values, so this BEFORE
-- UPDATE trigger is the correct mechanism in PostgreSQL.
--
-- Valid graph:
--   DRAFT       → OPEN | CANCELLED
--   OPEN        → IN_PROGRESS | CANCELLED
--   IN_PROGRESS → REVIEW | DISPUTED | CANCELLED
--   REVIEW      → COMPLETED | IN_PROGRESS | DISPUTED
--   DISPUTED    → COMPLETED | CANCELLED
--   COMPLETED   (terminal)
--   CANCELLED   (terminal)
-- -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_project_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NOT (
    (OLD.status = 'DRAFT'       AND NEW.status IN ('OPEN',        'CANCELLED'))              OR
    (OLD.status = 'OPEN'        AND NEW.status IN ('IN_PROGRESS', 'CANCELLED'))               OR
    (OLD.status = 'IN_PROGRESS' AND NEW.status IN ('REVIEW',      'DISPUTED', 'CANCELLED'))   OR
    (OLD.status = 'REVIEW'      AND NEW.status IN ('COMPLETED',   'IN_PROGRESS', 'DISPUTED')) OR
    (OLD.status = 'DISPUTED'    AND NEW.status IN ('COMPLETED',   'CANCELLED'))
  ) THEN
    RAISE EXCEPTION
      'Invalid project status transition: % → %',
      OLD.status, NEW.status
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_project_status_transition
  BEFORE UPDATE OF status ON projects
  FOR EACH ROW EXECUTE FUNCTION validate_project_status_transition();

-- -----------------------------------------------------------------
-- Recalculate freelancer.rating + completed_projects_count
-- every time a new review is posted for that freelancer
-- -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION recalculate_freelancer_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_freelancer_id    UUID;
  v_avg_rating       DECIMAL(3, 2);
  v_completed_count  INT;
  v_on_time_count    INT;
BEGIN
  -- Determine the freelancer who was reviewed
  SELECT p.freelancer_id INTO v_freelancer_id
  FROM projects p
  WHERE p.id = NEW.project_id;

  -- Skip if the reviewee is not the project freelancer (i.e. client review)
  IF v_freelancer_id IS NULL OR NEW.reviewee_id <> v_freelancer_id THEN
    RETURN NEW;
  END IF;

  -- Aggregate stats from all reviews for this freelancer
  SELECT
    ROUND(AVG(r.rating)::NUMERIC, 2),
    COUNT(*),
    COUNT(CASE WHEN r.on_time_delivery = TRUE THEN 1 END)
  INTO v_avg_rating, v_completed_count, v_on_time_count
  FROM reviews r
  JOIN projects p ON r.project_id = p.id
  WHERE p.freelancer_id = v_freelancer_id
    AND r.reviewee_id   = v_freelancer_id;

  UPDATE freelancers
  SET
    rating                   = COALESCE(v_avg_rating, 0),
    completed_projects_count = v_completed_count,
    on_time_delivery_rate    = CASE
                                 WHEN v_completed_count > 0
                                 THEN ROUND((v_on_time_count::NUMERIC / v_completed_count) * 100, 2)
                                 ELSE 0
                               END
  WHERE id = v_freelancer_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_freelancer_rating
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION recalculate_freelancer_rating();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients               ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills                ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_skills     ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_skills        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones            ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE files                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews               ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_state_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;

-- ── USERS ─────────────────────────────────────────────────────────────────────
-- Any authenticated user can read public profile data (names, avatars, roles).
-- This is required for the matching, bidding, and review display flows.
CREATE POLICY "users: authenticated read"
  ON users FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "users: update own"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "users: admin all"
  ON users FOR ALL
  USING (is_admin());

-- ── CLIENTS ───────────────────────────────────────────────────────────────────
CREATE POLICY "clients: authenticated read"
  ON clients FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "clients: update own"
  ON clients FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "clients: admin all"
  ON clients FOR ALL
  USING (is_admin());

-- ── FREELANCERS ───────────────────────────────────────────────────────────────
CREATE POLICY "freelancers: authenticated read"
  ON freelancers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "freelancers: update own"
  ON freelancers FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "freelancers: admin all"
  ON freelancers FOR ALL
  USING (is_admin());

-- ── SKILLS ────────────────────────────────────────────────────────────────────
-- Public read; only admins may mutate (via Supabase Studio or service role).
CREATE POLICY "skills: authenticated read"
  ON skills FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "skills: admin write"
  ON skills FOR ALL
  USING (is_admin());

-- ── FREELANCER_SKILLS ─────────────────────────────────────────────────────────
-- Public read needed for the matching algorithm.
CREATE POLICY "freelancer_skills: authenticated read"
  ON freelancer_skills FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Freelancers manage their own skill list.
CREATE POLICY "freelancer_skills: manage own"
  ON freelancer_skills FOR ALL
  USING (freelancer_id = auth.uid());

CREATE POLICY "freelancer_skills: admin all"
  ON freelancer_skills FOR ALL
  USING (is_admin());

-- ── PROJECTS ──────────────────────────────────────────────────────────────────
-- Clients: full CRUD over their own projects.
CREATE POLICY "projects: client own"
  ON projects FOR ALL
  USING (client_id = auth.uid());

-- Freelancers: read OPEN projects so they can browse and place bids.
CREATE POLICY "projects: freelancer read open"
  ON projects FOR SELECT
  USING (
    status = 'OPEN'
    AND current_user_role() = 'FREELANCER'
  );

-- Freelancers: read the project they are assigned to (IN_PROGRESS → COMPLETED).
CREATE POLICY "projects: freelancer read assigned"
  ON projects FOR SELECT
  USING (freelancer_id = auth.uid());

CREATE POLICY "projects: admin all"
  ON projects FOR ALL
  USING (is_admin());

-- ── PROJECT_SKILLS ────────────────────────────────────────────────────────────
CREATE POLICY "project_skills: authenticated read"
  ON project_skills FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "project_skills: client manage"
  ON project_skills FOR ALL
  USING (is_project_client(project_id));

CREATE POLICY "project_skills: admin all"
  ON project_skills FOR ALL
  USING (is_admin());

-- ── BIDS ──────────────────────────────────────────────────────────────────────
-- Freelancers: full control over their own bids.
CREATE POLICY "bids: freelancer own"
  ON bids FOR ALL
  USING (freelancer_id = auth.uid());

-- Clients: read all bids on their projects to compare offers.
CREATE POLICY "bids: client read own project"
  ON bids FOR SELECT
  USING (is_project_client(project_id));

-- Clients: accept or reject a bid (status change only).
CREATE POLICY "bids: client update status"
  ON bids FOR UPDATE
  USING (is_project_client(project_id));

CREATE POLICY "bids: admin all"
  ON bids FOR ALL
  USING (is_admin());

-- ── MILESTONES ────────────────────────────────────────────────────────────────
-- Both parties can see milestones for their shared project.
CREATE POLICY "milestones: participants read"
  ON milestones FOR SELECT
  USING (
    is_project_client(project_id)
    OR is_project_freelancer(project_id)
  );

-- Clients: define and modify milestone scope / amount.
CREATE POLICY "milestones: client insert"
  ON milestones FOR INSERT
  WITH CHECK (is_project_client(project_id));

CREATE POLICY "milestones: client update"
  ON milestones FOR UPDATE
  USING (is_project_client(project_id));

-- Freelancers: update status to SUBMITTED (mark milestone ready for review).
CREATE POLICY "milestones: freelancer update status"
  ON milestones FOR UPDATE
  USING (is_project_freelancer(project_id));

CREATE POLICY "milestones: admin all"
  ON milestones FOR ALL
  USING (is_admin());

-- ── TRANSACTIONS ──────────────────────────────────────────────────────────────
-- Read-only for involved parties; only service role / admin inserts transactions.
CREATE POLICY "transactions: client read own"
  ON transactions FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "transactions: freelancer read own"
  ON transactions FOR SELECT
  USING (freelancer_id = auth.uid());

CREATE POLICY "transactions: admin all"
  ON transactions FOR ALL
  USING (is_admin());

-- ── FILES ─────────────────────────────────────────────────────────────────────
-- Uploaders manage their own files.
CREATE POLICY "files: uploader own"
  ON files FOR ALL
  USING (uploader_id = auth.uid());

-- Project participants can download files associated with the project.
CREATE POLICY "files: project participants read"
  ON files FOR SELECT
  USING (
    project_id IS NOT NULL
    AND (
      is_project_client(project_id)
      OR is_project_freelancer(project_id)
    )
  );

CREATE POLICY "files: admin all"
  ON files FOR ALL
  USING (is_admin());

-- ── DISPUTES ──────────────────────────────────────────────────────────────────
CREATE POLICY "disputes: participants read"
  ON disputes FOR SELECT
  USING (
    is_project_client(project_id)
    OR is_project_freelancer(project_id)
  );

-- Either party may file a dispute; filed_by_id must match the caller.
CREATE POLICY "disputes: participants file"
  ON disputes FOR INSERT
  WITH CHECK (
    filed_by_id = auth.uid()
    AND (
      is_project_client(project_id)
      OR is_project_freelancer(project_id)
    )
  );

-- Only admins can update disputes (resolve, close).
CREATE POLICY "disputes: admin all"
  ON disputes FOR ALL
  USING (is_admin());

-- ── REVIEWS ───────────────────────────────────────────────────────────────────
-- Completed-project reviews are visible to all authenticated users (trust signal).
CREATE POLICY "reviews: authenticated read"
  ON reviews FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- A project participant may post a review only after the project is COMPLETED.
CREATE POLICY "reviews: participant insert after completion"
  ON reviews FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id     = reviews.project_id
        AND p.status = 'COMPLETED'
        AND (p.client_id = auth.uid() OR p.freelancer_id = auth.uid())
    )
  );

CREATE POLICY "reviews: admin all"
  ON reviews FOR ALL
  USING (is_admin());

-- ── PROJECT_STATE_HISTORY ─────────────────────────────────────────────────────
-- Immutable audit log. Inserts come exclusively from the SECURITY DEFINER
-- trigger, so no INSERT policy is needed for regular users.
CREATE POLICY "project_state_history: participants read"
  ON project_state_history FOR SELECT
  USING (
    is_project_client(project_id)
    OR is_project_freelancer(project_id)
  );

CREATE POLICY "project_state_history: admin all"
  ON project_state_history FOR ALL
  USING (is_admin());

-- ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
-- Users only see and manage their own notifications.
CREATE POLICY "notifications: own"
  ON notifications FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "notifications: admin all"
  ON notifications FOR ALL
  USING (is_admin());
