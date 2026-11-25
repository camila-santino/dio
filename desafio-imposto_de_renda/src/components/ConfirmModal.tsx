import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
import type { ConfirmModalConfig } from '../types/ir';

interface ConfirmModalProps {
  config: ConfirmModalConfig | null;
  onClose: () => void;
}

export function ConfirmModal({ config, onClose }: ConfirmModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!config) return;
    setSubmitting(false);
    cancelBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config, submitting, onClose]);

  if (!config) return null;

  const isDanger = config.variant === 'danger';

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      await config.onConfirm();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      <div
        className="w-full max-w-lg rounded-xl border p-6 shadow-xl"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
          color: 'var(--text-primary)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {isDanger ? (
              <AlertTriangle
                className="h-6 w-6 shrink-0 mt-0.5"
                style={{ color: 'var(--status-error-text)' }}
                aria-hidden="true"
              />
            ) : (
              <CheckCircle2
                className="h-6 w-6 shrink-0 mt-0.5"
                style={{ color: 'var(--accent-primary)' }}
                aria-hidden="true"
              />
            )}
            <div>
              <h2 id="confirm-modal-title" className="text-lg font-bold leading-snug">
                {config.title}
              </h2>
              <p
                id="confirm-modal-desc"
                className="mt-2 text-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {config.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Fechar janela de confirmação"
            className="rounded-lg p-1.5 transition-colors hover:opacity-80 disabled:opacity-50"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {config.details && config.details.length > 0 && (
          <ul
            className="mt-4 space-y-1.5 rounded-lg border p-3.5 text-sm"
            style={{
              backgroundColor: 'var(--bg-muted)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            {config.details.map((line, i) => (
              <li key={i} className="leading-snug">
                {line}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="min-h-[42px] rounded-lg border px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-strong)',
              color: 'var(--text-primary)',
            }}
          >
            {config.cancelLabel || 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="min-h-[42px] inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 whitespace-nowrap"
            style={
              isDanger
                ? {
                    backgroundColor: 'var(--status-error-text)',
                    color: '#FAFBFD',
                  }
                : {
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-primary-text)',
                  }
            }
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {submitting ? 'Processando...' : config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
