import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  FileText, Plus, Upload, LogOut, Search,
  Users, Crown, Edit3, Trash2, ChevronRight, X
} from 'lucide-react';

function DocCard({ doc, onDelete, onClick, currentUserId }) {
  const isOwner = doc.role === 'owner';
  const canDelete = isOwner;

  return (
    <div
      onClick={() => onClick(doc.id)}
      className="group relative bg-white border border-ink-100 rounded-xl p-5 cursor-pointer hover:border-ink-300 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
          isOwner ? 'bg-ink-100 text-ink-600' : 'bg-sage/10 text-sage'
        }`}>
          {isOwner ? <Crown className="w-3 h-3" /> : <Users className="w-3 h-3" />}
          {isOwner ? 'Owner' : doc.role === 'edit' ? 'Can edit' : 'View only'}
        </div>
        {canDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(doc); }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rust/10 hover:text-rust transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <h3 className="font-medium text-ink-800 mb-1 truncate pr-2 group-hover:text-ink-900 transition-colors">
        {doc.title}
      </h3>

      <div className="text-xs text-ink-400 space-y-0.5">
        {!isOwner && <p>by {doc.owner_name}</p>}
        <p>Updated {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}</p>
      </div>

      <ChevronRight className="absolute right-4 bottom-4 w-4 h-4 text-ink-200 group-hover:text-ink-400 transition-colors" />
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState({ owned: [], shared: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fileRef = useRef();

  const fetchDocs = async () => {
    try {
      const res = await api.get('/documents');
      setDocs(res.data);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const createDoc = async () => {
    setCreating(true);
    try {
      const res = await api.post('/documents', { title: 'Untitled Document', content: '' });
      navigate(`/doc/${res.data.id}`);
    } catch {
      toast.error('Failed to create document');
      setCreating(false);
    }
  };

  const deleteDoc = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/documents/${deleteTarget.id}`);
      toast.success('Document deleted');
      setDeleteTarget(null);
      fetchDocs();
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/upload/import', formData);
      toast.success(res.data.message);
      navigate(`/doc/${res.data.document.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Import failed');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const filterDocs = (list) =>
    search ? list.filter(d => d.title.toLowerCase().includes(search.toLowerCase())) : list;

  const allDocs = [...filterDocs(docs.owned), ...filterDocs(docs.shared)];
  const owned = filterDocs(docs.owned);
  const shared = filterDocs(docs.shared);

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="bg-white border-b border-ink-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-ink-800 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-parchment" />
            </div>
            <span className="font-display text-lg font-semibold text-ink-800">AjaiaDocs</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-parchment rounded-lg">
              <div className="w-6 h-6 bg-ink-800 rounded-full flex items-center justify-center text-parchment text-xs font-semibold">
                {user?.name?.[0]}
              </div>
              <span className="text-sm text-ink-700 font-medium hidden sm:block">{user?.name}</span>
            </div>
            <button onClick={logout}
              className="p-2 text-ink-400 hover:text-rust hover:bg-rust/10 rounded-lg transition-colors"
              title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="font-display text-3xl text-ink-800 font-bold">My Documents</h1>
            <p className="text-ink-500 text-sm mt-1">
              {docs.owned.length} owned · {docs.shared.length} shared with you
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileRef}
              className="hidden"
              accept=".txt,.md,.docx"
              onChange={handleImport}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-2 px-4 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-parchment hover:border-ink-300 transition-all text-sm font-medium disabled:opacity-60"
            >
              <Upload className="w-4 h-4" />
              {importing ? 'Importing...' : 'Import file'}
            </button>
            <button
              onClick={createDoc}
              disabled={creating}
              className="flex items-center gap-2 px-4 py-2 bg-ink-800 text-parchment rounded-lg hover:bg-ink-700 transition-colors text-sm font-medium disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              New document
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full max-w-sm pl-10 pr-4 py-2.5 border border-ink-200 rounded-lg bg-white text-ink-900 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-300 focus:border-transparent text-sm"
          />
        </div>

        {/* File type note */}
        <div className="flex items-center gap-2 mb-8 text-xs text-ink-400 bg-parchment rounded-lg px-4 py-2.5 w-fit">
          <Upload className="w-3.5 h-3.5" />
          <span>Supported import formats: <strong className="text-ink-600">.txt</strong>, <strong className="text-ink-600">.md</strong>, <strong className="text-ink-600">.docx</strong></span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-ink-100 rounded-xl p-5 animate-pulse h-28" />
            ))}
          </div>
        ) : allDocs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-parchment rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-ink-400" />
            </div>
            <h3 className="font-display text-xl text-ink-700 font-semibold mb-2">
              {search ? 'No documents found' : 'No documents yet'}
            </h3>
            <p className="text-ink-400 text-sm mb-6">
              {search ? 'Try a different search term' : 'Create your first document or import a file to get started'}
            </p>
            {!search && (
              <button onClick={createDoc}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink-800 text-parchment rounded-lg hover:bg-ink-700 transition-colors text-sm font-medium">
                <Plus className="w-4 h-4" />
                Create document
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {owned.length > 0 && (
              <section>
                <h2 className="text-xs uppercase tracking-widest text-ink-400 font-semibold mb-4 flex items-center gap-2">
                  <Crown className="w-3.5 h-3.5" /> My Documents
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {owned.map(doc => (
                    <DocCard key={doc.id} doc={doc} currentUserId={user?.id}
                      onClick={id => navigate(`/doc/${id}`)}
                      onDelete={setDeleteTarget} />
                  ))}
                </div>
              </section>
            )}

            {shared.length > 0 && (
              <section>
                <h2 className="text-xs uppercase tracking-widest text-ink-400 font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Shared with me
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shared.map(doc => (
                    <DocCard key={doc.id} doc={doc} currentUserId={user?.id}
                      onClick={id => navigate(`/doc/${id}`)}
                      onDelete={setDeleteTarget} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold text-ink-800">Delete document?</h3>
              <button onClick={() => setDeleteTarget(null)} className="text-ink-400 hover:text-ink-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-ink-600 text-sm mb-6">
              "<strong>{deleteTarget.title}</strong>" will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-parchment transition-colors text-sm font-medium">
                Cancel
              </button>
              <button onClick={deleteDoc}
                className="flex-1 py-2 bg-rust text-white rounded-lg hover:bg-rust/90 transition-colors text-sm font-medium">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
