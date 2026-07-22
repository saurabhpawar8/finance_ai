"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getSummary, getPieSummary, sendChat, removeTokens } from "@/lib/api";

const ExpensePieChart = dynamic(() => import("@/components/ExpensePieChart"), {
  ssr: false,
});

const SUGGESTIONS = [
  "Spent 200 at Zomato",
  "Paid 1200 for electricity bill",
  "Bought groceries for 800",
  "Movie tickets 400",
];

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState(null);
  const [pieData, setPieData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: 'Hello! Tell me about your expenses in plain English.\nE.g. "Spent 500 at Swiggy" or "Paid 1200 for electricity"',
    },
  ]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const [sumRes, pieRes] = await Promise.all([
        getSummary(),
        getPieSummary(),
      ]);
      if (sumRes?.success) setSummary(sumRes.data);
      if (pieRes?.success) setPieData(pieRes.data);
    } catch {}
    setDataLoading(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/auth");
      return;
    }
    loadData();
  }, [loadData, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg || chatLoading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const res = await sendChat(msg);
      if (res?.success) {
        setMessages((prev) => [...prev, { role: "bot", text: res.message }]);
        loadData();
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: res?.message || "Something went wrong." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Could not connect. Is your backend running?" },
      ]);
    }
    setChatLoading(false);
  };

  const handleLogout = () => {
    removeTokens();
    router.push("/auth");
  };
  const fmt = (n) => (n ? `₹${Number(n).toLocaleString("en-IN")}` : "₹0");

  return (
    <div
      className="mobile-page-wrap"
      style={{ minHeight: "100vh", background: "#1F1A16", color: "#F2E8D9" }}
    >
      {/* ── HEADER ── */}
      <header
        style={{
          background: "#2C2520",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "0 20px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              background: "linear-gradient(135deg, #6366F1, #818CF8)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "17px",
            }}
          >
            💰
          </div>
          <span
            style={{
              fontSize: "17px",
              fontWeight: "800",
              letterSpacing: "-0.4px",
            }}
          >
            FinanceAI
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Desktop nav — hidden on mobile */}
          <div className="hide-mobile" style={{ gap: "10px" }}>
            <Link
              href="/transactions"
              style={{
                padding: "7px 14px",
                background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.25)",
                borderRadius: "8px",
                color: "#34D399",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              📋 Transactions
            </Link>
            <Link
              href="/report"
              style={{
                padding: "7px 14px",
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.25)",
                borderRadius: "8px",
                color: "#818CF8",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              📊 Reports
            </Link>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: "7px 14px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "8px",
              color: "#A89E94",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main
        className="mobile-main"
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" }}
      >
        <p
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#5E5148",
            textTransform: "uppercase",
            letterSpacing: "1px",
            marginBottom: "16px",
          }}
        >
          {dataLoading ? "Loading…" : summary?.month || "This Month"}
        </p>

        {/* ── SUMMARY CARDS ── */}
        <div className="cards-grid">
          <div
            style={{
              background: "#2C2520",
              borderRadius: "16px",
              padding: "20px",
              border: "1px solid rgba(255,255,255,0.07)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-20px",
                right: "-20px",
                width: "80px",
                height: "80px",
                background: "rgba(239,68,68,0.08)",
                borderRadius: "50%",
              }}
            />
            <p
              style={{
                fontSize: "11px",
                color: "#7A6E63",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                marginBottom: "10px",
              }}
            >
              Total Spent
            </p>
            <p
              style={{
                fontSize: "28px",
                fontWeight: "800",
                color: "#F87171",
                letterSpacing: "-1px",
                lineHeight: 1,
              }}
            >
              {dataLoading ? "—" : fmt(summary?.total_expense)}
            </p>
            <p style={{ fontSize: "12px", color: "#5E5148", marginTop: "6px" }}>
              This month
            </p>
          </div>

          <div
            style={{
              background: "#2C2520",
              borderRadius: "16px",
              padding: "20px",
              border: "1px solid rgba(255,255,255,0.07)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-20px",
                right: "-20px",
                width: "80px",
                height: "80px",
                background: "rgba(99,102,241,0.08)",
                borderRadius: "50%",
              }}
            />
            <p
              style={{
                fontSize: "11px",
                color: "#7A6E63",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                marginBottom: "10px",
              }}
            >
              Transactions
            </p>
            <p
              style={{
                fontSize: "28px",
                fontWeight: "800",
                color: "#818CF8",
                letterSpacing: "-1px",
                lineHeight: 1,
              }}
            >
              {dataLoading ? "—" : summary?.total_transactions ?? 0}
            </p>
            <p style={{ fontSize: "12px", color: "#5E5148", marginTop: "6px" }}>
              This month
            </p>
          </div>

          <div
            style={{
              background: "#2C2520",
              borderRadius: "16px",
              padding: "20px",
              border: "1px solid rgba(255,255,255,0.07)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-20px",
                right: "-20px",
                width: "80px",
                height: "80px",
                background: "rgba(16,185,129,0.08)",
                borderRadius: "50%",
              }}
            />
            <p
              style={{
                fontSize: "11px",
                color: "#7A6E63",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                marginBottom: "10px",
              }}
            >
              Top Category
            </p>
            <p
              style={{
                fontSize: "18px",
                fontWeight: "800",
                color: "#34D399",
                letterSpacing: "-0.5px",
                lineHeight: 1.2,
              }}
            >
              {dataLoading ? "—" : summary?.top_category || "—"}
            </p>
            <p style={{ fontSize: "12px", color: "#5E5148", marginTop: "6px" }}>
              {summary?.category_amount
                ? `${fmt(summary.category_amount)} spent`
                : "No data yet"}
            </p>
          </div>
        </div>

        {/* ── PIE + CHAT ── */}
        <div className="bottom-grid">
          <div
            style={{
              background: "#2C2520",
              borderRadius: "16px",
              padding: "20px",
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              flexDirection: "column",
              minHeight: "380px",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "#7A6E63",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                marginBottom: "16px",
              }}
            >
              Spending by Category
            </p>
            <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <ExpensePieChart data={pieData} />
            </div>
          </div>

          <div
            style={{
              background: "#2C2520",
              borderRadius: "16px",
              padding: "20px",
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              flexDirection: "column",
              minHeight: "380px",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "#7A6E63",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                marginBottom: "16px",
              }}
            >
              Record Expense
            </p>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "16px",
                paddingRight: "4px",
              }}
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    padding: "11px 15px",
                    borderRadius:
                      msg.role === "user"
                        ? "16px 16px 4px 16px"
                        : "16px 16px 16px 4px",
                    background:
                      msg.role === "user"
                        ? "linear-gradient(135deg, #6366F1, #818CF8)"
                        : "#1F1A16",
                    color: msg.role === "user" ? "#fff" : "#D8CCBE",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    border:
                      msg.role === "bot"
                        ? "1px solid rgba(255,255,255,0.07)"
                        : "none",
                    whiteSpace: "pre-wrap",
                    boxShadow:
                      msg.role === "user"
                        ? "0 4px 12px rgba(99,102,241,0.3)"
                        : "none",
                  }}
                >
                  {msg.text}
                </div>
              ))}
              {chatLoading && (
                <div
                  style={{
                    alignSelf: "flex-start",
                    padding: "12px 16px",
                    borderRadius: "16px 16px 16px 4px",
                    background: "#1F1A16",
                    border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex",
                    gap: "4px",
                    alignItems: "center",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#5E5148",
                        animation: `bounce 1.2s infinite ${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length <= 1 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    style={{
                      padding: "6px 12px",
                      background: "rgba(99,102,241,0.1)",
                      border: "1px solid rgba(99,102,241,0.25)",
                      borderRadius: "20px",
                      color: "#818CF8",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: "500",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="e.g. Spent 200 at Zomato…"
                disabled={chatLoading}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: "#1F1A16",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                  color: "#F2E8D9",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={chatLoading || !input.trim()}
                style={{
                  padding: "12px 20px",
                  background:
                    !input.trim() || chatLoading
                      ? "#302820"
                      : "linear-gradient(135deg, #6366F1, #818CF8)",
                  border: "none",
                  borderRadius: "10px",
                  color: !input.trim() || chatLoading ? "#5E5148" : "#fff",
                  fontSize: "20px",
                  cursor:
                    !input.trim() || chatLoading ? "not-allowed" : "pointer",
                  flexShrink: 0,
                }}
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── BOTTOM TAB BAR (mobile only) ── */}
      <nav className="bottom-tab-bar">
        <Link href="/dashboard" className="bottom-tab-link bottom-tab-active">
          <span className="bottom-tab-icon">🏠</span>Dashboard
        </Link>
        <Link href="/transactions" className="bottom-tab-link">
          <span className="bottom-tab-icon">📋</span>Transactions
        </Link>
        <Link href="/report" className="bottom-tab-link">
          <span className="bottom-tab-icon">📊</span>Reports
        </Link>
      </nav>
    </div>
  );
}
