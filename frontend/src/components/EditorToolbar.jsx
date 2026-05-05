import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Heading1, Heading2, Heading3, Type, Link2, Minus
} from 'lucide-react';

function ToolbarButton({ onClick, active, title, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition-all ${
        active
          ? 'bg-ink-800 text-parchment'
          : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-ink-200 mx-1" />;
}

export default function EditorToolbar({ editor, canEdit }) {
  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('URL:', prev || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const disabled = !canEdit;

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-4 py-2 bg-white border-b border-ink-100 sticky top-0 z-10">
      {/* Headings */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })} title="Heading 1" disabled={disabled}>
        <Heading1 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })} title="Heading 2" disabled={disabled}>
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })} title="Heading 3" disabled={disabled}>
        <Heading3 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()}
        active={editor.isActive('paragraph')} title="Paragraph" disabled={disabled}>
        <Type className="w-4 h-4" />
      </ToolbarButton>

      <Divider />

      {/* Formatting */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')} title="Bold (Ctrl+B)" disabled={disabled}>
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')} title="Italic (Ctrl+I)" disabled={disabled}>
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')} title="Underline (Ctrl+U)" disabled={disabled}>
        <Underline className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')} title="Strikethrough" disabled={disabled}>
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')} title="Bullet list" disabled={disabled}>
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')} title="Numbered list" disabled={disabled}>
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>

      <Divider />

      {/* Alignment */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()}
        active={editor.isActive({ textAlign: 'left' })} title="Align left" disabled={disabled}>
        <AlignLeft className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()}
        active={editor.isActive({ textAlign: 'center' })} title="Align center" disabled={disabled}>
        <AlignCenter className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()}
        active={editor.isActive({ textAlign: 'right' })} title="Align right" disabled={disabled}>
        <AlignRight className="w-4 h-4" />
      </ToolbarButton>

      <Divider />

      {/* Link */}
      <ToolbarButton onClick={setLink}
        active={editor.isActive('link')} title="Insert link" disabled={disabled}>
        <Link2 className="w-4 h-4" />
      </ToolbarButton>

      {/* Horizontal rule */}
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()}
        active={false} title="Horizontal rule" disabled={disabled}>
        <Minus className="w-4 h-4" />
      </ToolbarButton>

      {!canEdit && (
        <span className="ml-auto text-xs text-ink-400 flex items-center gap-1.5 px-3 py-1 bg-parchment rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-ink-400"></span>
          View only
        </span>
      )}
    </div>
  );
}
