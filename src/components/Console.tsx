import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Play, CheckCircle, AlertTriangle, XCircle, RotateCcw, 
  Database, FileText, Cpu, AlertCircle, LogOut, ArrowRight, Copy, 
  Terminal, Search, ChevronDown, ChevronUp, Lock, RefreshCw, Zap
} from 'lucide-react';
import { AuthState, FinOpsRun, CloudResource, AuditLog, PlanStep } from '../types';

interface ConsoleProps {
  auth: AuthState;
  onLogout: () => void;
}

export default function Console({ auth, onLogout }: ConsoleProps) {
  const [activeTab, setActiveTab] = useState<'runs' | 'fleet' | 'audit'>('runs');
  const [runs, setRuns] = useState<FinOpsRun[]>([]);
  const [resources, setResources] = useState<CloudResource[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering for Audit Logs
  const [auditFilterAction, setAuditFilterAction] = useState('');
  const [auditFilterDecision, setAuditFilterDecision] = useState('');
  const [expandedAuditRow, setExpandedAuditRow] = useState<string | null>(null);

  // Copy state feedbacks
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize Socket.IO connection with JWT Auth
    const socket = io({
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: {
        token: auth.token
      }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('connect_error', (err: any) => {
      setSocketConnected(false);
      if (err && (err.message === 'Authentication token missing' || err.message === 'Token is invalid or expired')) {
        onLogout();
      }
    });

    socket.on('init', (data: { resources: CloudResource[]; runs: FinOpsRun[]; auditLogs: AuditLog[] }) => {
      setResources(data.resources);
      setRuns(data.runs);
      setAuditLogs(data.auditLogs);
      if (data.runs.length > 0 && !selectedRunId) {
        setSelectedRunId(data.runs[0].id);
      }
    });

    socket.on('run:created', (newRun: FinOpsRun) => {
      setRuns(prev => [newRun, ...prev]);
      setSelectedRunId(newRun.id);
    });

    socket.on('run:updated', (updatedRun: FinOpsRun) => {
      setRuns(prev => prev.map(r => r.id === updatedRun.id ? updatedRun : r));
    });

    socket.on('step:running', (data: { runId: string; step: PlanStep }) => {
      setRuns(prev => prev.map(r => {
        if (r.id === data.runId) {
          const updatedSteps = r.steps.map(s => s.id === data.step.id ? { ...s, status: 'running' as const } : s);
          return { ...r, steps: updatedSteps };
        }
        return r;
      }));
    });

    socket.on('step:allowed', (data: { runId: string; step: PlanStep; auditLogs: AuditLog[] }) => {
      setRuns(prev => prev.map(r => {
        if (r.id === data.runId) {
          const updatedSteps = r.steps.map(s => s.id === data.step.id ? { ...s, status: 'allowed' as const } : s);
          return { ...r, steps: updatedSteps };
        }
        return r;
      }));
      setAuditLogs(data.auditLogs);
    });

    socket.on('step:held', (data: { runId: string; step: PlanStep; auditLogs: AuditLog[] }) => {
      setRuns(prev => prev.map(r => {
        if (r.id === data.runId) {
          const updatedSteps = r.steps.map(s => s.id === data.step.id ? { ...s, status: 'held' as const, holdReason: data.step.holdReason } : s);
          return { ...r, steps: updatedSteps, status: 'paused' as const };
        }
        return r;
      }));
      setAuditLogs(data.auditLogs);
    });

    socket.on('step:blocked', (data: { runId: string; step: PlanStep; auditLogs: AuditLog[] }) => {
      setRuns(prev => prev.map(r => {
        if (r.id === data.runId) {
          const updatedSteps = r.steps.map(s => s.id === data.step.id ? { ...s, status: 'failed' as const, holdReason: data.step.holdReason } : s);
          return { ...r, steps: updatedSteps, status: 'failed' as const };
        }
        return r;
      }));
      setAuditLogs(data.auditLogs);
    });

    socket.on('step:approved', (data: { runId: string; step: PlanStep; auditLogs: AuditLog[] }) => {
      setRuns(prev => prev.map(r => {
        if (r.id === data.runId) {
          const updatedSteps = r.steps.map(s => s.id === data.step.id ? { ...s, status: 'allowed' as const } : s);
          return { ...r, steps: updatedSteps, status: 'running' as const };
        }
        return r;
      }));
      setAuditLogs(data.auditLogs);
    });

    socket.on('step:rejected', (data: { runId: string; step: PlanStep; auditLogs: AuditLog[] }) => {
      setRuns(prev => prev.map(r => {
        if (r.id === data.runId) {
          const updatedSteps = r.steps.map(s => s.id === data.step.id ? { ...s, status: 'rejected' as const } : s);
          return { ...r, steps: updatedSteps, status: 'failed' as const };
        }
        return r;
      }));
      setAuditLogs(data.auditLogs);
    });

    socket.on('resources:updated', (updatedResources: CloudResource[]) => {
      setResources(updatedResources);
    });

    socket.on('resources:reset', (resetResources: CloudResource[]) => {
      setResources(resetResources);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleLaunchAgent = async (type: 'compliant' | 'policy_violation' | 'tampered') => {
    if (!socketConnected) return;
    setLoading('launch');
    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`
        },
        body: JSON.stringify({ type })
      });
      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to seal and launch FinOps plan.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleApproveStep = async (runId: string, stepId: string) => {
    setLoading(`approve-${stepId}`);
    try {
      const res = await fetch(`/api/runs/${runId}/steps/${stepId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }
      if (!res.ok) throw new Error('Authorization error');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleRejectStep = async (runId: string, stepId: string) => {
    setLoading(`reject-${stepId}`);
    try {
      const res = await fetch(`/api/runs/${runId}/steps/${stepId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }
      if (!res.ok) throw new Error('Authorization error');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleInjectTampering = async (runId: string) => {
    setLoading('tamper');
    try {
      const res = await fetch(`/api/runs/${runId}/tamper`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }
      if (!res.ok) throw new Error('Failed to inject tamper attack');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleResetFleet = async () => {
    setLoading('reset-fleet');
    try {
      const res = await fetch('/api/resources/reset', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }
      if (!res.ok) throw new Error('Failed to reset cloud resource fleet');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const selectedRun = runs.find(r => r.id === selectedRunId);

  // Filtered logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesAction = auditFilterAction ? log.action.includes(auditFilterAction) : true;
    const matchesDecision = auditFilterDecision ? log.decision === auditFilterDecision : true;
    return matchesAction && matchesDecision;
  });

  return (
    <div id="product-console" className="min-h-screen bg-[#050505] flex flex-col font-sans">
      
      {/* 1. Header / Navigation Rail */}
      <header className="sticky top-0 z-30 bg-black/90 border-b border-white/10 backdrop-blur-md px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Left: Branding */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-white flex items-center justify-center rounded-none border border-white">
              <div className="w-3 h-3 bg-black rounded-none"></div>
            </div>
            <span className="text-md font-bold tracking-tighter uppercase text-white">
              GhostCFO
            </span>
          </div>
          
          <div className="h-4 w-[1px] bg-white/10" />
          
          {/* Org context indicator */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">ORG SCOPE:</span>
            <span id="console-org-badge" className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-none bg-white/[0.02] border border-white/10 text-white">
              {auth.org?.name}
            </span>
          </div>
        </div>

        {/* Center: Live Connection status */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div id="connection-status-indicator" className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-none ${socketConnected ? 'bg-emerald-400 animate-ping' : 'bg-red-500 animate-pulse'}`} />
            <span className={`text-[9px] font-bold font-mono tracking-widest ${socketConnected ? 'text-emerald-400' : 'text-red-500'}`}>
              {socketConnected ? '● GATEWAY CONNECTED' : '● CONNECTION SEVERED'}
            </span>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center bg-[#09090c] p-1 rounded-none border border-white/10">
            <button
              id="tab-runs"
              onClick={() => setActiveTab('runs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-none text-[10px] font-bold tracking-widest transition uppercase ${activeTab === 'runs' ? 'bg-white text-black font-extrabold' : 'text-zinc-500 hover:text-white'}`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Command Center
            </button>
            <button
              id="tab-fleet"
              onClick={() => setActiveTab('fleet')}
              className={`flex items-center gap-2 px-4 py-2 rounded-none text-[10px] font-bold tracking-widest transition uppercase ${activeTab === 'fleet' ? 'bg-white text-black font-extrabold' : 'text-zinc-500 hover:text-white'}`}
            >
              <Database className="w-3.5 h-3.5" />
              Fleet View
            </button>
            <button
              id="tab-audit"
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-none text-[10px] font-bold tracking-widest transition uppercase ${activeTab === 'audit' ? 'bg-white text-black font-extrabold' : 'text-zinc-500 hover:text-white'}`}
            >
              <FileText className="w-3.5 h-3.5" />
              Audit Trail
            </button>
          </nav>
        </div>

        {/* Right: Operator profile and Logout */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right">
            <span className="text-[11px] font-bold tracking-wide text-zinc-300">{auth.user?.name}</span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{auth.user?.email}</span>
          </div>
          <button
            id="console-logout-btn"
            onClick={onLogout}
            className="p-2 rounded-none bg-white/[0.02] border border-white/10 text-zinc-500 hover:text-white hover:border-white transition duration-150"
            title="Disconnect Operator"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Connection Severed Alert Block */}
      {!socketConnected && (
        <div id="connection-severed-bar" className="bg-red-950/20 border-b border-red-900/40 text-red-400 text-center text-xs py-2 px-4 font-mono uppercase tracking-wider font-semibold flex items-center justify-center gap-2 animate-pulse">
          <AlertCircle className="w-4 h-4" />
          [COMMUNICATION_FAULT] Real-time connection to FinOps agent daemon severed. Attempting recovery...
        </div>
      )}

      {/* Global error banner */}
      {error && (
        <div className="bg-amber-950/20 border-b border-amber-900/40 text-amber-400 text-center text-xs py-2 px-4 flex items-center justify-between font-mono uppercase tracking-wide font-semibold">
          <span>[ERROR] {error}</span>
          <button onClick={() => setError(null)} className="text-xs font-bold text-amber-400 hover:text-white focus:outline-none">Dismiss</button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto">
        <AnimatePresence mode="wait">
          
          {/* ========================================== */}
          {/* TAB 1: RUNS & REAL-TIME TIMELINE COMMAND CENTER */}
          {/* ========================================== */}
          {activeTab === 'runs' && (
            <motion.div
              key="runs-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              
              {/* Left Column: Plan Launchers & Run History (4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Launch New Run Box */}
                <div className="bg-black p-6 rounded-none border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-[1.5px] h-full bg-indigo-500" />
                  <h3 className="text-[10px] font-bold tracking-[0.25em] text-zinc-500 uppercase font-sans mb-4">Sealed Plan Orchestration</h3>
                  
                  <p className="text-xs text-zinc-400 mb-5 leading-relaxed font-sans">
                    Formulate and seal a FinOps operation plan. Once captured, any un-sealed tool call is cryptographically rejected.
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      id="btn-scenario-compliant"
                      onClick={() => handleLaunchAgent('compliant')}
                      disabled={loading !== null || !socketConnected}
                      className="w-full text-left px-4 py-3 rounded-none bg-white/[0.01] hover:bg-white/[0.04] border border-white/10 transition flex items-center justify-between group disabled:opacity-50 select-none cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition uppercase tracking-wide">Compliant Pruning Loop</div>
                        <div className="text-[10px] font-mono text-zinc-500 mt-1 uppercase tracking-wider">100% In-Scope • Auto-Resolves</div>
                      </div>
                      <Zap className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition" />
                    </button>

                    <button
                      id="btn-scenario-violation"
                      onClick={() => handleLaunchAgent('policy_violation')}
                      disabled={loading !== null || !socketConnected}
                      className="w-full text-left px-4 py-3 rounded-none bg-white/[0.01] hover:bg-white/[0.04] border border-white/10 transition flex items-center justify-between group disabled:opacity-50 select-none cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-amber-400 transition uppercase tracking-wide">Policy Violation Run</div>
                        <div className="text-[10px] font-mono text-zinc-500 mt-1 uppercase tracking-wider">Destructive action • Triggers Hold</div>
                      </div>
                      <AlertTriangle className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition" />
                    </button>

                    <button
                      id="btn-scenario-tamper"
                      onClick={() => handleLaunchAgent('tampered')}
                      disabled={loading !== null || !socketConnected}
                      className="w-full text-left px-4 py-3 rounded-none bg-white/[0.01] hover:bg-red-950/20 border border-white/10 hover:border-red-900/60 transition flex items-center justify-between group disabled:opacity-50 select-none cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-red-400 transition uppercase tracking-wide">Cryptographic Tamper Attack</div>
                        <div className="text-[10px] font-mono text-zinc-500 mt-1 uppercase tracking-wider">Adversarial Injection • Block Demo</div>
                      </div>
                      <Lock className="w-4 h-4 text-zinc-600 group-hover:text-red-400 transition" />
                    </button>
                  </div>
                </div>

                {/* Execution Run History List */}
                <div className="bg-black p-6 rounded-none border border-white/10 flex-1 flex flex-col min-h-[300px]">
                  <h3 className="text-[10px] font-bold tracking-[0.25em] text-zinc-500 uppercase font-sans mb-4">Run Vault Logs</h3>
                  
                  <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[400px] pr-2">
                    {runs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <Terminal className="w-8 h-8 text-zinc-700 mb-2" />
                        <p className="text-[10px] font-mono tracking-widest text-zinc-600 font-bold uppercase">NO SECURED RUNS IN RECORD</p>
                      </div>
                    ) : (
                      runs.map(run => {
                        const statusColors = {
                          pending: 'border-white/10 text-zinc-500 bg-white/[0.02]',
                          running: 'border-indigo-900/50 text-indigo-400 bg-indigo-950/20',
                          completed: 'border-green-900/50 text-green-400 bg-green-950/20',
                          paused: 'border-amber-900/50 text-amber-400 bg-amber-950/20 animate-pulse font-bold',
                          failed: 'border-red-900/50 text-red-400 bg-red-950/20 font-bold'
                        };

                        return (
                          <div
                            key={run.id}
                            onClick={() => setSelectedRunId(run.id)}
                            className={`p-4 rounded-none border cursor-pointer transition flex flex-col gap-2 relative overflow-hidden ${selectedRunId === run.id ? 'border-white/30 bg-white/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.5)]' : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/20'}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-zinc-500 font-bold">{run.id}</span>
                              <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-none border ${statusColors[run.status]}`}>
                                {run.status}
                              </span>
                            </div>
                            
                            <p className="text-xs font-bold uppercase tracking-wide text-zinc-200 line-clamp-1 leading-normal">{run.goal}</p>
                            
                            <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono mt-1 uppercase tracking-wider font-semibold">
                              <span>Steps: {run.steps.length}</span>
                              <span>{new Date(run.createdAt).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Execution Timeline detail (8 cols) */}
              <div className="lg:col-span-8">
                {selectedRun ? (
                  <div className="bg-black p-6 rounded-none flex flex-col gap-6 relative border border-white/10">
                    
                    {/* Status accent indicator */}
                    <div className={`absolute top-0 inset-x-0 h-[2.5px] ${selectedRun.status === 'completed' ? 'bg-emerald-500' : selectedRun.status === 'failed' ? 'bg-red-500' : selectedRun.status === 'paused' ? 'bg-amber-500' : 'bg-indigo-500'}`} />

                    {/* Header Details */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold tracking-[0.25em] text-indigo-400 uppercase font-sans">Active Execution Frame</span>
                          <h2 className="text-xl font-serif italic font-light text-white mt-1.5 tracking-tight">{selectedRun.goal}</h2>
                        </div>
                        
                        <div className="flex flex-col text-right items-end font-sans">
                          <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">STATUS: <span className="uppercase text-indigo-400 font-extrabold">{selectedRun.status}</span></span>
                          <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-600 mt-2 uppercase">{new Date(selectedRun.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Cryptographic Signatures Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-none bg-white/[0.01] border border-white/10 font-mono text-[10px]">
                        <div className="flex flex-col gap-1">
                          <span className="text-zinc-500 uppercase text-[9px] font-bold tracking-widest flex items-center gap-1">
                            <Lock className="w-3 h-3 text-zinc-600" /> Plan Hash (Sealed)
                          </span>
                          <div className="flex items-center justify-between bg-black px-2 py-1.5 rounded-none border border-white/5 text-zinc-400 truncate">
                            <span className="truncate">{selectedRun.planHash}</span>
                            <button onClick={() => handleCopy(selectedRun.planHash, 'hash')} className="text-zinc-600 hover:text-white ml-1.5 focus:outline-none cursor-pointer">
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-zinc-500 uppercase text-[9px] font-bold tracking-widest flex items-center gap-1">
                            <Lock className="w-3 h-3 text-zinc-600" /> Merkle Root Seal
                          </span>
                          <div className="flex items-center justify-between bg-black px-2 py-1.5 rounded-none border border-white/5 text-zinc-400 truncate">
                            <span className="truncate">{selectedRun.merkleRoot}</span>
                            <button onClick={() => handleCopy(selectedRun.merkleRoot, 'merkle')} className="text-zinc-600 hover:text-white ml-1.5 focus:outline-none cursor-pointer">
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-zinc-500 uppercase text-[9px] font-bold tracking-widest flex items-center gap-1">
                            <Lock className="w-3 h-3 text-zinc-600" /> Step Proof Seal
                          </span>
                          <div className="flex items-center justify-between bg-black px-2 py-1.5 rounded-none border border-white/5 text-zinc-400 truncate">
                            <span className="truncate">{selectedRun.stepProof}</span>
                            <button onClick={() => handleCopy(selectedRun.stepProof, 'proof')} className="text-zinc-600 hover:text-white ml-1.5 focus:outline-none cursor-pointer">
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {copiedText && (
                        <div className="text-[9px] font-bold font-mono text-emerald-400 uppercase tracking-widest bg-emerald-950/20 px-2 py-1 rounded-none self-end">
                          ✓ Copied {copiedText} signature to secure workspace clipboard
                        </div>
                      )}
                    </div>

                    {/* Timeline Tracker */}
                    <div className="flex-1 flex flex-col gap-4">
                      <h3 className="text-[10px] font-bold tracking-[0.25em] text-zinc-500 uppercase font-sans">Real-time Cryptographic Verification Pipeline</h3>

                      <div className="relative border-l border-white/10 ml-4 pl-8 space-y-6 py-2">
                        {selectedRun.steps.map((step, idx) => {
                          const isCurrent = idx === selectedRun.currentStepIndex && selectedRun.status === 'running';
                          const isHeld = step.status === 'held';
                          const isAllowed = step.status === 'allowed' || step.status === 'approved';
                          const isFailed = step.status === 'failed' || step.status === 'rejected';
                          const isPending = step.status === 'pending';

                          return (
                            <div key={step.id} className="relative group">
                              
                              {/* Step Status Node Bulb */}
                              <div className="absolute -left-[45px] top-1.5 flex items-center justify-center">
                                {isAllowed && (
                                  <div className="p-1 rounded-none bg-black border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                  </div>
                                )}
                                {isHeld && (
                                  <div className="p-1 rounded-none bg-black border border-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.4)] animate-bounce">
                                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                                  </div>
                                )}
                                {isFailed && (
                                  <div className="p-1 rounded-none bg-black border border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                                    <XCircle className="w-4 h-4 text-red-400" />
                                  </div>
                                )}
                                {isCurrent && (
                                  <div className="p-1 rounded-none bg-black border border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)] animate-spin">
                                    <RefreshCw className="w-4 h-4 text-indigo-400" />
                                  </div>
                                )}
                                {isPending && (
                                  <div className="w-4 h-4 rounded-none bg-zinc-900 border-2 border-zinc-800" />
                                )}
                              </div>

                              {/* Step Details Box */}
                              <div className={`p-4 rounded-none border transition ${isHeld ? 'border-amber-900/60 bg-amber-950/10' : isFailed ? 'border-red-900/60 bg-red-950/10' : isAllowed ? 'border-white/10 bg-white/[0.01]' : 'border-white/5 bg-white/[0.01]'}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-zinc-500 font-bold">[{step.mcp}]</span>
                                    <span className="text-xs font-bold uppercase tracking-wide text-white">{step.action}</span>
                                  </div>

                                  <span className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded-none border ${isAllowed ? 'text-emerald-400 border-emerald-950' : isHeld ? 'text-amber-400 border-amber-950 animate-pulse' : isFailed ? 'text-red-400 border-red-950' : isCurrent ? 'text-indigo-400' : 'text-zinc-500'}`}>
                                    {step.status}
                                  </span>
                                </div>

                                <div className="mt-2 text-[10px] font-mono text-zinc-500 space-y-1 bg-black p-2.5 rounded-none border border-white/5 uppercase tracking-wider">
                                  <div><span className="text-zinc-600 font-bold">Params:</span> {JSON.stringify(step.params)}</div>
                                </div>

                                {/* Held Step Warning with Live Approve/Reject Actions */}
                                {isHeld && (
                                  <div className="mt-4 p-4 rounded-none bg-amber-950/10 border border-amber-900/40">
                                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
                                      [ARMORIQ POLICY BLOCK] {step.holdReason}
                                    </p>
                                    
                                    <div className="mt-4 flex items-center gap-3">
                                      <button
                                        id={`btn-approve-${step.id}`}
                                        onClick={() => handleApproveStep(selectedRun.id, step.id)}
                                        disabled={loading === `approve-${step.id}`}
                                        className="px-4 py-2.5 rounded-none bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono text-[10px] uppercase transition tracking-widest flex items-center gap-1 select-none cursor-pointer"
                                      >
                                        Authorize Override
                                      </button>
                                      <button
                                        id={`btn-reject-${step.id}`}
                                        onClick={() => handleRejectStep(selectedRun.id, step.id)}
                                        disabled={loading === `reject-${step.id}`}
                                        className="px-4 py-2.5 rounded-none bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold font-mono text-[10px] uppercase transition tracking-widest flex items-center gap-1 select-none cursor-pointer"
                                      >
                                        Reject Execution
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Tampered/Failure indicator */}
                                {isFailed && step.holdReason && (
                                  <div className="mt-3 p-3 rounded-none bg-red-950/10 border border-red-900/40 text-[10px] font-bold font-mono text-red-400 uppercase tracking-wide leading-relaxed">
                                    [THREAT_VETO] {step.holdReason}
                                  </div>
                                )}
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Run injection control (Tamper Button) */}
                    {selectedRun.status === 'running' && (
                      <div className="p-4 rounded-none border border-red-950 bg-red-950/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-[0.2em] flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Adversarial Intercept Simulation
                          </span>
                          <p className="text-[11px] text-zinc-400 leading-normal font-sans">
                            Attempt to spoof client verification token. ArmorIQ will intercept this in real-time.
                          </p>
                        </div>
                        
                        <button
                          id="btn-tamper-simulation"
                          onClick={() => handleInjectTampering(selectedRun.id)}
                          disabled={loading !== null}
                          className="px-4 py-3 bg-red-600/20 border border-red-800/40 hover:bg-red-600 hover:border-red-500 hover:text-white text-red-400 font-mono font-bold text-[10px] uppercase tracking-widest rounded-none transition select-none flex items-center gap-1.5 cursor-pointer"
                        >
                          {loading === 'tamper' ? 'Verifying Block...' : 'Inject Tampering Attack'}
                        </button>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="bg-black p-12 rounded-none text-center flex flex-col items-center justify-center min-h-[400px] border border-white/10">
                    <Shield className="w-12 h-12 text-zinc-700 animate-pulse mb-4" />
                    <h3 className="font-serif italic font-light text-lg text-white">Establish Agent Session</h3>
                    <p className="text-xs text-zinc-500 max-w-sm mt-3 leading-relaxed uppercase tracking-wider font-semibold">
                      Select an execution thread from the log vault or formulate a new secure FinOps plan using the orchestrators.
                    </p>
                  </div>
                )}
              </div>

            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 2: CLOUD FLEET INVENTORY (RESOURCES) */}
          {/* ========================================== */}
          {activeTab === 'fleet' && (
            <motion.div
              key="fleet-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6"
            >
              
              {/* Fleet Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
                <div>
                  <h2 className="text-xl font-serif italic font-light text-white">Cloud Asset Fleet</h2>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-normal font-sans">
                    This inventory mirrors the targeted cloud resources. Watch the FinOps agent mutate states or perform secure cleanup.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    id="btn-restore-fleet"
                    onClick={handleResetFleet}
                    disabled={loading === 'reset-fleet'}
                    className="px-4 py-2.5 rounded-none bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] text-[10px] font-bold font-mono uppercase tracking-widest text-zinc-300 transition flex items-center gap-1.5 select-none cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Fleet State
                  </button>
                </div>
              </div>

              {/* Grid of Resources */}
              <div id="fleet-inventory-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map(res => {
                  const isProd = res.tags?.environment === 'production';
                  const isTerminated = res.status === 'terminated';
                  const isIdle = res.status === 'idle';

                  return (
                    <div
                      key={res.id}
                      className={`bg-black p-5 rounded-none border relative overflow-hidden transition flex flex-col gap-4 ${isTerminated ? 'opacity-40 border-dashed border-white/5 bg-white/[0.01]' : 'border-white/10'}`}
                    >
                      {/* Top banner */}
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                          {res.type}
                        </span>
                        
                        <span className={`text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded-none border ${isTerminated ? 'text-zinc-500 bg-white/[0.02] border-white/5' : isIdle ? 'text-amber-400 bg-amber-950/10 border-amber-900/40 animate-pulse' : 'text-emerald-400 bg-emerald-950/10 border-emerald-900/40'}`}>
                          {res.status}
                        </span>
                      </div>

                      {/* Title & Cost */}
                      <div className="flex items-baseline justify-between gap-2 border-b border-white/5 pb-3">
                        <span className="text-xs font-bold text-white truncate font-mono uppercase tracking-wide">{res.name}</span>
                        <span className="text-xs font-mono text-indigo-400 font-extrabold whitespace-nowrap">${res.cost}/mo</span>
                      </div>

                      {/* Resource tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(res.tags || {}).map(([key, val]) => (
                          <span
                            key={key}
                            className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-none border ${isProd && key === 'environment' ? 'bg-red-950/10 border-red-900/40 text-red-400 font-extrabold' : 'bg-white/[0.01] border-white/5 text-zinc-400'}`}
                          >
                            {key}:{val}
                          </span>
                        ))}
                      </div>

                      {/* CPU / Utilization bar indicator */}
                      {!isTerminated && (
                        <div className="space-y-1.5 mt-2">
                          <div className="flex items-center justify-between text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-widest">
                            <span>Utilization:</span>
                            <span className={isIdle ? 'text-amber-400 font-extrabold' : 'text-zinc-300'}>{res.utilization}%</span>
                          </div>
                          
                          <div className="w-full h-1 bg-zinc-950 overflow-hidden border border-white/5 rounded-none">
                            <div 
                              className={`h-full rounded-none ${isIdle ? 'bg-amber-400' : 'bg-indigo-500'}`}
                              style={{ width: `${res.utilization}%` }}
                            />
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

            </motion.div>
          )}

          {/* ========================================== */}
          {/* TAB 3: CRYPTOGRAPHIC AUDIT LOG */}
          {/* ========================================== */}
          {activeTab === 'audit' && (
            <motion.div
              key="audit-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6"
            >
              
              {/* Filter controls */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#09090c] p-4 rounded-none border border-white/10">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-initial">
                    <span className="absolute left-3.5 top-3 text-zinc-500">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      id="input-audit-search-action"
                      type="text"
                      value={auditFilterAction}
                      onChange={(e) => setAuditFilterAction(e.target.value)}
                      placeholder="FILTER BY ACTION..."
                      className="pl-10 pr-4 py-2.5 rounded-none bg-black border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition font-mono uppercase tracking-widest w-full md:w-60"
                    />
                  </div>

                  <select
                    id="select-audit-filter-decision"
                    value={auditFilterDecision}
                    onChange={(e) => setAuditFilterDecision(e.target.value)}
                    className="px-3 py-2.5 rounded-none bg-black border border-white/10 text-xs text-white focus:outline-none focus:border-white font-mono uppercase tracking-widest"
                  >
                    <option value="">ALL DECISIONS</option>
                    <option value="allowed">ALLOWED</option>
                    <option value="held">HELD</option>
                    <option value="approved">APPROVED</option>
                    <option value="blocked">BLOCKED</option>
                    <option value="rejected">REJECTED</option>
                  </select>
                </div>

                <div className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-widest">
                  RECORD VOLUME: {filteredLogs.length} AUDITS COMPLIED
                </div>
              </div>

              {/* Audits Table */}
              <div id="audit-logs-table-container" className="bg-black rounded-none overflow-hidden border border-white/10 shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/[0.01] border-b border-white/10 text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-[0.25em]">
                        <th className="py-4 px-6">Timestamp</th>
                        <th className="py-4 px-6">Execution / MCP</th>
                        <th className="py-4 px-6">Action</th>
                        <th className="py-4 px-6">Decision</th>
                        <th className="py-4 px-6 text-right">Integrity Seal</th>
                      </tr>
                    </thead>
                    {filteredLogs.length === 0 ? (
                      <tbody className="divide-y divide-white/10 text-xs font-mono">
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-zinc-500 font-mono font-bold tracking-widest uppercase">
                            NO CRYPTOGRAPHIC LOGS MATCH THE SELECTION CRITERIA
                          </td>
                        </tr>
                      </tbody>
                    ) : (
                      filteredLogs.map(log => {
                        const isExpanded = expandedAuditRow === log.id;
                        const badgeColors = {
                          allowed: 'text-emerald-400 bg-emerald-950/20 border border-emerald-900/40',
                          held: 'text-amber-400 bg-amber-950/20 border border-amber-900/40 animate-pulse',
                          approved: 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 font-bold',
                          blocked: 'text-red-400 bg-red-950/20 border border-red-900/40 font-bold',
                          rejected: 'text-red-400 bg-red-950/20 border border-red-900/40 font-bold'
                        };

                        return (
                          <tbody key={log.id} className="divide-y divide-white/10 text-xs font-mono group transition hover:bg-white/[0.01]">
                            <tr 
                              onClick={() => setExpandedAuditRow(isExpanded ? null : log.id)}
                              className="cursor-pointer"
                            >
                              <td className="py-4 px-6 text-zinc-500 font-bold">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </td>
                              <td className="py-4 px-6 text-zinc-400">
                                <div className="font-bold">{log.runId}</div>
                                <div className="text-[10px] text-zinc-600 mt-0.5 font-semibold">{log.mcp}</div>
                              </td>
                              <td className="py-4 px-6 text-white font-sans font-bold uppercase tracking-wide">
                                {log.action}
                              </td>
                              <td className="py-4 px-6">
                                <span className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-none border ${badgeColors[log.decision]}`}>
                                  {log.decision}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right text-zinc-500">
                                <div className="flex items-center justify-end gap-1.5 font-mono text-[10px]">
                                  <span className="text-zinc-600 truncate max-w-[80px] block font-semibold">{log.planHash}</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-600" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />}
                                </div>
                              </td>
                            </tr>

                            {/* Expanded Row details */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={5} className="bg-white/[0.01] p-6 border-b border-white/10">
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-zinc-400 font-mono uppercase tracking-wider"
                                  >
                                    <div className="space-y-3">
                                      <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">Audit Meta Parameters</div>
                                      
                                      <div className="space-y-1.5 text-[10px] text-zinc-400 font-medium">
                                        <div><span className="text-zinc-600 font-bold">ID:</span> {log.id}</div>
                                        <div><span className="text-zinc-600 font-bold">Timestamp:</span> {log.timestamp}</div>
                                        <div><span className="text-zinc-600 font-bold">Operator Email:</span> {log.userEmail}</div>
                                        <div><span className="text-zinc-600 font-bold">Action Name:</span> {log.action}</div>
                                        <div><span className="text-zinc-600 font-bold">MCP Daemon:</span> {log.mcp}</div>
                                      </div>

                                      <div className="p-3.5 rounded-none bg-black border border-white/5 text-zinc-300 leading-relaxed font-sans text-xs normal-case">
                                        <span className="font-mono text-[10px] font-bold text-indigo-400 block mb-1 uppercase tracking-wider">DECISION LOG MESSAGE:</span>
                                        {log.reason}
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <div className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">Cryptographic Seals</div>

                                      <div className="space-y-2">
                                        <div className="flex flex-col gap-1">
                                          <span className="text-[9px] text-zinc-600 font-bold tracking-widest">SEALED PLAN HASH (SHA-256)</span>
                                          <div className="bg-black px-3 py-2 rounded-none text-zinc-300 font-mono text-[10px] select-all flex items-center justify-between border border-white/5">
                                            <span className="truncate">{log.planHash}</span>
                                            <button onClick={() => handleCopy(log.planHash, 'audit-hash')} className="text-zinc-600 hover:text-indigo-400 ml-2 focus:outline-none cursor-pointer">
                                              <Copy className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                          <span className="text-[9px] text-zinc-600 font-bold tracking-widest">ARMORIQ STEP PROOF SIGNATURE</span>
                                          <div className="bg-black px-3 py-2 rounded-none text-zinc-300 font-mono text-[10px] select-all flex items-center justify-between border border-white/5">
                                            <span className="truncate">{log.stepProof}</span>
                                            <button onClick={() => handleCopy(log.stepProof, 'audit-proof')} className="text-zinc-600 hover:text-indigo-400 ml-2 focus:outline-none cursor-pointer">
                                              <Copy className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="text-[10px] text-indigo-400 flex items-center gap-1.5 mt-2 font-bold tracking-widest uppercase">
                                        <Shield className="w-3.5 h-3.5" /> Core Math Cryptographically Verified
                                      </div>
                                    </div>
                                  </motion.div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        );
                      })
                    )}
                  </table>
                </div>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

    </div>
  );
}
