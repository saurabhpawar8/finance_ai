"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Activity,
  Zap,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";
import {
  getSummary,
  getPieSummary,
  sendChat,
  removeTokens,
  getHeatmap,
} from "@/lib/api";
import Toast, { showToast } from "@/components/Toast";
import { useTheme } from "@/lib/ThemeContext";

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
    color: "var(--accent-dim)",
    bg: "var(--accent-bg)",
    border: "var(--accent-border)",
    step: "1",
    title: "Tell me what you spent",
    desc: 'Type naturally - "Spent 200 at Zomato". No forms, no dropdowns.',
  },
  {
    icon: PieChart,
    color: "var(--green-dim)",
    bg: "var(--green-bg)",
    border: "var(--green-border)",
    step: "2",
    title: "I categorize everything",
    desc: "Every expense is sorted into categories and shown as a live chart.",
  },
  {
    icon: Sparkles,
    color: "var(--yellow)",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.2)",
    step: "3",
    title: "Get AI insights",
    desc: "Go to Reports for a full AI analysis of your spending habits.",
  },
];

// ── Insight generator ────────────────────────────────────
const generateInsights = (summary, pieData, heatmapData) => {
  if (!summary || !summary.total_expense) return [];

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  const dailyAvg = summary.total_expense / dayOfMonth;
  const projected = Math.round(dailyAvg * daysInMonth);
  const monthName = summary.month?.split(" ")[0] || "month end";
  const results = [];

  // Daily average + projection
  results.push({
    icon: TrendingUp,
    color: "var(--yellow)",
    priority: 2,
    text: `Averaging ₹${Math.round(dailyAvg).toLocaleString(
      "en-IN"
    )} per day - projected ₹${projected.toLocaleString(
      "en-IN"
    )} by ${monthName} end`,
  });

  // Top category %
  if (summary.top_category && summary.category_amount) {
    const pct = Math.round(
      (summary.category_amount / summary.total_expense) * 100
    );
    results.push({
      icon: Zap,
      color: "var(--accent-dim)",
      priority: 3,
      text: `${summary.top_category} accounts for ${pct}% of your spending - your biggest category this month`,
    });
  }

  // Days since last spending
  if (heatmapData?.length > 0) {
    const sorted = [...heatmapData].sort(
      (a, b) => new Date(b.date_only) - new Date(a.date_only)
    );
    const lastDate = new Date(sorted[0].date_only + "T00:00:00");
    const daysSince = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    if (daysSince >= 2) {
      results.push({
        icon: TrendingDown,
        color: "var(--green-dim)",
        priority: 0,
        text: `No spending for ${daysSince} days straight - you're on a great streak!`,
      });
    }

    // Biggest spending day
    const maxDay = heatmapData.reduce(
      (max, d) => (d.total > max.total ? d : max),
      heatmapData[0]
    );
    if (maxDay?.total > 0) {
      const [y, m, d] = maxDay.date_only.split("-").map(Number);
      const dateLabel = new Date(y, m - 1, d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      results.push({
        icon: AlertCircle,
        color: "var(--red)",
        priority: 1,
        text: `Biggest day was ${dateLabel} - ₹${Number(
          maxDay.total
        ).toLocaleString("en-IN")} spent in a single day`,
      });
    }
  }

  // Category diversity
  if (pieData?.length > 1) {
    const smallest = [...pieData].sort((a, b) => a.total - b.total)[0];
    results.push({
      icon: Activity,
      color: "var(--cyan)",
      priority: 4,
      text: `Spending across ${pieData.length} categories - ${
        smallest.category_name
      } is your lowest at ₹${Number(smallest.total).toLocaleString("en-IN")}`,
    });
  }

  return results.sort((a, b) => a.priority - b.priority).slice(0, 3);
};

// ── Spending Insights card ────────────────────────────────
function SpendingInsights({ summary, pieData, heatmapData }) {
  const insights = generateInsights(summary, pieData, heatmapData);
  if (!insights.length) return null;

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        borderRadius: "16px",
        padding: "20px",
        boxShadow: "var(--shadow-card)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: "600",
          color: "var(--text-3)",
          textTransform: "uppercase",
          letterSpacing: "0.8px",
        }}
      >
        Spending Insights
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          flex: 1,
        }}
      >
        {insights.map((insight, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "12px 14px",
              background: "var(--bg-inset)",
              borderRadius: "10px",
              borderLeft: `3px solid ${insight.color}`,
            }}
          >
            <insight.icon
              size={15}
              color={insight.color}
              strokeWidth={2}
              style={{ flexShrink: 0, marginTop: "2px" }}
            />
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-2)",
                lineHeight: "1.7",
                margin: 0,
              }}
            >
              {insight.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

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

// ── Spending Heatmap ─────────────────────────────────────
// ── Trend tooltip ─────────────────────────────────────────
function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const amount = payload[0].value;
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        borderRadius: "10px",
        padding: "10px 14px",
        boxShadow: "var(--shadow-elevated)",
        border: "1px solid var(--border)",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          color: "var(--text-3)",
          marginBottom: "4px",
        }}
      >
        Day {label}
      </p>
      <p
        style={{
          fontSize: "15px",
          fontWeight: "700",
          color: amount > 0 ? "var(--red)" : "var(--text-3)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {amount > 0
          ? `₹${Number(amount).toLocaleString("en-IN")}`
          : "No spending"}
      </p>
    </div>
  );
}

