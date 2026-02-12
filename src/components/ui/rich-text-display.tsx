import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

export function RichTextDisplay({ content, className }: RichTextDisplayProps) {
  // If content looks like plain text (no HTML tags), wrap in <p>
  const isHtml = /<[a-z][\s\S]*>/i.test(content);
  const html = isHtml ? content : `<p>${content}</p>`;
  const sanitized = DOMPurify.sanitize(html);

  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none font-body',
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
