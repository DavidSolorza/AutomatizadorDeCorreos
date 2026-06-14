import { useMemo, useRef, useState, useCallback } from 'react';
import { ExternalLink, Video, FileText, Calendar, BookOpen, Copy, Check, Link as LinkIcon, AlertCircle, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { prepareEmailContent, type DetectedLink } from '@/lib/email-utils';
import type { Email } from '@/types';

interface EmailViewerProps {
  email: Email;
  className?: string;
}

const linkIcons: Record<string, React.ReactNode> = {
  video: <Video size={14} />,
  file: <FileText size={14} />,
  calendar: <Calendar size={14} />,
  book: <BookOpen size={14} />,
};

const linkColors: Record<string, string> = {
  meet: 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
  classroom: 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  zoom: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  teams: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  calendar: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  pdf: 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  generic: 'bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
};

function LinkCard({ link, onCopy }: { link: DetectedLink; onCopy: (url: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    onCopy(link.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [link.url, onCopy]);

  return (
    <div className={cn(
      'group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer',
      linkColors[link.type] || linkColors.generic,
    )}>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 flex-1 min-w-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="shrink-0">{linkIcons[link.icon] || <LinkIcon size={14} />}</span>
        <span className="text-sm font-medium truncate">{link.label}</span>
        <ExternalLink size={12} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
      <button
        onClick={handleCopy}
        className="shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        title="Copiar enlace"
      >
        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
      </button>
    </div>
  );
}

function CopiedToast({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-lg text-sm font-medium">
        <Check size={14} />
        Enlace copiado
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-48 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-3 w-32 bg-neutral-100 dark:bg-neutral-800 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-neutral-200 dark:bg-neutral-700 rounded" />
        <div className="h-3 w-5/6 bg-neutral-200 dark:bg-neutral-700 rounded" />
        <div className="h-3 w-4/6 bg-neutral-200 dark:bg-neutral-700 rounded" />
      </div>
      <div className="space-y-2 pt-4">
        <div className="h-3 w-full bg-neutral-200 dark:bg-neutral-700 rounded" />
        <div className="h-3 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded" />
        <div className="h-3 w-5/6 bg-neutral-200 dark:bg-neutral-700 rounded" />
        <div className="h-3 w-2/3 bg-neutral-200 dark:bg-neutral-700 rounded" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-16 text-neutral-400">
      <div className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-3">
        <Paperclip size={20} />
      </div>
      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Sin contenido</p>
      <p className="text-xs mt-1">Este correo no tiene contenido visible.</p>
    </div>
  );
}

function EmailHeader({ email }: { email: Email }) {
  return (
    <div className="flex items-start gap-3 mb-6 pb-6 border-b border-neutral-100 dark:border-neutral-800">
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-neutral-300 to-neutral-400 dark:from-neutral-600 dark:to-neutral-700 flex items-center justify-center text-sm font-semibold text-white shrink-0 shadow-sm">
        {(email.sender_name || email.sender).charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-white leading-tight">
          {email.subject || 'Sin asunto'}
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5 truncate max-w-full">
          {email.sender_name || email.sender}
        </p>
      </div>
      <div className="text-xs text-neutral-400 whitespace-nowrap shrink-0 pt-1">
        {new Date(email.received_at).toLocaleDateString('es-CO', {
          weekday: 'short', day: 'numeric', month: 'short',
          ...(email.received_at.includes('T') ? { hour: '2-digit', minute: '2-digit' } : {}),
        })}
      </div>
    </div>
  );
}

function ProcessedEmailContent({ content }: { content: string }) {
  const processed = useMemo(() => {
    let html = content;

    html = html.replace(/<a\s+href="([^"]+)"[^>]*>(.*?)<\/a>/gi, (_, href, text) => {
      const cleanHref = href.replace(/[.,;:!?)"'\]>]+$/, '');
      const cleanText = text.replace(/<[^>]+>/g, '').trim();
      if (cleanText === cleanHref || cleanHref.includes(cleanText)) {
        return `<a href="${cleanHref}" target="_blank" rel="noopener noreferrer" class="email-link">${cleanHref}</a>`;
      }
      return `<a href="${cleanHref}" target="_blank" rel="noopener noreferrer" class="email-link">${cleanText || cleanHref}</a>`;
    });

    return html;
  }, [content]);

  return (
    <div
      className="email-body"
      dangerouslySetInnerHTML={{ __html: processed }}
    />
  );
}

export function EmailViewer({ email, className }: EmailViewerProps) {
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const processed = useMemo(() => prepareEmailContent(email.body_html, email.body_plain), [email.body_html, email.body_plain]);

  const handleCopy = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2000);
  }, []);

  if (!processed.html && !processed.plain) {
    return <EmptyState />;
  }

  return (
    <div className={cn('max-w-full overflow-hidden', className)}>
      <EmailHeader email={email} />

      {processed.importantLinks.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-2.5">
            <LinkIcon size={12} className="text-neutral-400 shrink-0" />
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">Enlaces importantes</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {processed.importantLinks.map((link, i) => (
              <LinkCard key={i} link={link} onCopy={handleCopy} />
            ))}
          </div>
        </div>
      )}

      {processed.html ? (
        <div className="email-viewer prose prose-sm dark:prose-invert max-w-full overflow-x-hidden">
          <ProcessedEmailContent content={processed.html} />
        </div>
      ) : (
        <div className="space-y-1.5 max-w-full overflow-hidden">
          {processed.plain.split('\n').map((line, i) => (
            line.startsWith('http://') || line.startsWith('https://') ? (
              <a
                key={i}
                href={line}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-sm break-all max-w-full"
              >
                <span className="truncate max-w-full">{line}</span>
                <ExternalLink size={10} className="shrink-0" />
              </a>
            ) : (
              <p key={i} className={cn(
                'text-sm leading-relaxed break-words max-w-full',
                line.trim() ? 'text-neutral-700 dark:text-neutral-300' : 'h-3',
              )}>
                {line || '\u00A0'}
              </p>
            )
          ))}
        </div>
      )}

      <CopiedToast visible={toastVisible} />
    </div>
  );
}

export { LoadingSkeleton as EmailLoadingSkeleton };
