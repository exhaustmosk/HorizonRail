-- ================================================
-- HORIZONRAIL — SUPABASE COMPLETE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ================================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. ORGANIZATIONS
-- ================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  industry     TEXT DEFAULT 'Technology',
  size         TEXT DEFAULT '10-50 employees',
  admin_id     UUID NOT NULL,  -- references auth.users(id) — set after profile exists
  admin_name   TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 2. PROFILES  (extends auth.users — one row per user)
-- ================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  initials     TEXT NOT NULL,
  email        TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'employee'
                 CHECK (role IN ('employee', 'manager', 'admin')),
  department   TEXT NOT NULL DEFAULT 'Unassigned',
  manager_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  org_id       UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  org_name     TEXT,
  org_status   TEXT NOT NULL DEFAULT 'none'
                 CHECK (org_status IN ('none', 'pending', 'joined')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 3. JOIN REQUESTS
-- ================================================
CREATE TABLE IF NOT EXISTS public.join_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_name   TEXT NOT NULL,
  employee_email  TEXT NOT NULL,
  employee_role   TEXT NOT NULL CHECK (employee_role IN ('employee', 'manager')),
  department      TEXT NOT NULL,
  requested_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, employee_id)
);

-- ================================================
-- 4. GOALS
-- ================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id           UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  thrust_area      TEXT NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT DEFAULT '',
  uom              TEXT NOT NULL
                     CHECK (uom IN ('numeric_min', 'numeric_max', 'timeline', 'zero')),
  target           NUMERIC NOT NULL,
  target_date      TIMESTAMPTZ,
  weightage        NUMERIC NOT NULL,
  is_admin_pushed  BOOLEAN DEFAULT FALSE,
  approval_status  TEXT NOT NULL DEFAULT 'draft'
                     CHECK (approval_status IN ('draft', 'submitted', 'approved', 'rejected')),
  locked           BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 5. QUARTERLY ACTUALS
-- ================================================
CREATE TABLE IF NOT EXISTS public.quarterly_actuals (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id          UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  quarter          TEXT NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
  planned          NUMERIC NOT NULL DEFAULT 0,
  actual           NUMERIC NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'not_started'
                     CHECK (status IN ('not_started', 'on_track', 'completed', 'at_risk')),
  employee_notes   TEXT DEFAULT '',
  manager_comment  TEXT DEFAULT '',
  submitted_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, quarter)
);

-- ================================================
-- 6. CHECK-IN COMMENTS  (manager structured feedback)
-- ================================================
CREATE TABLE IF NOT EXISTS public.checkin_comments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id      UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  quarter      TEXT NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
  summary      TEXT DEFAULT '',
  strengths    TEXT DEFAULT '',
  blockers     TEXT DEFAULT '',
  next_steps   TEXT DEFAULT '',
  manager_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  manager_name TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(goal_id, quarter)
);

-- ================================================
-- 7. CYCLE POLICY  (one per organization)
-- ================================================
CREATE TABLE IF NOT EXISTS public.cycle_policy (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id                      UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  max_goals                   INTEGER NOT NULL DEFAULT 8,
  min_goals                   INTEGER NOT NULL DEFAULT 3,
  min_weightage_per_goal      NUMERIC NOT NULL DEFAULT 10,
  total_weightage_required    NUMERIC NOT NULL DEFAULT 100,
  checkins_mandatory          BOOLEAN NOT NULL DEFAULT TRUE,
  goal_setting_mandatory      BOOLEAN NOT NULL DEFAULT TRUE,
  allow_late_submissions      BOOLEAN NOT NULL DEFAULT FALSE,
  late_submission_grace_days  INTEGER NOT NULL DEFAULT 5
);

-- ================================================
-- 8. CHECK-IN PERIODS  (per organization, 5 rows per org)
-- ================================================
CREATE TABLE IF NOT EXISTS public.check_in_periods (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  quarter    TEXT NOT NULL CHECK (quarter IN ('goal_setting', 'Q1', 'Q2', 'Q3', 'Q4')),
  name       TEXT NOT NULL,
  label      TEXT NOT NULL,
  action     TEXT NOT NULL,
  open_date  TIMESTAMPTZ NOT NULL,
  close_date TIMESTAMPTZ NOT NULL,
  enforced   BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(org_id, quarter)
);

-- ================================================
-- 9. CHANGE REQUESTS
-- ================================================
CREATE TABLE IF NOT EXISTS public.change_requests (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id             UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requested_by_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_by_name  TEXT NOT NULL,
  requested_at       TIMESTAMPTZ DEFAULT NOW(),
  status             TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'approved', 'rejected')),
  reason             TEXT NOT NULL,
  summary            TEXT NOT NULL,
  target_period      TEXT CHECK (target_period IN ('goal_setting', 'Q1', 'Q2', 'Q3', 'Q4')),
  policy_patch       JSONB,
  period_patch       JSONB,
  reviewed_by_id     UUID REFERENCES public.profiles(id),
  reviewed_by_name   TEXT,
  reviewed_at        TIMESTAMPTZ,
  review_note        TEXT
);

