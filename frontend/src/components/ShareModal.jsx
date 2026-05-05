import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { X, UserPlus, Users, Trash2, Crown, Edit3, Eye, Mail } from 'lucide-react';

export default function ShareModal({ doc, onClose, onUpdate }) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [loading, setLoading] = useState(false);

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await api.post(`/documents/${doc.id}/share`, { email: email.trim(), permission });
      toast.success(`Shared with ${res.data.user.name}`);
      setEmail('');
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to share');
    } finally {
      setLoading(false);
    }
  };

  const revokeAccess = async (userId, name) => {
    try {
      await api.delete(`/documents/${doc.id}/share/${userId}`);
      toast.success(`Removed ${name}`);
      onUpdate();
    } catch {
      toast.error('Failed to revoke access');
    }
  };

  return (
    <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ink-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-parchment rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-ink-600" />
            </div>
            <div>
              <h2 className="font-semibold text-ink-800">Share document</h2>
              <p className="text-xs text-ink-400 truncate max-w-48">{doc.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share form */}
        <div className="p-6 border-b border-ink-100">
          <form onSubmit={handleShare} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5 uppercase tracking-wide">
                Invite by email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full pl-9 pr-4 py-2.5 border border-ink-200 rounded-lg text-sm text-ink-900 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-300 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1.5 uppercase tracking-wide">
                Permission
              </label>
              <div className="flex gap-2">
                {[
                  { val: 'view', label: 'View only', Icon: Eye },
                  { val: 'edit', label: 'Can edit', Icon: Edit3 },
                ].map(({ val, label, Icon }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPermission(val)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all ${
                      permission === val
                        ? 'border-ink-800 bg-ink-800 text-parchment'
                        : 'border-ink-200 text-ink-600 hover:border-ink-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading || !email.trim()}
              className="w-full py-2.5 bg-sage text-white rounded-lg hover:bg-sage/90 transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
              <UserPlus className="w-4 h-4" />
              {loading ? 'Sharing...' : 'Share'}
            </button>
          </form>
        </div>

        {/* Current access */}
        <div className="p-6">
          <h3 className="text-xs font-medium text-ink-600 uppercase tracking-wide mb-3">People with access</h3>
          <div className="space-y-2">
            {/* Owner */}
            <div className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 bg-ink-800 rounded-full flex items-center justify-center text-parchment text-xs font-semibold">
                {doc.owner_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-800 truncate">{doc.owner_name}</p>
                <p className="text-xs text-ink-400 truncate">{doc.owner_email}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gold font-medium bg-gold/10 px-2 py-1 rounded-full">
                <Crown className="w-3 h-3" />
                Owner
              </div>
            </div>

            {/* Shared users */}
            {doc.shares?.map(share => (
              <div key={share.id} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 bg-sage/20 rounded-full flex items-center justify-center text-sage text-xs font-semibold">
                  {share.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-800 truncate">{share.name}</p>
                  <p className="text-xs text-ink-400 truncate">{share.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    share.permission === 'edit'
                      ? 'bg-sage/10 text-sage'
                      : 'bg-ink-100 text-ink-500'
                  }`}>
                    {share.permission === 'edit' ? 'Can edit' : 'View only'}
                  </span>
                  <button onClick={() => revokeAccess(share.shared_with_id, share.name)}
                    className="p-1.5 text-ink-300 hover:text-rust hover:bg-rust/10 rounded-lg transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {(!doc.shares || doc.shares.length === 0) && (
              <p className="text-xs text-ink-400 py-2">Not shared with anyone yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
