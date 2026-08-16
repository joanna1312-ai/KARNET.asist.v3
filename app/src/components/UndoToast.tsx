"use client";

type UndoToastProps = {
  title: string;
  detail: string;
  undoLabel: string;
  durationMs: number;
  onUndo: () => void;
};

export function UndoToast({ title, detail, undoLabel, durationMs, onUndo }: UndoToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-[calc(88px+env(safe-area-inset-bottom))] z-40 overflow-hidden rounded-[18px] bg-[#232629] text-[#faf9f7] shadow-[0_12px_30px_rgba(0,0,0,0.28)] md:bottom-4"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="truncate text-xs text-[#faf9f7]/70">{detail}</p>
        </div>
        <button
          type="button"
          onClick={onUndo}
          className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-mint"
        >
          {undoLabel}
        </button>
      </div>
      <div
        className="h-[3px] bg-mint/70"
        style={{ animation: `undo-toast-progress ${durationMs}ms linear forwards` }}
      />
      <style>{`
        @keyframes undo-toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