-- ================================================
-- 10. AUDIT LOG
-- ================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id       UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  timestamp    TIMESTAMPTZ DEFAULT NOW(),
  actor_id     UUID NOT NULL,
  actor_name   TEXT NOT NULL,
  action       TEXT NOT NULL,
  target_id    TEXT NOT NULL DEFAULT '',
  target_label TEXT NOT NULL DEFAULT '',
  old_value    TEXT DEFAULT '',
  new_value    TEXT DEFAULT ''
);

-- ================================================
-- PERFORMANCE INDEXES
-- ================================================
CREATE INDEX IF NOT EXISTS idx_profiles_org_id        ON public.profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id    ON public.profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_goals_employee_id      ON public.goals(employee_id);
CREATE INDEX IF NOT EXISTS idx_goals_org_id           ON public.goals(org_id);
CREATE INDEX IF NOT EXISTS idx_goals_approval_status  ON public.goals(approval_status);
CREATE INDEX IF NOT EXISTS idx_quarterly_actuals_goal ON public.quarterly_actuals(goal_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_id       ON public.audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_ts           ON public.audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_join_requests_org_id   ON public.join_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_checkin_comments_goal  ON public.checkin_comments(goal_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_org_id ON public.change_requests(org_id);

-- ================================================
-- TRIGGER FUNCTION — auto-update updated_at
-- ================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ================================================
-- TRIGGER — auto-create profile row when user signs up
-- This fires AFTER INSERT on auth.users
-- ================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name      TEXT;
  v_initials  TEXT;
  v_role      TEXT;
  v_dept      TEXT;
BEGIN
  v_name     := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  v_role     := COALESCE(NEW.raw_user_meta_data->>'role', 'employee');
  v_dept     := COALESCE(NEW.raw_user_meta_data->>'department', 'Unassigned');
  -- Build initials from name (e.g. "Priya Sharma" → "PS")
  v_initials := UPPER(
    COALESCE(LEFT(split_part(v_name, ' ', 1), 1), '') ||
    COALESCE(LEFT(split_part(v_name, ' ', 2), 1), '')
  );
  IF v_initials = '' THEN v_initials := UPPER(LEFT(v_name, 2)); END IF;

  INSERT INTO public.profiles (id, name, initials, email, role, department, org_status)
  VALUES (NEW.id, v_name, v_initials, NEW.email, v_role, v_dept, 'none')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- ROW LEVEL SECURITY — Enable on all tables
-- ================================================
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quarterly_actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_policy    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_in_periods  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log       ENABLE ROW LEVEL SECURITY;

-- ================================================
-- HELPER FUNCTIONS for RLS policies
-- ================================================
CREATE OR REPLACE FUNCTION public.my_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ================================================
-- RLS POLICIES — PROFILES
-- ================================================
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR org_id = public.my_org_id()
  );

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid()
    OR org_id IN (SELECT id FROM public.organizations WHERE admin_id = auth.uid())
  );

-- ================================================
-- RLS POLICIES — ORGANIZATIONS
-- ================================================
-- Everyone can read all orgs (needed for join-org search)
DROP POLICY IF EXISTS "orgs_select_all" ON public.organizations;
CREATE POLICY "orgs_select_all" ON public.organizations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "orgs_insert" ON public.organizations;
CREATE POLICY "orgs_insert" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "orgs_update" ON public.organizations;
CREATE POLICY "orgs_update" ON public.organizations
  FOR UPDATE USING (admin_id = auth.uid());

-- ================================================
-- RLS POLICIES — JOIN REQUESTS
-- ================================================
DROP POLICY IF EXISTS "jr_select_own" ON public.join_requests;
CREATE POLICY "jr_select_own" ON public.join_requests
  FOR SELECT USING (
    employee_id = auth.uid()
    OR org_id IN (SELECT id FROM public.organizations WHERE admin_id = auth.uid())
  );

DROP POLICY IF EXISTS "jr_insert" ON public.join_requests;
CREATE POLICY "jr_insert" ON public.join_requests
  FOR INSERT WITH CHECK (employee_id = auth.uid());

DROP POLICY IF EXISTS "jr_delete" ON public.join_requests;
CREATE POLICY "jr_delete" ON public.join_requests
  FOR DELETE USING (
    employee_id = auth.uid()
    OR org_id IN (SELECT id FROM public.organizations WHERE admin_id = auth.uid())
  );

-- ================================================
-- RLS POLICIES — GOALS
-- ================================================
DROP POLICY IF EXISTS "goals_select" ON public.goals;
CREATE POLICY "goals_select" ON public.goals
  FOR SELECT USING (org_id = public.my_org_id());

DROP POLICY IF EXISTS "goals_insert" ON public.goals;
CREATE POLICY "goals_insert" ON public.goals
  FOR INSERT WITH CHECK (
    (employee_id = auth.uid() AND org_id = public.my_org_id())
    OR public.my_role() IN ('admin', 'manager')
  );

