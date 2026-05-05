import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExt from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft, Share2, Paperclip, Crown,
  Users, CheckCircle2, Clock, FileText, Edit3
} from 'lucide-react';
import EditorToolbar from '../components/EditorToolbar';
import ShareModal from '../components/ShareModal';
import AttachmentsPanel from '../components/AttachmentsPanel';
import { useAutoSave } from '../hooks/useAutoSave';

const SAVE_DEBOUNCE = 1500;

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState('saved'); // 'saved' | 'saving' | 'unsaved'
  const [title, setTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const saveTimerRef = useRef(null);
  const contentRef = useRef('');

  const fetchDoc = useCallback(async () => {
    try {
      const res = await api.get(`/documents/${id}`);
      setDoc(res.data);
      setTitle(res.data.title);
      contentRef.current = res.data.content;
      return res.data;
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('You do not have access to this document');
        navigate('/');
      } else if (err.response?.status === 404) {
        toast.error('Document not found');
        navigate('/');
      }
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchDoc().finally(() => setLoading(false));
  }, [fetchDoc]);

  const canEdit = doc?.role === 'owner' || doc?.role === 'edit';

  const saveContent = useCallback(async (html) => {
    if (!canEdit) return;
    setSaveState('saving');
    try {
      await api.patch(`/documents/${id}`, { content: html });
      setSaveState('saved');
    } catch {
      setSaveState('unsaved');
    }
  }, [id, canEdit]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      UnderlineExt,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: true, autolink: true }),
      Placeholder.configure({ placeholder: 'Start writing your document...' }),
    ],
    content: '',
    editable: false, // set after doc loads
    onUpdate: ({ editor }) => {
      if (!canEdit) return;
      const html = editor.getHTML();
      contentRef.current = html;
      setSaveState('unsaved');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveContent(html), SAVE_DEBOUNCE);
    },
  });

  // Once doc loaded, set content and editable
  useEffect(() => {
    if (doc && editor) {
      editor.commands.setContent(doc.content || '');
      editor.setEditable(canEdit);
    }
  }, [doc, editor, canEdit]);

  // Cleanup timer on unmount - final save
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        if (canEdit && contentRef.current) {
          api.patch(`/documents/${id}`, { content: contentRef.current }).catch(() => {});
        }
      }
    };
  }, [id, canEdit]);

  const saveTitle = async (newTitle) => {
    if (!newTitle.trim() || newTitle === doc.title) return;
    try {
      await api.patch(`/documents/${id}`, { title: newTitle.trim() });
      setDoc(d => ({ ...d, title: newTitle.trim() }));
      toast.success('Title updated');
    } catch {
      toast.error('Failed to save title');
      setTitle(doc.title);
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') { e.target.blur(); }
    if (e.key === 'Escape') { setTitle(doc.title); setEditingTitle(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-paper">
        <div className="text-center">
          <div className="w-12 h-12 bg-parchment rounded-2xl flex items-center justify-center mx-auto mb-3 animate-pulse">
            <FileText className="w-6 h-6 text-ink-400" />
          </div>
          <p className="text-ink-400 text-sm">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-ink-100 sticky top-0 z-20">
        <div className="px-4 h-14 flex items-center gap-3">
          {/* Back */}
          <button onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-ink-500 hover:text-ink-900 transition-colors text-sm shrink-0">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:block">Docs</span>
          </button>

          <div className="w-px h-5 bg-ink-200" />

          {/* Title */}
          <div className="flex-1 min-w-0">
            {editingTitle && canEdit ? (
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={() => { saveTitle(title); setEditingTitle(false); }}
                onKeyDown={handleTitleKeyDown}
                className="w-full text-sm font-medium text-ink-800 bg-parchment rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ink-400"
                autoFocus
              />
            ) : (
              <button
                onClick={() => canEdit && setEditingTitle(true)}
                className={`flex items-center gap-2 group text-sm font-medium text-ink-800 truncate max-w-full ${canEdit ? 'hover:text-ink-900 cursor-text' : 'cursor-default'}`}
              >
                <span className="truncate">{doc.title}</span>
                {canEdit && <Edit3 className="w-3 h-3 text-ink-300 group-hover:text-ink-500 shrink-0" />}
              </button>
            )}
          </div>

          {/* Save state */}
          <div className="shrink-0 flex items-center gap-1.5 text-xs">
            {saveState === 'saved' && (
              <span className="flex items-center gap-1 text-sage">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:block">Saved</span>
              </span>
            )}
            {saveState === 'saving' && (
              <span className="flex items-center gap-1 text-ink-400">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:block">Saving...</span>
              </span>
            )}
            {saveState === 'unsaved' && (
              <span className="flex items-center gap-1 text-gold">
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:block">Unsaved</span>
              </span>
            )}
          </div>

          {/* Role badge */}
          <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 ${
            doc.role === 'owner' ? 'bg-ink-100 text-ink-600' : 'bg-sage/10 text-sage'
          }`}>
            {doc.role === 'owner' ? <Crown className="w-3 h-3" /> : <Users className="w-3 h-3" />}
            {doc.role === 'owner' ? 'Owner' : doc.role === 'edit' ? 'Editor' : 'Viewer'}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowAttachments(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showAttachments
                  ? 'bg-ink-800 text-parchment'
                  : 'border border-ink-200 text-ink-600 hover:border-ink-400'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Files {doc.attachments?.length > 0 ? `(${doc.attachments.length})` : ''}</span>
            </button>

            {doc.role === 'owner' && (
              <button
                onClick={() => setShowShare(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sage text-white rounded-lg text-xs font-medium hover:bg-sage/90 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:block">Share</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <EditorToolbar editor={editor} canEdit={canEdit} />

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <EditorContent editor={editor} className="min-h-[60vh]" />
        </div>
      </div>

      {/* Attachments panel */}
      {showAttachments && (
        <AttachmentsPanel
          docId={id}
          attachments={doc.attachments || []}
          canEdit={canEdit}
          onUpdate={fetchDoc}
          onClose={() => setShowAttachments(false)}
        />
      )}

      {/* Footer */}
      <div className="border-t border-ink-100 bg-white px-6 py-2 flex items-center justify-between text-xs text-ink-400">
        <span>
          {!canEdit && `Shared by ${doc.owner_name} · `}
          Updated {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
        </span>
        {!canEdit && (
          <span className="text-ink-400 italic">Read-only — you have view access</span>
        )}
      </div>

      {/* Modals */}
      {showShare && (
        <ShareModal
          doc={doc}
          onClose={() => setShowShare(false)}
          onUpdate={fetchDoc}
        />
      )}
    </div>
  );
}
