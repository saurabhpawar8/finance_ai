"use client";
import Link from "next/link";
import { Home, ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 60% 50% at 30% 60%, rgba(99,102,241,0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 75% 25%, rgba(255,77,109,0.08) 0%, transparent 70%)",
        }}
      />

      <div
        style={{ textAlign: "center", maxWidth: "420px", position: "relative" }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "72px",
            height: "72px",
            borderRadius: "20px",
            background: "var(--bg-surface)",
            boxShadow: "var(--shadow-elevated)",
            marginBottom: "28px",
          }}
        >
          <Compass size={32} color="var(--accent-dim)" strokeWidth={1.6} />
        </div>

        <p
          style={{
            fontSize: "13px",
            fontWeight: "700",
            color: "var(--red)",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          404
        </p>
        <h1
          style={{
            fontSize: "26px",
            fontWeight: "800",
            letterSpacing: "-0.6px",
            marginBottom: "12px",
            color: "var(--text-1)",
          }}
        >
          This page doesn't exist
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-3)",
            lineHeight: "1.6",
            marginBottom: "32px",
          }}
        >
          The page you're looking for may have moved, or the link might be
          broken. Let's get you back on track.
        </p>

        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/dashboard"
            style={{
              padding: "12px 22px",
              background: "var(--accent-gradient)",
              borderRadius: "10px",
              color: "#fff",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "var(--shadow-accent)",
            }}
          >
            <Home size={15} strokeWidth={2} />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: "12px 22px",
              background: "var(--bg-surface)",
              boxShadow: "var(--shadow-card)",
              border: "none",
              borderRadius: "10px",
              color: "var(--text-2)",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ArrowLeft size={15} strokeWidth={2} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
