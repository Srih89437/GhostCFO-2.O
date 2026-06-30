import { useEffect, useState } from 'react';
import { AuthState } from './types';
import MarketingSite from './components/MarketingSite';
import Auth from './components/Auth';
import Console from './components/Console';

export default function App() {
  const [view, setView] = useState<'marketing' | 'auth' | 'console'>('marketing');
  const [auth, setAuth] = useState<AuthState>({ token: null, user: null, org: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt auto-login with stored localStorage token
    const token = localStorage.getItem('ghost_cfo_token');
    const storedUser = localStorage.getItem('ghost_cfo_user');
    const storedOrg = localStorage.getItem('ghost_cfo_org');

    if (token && storedUser && storedOrg) {
      try {
        setAuth({
          token,
          user: JSON.parse(storedUser),
          org: JSON.parse(storedOrg)
        });
        setView('console');
      } catch (e) {
        // Clear corrupt storage
        localStorage.removeItem('ghost_cfo_token');
        localStorage.removeItem('ghost_cfo_user');
        localStorage.removeItem('ghost_cfo_org');
      }
    }
    setLoading(false);
  }, []);

  const handleAuthSuccess = (newAuth: AuthState) => {
    setAuth(newAuth);
    setView('console');
  };

  const handleLogout = () => {
    localStorage.removeItem('ghost_cfo_token');
    localStorage.removeItem('ghost_cfo_user');
    localStorage.removeItem('ghost_cfo_org');
    setAuth({ token: null, user: null, org: null });
    setView('marketing');
  };

  if (loading) {
    return (
      <div id="loading-screen" className="min-h-screen bg-[#030303] flex flex-col gap-3 items-center justify-center font-mono text-zinc-500 text-xs select-none">
        <div className="w-5 h-5 border-2 border-indigo-950 border-t-indigo-500 rounded-full animate-spin" />
        <span>[INITIALIZING_WORKSPACE] VERIFYING OPERATOR HANDSHAKE...</span>
      </div>
    );
  }

  return (
    <div id="app-root" className="min-h-screen">
      {view === 'marketing' && (
        <MarketingSite onEnterConsole={() => setView(auth.token ? 'console' : 'auth')} />
      )}
      {view === 'auth' && (
        <Auth 
          onAuthSuccess={handleAuthSuccess} 
          onBackToLanding={() => setView('marketing')} 
        />
      )}
      {view === 'console' && auth.token && (
        <Console auth={auth} onLogout={handleLogout} />
      )}
    </div>
  );
}