// ── Spending Trend chart ──────────────────────────────────
function SpendingTrend({ data, selectedMonth, selectedYear }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const now = new Date();
  const year = selectedYear || now.getFullYear();
  const month = selectedMonth ? selectedMonth - 1 : now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today =
    year === now.getFullYear() && month === now.getMonth()
      ? now.getDate()
      : daysInMonth;

  // Build full month data — fill missing days with 0
  const dataMap = {};
  (data || []).forEach((d) => {
    dataMap[d.date_only] = d.total;
  });

  const chartData = [];
  for (let d = 1; d <= today; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      d
    ).padStart(2, "0")}`;
    chartData.push({ day: d, amount: dataMap[dateStr] || 0 });
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const totalSpend = (data || []).reduce((s, d) => s + d.total, 0);
  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const tickColor = isDark ? "#44445A" : "#6C6C70";

  const fmtY = (v) =>
    v === 0 ? "" : v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`;

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        borderRadius: "16px",
        padding: "20px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "4px",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "11px",
              fontWeight: "700",
              color: "var(--text-3)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "6px",
            }}
          >
            Spending Trend
          </p>
          <p
            style={{
              fontSize: "22px",
              fontWeight: "800",
              color: "var(--red)",
              letterSpacing: "-1px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ₹{totalSpend.toLocaleString("en-IN")}
          </p>
        </div>
        <span
          style={{ fontSize: "12px", color: "var(--text-4)", marginTop: "2px" }}
        >
          {monthLabel}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart
          data={chartData}
          margin={{ top: 16, right: 4, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="#FF4D6D"
                stopOpacity={isDark ? 0.3 : 0.15}
              />
              <stop offset="95%" stopColor="#FF4D6D" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridColor}
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: tickColor, fontFamily: "Inter" }}
            tickLine={false}
            axisLine={false}
            interval={Math.floor(daysInMonth / 6)}
          />
          <YAxis
            tick={{ fontSize: 10, fill: tickColor, fontFamily: "Inter" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtY}
            width={40}
          />
          <Tooltip
            content={<TrendTooltip />}
            cursor={{
              stroke: "var(--border-strong)",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#FF4D6D"
            strokeWidth={2}
            fill="url(#trendGradient)"
            dot={false}
            activeDot={{
              r: 4,
              fill: "#FF4D6D",
              stroke: isDark ? "#111115" : "#FFFFFF",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Shared components (outside parent to avoid remount) ───
function AppHeader({
  onLogout,
  theme,
  toggleTheme,
  selectedMonth,
  selectedYear,
  goBack,
  goForward,
  isCurrentMonth,
  months,
  onBackToCurrent,
}) {
  return (
    <header
      style={{
        background: "var(--bg-header)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "0 16px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Left: Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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

      {/* Centre: Month switcher — desktop only */}
      <div
        className="hide-mobile"
        style={{ display: "flex", alignItems: "center", gap: "8px" }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "var(--bg-elevated)",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <button
            onClick={goBack}
            style={{
              padding: "7px 12px",
              background: "transparent",
              border: "none",
              borderRight: "1px solid var(--border)",
              color: "var(--text-3)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              transition: "color 100ms ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-3)")
            }
          >
            <ChevronLeft size={14} strokeWidth={2.5} />
          </button>
          <span
            style={{
              padding: "7px 16px",
              fontSize: "13px",
              fontWeight: "700",
              color: "var(--text-1)",
              minWidth: "100px",
              textAlign: "center",
              letterSpacing: "-0.2px",
            }}
          >
            {months[selectedMonth - 1]} {selectedYear}
          </span>
          <button
            onClick={goForward}
            disabled={isCurrentMonth}
            style={{
              padding: "7px 12px",
              background: "transparent",
              border: "none",
              borderLeft: "1px solid var(--border)",
              color: isCurrentMonth ? "var(--text-4)" : "var(--text-3)",
              cursor: isCurrentMonth ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              transition: "color 100ms ease",
            }}
            onMouseEnter={(e) => {
              if (!isCurrentMonth)
                e.currentTarget.style.color = "var(--text-1)";
            }}
            onMouseLeave={(e) => {
              if (!isCurrentMonth)
                e.currentTarget.style.color = "var(--text-3)";
            }}
          >
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>
        {!isCurrentMonth && (
          <button
            onClick={onBackToCurrent}
            style={{
              fontSize: "11px",
              color: "var(--accent-dim)",
              fontWeight: "600",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "0",
              whiteSpace: "nowrap",
            }}
          >
            Now
          </button>
        )}
      </div>

      {/* Right: Nav + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <div className="hide-mobile" style={{ display: "flex", gap: "0" }}>
          <Link
            href="/transactions"
            style={{
              padding: "7px 12px",
              background: "transparent",
              borderRadius: "8px",
              color: "var(--text-3)",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              transition: "color 100ms ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-3)")
            }
          >
            <Receipt size={14} strokeWidth={2} />
            Transactions
          </Link>
          <Link
            href="/report"
            style={{
              padding: "7px 12px",
              background: "transparent",
              borderRadius: "8px",
              color: "var(--text-3)",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              transition: "color 100ms ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-3)")
            }
          >
            <BarChart3 size={14} strokeWidth={2} />
            Reports
          </Link>
          <button
            onClick={onLogout}
            style={{
              padding: "7px 12px",
              background: "transparent",
              border: "none",
              borderRadius: "8px",
              color: "var(--text-3)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              transition: "color 100ms ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-3)")
            }
          >
            <LogOut size={14} strokeWidth={2} />
          </button>
        </div>
        <button
          onClick={toggleTheme}
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
            transition: "color 100ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-1)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-3)")}
        >
          {theme === "dark" ? (
            <Sun size={14} strokeWidth={2} />
          ) : (
            <Moon size={14} strokeWidth={2} />
          )}
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
        background: "var(--bg-surface)",
        borderRadius: "20px",
        padding: "20px",
        boxShadow: "var(--shadow-card)",
        display: "flex",
        flexDirection: "column",
        minHeight: fullWidth ? "320px" : "380px",
      }}
    >
      {!fullWidth && (
        <p
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: "1px",
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
          gap: "10px",
          marginBottom: "16px",
          paddingRight: "2px",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              padding: "10px 14px",
              borderRadius:
                msg.role === "user"
                  ? "18px 18px 4px 18px"
                  : "18px 18px 18px 4px",
              background:
                msg.role === "user"
                  ? "var(--accent-gradient)"
                  : "var(--bg-elevated)",
              color: msg.role === "user" ? "#fff" : "var(--text-2)",
              fontSize: "14px",
              lineHeight: "1.55",
              whiteSpace: "pre-wrap",
              boxShadow: msg.role === "user" ? "var(--shadow-accent)" : "none",
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
              borderRadius: "18px 18px 18px 4px",
              background: "var(--bg-elevated)",
              display: "flex",
              gap: "5px",
              alignItems: "center",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "var(--text-3)",
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
            gap: "6px",
            marginBottom: "12px",
          }}
        >
          {EXAMPLES.slice(0, fullWidth ? 6 : 4).map((s, i) => (
            <button
              key={i}
              onClick={() => onSend(s)}
              style={{
                padding: "5px 12px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-strong)",
                borderRadius: "20px",
                color: "var(--text-2)",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: "500",
                transition: "all 100ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent-bg)";
                e.currentTarget.style.color = "var(--accent-dim)";
                e.currentTarget.style.borderColor = "var(--accent-border)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bg-elevated)";
                e.currentTarget.style.color = "var(--text-2)";
                e.currentTarget.style.borderColor = "var(--border-strong)";
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <div
        style={{
          display: "flex",
          gap: "8px",
          background: "var(--bg-elevated)",
          borderRadius: "14px",
          padding: "6px 6px 6px 14px",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="e.g. Spent 200 at Zomato…"
          disabled={chatLoading}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            color: "var(--text-1)",
            fontSize: "14px",
            outline: "none",
            padding: "6px 0",
          }}
        />
        <button
          onClick={() => onSend()}
          disabled={chatLoading || !input.trim()}
          style={{
            padding: "10px 14px",
            background:
              !input.trim() || chatLoading
                ? "var(--bg-inset)"
                : "var(--accent-gradient)",
            border: "none",
            borderRadius: "10px",
            color: !input.trim() || chatLoading ? "var(--text-3)" : "#fff",
            cursor: !input.trim() || chatLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow:
              !input.trim() || chatLoading ? "none" : "var(--shadow-accent)",
            transition: "all 150ms ease",
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
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);
  const [pieData, setPieData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
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

  const loadData = useCallback(async (month, year) => {
    try {
      const [sumRes, pieRes, heatRes] = await Promise.all([
        getSummary(month, year),
        getPieSummary(month, year),
        getHeatmap(month, year),
      ]);
      if (sumRes?.success) setSummary(sumRes.data);
      if (pieRes?.success) setPieData(pieRes.data);
      if (heatRes?.success) setHeatmapData(heatRes.data);
    } catch {}
    setDataLoading(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("refresh_token");
    if (!token) {
      router.push("/auth");
      return;
    }
    loadData(selectedMonth, selectedYear);
  }, [loadData, router]);

  // Reload when month/year changes
  useEffect(() => {
    setDataLoading(true);
    setSummary(null);
    setPieData([]);
    setHeatmapData([]);
    loadData(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, loadData]);

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
          loadData(selectedMonth, selectedYear);
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
  const { theme, toggleTheme } = useTheme();

  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const goBack = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else setSelectedMonth((m) => m - 1);
  };

  const goForward = () => {
    if (isCurrentMonthSelected) return;
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else setSelectedMonth((m) => m + 1);
  };

  const fmt = (n) => (n ? `₹${Number(n).toLocaleString("en-IN")}` : "₹0");
  const isCurrentMonthSelected =
    selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();
  // Mark user as returning once they have any transaction ever
  useEffect(() => {
    if (summary?.total_transactions > 0) {
      localStorage.setItem("has_transactions", "true");
    }
  }, [summary]);

  const isReturningUser =
    typeof window !== "undefined" &&
    localStorage.getItem("has_transactions") === "true";
  const isFirstTime =
    !dataLoading &&
    !isReturningUser &&
    isCurrentMonthSelected &&
    (!summary || summary.total_transactions === 0);
  const isEmptyMonth =
    !dataLoading &&
    !isCurrentMonthSelected &&
    (!summary || summary.total_transactions === 0) &&
    !isFirstTime;
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
        style={{
          minHeight: "100vh",
          background: "var(--bg-inset)",
          color: "var(--text-1)",
        }}
      >
        <AppHeader
          onLogout={handleLogout}
          theme={theme}
          toggleTheme={toggleTheme}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          goBack={goBack}
          goForward={goForward}
          isCurrentMonth={isCurrentMonthSelected}
          months={MONTHS}
          onBackToCurrent={() => {
            setSelectedMonth(now.getMonth() + 1);
            setSelectedYear(now.getFullYear());
          }}
        />
        <main
          className="mobile-main"
          style={{ maxWidth: "860px", margin: "0 auto", padding: "40px 20px" }}
        >
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <img
              src="/icons/icon-192.png"
              alt="Outgo"
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                objectFit: "cover",
                marginBottom: "20px",
              }}
            />
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
              Welcome to Outgo
            </h1>
            <p
              style={{
                fontSize: "16px",
                color: "var(--text-3)",
                maxWidth: "420px",
                margin: "0 auto",
                lineHeight: "1.6",
              }}
            >
              Track every expense just by chatting. No spreadsheets, no manual
              entry - just plain English.
            </p>
          </div>
          <div className="cards-grid" style={{ marginBottom: "36px" }}>
            {STEPS.map(
              ({ icon: Icon, color, bg, border, step, title, desc }) => (
                <div
                  key={step}
                  style={{
                    background: "var(--bg-surface)",
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
                      color: "var(--text-1)",
                      marginBottom: "8px",
                      letterSpacing: "-0.2px",
                    }}
                  >
                    {title}
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-3)",
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
                style={{ height: "1px", flex: 1, background: "var(--border)" }}
              />
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-3)",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  whiteSpace: "nowrap",
                }}
              >
                Start here - record your first expense
              </p>
              <div
                style={{ height: "1px", flex: 1, background: "var(--border)" }}
              />
            </div>
            <ChatBox {...chatProps} fullWidth={true} />
          </div>
          <div style={{ textAlign: "center" }}>
            <Link
              href="/transactions"
              style={{
                fontSize: "13px",
                color: "var(--text-3)",
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
      style={{
        minHeight: "100vh",
        background: "var(--bg-inset)",
        color: "var(--text-1)",
      }}
    >
      <AppHeader
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={toggleTheme}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        goBack={goBack}
        goForward={goForward}
        isCurrentMonth={isCurrentMonthSelected}
        months={MONTHS}
        onBackToCurrent={() => {
          setSelectedMonth(now.getMonth() + 1);
          setSelectedYear(now.getFullYear());
        }}
      />
      <main
        className="mobile-main"
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" }}
      >
        {/* Mobile month switcher — shown below header on mobile only */}
        <div
          className="show-mobile"
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "var(--bg-surface)",
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <button
              onClick={goBack}
              style={{
                padding: "10px 14px",
                background: "transparent",
                border: "none",
                borderRight: "1px solid var(--border)",
                color: "var(--text-3)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronLeft size={15} strokeWidth={2.5} />
            </button>
            <span
              style={{
                padding: "10px 18px",
                fontSize: "14px",
                fontWeight: "700",
                color: "var(--text-1)",
                textAlign: "center",
                letterSpacing: "-0.2px",
              }}
            >
              {MONTHS[selectedMonth - 1]} {selectedYear}
            </span>
            <button
              onClick={goForward}
              disabled={isCurrentMonthSelected}
              style={{
                padding: "10px 14px",
                background: "transparent",
                border: "none",
                borderLeft: "1px solid var(--border)",
                color: isCurrentMonthSelected
                  ? "var(--text-4)"
                  : "var(--text-3)",
                cursor: isCurrentMonthSelected ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronRight size={15} strokeWidth={2.5} />
            </button>
          </div>
          {!isCurrentMonthSelected && (
            <button
              onClick={() => {
                setSelectedMonth(now.getMonth() + 1);
                setSelectedYear(now.getFullYear());
              }}
              style={{
                fontSize: "12px",
                color: "var(--accent-dim)",
                fontWeight: "600",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              Now
            </button>
          )}
        </div>

        {/* Summary cards */}
        {isEmptyMonth ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 20px",
              color: "var(--text-3)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗓️</div>
            <p
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "var(--text-3)",
                marginBottom: "8px",
              }}
            >
              No data for {MONTHS[selectedMonth - 1]} {selectedYear}
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-3)",
                marginBottom: "20px",
              }}
            >
              No expenses were recorded this month
            </p>
            <button
              onClick={() => {
                setSelectedMonth(now.getMonth() + 1);
                setSelectedYear(now.getFullYear());
              }}
              style={{
                padding: "10px 20px",
                background: "var(--accent-bg)",
                border: "1px solid var(--accent-border)",
                borderRadius: "10px",
                color: "var(--accent-dim)",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Go to current month
            </button>
          </div>
        ) : (
          <>
            <div className="cards-grid">
              {/* Total Spent */}
              <div
                style={{
                  background: "var(--bg-surface)",
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: "var(--shadow-card)",
                  borderTop: "2px solid var(--red)",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-3)",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: "10px",
                  }}
                >
                  Total Spent
                </p>
                <p
                  style={{
                    fontSize: "40px",
                    fontWeight: "800",
                    color: "var(--text-1)",
                    letterSpacing: "-2px",
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <CountUp to={summary?.total_expense || 0} prefix="₹" />
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--red)",
                    marginTop: "10px",
                    fontWeight: "500",
                  }}
                >
                  {MONTHS[selectedMonth - 1]} {selectedYear}
                </p>
              </div>
              {/* Transactions */}
              <div
                style={{
                  background: "var(--bg-surface)",
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: "var(--shadow-card)",
                  borderTop: "2px solid var(--accent)",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-3)",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: "10px",
                  }}
                >
                  Transactions
                </p>
                <p
                  style={{
                    fontSize: "40px",
                    fontWeight: "800",
                    color: "var(--text-1)",
                    letterSpacing: "-2px",
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <CountUp to={summary?.total_transactions || 0} />
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--accent-dim)",
                    marginTop: "10px",
                    fontWeight: "500",
                  }}
                >
                  this month
                </p>
              </div>
              {/* Top Category */}
              <div
                style={{
                  background: "var(--bg-surface)",
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: "var(--shadow-card)",
                  borderTop: "2px solid var(--green)",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-3)",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: "10px",
                  }}
                >
                  Top Category
                </p>
                <p
                  style={{
                    fontSize: "22px",
                    fontWeight: "800",
                    color: "var(--text-1)",
                    letterSpacing: "-0.5px",
                    lineHeight: 1.2,
                  }}
                >
                  {summary?.top_category || "-"}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--green)",
                    marginTop: "8px",
                    fontWeight: "500",
                  }}
                >
                  {summary?.category_amount
                    ? `₹${Number(summary.category_amount).toLocaleString(
                        "en-IN"
                      )} spent`
                    : "No data"}
                </p>
              </div>
            </div>

            {/* Row 2: Chat (primary) | Insights (secondary) */}
            <div className="bottom-grid" style={{ marginBottom: "16px" }}>
              <ChatBox {...chatProps} fullWidth={false} />
              <SpendingInsights
                summary={summary}
                pieData={pieData}
                heatmapData={heatmapData}
              />
            </div>

            {/* Row 3: Pie Chart | Heatmap */}
            <div className="bottom-grid">
              <div
                style={{
                  background: "var(--bg-surface)",
                  borderRadius: "16px",
                  padding: "20px",
                  boxShadow: "var(--shadow-card)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "var(--text-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    marginBottom: "16px",
                  }}
                >
                  Spending by Category
                </p>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "280px",
                  }}
                >
                  <ExpensePieChart data={pieData} />
                </div>
              </div>
              <SpendingTrend
                data={heatmapData}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
              />
            </div>
          </>
        )}
      </main>
      <BottomTabs active="dashboard" />
      <Toast />
    </div>
  );
}
