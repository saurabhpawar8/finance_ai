"use client";
import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

const listeners = new Set();
let nextId = 0;

export const showToast = (message, type = "success") => {
  const id = ++nextId;
  listeners.forEach((fn) => fn({ id, message, type }));
};

const STYLES = {
  success: {
    border: "rgba(16,185,129,0.3)",
    color: "#34D399",
    Icon: CheckCircle,
  },
  error: { border: "rgba(239,68,68,0.3)", color: "#FCA5A5", Icon: AlertCircle },
  info: { border: "rgba(99,102,241,0.3)", color: "#818CF8", Icon: Info },
};

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== toast.id)),
        3500
      );
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  if (!toasts.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "90px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column-reverse",
        gap: "8px",
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      {toasts.map(({ id, message, type }) => {
        const s = STYLES[type] || STYLES.success;
        return (
          <div
            key={id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 18px",
              background: "#1E293B",
              border: `1px solid ${s.border}`,
              borderRadius: "12px",
              color: s.color,
              fontSize: "14px",
              fontWeight: "600",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              whiteSpace: "nowrap",
              animation: "toastIn 0.25s ease",
              pointerEvents: "auto",
            }}
          >
            <s.Icon size={16} strokeWidth={2} />
            {message}
          </div>
        );
      })}
    </div>
  );
}
