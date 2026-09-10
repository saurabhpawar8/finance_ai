"use client";
import Link from "next/link";
import { ArrowLeft, Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

const ITEMS = [
  {
    title: "Account information",
    desc: "Your email address and a securely hashed password if you register directly, or your name, email address, and profile picture if you sign in with Google.",
  },
  {
    title: "Financial data you enter",
    desc: "Transaction details you provide through chat or manually, merchant name, amount, category, wallet, date, and any notes, along with any budget limits you set per category.",
  },
  {
    title: "Chat messages",
    desc: "The text you type in chat, sent to a third-party AI provider to be interpreted into a transaction or to generate an AI report or summary you request.",
  },
  {
    title: "Basic usage data",
    desc: "Which pages you visit and basic device/browser information, used only to keep the app working correctly.",
  },
];

export default function PrivacyPolicyPage() {
  const { theme, toggleTheme } = useTheme();
  const lastUpdated = "September 11, 2026";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-inset)",
        color: "var(--text-1)",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          background: "var(--bg-header)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: "0 24px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src="/icons/icon-192.png"
            alt="Outgo"
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "7px",
              objectFit: "cover",
            }}
          />
          <span
            style={{
              fontSize: "16px",
              fontWeight: "800",
              letterSpacing: "-0.4px",
            }}
          >
            Outgo
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link
            href="/auth"
            style={{
              padding: "7px 14px",
              background: "transparent",
              borderRadius: "8px",
              color: "var(--text-3)",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Back
          </Link>
          <button
            onClick={toggleTheme}
            title="Toggle theme"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--bg-elevated)",
              border: "none",
              color: "var(--text-3)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {theme === "dark" ? (
              <Sun size={15} strokeWidth={2} />
            ) : (
              <Moon size={15} strokeWidth={2} />
            )}
          </button>
        </div>
      </header>

      <main
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "40px 20px 80px",
        }}
      >
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "800",
              letterSpacing: "-0.8px",
              marginBottom: "8px",
            }}
          >
            Information We Collect
          </h1>
          <p style={{ color: "var(--text-3)", fontSize: "13px" }}>
            Last updated: {lastUpdated}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {ITEMS.map((item, i) => (
            <div
              key={i}
              style={{
                background: "var(--bg-surface)",
                borderRadius: "16px",
                padding: "20px 22px",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <h2
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "var(--text-1)",
                  marginBottom: "6px",
                  letterSpacing: "-0.1px",
                }}
              >
                {item.title}
              </h2>
              <p
                style={{
                  fontSize: "13.5px",
                  color: "var(--text-2)",
                  lineHeight: "1.7",
                  margin: 0,
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <p
          style={{
            fontSize: "12px",
            color: "var(--text-4)",
            textAlign: "center",
            marginTop: "32px",
          }}
        >
          Outgo · Information We Collect
        </p>
      </main>
    </div>
  );
}