DROP POLICY IF EXISTS "goals_update" ON public.goals;
CREATE POLICY "goals_update" ON public.goals
  FOR UPDATE USING (
    employee_id = auth.uid()
    OR public.my_role() IN ('admin', 'manager')
  );

DROP POLICY IF EXISTS "goals_delete" ON public.goals;
CREATE POLICY "goals_delete" ON public.goals
  FOR DELETE USING (
    employee_id = auth.uid()
    OR public.my_role() = 'admin'
  );

-- ================================================
-- RLS POLICIES — QUARTERLY ACTUALS
-- ================================================
DROP POLICY IF EXISTS "qa_select" ON public.quarterly_actuals;
CREATE POLICY "qa_select" ON public.quarterly_actuals
  FOR SELECT USING (
    goal_id IN (SELECT id FROM public.goals WHERE org_id = public.my_org_id())
  );

DROP POLICY IF EXISTS "qa_insert" ON public.quarterly_actuals;
CREATE POLICY "qa_insert" ON public.quarterly_actuals
  FOR INSERT WITH CHECK (
    goal_id IN (SELECT id FROM public.goals WHERE org_id = public.my_org_id())
  );

DROP POLICY IF EXISTS "qa_update" ON public.quarterly_actuals;
CREATE POLICY "qa_update" ON public.quarterly_actuals
  FOR UPDATE USING (
    goal_id IN (SELECT id FROM public.goals WHERE org_id = public.my_org_id())
  );

-- ================================================
-- RLS POLICIES — CHECKIN COMMENTS
-- ================================================
DROP POLICY IF EXISTS "cc_select" ON public.checkin_comments;
CREATE POLICY "cc_select" ON public.checkin_comments
  FOR SELECT USING (
    goal_id IN (SELECT id FROM public.goals WHERE org_id = public.my_org_id())
  );

DROP POLICY IF EXISTS "cc_insert" ON public.checkin_comments;
CREATE POLICY "cc_insert" ON public.checkin_comments
  FOR INSERT WITH CHECK (public.my_role() IN ('manager', 'admin'));

DROP POLICY IF EXISTS "cc_update" ON public.checkin_comments;
CREATE POLICY "cc_update" ON public.checkin_comments
  FOR UPDATE USING (manager_id = auth.uid() OR public.my_role() = 'admin');

-- ================================================
-- RLS POLICIES — CYCLE POLICY
-- ================================================
DROP POLICY IF EXISTS "cp_select" ON public.cycle_policy;
CREATE POLICY "cp_select" ON public.cycle_policy
  FOR SELECT USING (org_id = public.my_org_id());

DROP POLICY IF EXISTS "cp_all" ON public.cycle_policy;
CREATE POLICY "cp_all" ON public.cycle_policy
  FOR ALL USING (
    org_id IN (SELECT id FROM public.organizations WHERE admin_id = auth.uid())
  );

-- ================================================
-- RLS POLICIES — CHECK-IN PERIODS
-- ================================================
DROP POLICY IF EXISTS "cip_select" ON public.check_in_periods;
CREATE POLICY "cip_select" ON public.check_in_periods
  FOR SELECT USING (org_id = public.my_org_id());

DROP POLICY IF EXISTS "cip_all" ON public.check_in_periods;
CREATE POLICY "cip_all" ON public.check_in_periods
  FOR ALL USING (
    org_id IN (SELECT id FROM public.organizations WHERE admin_id = auth.uid())
  );

-- ================================================
-- RLS POLICIES — CHANGE REQUESTS
-- ================================================
DROP POLICY IF EXISTS "cr_select" ON public.change_requests;
CREATE POLICY "cr_select" ON public.change_requests
  FOR SELECT USING (org_id = public.my_org_id());

DROP POLICY IF EXISTS "cr_insert" ON public.change_requests;
CREATE POLICY "cr_insert" ON public.change_requests
  FOR INSERT WITH CHECK (
    public.my_role() IN ('manager', 'admin')
    AND org_id = public.my_org_id()
  );

DROP POLICY IF EXISTS "cr_update" ON public.change_requests;
CREATE POLICY "cr_update" ON public.change_requests
  FOR UPDATE USING (
    org_id IN (SELECT id FROM public.organizations WHERE admin_id = auth.uid())
  );

-- ================================================
-- RLS POLICIES — AUDIT LOG
-- ================================================
DROP POLICY IF EXISTS "al_select" ON public.audit_log;
CREATE POLICY "al_select" ON public.audit_log
  FOR SELECT USING (org_id = public.my_org_id());

DROP POLICY IF EXISTS "al_insert" ON public.audit_log;
CREATE POLICY "al_insert" ON public.audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ================================================
-- SEED — Default Acme Corp organization (optional demo)
-- You can delete these if you want a clean start.
-- ================================================
-- NOTE: The demo users (priya, ramesh, divya, etc.) will be created
-- when they sign up through the Auth system. The seeded org below
-- provides a target for them to join.
-- To fully seed demo data, use the seed RPC below after creating users.
