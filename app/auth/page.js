"use client";
import { useState } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { useRouter } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import { login, register } from "@/lib/api";

export default function AuthPage() {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const reset = () => {
    setError("");
    setSuccess("");
  };

  // Backend sometimes returns message as object e.g. {email: ["already exists"]}
  const parseMessage = (msg) => {
    if (!msg) return "";
    if (typeof msg === "string") return msg;
    if (typeof msg === "object") {
      const first = Object.values(msg)[0];
      return Array.isArray(first) ? first[0] : String(first);
    }
    return String(msg);
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }
    reset();
    setLoading(true);
    try {
      if (tab === "login") {
        const res = await login(email, password);
        if (res.success) {
          localStorage.setItem("access_token", res.data.access);
          localStorage.setItem("refresh_token", res.data.refresh);
          localStorage.setItem("user_email", email);
          router.push("/dashboard");
        } else {
          setError(
            parseMessage(res.message) || "Login failed. Check your credentials."
          );
        }
      } else {
        const res = await register(email, password);
        if (res.success) {
          setSuccess("Account created! You can now sign in.");
          setTab("login");
          setPassword("");
        } else {
          setError(
            parseMessage(res.message) ||
              "Registration failed. Try a different email."
          );
        }
      }
    } catch {
      setError("Cannot connect to server. Make sure your backend is running.");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-inset)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <button
        onClick={toggleTheme}
        style={{
          position: "fixed",
          top: "16px",
          right: "16px",
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          color: "var(--text-2)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        {theme === "dark" ? (
          <Sun size={16} strokeWidth={2} />
        ) : (
          <Moon size={16} strokeWidth={2} />
        )}
      </button>
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at 20% 60%, rgba(99,102,241,0.12) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.08) 0%, transparent 45%)",
        }}
      />

      <div
        style={{
          background: "var(--bg-surface)",
          borderRadius: "24px",
          padding: "40px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.07)",
          position: "relative",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <img
              src="/icons/icon-192.png"
              alt="FinanceAI"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                objectFit: "cover",
              }}
            />
            <span
              style={{
                fontSize: "24px",
                fontWeight: "800",
                color: "var(--text-1)",
                letterSpacing: "-0.5px",
              }}
            >
              FinanceAI
            </span>
          </div>
          <p
            style={{
              color: "var(--text-3)",
              marginTop: "10px",
              fontSize: "14px",
            }}
          >
            Track expenses with the power of AI
          </p>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            background: "var(--bg-inset)",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "28px",
          }}
        >
          {["login", "register"].map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                reset();
              }}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: "9px",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                transition: "all 0.2s",
                background:
                  tab === t ? "var(--accent-gradient)" : "transparent",
                color: tab === t ? "#fff" : "#64748B",
                boxShadow:
                  tab === t ? "0 4px 12px rgba(99,102,241,0.35)" : "none",
              }}
            >
              {t === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label
              style={{
                display: "block",
                color: "var(--text-2)",
                fontSize: "13px",
                fontWeight: "500",
                marginBottom: "6px",
              }}
            >
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "var(--bg-inset)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                color: "var(--text-1)",
                fontSize: "15px",
                outline: "none",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                color: "var(--text-2)",
                fontSize: "13px",
                fontWeight: "500",
                marginBottom: "6px",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "var(--bg-inset)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                color: "var(--text-1)",
                fontSize: "15px",
                outline: "none",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                background: "var(--red-bg)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#FCA5A5",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                background: "var(--green-bg)",
                border: "1px solid rgba(16,185,129,0.25)",
                color: "#6EE7B7",
                fontSize: "14px",
              }}
            >
              {success}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#334155" : "var(--accent-gradient)",
              border: "none",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "15px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 8px 24px rgba(99,102,241,0.35)",
              marginTop: "4px",
            }}
          >
            {loading
              ? "Please wait…"
              : tab === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
