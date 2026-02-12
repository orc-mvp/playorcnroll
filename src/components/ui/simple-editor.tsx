import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useI18n } from '@/lib/i18n';
import { Toggle } from '@/components/ui/toggle';
import { Bold, Italic, List, ListOrdered, Heading2, Undo, Redo } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimpleEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SimpleEditor({ value, onChange, placeholder, disabled, className }: SimpleEditorProps) {
  const { t } = useI18n();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({
        placeholder: placeholder || '',
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className={cn('border border-input rounded-md overflow-hidden bg-background', disabled && 'opacity-50', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/30 px-1 py-1">
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label={t.editor.bold}
          disabled={disabled}
        >
          <Bold className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label={t.editor.italic}
          disabled={disabled}
        >
          <Italic className="w-4 h-4" />
        </Toggle>
        <div className="w-px h-5 bg-border mx-0.5" />
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-label={t.editor.heading}
          disabled={disabled}
        >
          <Heading2 className="w-4 h-4" />
        </Toggle>
        <div className="w-px h-5 bg-border mx-0.5" />
        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label={t.editor.bulletList}
          disabled={disabled}
        >
          <List className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label={t.editor.orderedList}
          disabled={disabled}
        >
          <ListOrdered className="w-4 h-4" />
        </Toggle>
        <div className="w-px h-5 bg-border mx-0.5" />
        <Toggle
          size="sm"
          onPressedChange={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editor.can().undo()}
          aria-label={t.editor.undo}
          pressed={false}
        >
          <Undo className="w-4 h-4" />
        </Toggle>
        <Toggle
          size="sm"
          onPressedChange={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editor.can().redo()}
          aria-label={t.editor.redo}
          pressed={false}
        >
          <Redo className="w-4 h-4" />
        </Toggle>
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="prose prose-sm dark:prose-invert max-w-none px-3 py-2 min-h-[100px] font-body focus-within:outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-[80px] [&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0 [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none"
      />
    </div>
  );
}
