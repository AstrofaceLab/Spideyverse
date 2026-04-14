-- Migration: Add RLS Policies for Phase 4 Tables
-- Enabling users to see only their own workspace data

-- 1. workflow_runs
CREATE POLICY "Users can view their own workflow runs" 
ON workflow_runs FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM workspaces WHERE id = workspace_id));

CREATE POLICY "Users can insert their own workflow runs" 
ON workflow_runs FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT user_id FROM workspaces WHERE id = workspace_id));

-- 2. agent_tasks
CREATE POLICY "Users can view their own agent tasks" 
ON agent_tasks FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM workspaces WHERE id = workspace_id));

CREATE POLICY "Users can insert their own agent tasks" 
ON agent_tasks FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT user_id FROM workspaces WHERE id = workspace_id));

-- 3. leads
CREATE POLICY "Users can view their own leads" 
ON leads FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM workspaces WHERE id = workspace_id));

CREATE POLICY "Users can insert their own leads" 
ON leads FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT user_id FROM workspaces WHERE id = workspace_id));

CREATE POLICY "Users can update their own leads" 
ON leads FOR UPDATE 
USING (auth.uid() IN (SELECT user_id FROM workspaces WHERE id = workspace_id));

-- 4. outreach_drafts
CREATE POLICY "Users can view their own outreach drafts" 
ON outreach_drafts FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM workspaces WHERE id = workspace_id));

CREATE POLICY "Users can update their own outreach drafts" 
ON outreach_drafts FOR UPDATE 
USING (auth.uid() IN (SELECT user_id FROM workspaces WHERE id = workspace_id));

-- 5. reports
CREATE POLICY "Users can view their own reports" 
ON reports FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM workspaces WHERE id = workspace_id));

-- 6. activity_logs
CREATE POLICY "Users can view their own activity logs" 
ON activity_logs FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM workspaces WHERE id = workspace_id));

-- 7. campaigns (Ensuring the user can update campaigns to 'running')
CREATE POLICY "Users can update their own campaigns" 
ON campaigns FOR UPDATE 
USING (auth.uid() IN (SELECT user_id FROM workspaces WHERE id = workspace_id));
