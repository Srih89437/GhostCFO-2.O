export interface User {
  id: string;
  email: string;
  name: string;
  orgId: string;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}

export interface CloudResource {
  id: string;
  name: string;
  type: 'instance' | 'volume' | 'database';
  status: 'running' | 'terminated' | 'idle';
  cost: number; // cost per month in USD
  utilization: number; // CPU utilization %
  tags: Record<string, string>;
}

export interface PlanStep {
  id: string;
  action: 'list_instances' | 'analyze_utilization' | 'terminate_instance' | 'generate_report' | 'rollback_migration' | 'delete_volume' | 'custom_malicious_action';
  mcp: string;
  params: Record<string, any>;
  status: 'pending' | 'running' | 'allowed' | 'held' | 'approved' | 'rejected' | 'failed';
  holdReason?: string | null;
}

export interface FinOpsRun {
  id: string;
  goal: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  steps: PlanStep[];
  planHash: string;
  merkleRoot: string;
  stepProof: string;
  currentStepIndex: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  mcp: string;
  planHash: string;
  stepProof: string;
  decision: 'allowed' | 'held' | 'approved' | 'rejected' | 'blocked';
  reason: string;
  userEmail: string;
  runId: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  org: Organization | null;
}
