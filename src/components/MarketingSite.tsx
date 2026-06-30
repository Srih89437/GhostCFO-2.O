import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { 
  Shield, ArrowRight, AlertTriangle, Play, Database, Lock, Cpu, 
  Zap, TrendingDown, Sun, Moon, ChevronRight, Activity, Check, CheckCircle
} from 'lucide-react';
import ParticleBackground from './ParticleBackground';

interface MarketingSiteProps {
  onEnterConsole: () => void;
}

export default function MarketingSite({ onEnterConsole }: MarketingSiteProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [problemActiveMode, setProblemActiveMode] = useState<'fatigue' | 'rogue'>('fatigue');
  
  // Ref for intersection elements (to trigger SVG animations and stats count up)
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [svgInView, setSvgInView] = useState(false);
  const [statSavings, setStatSavings] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection observer for SVG drawing animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSvgInView(true);
        }
      },
      { threshold: 0.2 }
    );
    if (svgRef.current) {
      observer.observe(svgRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Stats Count-up animation on scroll
  useEffect(() => {
    if (!svgInView) return;
    let start = 0;
    const end = 42; // e.g. 42% average cloud savings
    const duration = 1500;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setStatSavings(end);
        clearInterval(timer);
      } else {
        setStatSavings(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [svgInView]);

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${isLightTheme ? 'bg-zinc-50 text-zinc-900' : 'bg-[#030303] text-gray-100'}`}>
      
      {/* 1. Frosted Sticky Navigation Header */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 px-10 py-6 flex items-center justify-between border-b ${
        isScrolled 
          ? isLightTheme 
            ? 'bg-white/90 border-zinc-200/80 backdrop-blur-md shadow-sm' 
            : 'bg-[#050505]/90 border-white/10 backdrop-blur-md shadow-2xl'
          : 'bg-transparent border-transparent'
      }`}>
        {/* Brand logo */}
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 flex items-center justify-center rounded-none border ${isLightTheme ? 'bg-zinc-900 border-zinc-900' : 'bg-white border-white'}`}>
            <div className={`w-4 h-4 rounded-none ${isLightTheme ? 'bg-white' : 'bg-black'}`}></div>
          </div>
          <span className={`text-xl font-bold tracking-tighter uppercase ${isLightTheme ? 'text-zinc-900' : 'text-white'}`}>
            GhostCFO
          </span>
        </div>

        {/* Center links (Aesthetic Only) */}
        <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.2em]">
          <a href="#problem" className={`${isLightTheme ? 'text-zinc-600 hover:text-black' : 'text-white opacity-60 hover:opacity-100'} transition`}>Dual Failure</a>
          <a href="#how-it-works" className={`${isLightTheme ? 'text-zinc-600 hover:text-black' : 'text-white opacity-60 hover:opacity-100'} transition`}>Zero-Trust Pipeline</a>
          <a href="#demo" className={`${isLightTheme ? 'text-zinc-600 hover:text-black' : 'text-white opacity-60 hover:opacity-100'} transition`}>Interactive Demo</a>
          <a href="#metrics" className={`${isLightTheme ? 'text-zinc-600 hover:text-black' : 'text-white opacity-60 hover:opacity-100'} transition`}>Value Deck</a>
        </nav>

        {/* Right controls: Theme Toggle & CTA */}
        <div className="flex items-center gap-4">
          
          {/* Smooth Morphing Theme Toggle */}
          <button
            id="marketing-theme-toggle"
            onClick={() => setIsLightTheme(!isLightTheme)}
            className={`p-2 rounded-none border transition duration-300 ${
              isLightTheme 
                ? 'bg-zinc-200 border-zinc-300 text-zinc-700 hover:bg-zinc-300' 
                : 'bg-zinc-900 border-white/10 text-zinc-400 hover:border-white/30 hover:text-white'
            }`}
            title="Morph interface polarity"
          >
            {isLightTheme ? (
              <motion.div initial={{ rotate: -90 }} animate={{ rotate: 0 }}>
                <Moon className="w-4 h-4" />
              </motion.div>
            ) : (
              <motion.div initial={{ rotate: 90 }} animate={{ rotate: 0 }}>
                <Sun className="w-4 h-4 text-amber-400" />
              </motion.div>
            )}
          </button>

          {/* System Live status from design */}
          <div className="hidden lg:flex items-center gap-3 mr-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[10px] font-mono tracking-widest text-emerald-500 uppercase">System Live</span>
          </div>

          <button
            id="marketing-enter-console-btn"
            onClick={onEnterConsole}
            className={`px-4 py-2 rounded-none font-bold text-[10px] uppercase tracking-widest transition duration-150 select-none flex items-center gap-1.5 ${
              isLightTheme 
                ? 'bg-zinc-900 hover:bg-zinc-800 text-white' 
                : 'bg-white hover:bg-emerald-500 hover:text-black text-black'
            }`}
          >
            Access Core Platform
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. CINEMATIC HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 px-10 overflow-hidden">
        {/* Render interactive background if not in light mode */}
        {!isLightTheme && (
          <div className="absolute inset-0 z-0">
            <ParticleBackground />
          </div>
        )}
        
        {/* Light theme soft glowing blobs */}
        {isLightTheme && (
          <div className="absolute inset-0 z-0 overflow-hidden bg-zinc-50">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-zinc-100 rounded-full blur-[140px] opacity-60 pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-zinc-200 rounded-full blur-[100px] opacity-50 pointer-events-none" />
          </div>
        )}

        <div className="max-w-4xl w-full mx-auto text-center relative z-10 space-y-10 px-4">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-none border text-[10px] font-bold uppercase tracking-[0.25em] ${
            isLightTheme 
              ? 'bg-zinc-100 border-zinc-200 text-zinc-600' 
              : 'bg-white/[0.02] border-white/10 text-white/60'
          }`}>
            <Zap className="w-3.5 h-3.5 text-emerald-400" /> Cryptographically Sealed FinOps
          </div>

          <div className="space-y-4">
            <p className={`text-[11px] font-bold tracking-[0.35em] uppercase ${isLightTheme ? 'text-zinc-400' : 'text-white/30'} font-sans`}>
              FinOps Sovereignty
            </p>
            <h1 className="text-5xl md:text-8xl font-light leading-[0.9] tracking-tighter italic font-serif">
              <span className={isLightTheme ? 'text-zinc-900' : 'text-white'}>Autonomous.</span><br />
              <span className={`not-italic font-bold tracking-[-0.05em] ${isLightTheme ? 'text-zinc-800' : 'text-white'}`}>Constrained.</span>
            </h1>
          </div>

          <p className={`text-base md:text-lg max-w-xl mx-auto leading-relaxed font-sans ${isLightTheme ? 'text-zinc-600' : 'text-white/50'}`}>
            Zero-Trust execution for cloud optimization. Mathematically verified by ArmorIQ.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              id="hero-primary-cta"
              onClick={onEnterConsole}
              className={`w-full sm:w-auto px-8 py-4 rounded-none font-bold text-xs uppercase tracking-widest transition duration-150 select-none flex items-center justify-center gap-2 ${
                isLightTheme
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-white'
                  : 'bg-white text-black hover:bg-emerald-500 transition-colors'
              }`}
            >
              Initialize Live Agent Demo
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <a
              id="hero-secondary-anchor"
              href="#problem"
              className={`w-full sm:w-auto px-8 py-4 rounded-none border font-bold text-xs uppercase tracking-widest transition text-center select-none ${
                isLightTheme 
                  ? 'border-zinc-950 text-zinc-900 hover:bg-zinc-100' 
                  : 'border-white/10 text-white hover:bg-white/5 hover:border-white'
              }`}
            >
              Analyze Threat Mitigation
            </a>
          </div>

          {/* Core Tech badging */}
          <div className="pt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em] font-semibold">
            <span>SOC-2 TYPE II ENFORCED</span>
            <span>•</span>
            <span>ARMORIQ ZERO-TRUST SECURITY</span>
            <span>•</span>
            <span>ISO 27001 SECURED</span>
          </div>
        </div>

        {/* Scroll down indicator mouse */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
          <div className="w-5 h-8 rounded-full border-2 border-zinc-700 flex justify-center p-1">
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
          </div>
          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">SCROLL FOR SECURE AUDIT</span>
        </div>
      </section>

      {/* 3. PROBLEM SECTION (DUAL FAILURES TRANSITION) */}
      <section id="problem" className={`py-24 px-10 border-t ${isLightTheme ? 'border-zinc-200' : 'border-white/10 bg-[#050505]'}`}>
        <div className="max-w-6xl w-full mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-indigo-400 font-sans">The FinOps Frontier</span>
            <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight">The Dual Failure Paradigm</h2>
            <p className={`text-sm max-w-xl mx-auto leading-relaxed ${isLightTheme ? 'text-zinc-600' : 'text-white/50'}`}>
              Modern cloud teams are trapped between two critical agent limitations: perpetual notification fatigue or catastrophic unchecked destruction.
            </p>
          </div>

          {/* Interactive dual-mode selector toggle */}
          <div className="flex justify-center">
            <div className={`p-1 rounded-none border flex ${isLightTheme ? 'bg-zinc-100 border-zinc-200' : 'bg-black border-white/10'}`}>
              <button
                id="btn-failure-fatigue"
                onClick={() => setProblemActiveMode('fatigue')}
                className={`px-6 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-wider transition ${
                  problemActiveMode === 'fatigue' 
                    ? isLightTheme 
                      ? 'bg-zinc-900 text-white shadow' 
                      : 'bg-white text-black font-extrabold' 
                    : isLightTheme 
                      ? 'text-zinc-500 hover:text-zinc-900' 
                      : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Failure A: Alert Fatigue
              </button>
              <button
                id="btn-failure-rogue"
                onClick={() => setProblemActiveMode('rogue')}
                className={`px-6 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-wider transition ${
                  problemActiveMode === 'rogue' 
                    ? isLightTheme 
                      ? 'bg-zinc-900 text-white shadow' 
                      : 'bg-white text-black font-extrabold' 
                    : isLightTheme 
                      ? 'text-zinc-500 hover:text-zinc-900' 
                      : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Failure B: Rogue Agents
              </button>
            </div>
          </div>

          {/* Interactive slide transitions */}
          <AnimatePresence mode="wait">
            {problemActiveMode === 'fatigue' ? (
              <motion.div
                key="fatigue-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                {/* Text (5 cols) */}
                <div className="lg:col-span-5 space-y-5">
                  <div className={`p-2.5 w-fit rounded-none border ${isLightTheme ? 'bg-amber-100/50 border-amber-200 text-amber-700' : 'bg-amber-950/20 border-amber-900/30 text-amber-400'}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-display font-extrabold tracking-tight">Constant Alert Blockade</h3>
                  <p className={`text-sm leading-relaxed ${isLightTheme ? 'text-zinc-600' : 'text-white/50'}`}>
                    Legacy agents lack execution-level cryptographic governance. Because they cannot verify authorization parameters on their own, they are hardcoded to halt and page a human supervisor for every single trivial resource enumeration task. 
                  </p>
                  <ul className="space-y-2.5 text-[10px] font-mono tracking-wider text-zinc-500 uppercase font-semibold">
                    <li className="flex items-center gap-2 text-amber-500"><XCircleIcon /> Interrupted slack channels every 4 minutes</li>
                    <li className="flex items-center gap-2"><XCircleIcon /> Human bottlenecks destroying efficiency</li>
                    <li className="flex items-center gap-2"><XCircleIcon /> Cloud savings unrealized due to constant delay</li>
                  </ul>
                </div>

                {/* Visual interface (7 cols) */}
                <div className="lg:col-span-7 bg-black p-6 rounded-none border border-white/10 font-mono text-[11px] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 bg-amber-950/40 text-[9px] text-amber-400 font-bold border-l border-b border-white/10 uppercase">Alert Exhaustion</div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span className="text-zinc-400 text-xs font-bold uppercase tracking-wide">PAGERDUTY #301 - STANDBY HOLD</span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="p-4 rounded-none bg-white/[0.02] border border-white/5">
                        <div className="text-zinc-500">[08:42:11] AGENT_STATUS: paused</div>
                        <div className="text-zinc-300 mt-1">Requesting supervisor approval to call <span className="text-amber-400 font-bold">'list_instances'</span> in sandbox environment...</div>
                      </div>

                      <div className="p-4 rounded-none bg-white/[0.02] border border-white/5">
                        <div className="text-zinc-500">[08:46:15] AGENT_STATUS: paused</div>
                        <div className="text-zinc-300 mt-1">Requesting supervisor approval to call <span className="text-amber-400 font-bold">'analyze_utilization'</span> on staging cluster...</div>
                      </div>
                    </div>

                    <div className="pt-3 flex justify-end">
                      <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">OVERRIDE DEMAND: 14 PENDING ALERTS</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="rogue-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
              >
                {/* Text (5 cols) */}
                <div className="lg:col-span-5 space-y-5">
                  <div className={`p-2.5 w-fit rounded-none border ${isLightTheme ? 'bg-red-100/50 border-red-200 text-red-700' : 'bg-red-950/20 border-red-900/30 text-red-400'}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-display font-extrabold tracking-tight">Unchecked System Mutations</h3>
                  <p className={`text-sm leading-relaxed ${isLightTheme ? 'text-zinc-600' : 'text-white/50'}`}>
                    Alternatively, giving agents full access keys without cryptographic micro-boundaries is a recipe for disaster. The moment an LLM hallucinates or gets target parameters confused, it deletes active database backup volumes or breaks live services.
                  </p>
                  <ul className="space-y-2.5 text-[10px] font-mono tracking-wider text-zinc-500 uppercase font-semibold">
                    <li className="flex items-center gap-2 text-red-400"><XCircleIcon /> HALO production databases deleted by mistake</li>
                    <li className="flex items-center gap-2"><XCircleIcon /> Complete loss of service control integrity</li>
                    <li className="flex items-center gap-2"><XCircleIcon /> Hallucinated MCP tools execution</li>
                  </ul>
                </div>

                {/* Visual interface (7 cols) */}
                <div className="lg:col-span-7 bg-black p-6 rounded-none border border-white/10 font-mono text-[11px] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 bg-red-950/40 text-[9px] text-red-400 font-bold border-l border-b border-white/10 uppercase">Rogue Execution</div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      <span className="text-zinc-400 text-xs text-red-400 font-bold uppercase tracking-wide">SYSTEM OUTAGE INCIDENT</span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="p-4 rounded-none bg-red-950/10 border border-red-900/30">
                        <div className="text-red-400 font-bold">[14:15:02] CALL_INVOKED: 'delete_volume'</div>
                        <div className="text-zinc-300 mt-1">Target resource: <span className="text-red-400 font-bold">ebs-vol-prod-db-backup</span></div>
                        <div className="text-zinc-500 mt-1">Result: Success. Volume terminated autonomously.</div>
                      </div>

                      <div className="text-red-400 font-bold text-[10px] animate-pulse tracking-wide">
                        ⚠️ WARNING: MAIN TRANSACTION DATABASE SYSTEM REPORTING CRITICAL DISK READ FAULT
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </section>

      {/* 4. HOW IT WORKS (SVG PIPELINE DIAGRAM) */}
      <section id="how-it-works" className={`py-24 px-10 border-t ${isLightTheme ? 'border-zinc-200 bg-white' : 'border-white/10 bg-[#050505]'}`}>
        <div className="max-w-5xl w-full mx-auto space-y-16">
          
          <div className="text-center space-y-3">
            <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-indigo-400 font-sans">Mathematical Governance</span>
            <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight">The Zero-Trust Agent Pipeline</h2>
            <p className={`text-sm max-w-xl mx-auto leading-relaxed ${isLightTheme ? 'text-zinc-600' : 'text-white/50'}`}>
              GhostCFO establishes the industry's first absolute cryptographic isolation envelope for AI systems.
            </p>
          </div>

          {/* Elegant Horizontal Flow SVG */}
          <div className="p-8 rounded-none bg-black border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-[#6366f1]/20" />
            
            <svg 
              ref={svgRef}
              viewBox="0 0 800 220" 
              className="w-full h-auto text-white fill-none font-mono text-[10px]"
            >
              {/* SVG connection path that draws itself in view */}
              <path 
                d="M 120 110 L 260 110 M 380 110 L 520 110 M 640 110 L 710 110" 
                stroke="#6366f1" 
                strokeWidth="2" 
                strokeDasharray="600"
                strokeDashoffset={svgInView ? "0" : "600"}
                className="transition-all duration-[2000ms] ease-out"
              />

              {/* Step 1 Node */}
              <g transform="translate(40, 60)">
                <rect x="0" y="0" width="100" height="100" rx="0" fill="#000" stroke="#white" strokeWidth="1" className="stroke-white/10" />
                <rect x="0" y="0" width="100" height="100" rx="0" fill="none" stroke="#6366f1" strokeWidth="1.5" className={svgInView ? "opacity-100 transition-opacity delay-300" : "opacity-0"} />
                <text x="50" y="40" textAnchor="middle" fill="#818cf8" fontWeight="bold">1. PLANNER</text>
                <text x="50" y="65" textAnchor="middle" fill="#9ca3af">Formulates</text>
                <text x="50" y="80" textAnchor="middle" fill="#9ca3af">Pruning Plan</text>
              </g>

              {/* Step 2 Node */}
              <g transform="translate(260, 60)">
                <rect x="0" y="0" width="120" height="100" rx="0" fill="#000" stroke="#white" strokeWidth="1" className="stroke-white/10" />
                <rect x="0" y="0" width="120" height="100" rx="0" fill="none" stroke="#6366f1" strokeWidth="1.5" className={svgInView ? "opacity-100 transition-opacity delay-700" : "opacity-0"} />
                <text x="60" y="40" textAnchor="middle" fill="#818cf8" fontWeight="bold">2. CRYPTO SEAL</text>
                <text x="60" y="65" textAnchor="middle" fill="#9ca3af">ArmorIQ locks</text>
                <text x="60" y="80" textAnchor="middle" fill="#9ca3af">Intent Tokens</text>
              </g>

              {/* Step 3 Node */}
              <g transform="translate(520, 60)">
                <rect x="0" y="0" width="120" height="100" rx="0" fill="#000" stroke="#white" strokeWidth="1" className="stroke-white/10" />
                <rect x="0" y="0" width="120" height="100" rx="0" fill="none" stroke="#6366f1" strokeWidth="1.5" className={svgInView ? "opacity-100 transition-opacity delay-1100" : "opacity-0"} />
                <text x="60" y="40" textAnchor="middle" fill="#f59e0b" fontWeight="bold">3. INTERCEPTOR</text>
                <text x="60" y="65" textAnchor="middle" fill="#9ca3af">Gates out-of-</text>
                <text x="60" y="80" textAnchor="middle" fill="#9ca3af">scope actions</text>
              </g>

              {/* Step 4 Node */}
              <g transform="translate(700, 75)">
                <circle cx="35" cy="35" r="30" fill="#064e3b" stroke="#10b981" strokeWidth="2" className={svgInView ? "opacity-100 transition-opacity delay-1500" : "opacity-0"} />
                <path d="M 27 35 L 32 40 L 43 28" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <text x="35" y="85" textAnchor="middle" fill="#10b981" fontWeight="bold">SECURED</text>
              </g>
            </svg>

            {/* Explanation grid underneath */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/10 font-sans">
              <div className="space-y-2">
                <div className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-none" /> 1. PLAN CAPTURE
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Before executing any cloud action, the FinOps agent seals the proposed steps into a cryptographically secure hash bound to the operator's workspace.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-none" /> 2. INTENT ENVELOPES
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  The ArmorIQ SDK issues unique micro-invocation tokens mapped to individual authorized actions. Modification of targets automatically invalidates the seal.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> 3. TRUST AUDIT TRAIL
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Every permitted, held, and overridden decision is logged inside an immutable org-wide ledger complete with tamper-proof Merkle proofs and signatures.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. LIVE DEMO TEASER SECTION (CONSOLE MIRROR) */}
      <section id="demo" className={`py-24 px-10 border-t ${isLightTheme ? 'border-zinc-200' : 'border-white/10 bg-[#050505]'}`}>
        <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text Content (4 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-indigo-400 font-sans">Tactile Experience</span>
            <h2 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight">See the Cryptographic Gate in Action</h2>
            <p className={`text-sm leading-relaxed ${isLightTheme ? 'text-zinc-600' : 'text-white/50'}`}>
              Unlike conventional rule-based scripts, GhostCFO coordinates verification at the execution interface. Watch how out-of-scope tasks pause instantly to await operator verification.
            </p>
            
            <button
              id="teaser-enter-console-btn"
              onClick={onEnterConsole}
              className={`px-6 py-4 rounded-none font-bold text-[10px] uppercase tracking-widest transition select-none flex items-center gap-1.5 ${
                isLightTheme
                  ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                  : 'bg-white text-black hover:bg-emerald-500 hover:text-black'
              }`}
            >
              LAUNCH INTERACTIVE DEMO CONSOLE
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Autoplay / Simulating miniature Replica UI (7 cols) */}
          <div className="lg:col-span-7 bg-black p-6 rounded-none border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.8)] font-mono text-[11px] relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-indigo-500/25" />
            
            {/* Mock Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4 text-zinc-500">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-none bg-indigo-500" />
                <span className="text-zinc-400 font-bold uppercase tracking-widest text-[9px]">GHOSTCFO LIVE ENVELOPE</span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">THREAD #F20C</span>
            </div>

            {/* Simulating steps */}
            <div className="space-y-3.5">
              
              {/* Step 1 Allowed */}
              <div className="p-4 rounded-none bg-white/[0.01] border border-green-950/60 flex flex-col gap-1">
                <div className="flex items-center justify-between text-green-400 font-bold uppercase tracking-wide">
                  <span>[mcp-aws-compute] list_instances</span>
                  <span className="text-[9px] uppercase tracking-widest border border-green-950 px-2 py-0.5 rounded-none font-bold">ALLOWED</span>
                </div>
                <div className="text-zinc-500 text-[10px] mt-0.5 uppercase tracking-wider font-semibold">Hash Seal Matches • Enlisted 7 assets</div>
              </div>

              {/* Step 2 Held */}
              <div className="p-4 rounded-none bg-amber-950/5 border border-amber-900/30 glow-amber flex flex-col gap-2 animate-pulse">
                <div className="flex items-center justify-between text-amber-400 font-bold uppercase tracking-wide">
                  <span>[mcp-aws-storage] delete_volume</span>
                  <span className="text-[9px] uppercase tracking-widest border border-amber-900/30 px-2 py-0.5 rounded-none font-bold animate-pulse">HELD FOR SIGNATURE</span>
                </div>
                
                <p className="text-zinc-300 text-[10px] leading-relaxed uppercase tracking-wider">
                  [REASON] ArmorIQ Policy Gate: Destructive volume termination detected outside initial compliant bounds.
                </p>

                <div className="flex items-center gap-2.5 pt-1 font-mono uppercase text-[9px] font-bold tracking-widest">
                  <span className="px-3 py-1.5 rounded-none bg-emerald-500 text-black cursor-pointer">Approve Override</span>
                  <span className="px-3 py-1.5 rounded-none bg-zinc-900 text-zinc-400 cursor-pointer">Reject</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 6. ENTERPRISE VALUE METRICS (COUNT-UP) */}
      <section id="metrics" className={`py-24 px-10 border-y ${isLightTheme ? 'border-zinc-200 bg-zinc-50' : 'border-white/10 bg-[#050505]'}`}>
        <div className="max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          
          <div className="space-y-3">
            <div className="text-5xl md:text-7xl font-serif italic font-light text-indigo-400 tracking-tighter">
              {svgInView ? `${statSavings}%` : '0%'}
            </div>
            <div className="text-[10px] font-bold tracking-[0.25em] text-zinc-500 uppercase font-sans">Average Cloud Savings</div>
            <p className="text-xs text-zinc-400 max-w-[240px] mx-auto leading-relaxed">
              Consistently achieved via automated, autonomous idle instance termination.
            </p>
          </div>

          <div className="space-y-3">
            <div className={`text-5xl md:text-7xl font-serif italic font-light tracking-tighter ${isLightTheme ? 'text-zinc-900' : 'text-white'}`}>
              0
            </div>
            <div className="text-[10px] font-bold tracking-[0.25em] text-zinc-500 uppercase font-sans">Unchecked Production Outages</div>
            <p className="text-xs text-zinc-400 max-w-[240px] mx-auto leading-relaxed">
              Guaranteed by ArmorIQ cryptographically validating every single API call.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-5xl md:text-7xl font-serif italic font-light text-indigo-400 tracking-tighter">
              &lt;2s
            </div>
            <div className="text-[10px] font-bold tracking-[0.25em] text-zinc-500 uppercase font-sans">Authorization Validation</div>
            <p className="text-xs text-zinc-400 max-w-[240px] mx-auto leading-relaxed">
              Sub-second cryptographic verification ensures zero friction to execution speeds.
            </p>
          </div>

        </div>
      </section>

      {/* 7. CTA / MINIMAL FOOTER */}
      <footer className="py-24 px-10 text-center space-y-12 relative overflow-hidden bg-black border-t border-white/10">
        
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-5xl font-serif italic font-light text-white tracking-tighter">Built for the Autonomous Future</h2>
          <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed uppercase tracking-wider font-semibold">
            Eliminate alert fatigue and secure autonomous operations with GhostCFO. No compromises.
          </p>
          
          <div className="pt-4">
            <button
              id="footer-cta"
              onClick={onEnterConsole}
              className="px-10 py-4 rounded-none bg-white text-black hover:bg-emerald-500 font-bold text-xs uppercase tracking-widest transition duration-150 select-none"
            >
              Initialize Developer Sandbox
            </button>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-[10px] tracking-widest font-bold uppercase text-zinc-600 max-w-5xl mx-auto">
          <span>© 2026 GhostCFO Systems Inc. Secured by ArmorIQ.</span>
          <span className="font-mono mt-2 md:mt-0 tracking-[0.2em]">BUILT FOR THE FUTURE</span>
        </div>
      </footer>

    </div>
  );
}

// Inline Helper Components
function XCircleIcon() {
  return (
    <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full inline-block" />
  );
}
