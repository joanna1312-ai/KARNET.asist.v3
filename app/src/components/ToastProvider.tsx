"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { UndoToast } from "@/components/UndoToast";

export type ToastData = {
  title: string;
  detail: string;
  undoLabel: string;
  onUndo: () => void;
  /** Wywoływane tylko, gdy toast zniknie sam (po 5 s), nie przy kliknięciu „Cofnij”. */
  onExpire?: () => void;
};

type ToastContextValue = {
  showToast: (toast: ToastData) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast(null);
  }, []);

  const showToast = useCallback((next: ToastData) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Kolejka maks. 1 toast (decyzja projektowa) — nowy natychmiast zastępuje poprzedni.
    setToast(next);
    timeoutRef.current = setTimeout(() => {
      setToast(null);
      next.onExpire?.();
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <UndoToast
          title={toast.title}
          detail={toast.detail}
          undoLabel={toast.undoLabel}
          durationMs={TOAST_DURATION_MS}
          onUndo={() => {
            dismiss();
            toast.onUndo();
          }}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
