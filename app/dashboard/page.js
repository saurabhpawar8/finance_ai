"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Wallet,
  LayoutDashboard,
  Receipt,
  BarChart3,
  LogOut,
  Send,
  MessageSquare,
  PieChart,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { getSummary, getPieSummary, sendChat, removeTokens } from "@/lib/api";
import Toast, { showToast } from "@/components/Toast";

const ExpensePieChart = dynamic(() => import("@/components/ExpensePieChart"), {
  ssr: false,
});

const EXAMPLES = [
  "Spent 200 at Zomato",
  "Paid 1200 electricity bill",
  "Bought groceries for 800",
  "Netflix subscription 649",
  "Petrol 500",
  "Movie tickets 400",
];
const STEPS = [
  {
    icon: MessageSquare,
    color: "#818CF8",
    bg: "rgba(99,102,241,0.12)",
    border: "rgba(99,102,241,0.2)",
    step: "1",
    title: "Tell me what you spent",
    desc: 'Type naturally — "Spent 200 at Zomato". No forms, no dropdowns.',
  },
  {
    icon: PieChart,
    color: "#34D399",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.2)",
    step: "2",
    title: "I categorize everything",
    desc: "Every expense is sorted into categories and shown as a live chart.",
  },
  {
    icon: Sparkles,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.2)",
    step: "3",
    title: "Get AI insights",
    desc: "Go to Reports for a full AI analysis of your spending habits.",
  },
];

// ── Animated counter ──────────────────────────────────────
function CountUp({ to, prefix = "", decimals = 0, duration = 1600 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!to && to !== 0) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(
        decimals ? (eased * to).toFixed(decimals) : Math.floor(eased * to)
      );
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to, duration, decimals]);
  return (
    <>
      {prefix}
      {Number(val).toLocaleString("en-IN")}
    </>
  );
}

