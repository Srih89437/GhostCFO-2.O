import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Eye, EyeOff, Building, Mail, User, Lock, ArrowRight } from 'lucide-react';
import { AuthState } from '../types';

interface AuthProps {
  onAuthSuccess: (auth: AuthState) => void;
  onBackToLanding: () => void;
}

export default function Auth({ onAuthSuccess, onBackToLanding }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('srih89437@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email, password } 
      : { name, email, password, orgName };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Store in localStorage
      localStorage.setItem('ghost_cfo_token', data.token);
      localStorage.setItem('ghost_cfo_user', JSON.stringify(data.user));
      localStorage.setItem('ghost_cfo_org', JSON.stringify(data.org));

      onAuthSuccess({
        token: data.token,
        user: data.user,
        org: data.org
      });
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-screen" className="relative min-h-screen bg-[#050505] flex flex-col justify-center items-center px-4 overflow-hidden">
      {/* Absolute Ambient Background Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-white/[0.01] rounded-full blur-[120px] pointer-events-none" />

      {/* Decorative Brand Header */}
      <div className="mb-8 text-center relative z-10">
        <div 
          id="auth-logo-btn"
          onClick={onBackToLanding}
          className="flex items-center justify-center gap-4 cursor-pointer select-none group mb-4"
        >
          <div className="w-8 h-8 bg-white flex items-center justify-center rounded-none border border-white group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-colors">
            <div className="w-4 h-4 bg-black rounded-none"></div>
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase text-white">
            GhostCFO
          </span>
        </div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.25em]">
          {isLogin ? 'AUTHENTICATED GATEWAY' : 'PROVISION CONTEXT'}
        </p>
        <div className="flex items-center justify-center gap-2.5 mt-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <span className="text-[9px] font-mono tracking-widest text-emerald-500 uppercase font-bold">Secure Link Active</span>
        </div>
      </div>

      {/* Auth Card Container */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-black p-8 rounded-none border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
          {/* Subtle top indicator border */}
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-white/10" />

          <h2 className="text-2xl font-serif italic font-light text-white text-center mb-1 tracking-tight">
            {isLogin ? 'Access Console' : 'Establish Organization'}
          </h2>
          <p className="text-xs text-zinc-400 text-center mb-8 uppercase tracking-wider font-semibold">
            {isLogin 
              ? 'Enter credentials to connect to the secure environment.' 
              : 'Create your account and scaffold an organizational scope.'}
          </p>

          {error && (
            <div id="auth-error-msg" className="mb-4 p-3 rounded-none bg-red-950/20 border border-red-900/40 text-red-400 text-xs font-mono font-bold uppercase tracking-wide">
              [CRITICAL] {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Operator Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-zinc-500">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      id="register-name-input"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alexis Carter"
                      className="w-full pl-10 pr-4 py-2.5 rounded-none bg-white/[0.02] border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Organization Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-zinc-500">
                      <Building className="w-4 h-4" />
                    </span>
                    <input
                      id="register-org-input"
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Apex FinTech"
                      className="w-full pl-10 pr-4 py-2.5 rounded-none bg-white/[0.02] border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition font-sans"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Operator Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-zinc-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-none bg-white/[0.02] border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Cryptographic Key (Password)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-zinc-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-none bg-white/[0.02] border border-white/10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-4 rounded-none bg-white text-black hover:bg-emerald-500 hover:text-black font-bold text-xs uppercase tracking-widest transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Initiate Core Connection' : 'Generate Org Context'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Button */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <button
              id="auth-toggle-btn"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-[10px] font-bold font-mono text-zinc-500 hover:text-white transition focus:outline-none uppercase tracking-widest"
            >
              {isLogin 
                ? 'Request new operator workspace context' 
                : 'Return to authenticated secure gate'}
            </button>
          </div>
        </div>

        {/* Cancel return back to marketing */}
        <div className="mt-6 text-center">
          <button
            id="auth-cancel-btn"
            onClick={onBackToLanding}
            className="text-[10px] font-bold font-sans text-zinc-500 hover:text-white transition uppercase tracking-widest"
          >
            ← CANCEL AND VIEW GHOSTCFO BRIEFING
          </button>
        </div>
      </motion.div>
    </div>
  );
}
