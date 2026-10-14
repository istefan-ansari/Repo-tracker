"use client";

/**
 * Toast notification system.
 *
 * Uses a module-level event emitter pattern so any component can fire a toast
 * without prop drilling or a heavy state management library.
 *
 * Usage:
 *   import { showToast } from "@/components/ToastProvider";
 *   showToast("Saved!", "success");
 */

import { useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  exiting?: boolean;
}

// ─── Module-level event bus ───────────────────────────────────────────────────

type ToastListener = (message: string, variant: ToastVariant) => void;
const listeners: ToastListener[] = [];

/**
 * Call this from anywhere in the app to display a toast notification.
 */
export function showToast(message: string, variant: ToastVariant = "info"): void {
  listeners.forEach((fn) => fn(message, variant));
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ToastVariant, { border: string; icon: string }> = {
  success: { border: "rgba(63, 185, 80, 0.6)", icon: "✓" },
  error:   { border: "rgba(248, 81, 73, 0.6)", icon: "✕" },
  warning: { border: "rgba(210, 153, 34, 0.6)", icon: "⚠" },
  info:    { border: "rgba(88, 166, 255, 0.6)", icon: "ℹ" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const handler: ToastListener = (message, variant) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, variant }]);

      // Auto-dismiss after 3.5s
      const t = setTimeout(() => dismiss(id), 3500);
      timers.current.set(id, t);
    };

    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  function dismiss(id: string) {
    // Trigger exit animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    // Remove after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      clearTimeout(timers.current.get(id));
      timers.current.delete(id);
    }, 300);
  }

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "flex-end",
      }}
    >
      {toasts.map((toast) => {
        const style = VARIANT_STYLES[toast.variant];
        return (
          <div
            key={toast.id}
            role="alert"
            className={toast.exiting ? "toast-exit" : "toast-enter"}
            onClick={() => dismiss(toast.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-bg-secondary)",
              border: `1px solid ${style.border}`,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              cursor: "pointer",
              maxWidth: 340,
              color: "var(--color-text-primary)",
              fontSize: 14,
            }}
          >
            <span style={{ fontWeight: 700, color: style.border, flexShrink: 0 }}>
              {style.icon}
            </span>
            <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
