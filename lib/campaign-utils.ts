import type { Campaign, WorkflowStage, AgentStatus, Agent, ActivityEvent } from "./types";
import { mockAgents as baseMockAgents, mockActivity as baseMockActivity } from "./mock-data";

/**
 * Generates mock orchestration state and data for a campaign based on its status and stage.
 */
export function getCampaignOrchestration(campaign: Campaign) {
  const stage = campaign.current_stage;
  const status = campaign.status;

  // 1. Stage Status Mapping
  const stageStatuses: Record<string, string> = {
    research: "idle",
    qualification: "idle",
    outreach: "idle",
    reporting: "idle",
  };

  const stages: WorkflowStage[] = ["research", "qualification", "outreach", "reporting"];
  const currentIdx = stages.indexOf(stage);

  stages.forEach((s, idx) => {
    if (idx < currentIdx) {
      stageStatuses[s] = "completed";
    } else if (idx === currentIdx) {
      stageStatuses[s] = status === "running" ? "running" : status === "draft" ? "idle" : status;
    } else {
      stageStatuses[s] = "idle";
    }
  });

  // 2. Mock KPI values derived from campaign settings
  const target = campaign.target_lead_count || 100;
  
  let leadsFound = 0;
  let qualifiedLeads = 0;
  let draftsCreated = 0;
  let approvalsCount = 0;

  if (currentIdx > 0 || (stage === "research" && status === "completed")) {
    leadsFound = Math.floor(target * (0.8 + Math.random() * 0.4));
  } else if (stage === "research" && status === "running") {
    leadsFound = Math.floor(target * 0.3);
  }

  if (currentIdx > 1 || (stage === "qualification" && status === "completed")) {
    qualifiedLeads = Math.floor(leadsFound * (0.6 + Math.random() * 0.2));
  } else if (stage === "qualification" && status === "running") {
    qualifiedLeads = Math.floor(leadsFound * 0.4);
  }

  if (currentIdx > 2 || (stage === "outreach" && status === "completed")) {
    draftsCreated = qualifiedLeads;
    approvalsCount = Math.floor(draftsCreated * 0.9);
  } else if (stage === "outreach" && status === "running") {
    draftsCreated = Math.floor(qualifiedLeads * 0.8);
    approvalsCount = Math.floor(draftsCreated * 0.5);
  }

  // 3. Mock Agent States
  const agents: Agent[] = baseMockAgents.map(a => {
    let agentStatus: AgentStatus = "idle";
    let currentTask = "";

    if (status === "running") {
      if (a.type === stage) {
        agentStatus = "running";
        currentTask = `Processing ${campaign.campaign_name}...`;
      } else if (stages.indexOf(a.type as WorkflowStage) < currentIdx) {
        agentStatus = "completed";
      }
    } else if (status === "failed" && a.type === stage) {
      agentStatus = "failed";
    }

    return {
      ...a,
      status: agentStatus,
      currentTask: currentTask || undefined
    };
  });

  // 4. Mock Activity Timeline
  const activity: ActivityEvent[] = [];
  const now = new Date();
  
  if (campaign.created_at) {
    activity.push({
      id: "a1",
      agentType: "manager",
      agentName: "Manager Agent",
      event: "Campaign Initialized",
      detail: `${campaign.campaign_name} has been successfully created.`,
      timestamp: campaign.created_at,
      type: "info"
    });
  }

  if (currentIdx >= 0 && status !== "draft") {
    activity.push({
      id: "a2",
      agentType: "research",
      agentName: "Research Agent",
      event: status === "running" && stage === "research" ? "Research Started" : "Research Complete",
      detail: status === "running" && stage === "research" 
        ? "Crawling sources for matching profiles..." 
        : `Identified ${leadsFound} potential leads in ${campaign.target_region}.`,
      timestamp: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
      type: status === "running" && stage === "research" ? "info" : "success"
    });
  }

  return {
    stageStatuses,
    leadsFound,
    qualifiedLeads,
    draftsCreated,
    approvalsCount,
    agents,
    activity: activity.reverse()
  };
}
