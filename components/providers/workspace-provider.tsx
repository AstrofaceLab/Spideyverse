"use client";

import { createContext, useContext, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { Workspace } from "@/lib/workspace-utils";

interface WorkspaceContextType {
  user: User | null;
  workspace: Workspace | null;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  user: null,
  workspace: null,
});

export function WorkspaceProvider({ 
  children, 
  user, 
  workspace 
}: { 
  children: ReactNode; 
  user: User | null; 
  workspace: Workspace | null;
}) {
  return (
    <WorkspaceContext.Provider value={{ user, workspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => useContext(WorkspaceContext);