// ── Shared components (outside parent to avoid remount) ───
function AppHeader({ onLogout }) {
  return (
    <header
      style={{
        background: "#1E293B",
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
          }}
        >
          <Wallet size={18} color="#fff" strokeWidth={2} />
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
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Receipt size={14} strokeWidth={2} />
            Transactions
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
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <BarChart3 size={14} strokeWidth={2} />
            Reports
          </Link>
        </div>
        <button
          onClick={onLogout}
          style={{
            padding: "7px 14px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "8px",
            color: "#94A3B8",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <LogOut size={14} strokeWidth={2} />
          Sign Out
        </button>
      </div>
    </header>
  );
}

function ChatBox({
  messages,
  chatLoading,
  input,
  setInput,
  onSend,
  messagesEndRef,
  fullWidth,
}) {
  return (
    <div
      style={{
        background: "#1E293B",
        borderRadius: "16px",
        padding: "20px",
        border: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        minHeight: fullWidth ? "320px" : "380px",
      }}
    >
      {!fullWidth && (
        <p
          style={{
            fontSize: "11px",
            fontWeight: "600",
            color: "#64748B",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            marginBottom: "16px",
          }}
        >
          Record Expense
        </p>
      )}
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
                  : "#0F172A",
              color: msg.role === "user" ? "#fff" : "#CBD5E1",
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
              background: "#0F172A",
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
                  background: "#475569",
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
          {EXAMPLES.slice(0, fullWidth ? 6 : 4).map((s, i) => (
            <button
              key={i}
              onClick={() => onSend(s)}
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
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="e.g. Spent 200 at Zomato…"
          disabled={chatLoading}
          style={{
            flex: 1,
            padding: "12px 16px",
            background: "#0F172A",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            color: "#F1F5F9",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button
          onClick={() => onSend()}
          disabled={chatLoading || !input.trim()}
          style={{
            padding: "12px 16px",
            background:
              !input.trim() || chatLoading
                ? "#1E3A5F"
                : "linear-gradient(135deg, #6366F1, #818CF8)",
            border: "none",
            borderRadius: "10px",
            color: !input.trim() || chatLoading ? "#475569" : "#fff",
            cursor: !input.trim() || chatLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Send size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function BottomTabs({ active }) {
  return (
    <nav className="bottom-tab-bar">
      {[
        { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/transactions", icon: Receipt, label: "Transactions" },
        { href: "/report", icon: BarChart3, label: "Reports" },
      ].map(({ href, icon: Icon, label }) => {
        const isActive = active === label.toLowerCase();
        return (
          <Link
            key={href}
            href={href}
            className={`bottom-tab-link ${isActive ? "bottom-tab-active" : ""}`}
          >
            <div
              className={isActive ? "tab-active-pill" : ""}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <Icon size={22} strokeWidth={1.5} />
              {label}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

// ── Main ─────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState(null);
  const [pieData, setPieData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: 'Hi! Just tell me what you spent and I\'ll track it.\n\nTry: "Spent 200 at Zomato"',
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

  const handleSend = useCallback(
    async (text) => {
      const msg = (text || input).trim();
      if (!msg || chatLoading) return;
      setInput("");
      setMessages((prev) => [...prev, { role: "user", text: msg }]);
      setChatLoading(true);
      try {
        const res = await sendChat(msg);
        if (res?.success) {
          setMessages((prev) => [...prev, { role: "bot", text: res.message }]);
          showToast("Expense recorded!", "success");
          loadData();
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "bot", text: res?.message || "Something went wrong." },
          ]);
          showToast(res?.message || "Something went wrong", "error");
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: "Could not connect. Is your backend running?" },
        ]);
        showToast("Could not connect to server", "error");
      }
      setChatLoading(false);
    },
    [input, chatLoading, loadData]
  );

  const handleLogout = useCallback(() => {
    removeTokens();
    router.push("/auth");
  }, [router]);
  const fmt = (n) => (n ? `₹${Number(n).toLocaleString("en-IN")}` : "₹0");
  const isFirstTime =
    !dataLoading && (!summary || summary.total_transactions === 0);
  const chatProps = {
    messages,
    chatLoading,
    input,
    setInput,
    onSend: handleSend,
    messagesEndRef,
  };

  // ── WELCOME ───────────────────────────────────────────
  if (isFirstTime) {
    return (
      <div
        className="mobile-page-wrap"
        style={{ minHeight: "100vh", background: "#0F172A", color: "#F1F5F9" }}
      >
        <AppHeader onLogout={handleLogout} />
        <main
          className="mobile-main"
          style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 20px" }}
        >
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div
              style={{
                display: "inline-flex",
                width: "56px",
                height: "56px",
                background: "linear-gradient(135deg, #6366F1, #818CF8)",
                borderRadius: "16px",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
                boxShadow: "0 12px 32px rgba(99,102,241,0.35)",
              }}
            >
              <Wallet size={28} color="#fff" strokeWidth={2} />
            </div>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: "800",
                letterSpacing: "-1px",
                marginBottom: "12px",
                background: "linear-gradient(135deg, #F1F5F9, #818CF8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Welcome to FinanceAI
            </h1>
            <p
              style={{
                fontSize: "16px",
                color: "#64748B",
                maxWidth: "420px",
                margin: "0 auto",
                lineHeight: "1.6",
              }}
            >
              Track every expense just by chatting. No spreadsheets, no manual
              entry — just plain English.
            </p>
          </div>
          <div className="cards-grid" style={{ marginBottom: "36px" }}>
            {STEPS.map(
              ({ icon: Icon, color, bg, border, step, title, desc }) => (
                <div
                  key={step}
                  style={{
                    background: "#1E293B",
                    borderRadius: "16px",
                    padding: "22px",
                    border: `1px solid ${border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} color={color} strokeWidth={1.8} />
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color,
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                      }}
                    >
                      Step {step}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: "700",
                      color: "#F1F5F9",
                      marginBottom: "8px",
                      letterSpacing: "-0.2px",
                    }}
                  >
                    {title}
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#64748B",
                      lineHeight: "1.6",
                    }}
                  >
                    {desc}
                  </p>
                </div>
              )
            )}
          </div>
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  height: "1px",
                  flex: 1,
                  background: "rgba(255,255,255,0.06)",
                }}
              />
              <p
                style={{
                  fontSize: "12px",
                  color: "#475569",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  whiteSpace: "nowrap",
                }}
              >
                Start here — record your first expense
              </p>
              <div
                style={{
                  height: "1px",
                  flex: 1,
                  background: "rgba(255,255,255,0.06)",
                }}
              />
            </div>
            <ChatBox {...chatProps} fullWidth={true} />
          </div>
          <div style={{ textAlign: "center" }}>
            <Link
              href="/transactions"
              style={{
                fontSize: "13px",
                color: "#475569",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Already have data? View transactions{" "}
              <ArrowRight size={13} strokeWidth={2} />
            </Link>
          </div>
        </main>
        <BottomTabs active="dashboard" />
        <Toast />
      </div>
    );
  }

  // ── NORMAL DASHBOARD ─────────────────────────────────
  return (
    <div
      className="mobile-page-wrap"
      style={{ minHeight: "100vh", background: "#0F172A", color: "#F1F5F9" }}
    >
      <AppHeader onLogout={handleLogout} />
      <main
        className="mobile-main"
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" }}
      >
        <p
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "1px",
            marginBottom: "16px",
          }}
        >
          {summary?.month || "This Month"}
        </p>

        {/* Summary cards with animated counters */}
        <div className="cards-grid">
          <div
            style={{
              background: "#1E293B",
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
                color: "#64748B",
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
              <CountUp to={summary?.total_expense || 0} prefix="₹" />
            </p>
            <p style={{ fontSize: "12px", color: "#475569", marginTop: "6px" }}>
              This month
            </p>
          </div>
          <div
            style={{
              background: "#1E293B",
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
                color: "#64748B",
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
              <CountUp to={summary?.total_transactions || 0} />
            </p>
            <p style={{ fontSize: "12px", color: "#475569", marginTop: "6px" }}>
              This month
            </p>
          </div>
          <div
            style={{
              background: "#1E293B",
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
                color: "#64748B",
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
              {summary?.top_category || "—"}
            </p>
            <p style={{ fontSize: "12px", color: "#475569", marginTop: "6px" }}>
              {summary?.category_amount
                ? `₹${Number(summary.category_amount).toLocaleString(
                    "en-IN"
                  )} spent`
                : "No data"}
            </p>
          </div>
        </div>

        <div className="bottom-grid">
          <div
            style={{
              background: "#1E293B",
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
                color: "#64748B",
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
          <ChatBox {...chatProps} fullWidth={false} />
        </div>
      </main>
      <BottomTabs active="dashboard" />
      <Toast />
    </div>
  );
}
