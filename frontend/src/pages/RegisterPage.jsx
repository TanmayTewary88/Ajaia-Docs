import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FileText, Mail, Lock, User } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.name, form.password);
      navigate('/');
      toast.success('Account created!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-8">
      <div className="w-full max-w-sm fade-in">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-ink-800 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-parchment" />
          </div>
          <span className="font-display text-lg font-semibold text-ink-800">AjaiaDocs</span>
        </div>

        <h2 className="font-display text-3xl text-ink-800 font-bold mb-2">Create account</h2>
        <p className="text-ink-500 mb-8">Join and start collaborating</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'name', label: 'Full name', Icon: User, type: 'text', placeholder: 'Jane Doe' },
            { key: 'email', label: 'Email', Icon: Mail, type: 'email', placeholder: 'you@example.com' },
            { key: 'password', label: 'Password', Icon: Lock, type: 'password', placeholder: '6+ characters' },
          ].map(({ key, label, Icon, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full pl-10 pr-4 py-2.5 border border-ink-200 rounded-lg bg-white text-ink-900 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-400 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
          ))}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-ink-800 hover:bg-ink-700 text-parchment rounded-lg font-medium transition-colors disabled:opacity-60 mt-2">
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-ink-500 text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-ink-800 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
