import { useRef, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Paperclip, Upload, Trash2, Download, X } from 'lucide-react';

const ICON_MAP = {
  'image/': '🖼️',
  'application/pdf': '📄',
  'text/': '📝',
  'default': '📎'
};

function fileIcon(mime) {
  for (const [prefix, icon] of Object.entries(ICON_MAP)) {
    if (mime.startsWith(prefix) || mime === prefix) return icon;
  }
  return ICON_MAP.default;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentsPanel({ docId, attachments, canEdit, onUpdate, onClose }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post(`/upload/attach/${docId}`, formData);
      toast.success(`Attached "${file.name}"`);
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (attachId, name) => {
    try {
      await api.delete(`/upload/attach/${attachId}`);
      toast.success(`Removed "${name}"`);
      onUpdate();
    } catch {
      toast.error('Failed to remove attachment');
    }
  };

  return (
    <div className="border-t border-ink-100 bg-parchment/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-ink-700">
          <Paperclip className="w-4 h-4" />
          Attachments ({attachments.length})
        </div>
        <div className="flex items-center gap-1">
          {canEdit && (
            <>
              <input type="file" ref={fileRef} className="hidden" onChange={handleUpload}
                accept=".txt,.md,.docx,.pdf,.png,.jpg,.jpeg,.gif,.webp" />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-ink-200 text-ink-600 rounded-lg hover:bg-white hover:border-ink-400 transition-all disabled:opacity-60">
                <Upload className="w-3.5 h-3.5" />
                {uploading ? 'Uploading...' : 'Add file'}
              </button>
            </>
          )}
          <button onClick={onClose} className="p-1.5 text-ink-400 hover:text-ink-700 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {attachments.length === 0 ? (
        <p className="text-xs text-ink-400 py-2">No attachments yet</p>
      ) : (
        <div className="space-y-1.5">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-ink-100">
              <span className="text-lg">{fileIcon(att.mime_type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-800 truncate">{att.original_name}</p>
                <p className="text-xs text-ink-400">{formatBytes(att.size)}</p>
              </div>
              <div className="flex items-center gap-1">
                <a href={`/api/upload/file/${att.filename}`}
                  target="_blank" rel="noopener noreferrer"
                  className="p-1.5 text-ink-400 hover:text-sage hover:bg-sage/10 rounded-lg transition-all"
                  title="Download">
                  <Download className="w-3.5 h-3.5" />
                </a>
                {canEdit && (
                  <button onClick={() => handleDelete(att.id, att.original_name)}
                    className="p-1.5 text-ink-400 hover:text-rust hover:bg-rust/10 rounded-lg transition-all"
                    title="Remove">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
