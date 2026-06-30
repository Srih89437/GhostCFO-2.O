import { User, Organization, CloudResource, FinOpsRun, AuditLog, PlanStep } from '../types';
import crypto from 'crypto';

// Seeding standard data
const INITIAL_ORGS: Organization[] = [
  { id: 'org-ghost-finance', name: 'Ghost Finance Corp', createdAt: new Date().toISOString() }
];

const INITIAL_USERS: User[] = [
  { id: 'usr-srih', email: 'srih89437@gmail.com', name: 'Srih Operator', orgId: 'org-ghost-finance' }
];

const INITIAL_RESOURCES: CloudResource[] = [
  {
    id: 'res-ec2-prod-web-01',
    name: 'aws-ec2-prod-web-01',
    type: 'instance',
    status: 'running',
    cost: 320,
    utilization: 84.5,
    tags: { environment: 'production', tier: 'frontend' }
  },
  {
    id: 'res-ec2-dev-sandbox-01',
    name: 'aws-ec2-dev-sandbox-01',
    type: 'instance',
    status: 'idle',
    cost: 75,
    utilization: 0.9,
    tags: { environment: 'dev', owner: 'qa-sandbox' }
  },
  {
    id: 'res-ec2-staging-worker',
    name: 'aws-ec2-staging-worker',
    type: 'instance',
    status: 'running',
    cost: 180,
    utilization: 42.1,
    tags: { environment: 'staging', app: 'worker-queue' }
  },
  {
    id: 'res-ec2-temp-scrap-04',
    name: 'aws-ec2-temp-scrap-04',
    type: 'instance',
    status: 'idle',
    cost: 110,
    utilization: 0.4,
    tags: { environment: 'dev', billing: 'adhoc-test' }
  },
  {
    id: 'res-ebs-prod-db-backup',
    name: 'ebs-vol-prod-db-backup',
    type: 'volume',
    status: 'running',
    cost: 150,
    utilization: 95.0,
    tags: { environment: 'production', data: 'postgres-wal' }
  },
  {
    id: 'res-ebs-staging-unused',
    name: 'ebs-vol-staging-unused',
    type: 'volume',
    status: 'idle',
    cost: 65,
    utilization: 0.0,
    tags: { environment: 'staging', type: 'gp3' }
  },
  {
    id: 'res-rds-staging-replica',
    name: 'rds-postgres-staging-replica',
    type: 'database',
    status: 'idle',
    cost: 450,
    utilization: 15.2,
    tags: { environment: 'staging', db: 'replica-read' }
  }
];

class Database {
  private orgs: Map<string, Organization> = new Map();
  private users: Map<string, User> = new Map();
  private passwords: Map<string, string> = new Map(); // Store simple hash/string securely
  private resources: Map<string, CloudResource> = new Map();
  private runs: Map<string, FinOpsRun> = new Map();
  private auditLogs: AuditLog[] = [];

  constructor() {
    INITIAL_ORGS.forEach(org => this.orgs.set(org.id, org));
    INITIAL_USERS.forEach(user => {
      this.users.set(user.id, user);
      // Default password for seeded operator is 'admin123'
      this.passwords.set(user.email, 'admin123');
    });
    INITIAL_RESOURCES.forEach(res => this.resources.set(res.id, res));
  }

  // Auth & Org Methods
  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  verifyPassword(email: string, pass: string): boolean {
    return this.passwords.get(email) === pass;
  }

  registerUser(name: string, email: string, passwordStr: string, orgName: string): { user: User; org: Organization } {
    const existing = this.getUserByEmail(email);
    if (existing) {
      throw new Error('User already exists');
    }

    const orgId = `org-${crypto.randomBytes(4).toString('hex')}`;
    const org: Organization = {
      id: orgId,
      name: orgName,
      createdAt: new Date().toISOString()
    };
    this.orgs.set(orgId, org);

    const userId = `usr-${crypto.randomBytes(4).toString('hex')}`;
    const user: User = {
      id: userId,
      email,
      name,
      orgId
    };
    this.users.set(userId, user);
    this.passwords.set(email, passwordStr);

    return { user, org };
  }

  getOrg(id: string): Organization | undefined {
    return this.orgs.get(id);
  }

  // Cloud Resource Inventory Methods
  getResources(): CloudResource[] {
    return Array.from(this.resources.values());
  }

  getResource(id: string): CloudResource | undefined {
    return this.resources.get(id);
  }

  updateResourceStatus(id: string, status: 'running' | 'terminated' | 'idle'): void {
    const res = this.resources.get(id);
    if (res) {
      res.status = status;
      this.resources.set(id, res);
    }
  }

  deleteResource(id: string): void {
    this.resources.delete(id);
  }

  resetResources(): void {
    this.resources.clear();
    INITIAL_RESOURCES.forEach(res => this.resources.set(res.id, { ...res }));
  }

  // Run Operations
  getRuns(): FinOpsRun[] {
    return Array.from(this.runs.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getRun(id: string): FinOpsRun | undefined {
    return this.runs.get(id);
  }

  saveRun(run: FinOpsRun): void {
    this.runs.set(run.id, run);
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  logAudit(audit: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const log: AuditLog = {
      ...audit,
      id: `aud-${crypto.randomBytes(6).toString('hex')}`,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.push(log);
    return log;
  }
}

export const db = new Database();
