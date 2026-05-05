import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FileText, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email) => {
    setEmail(email);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-ink-800 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute text-parchment font-display text-8xl opacity-20 select-none"
              style={{ top: `${i * 18}%`, left: `${(i % 2) * 30 - 10}%`, transform: 'rotate(-15deg)' }}>
              Docs
            </div>
          ))}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-ink-900" />
            </div>
            <span className="text-parchment font-display text-xl font-semibold">AjaiaDocs</span>
          </div>
          <h1 className="text-parchment font-display text-4xl font-bold leading-tight mb-6">
            Write together.<br />Think together.
          </h1>
          <p className="text-ink-300 text-lg leading-relaxed max-w-sm">
            A collaborative document editor built for teams who move fast and think clearly.
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          <p className="text-ink-500 text-xs uppercase tracking-widest mb-3">Demo accounts</p>
          {[
            { email: 'alice@demo.com', name: 'Alice Johnson', color: 'bg-sage' },
            { email: 'bob@demo.com', name: 'Bob Smith', color: 'bg-rust' },
            { email: 'carol@demo.com', name: 'Carol White', color: 'bg-gold' },
          ].map(u => (
            <button key={u.email} onClick={() => fillDemo(u.email)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-ink-700 hover:bg-ink-600 transition-colors text-left group">
              <div className={`w-8 h-8 ${u.color} rounded-full flex items-center justify-center text-ink-900 text-xs font-semibold`}>
                {u.name[0]}
              </div>
              <div>
                <div className="text-parchment text-sm">{u.name}</div>
                <div className="text-ink-400 text-xs">{u.email}</div>
              </div>
              <span className="ml-auto text-ink-500 text-xs group-hover:text-ink-300">Click to fill →</span>
            </button>
          ))}
          <p className="text-ink-500 text-xs">All demo accounts use: <span className="text-ink-300 font-mono">password123</span></p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-ink-800 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-parchment" />
            </div>
            <span className="font-display text-lg font-semibold text-ink-800">AjaiaDocs</span>
          </div>

          <h2 className="font-display text-3xl text-ink-800 font-bold mb-2">Welcome back</h2>
          <p className="text-ink-500 mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-ink-200 rounded-lg bg-white text-ink-900 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-400 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-ink-200 rounded-lg bg-white text-ink-900 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-400 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-ink-800 hover:bg-ink-700 text-parchment rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-ink-500 text-sm mt-6">
            No account?{' '}
            <Link to="/register" className="text-ink-800 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
