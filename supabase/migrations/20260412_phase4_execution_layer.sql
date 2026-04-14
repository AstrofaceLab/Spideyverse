-- Phase 4: Growth Stack Backend Execution Layer Migration

-- 1. Create Enums for controlled states
DO $$ BEGIN
    CREATE TYPE workflow_run_status AS ENUM ('pending', 'running', 'needs_review', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('queued', 'running', 'completed', 'failed', 'skipped', 'needs_review');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_qualification_status AS ENUM ('new', 'qualified', 'disqualified', 'pending_review', 'contacted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE draft_status AS ENUM ('pending_review', 'approved', 'rejected', 'edited', 'regenerating');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Workflow Runs: Track the lifecycle of a campaign execution
CREATE TABLE IF NOT EXISTS workflow_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    status workflow_run_status NOT NULL DEFAULT 'pending',
    current_stage TEXT NOT NULL DEFAULT 'research', -- matches WorkflowStage type
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Agent Tasks: Track individual agent actions within a run
CREATE TABLE IF NOT EXISTS agent_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    task_type TEXT NOT NULL,
    stage TEXT NOT NULL, -- matches WorkflowStage type
    status task_status NOT NULL DEFAULT 'queued',
    input_json JSONB,
    output_json JSONB,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Leads: Real persisted research leads
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    company_website TEXT,
    contact_name TEXT,
    contact_role TEXT,
    email TEXT,
    linkedin_url TEXT,
    source TEXT,
    source_provider TEXT DEFAULT 'apollo',
    summary TEXT,
    score INTEGER DEFAULT 0,
    qualification_status lead_qualification_status NOT NULL DEFAULT 'new',
    reasoning TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Outreach Drafts: Human-in-the-loop email/message drafts
CREATE TABLE IF NOT EXISTS outreach_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    subject_line TEXT,
    opening_line TEXT,
    message_body TEXT,
    cta TEXT,
    follow_up TEXT,
    tone_label TEXT,
    generated_by TEXT,
    draft_status draft_status NOT NULL DEFAULT 'pending_review',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Reports: Finalized campaign insights
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title TEXT,
    summary TEXT,
    leads_found INTEGER DEFAULT 0,
    qualified_leads INTEGER DEFAULT 0,
    drafts_generated INTEGER DEFAULT 0,
    pending_approvals INTEGER DEFAULT 0,
    workflow_time_days NUMERIC,
    bottlenecks TEXT[],
    recommendations TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Activity Logs: Audit trail for the UI timeline
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    workflow_run_id UUID REFERENCES workflow_runs(id) ON DELETE SET NULL,
    agent_task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- info, success, warning, error
    message TEXT NOT NULL,
    metadata_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
