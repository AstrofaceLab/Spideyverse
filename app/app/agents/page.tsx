"use client";

import { TopBar } from "@/components/layout/TopBar";
import { AgentCard } from "@/components/app/AgentCard";
import { mockAgents } from "@/lib/mock-data";
import { Network, ArrowRight } from "lucide-react";

const agentAccents: Record<string, string> = {
  research: "#3B82F6",
  qualification: "#F59E0B",
  outreach: "#10B981",
  reporting: "#8B5CF6",
  manager: "#06B6D4",
};

const agentFlow = [
  { from: "manager", to: "research", label: "Assigns" },
  { from: "research", to: "qualification", label: "Passes leads" },
  { from: "qualification", to: "outreach", label: "Qualified leads" },
  { from: "outreach", to: "reporting", label: "Drafts + data" },
];

export default function AgentsPage() {
  const { workspace } = useWorkspace();
  const supabase = createClient();
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAgentStatus() {
      if (!workspace) return;
      
      // Fetch recent tasks for all agents to determine their status
      const { data: tasks } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('updated_at', { ascending: false });

      const agentMap = [
        { id: 'manager', name: 'Fleet Manager', type: 'manager', description: 'Orchestrates the agent-net workflow' },
        { id: 'research', name: 'Researcher Agent', type: 'research', description: 'Crawl for leads and company data' },
        { id: 'qualification', name: 'Qualification Agent', type: 'qualification', description: 'Analyze leads for campaign fit' },
        { id: 'outreach', name: 'Outreach Agent', type: 'outreach', description: 'Draft personalized messages' },
        { id: 'reporting', name: 'Reporting Agent', type: 'reporting', description: 'Generate campaign performance reports' },
      ];

      const realAgents = agentMap.map(a => {
        const latestTask = tasks?.find(t => t.agent_name.toLowerCase().includes(a.type));
        return {
          ...a,
          status: latestTask?.status === 'running' ? 'running' : 'idle',
          lastActive: latestTask?.updated_at || 'Never',
          tasksCompleted: tasks?.filter(t => t.agent_name.toLowerCase().includes(a.type) && t.status === 'completed').length || 0,
          currentTask: latestTask?.status === 'running' ? `Processing ${latestTask.stage}` : 'Await assignment',
        };
      });

      setAgents(realAgents);
      setIsLoading(false);
    }
    fetchAgentStatus();
    const interval = setInterval(fetchAgentStatus, 5000);
    return () => clearInterval(interval);
  }, [workspace]);

  const managerAgent = agents.find(a => a.type === "manager");
  const otherAgents = agents.filter(a => a.type !== "manager");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar
        title="Agent-Net"
        subtitle="Your connected AI workforce — visibility into every agent"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Network map */}
        <div className="sv-card p-6">
          <p className="sv-section-title mb-4">Agent-Net Workflow Map</p>
          <div className="flex items-center justify-center flex-wrap gap-4">
            {/* Manager at top */}
            <div className="w-full flex justify-center mb-2">
              <div className="flex flex-col items-center gap-2">
                <div className="px-4 py-2.5 rounded-xl border flex items-center gap-2.5"
                  style={{ background: `${agentAccents.manager}10`, borderColor: `${agentAccents.manager}30`, color: agentAccents.manager }}>
                  <Network className="w-4 h-4" />
                  <span className="text-sm font-manrope font-semibold">Manager Agent</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30">
                    Orchestrator
                  </span>
                </div>
                <div className="w-px h-6 bg-white/[0.08]" />
              </div>
            </div>

            {/* Sub-agents */}
            <div className="w-full flex items-start justify-center gap-6 flex-wrap">
              {otherAgents.map((agent, i) => {
                const accent = agentAccents[agent.type];
                const isLast = i === otherAgents.length - 1;
                return (
                  <div key={agent.id} className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="px-3 py-2 rounded-xl border flex items-center gap-2"
                        style={{ background: `${accent}08`, borderColor: `${accent}25`, color: accent }}>
                        <span className="text-xs font-manrope font-semibold whitespace-nowrap">{agent.name}</span>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${agent.status === "running" ? "animate-pulse" : ""}`}
                        style={{ background: accent }} />
                    </div>
                    {!isLast && (
                      <div className="flex items-center gap-2 text-[#4B5563] mb-6">
                        <div className="w-8 h-px bg-white/[0.08]" />
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Manager Agent */}
        {managerAgent && (
          <div>
            <p className="sv-section-title mb-3">Orchestration Layer</p>
            <div className="max-w-md">
              <AgentCard agent={managerAgent} />
            </div>
          </div>
        )}

        {/* Other Agents */}
        <div>
          <p className="sv-section-title mb-3">Execution Agents</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {otherAgents.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>

        {/* Agent health summary */}
        <div className="sv-card p-5">
          <p className="sv-section-title mb-4">Agent Health Summary</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {agents.map(agent => {
              const accent = agentAccents[agent.type];
              return (
                <div key={agent.id} className="text-center">
                  <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                    style={{ background: `${accent}12`, border: `1px solid ${accent}25` }}>
                    <div className={`w-3 h-3 rounded-full ${agent.status === "running" ? "animate-pulse" : ""}`}
                      style={{ background: accent, opacity: agent.status === "idle" ? 0.4 : 1 }} />
                  </div>
                  <p className="text-xs font-manrope font-medium text-[#94A3B8]">{agent.name.split(" ")[0]}</p>
                  <p className="text-xs text-[#64748B] capitalize mt-0.5">{agent.status}</p>
                  <p className="font-poppins text-base font-semibold mt-1" style={{ color: accent }}>
                    {agent.tasksCompleted}
                  </p>
                  <p className="text-xs text-[#4B5563]">tasks</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
