"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
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
  LayoutGrid,
  BarChart2,
  Wallet2,
} from "lucide-react";
import {
  getSummary,
  getPieSummary,
  sendChat,
  removeTokens,
  getHeatmap,
  getMonthlyTotals,
  getBudgets,
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

// ── Spending Calendar Heatmap ─────────────────────────────
function SpendingHeatmap({ data, selectedMonth, selectedYear }) {
  const [tooltip, setTooltip] = useState(null);
  const now = new Date();
  const year = selectedYear || now.getFullYear();
  const month = selectedMonth ? selectedMonth - 1 : now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const dataMap = {};
  (data || []).forEach((d) => {
    dataMap[d.date_only] = d.total;
  });
  const maxTotal = Math.max(...(data || []).map((d) => d.total), 1);
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      d
    ).padStart(2, "0")}`;
    cells.push({ day: d, date: dateStr, total: dataMap[dateStr] || 0 });
  }
  const getColor = (total) => {
    if (!total) return "rgba(255,255,255,0.06)";
    const t = Math.min(total / maxTotal, 1);
    if (t < 0.25) return "rgba(251,146,60,0.4)";
    if (t < 0.5) return "rgba(239,100,68,0.6)";
    if (t < 0.75) return "rgba(239,68,68,0.78)";
    return "rgba(239,68,68,0.96)";
  };
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const todayDay = isCurrentMonth ? now.getDate() : -1;
  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Spending Calendar
        </p>
        <span style={{ fontSize: "12px", color: "var(--text-4)" }}>
          {monthLabel}
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "3px",
          marginBottom: "3px",
        }}
      >
        {DAYS.map((d) => (
          <div
            key={d}
            style={{
              fontSize: "10px",
              color: "var(--text-3)",
              textAlign: "center",
              fontWeight: "600",
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "3px",
          flex: 1,
        }}
      >
        {cells.map((cell, i) => (
          <div
            key={i}
            style={{
              aspectRatio: "1",
              borderRadius: "4px",
              background: cell ? getColor(cell.total) : "transparent",
              border:
                cell?.day === todayDay
                  ? "1.5px solid var(--accent)"
                  : "1px solid transparent",
              cursor: cell ? "default" : "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 100ms ease",
            }}
            onMouseEnter={(e) => {
              if (cell) {
                setTooltip(cell);
                e.currentTarget.style.transform = "scale(1.15)";
              }
            }}
            onMouseLeave={(e) => {
              setTooltip(null);
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {cell && (
              <span
                style={{
                  fontSize: "9px",
                  color:
                    cell.total > 0 ? "rgba(255,255,255,0.8)" : "var(--text-4)",
                  fontWeight: "600",
                }}
              >
                {cell.day}
              </span>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: "10px", minHeight: "34px" }}>
        {tooltip ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "7px 12px",
              background: "var(--bg-inset)",
              borderRadius: "8px",
            }}
          >
            <span style={{ fontSize: "12px", color: "var(--text-2)" }}>
              {new Date(tooltip.date + "T00:00:00").toLocaleDateString(
                "en-IN",
                { weekday: "short", day: "numeric", month: "short" }
              )}
            </span>
            <span
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: tooltip.total > 0 ? "var(--red)" : "var(--text-4)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {tooltip.total > 0
                ? `₹${Number(tooltip.total).toLocaleString("en-IN")}`
                : "No spending"}
            </span>
          </div>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}

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

// ── Velocity tooltip ──────────────────────────────────────
function VelocityTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const actual = payload.find((p) => p.dataKey === "actual");
  const projected = payload.find((p) => p.dataKey === "projected");
  const value = actual?.value ?? projected?.value;
  const isProj = !actual?.value && !!projected?.value;
  if (!value) return null;
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "10px 14px",
        boxShadow: "var(--shadow-elevated)",
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
        {isProj ? " · projected" : ""}
      </p>
      <p
        style={{
          fontSize: "15px",
          fontWeight: "700",
          color: isProj ? "var(--accent-dim)" : "var(--red)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        ₹{Number(value).toLocaleString("en-IN")}
      </p>
    </div>
  );
}

// ── Spending Velocity ─────────────────────────────────────
function SpendingVelocity({
  data,
  selectedMonth,
  selectedYear,
  monthlyTotals = [],
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const now = new Date();
  const year = selectedYear || now.getFullYear();
  const month = selectedMonth ? selectedMonth - 1 : now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const today = isCurrentMonth ? now.getDate() : daysInMonth;
  const dataMap = {};
  (data || []).forEach((d) => {
    dataMap[d.date_only] = d.total;
  });

  let cumulative = 0;
  const chartData = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      d
    ).padStart(2, "0")}`;
    cumulative += dataMap[dateStr] || 0;
    chartData.push({
      day: d,
      actual: d <= today ? cumulative : null,
      projected: null,
      daySpend: dataMap[dateStr] || 0,
    });
  }

  const totalSoFar = chartData[today - 1]?.actual || 0;
  const daysRemaining = daysInMonth - today;

  const currentMonthLabel = new Date(year, month, 1).toLocaleDateString(
    "en-IN",
    { month: "short", year: "numeric" }
  );
  const historicalMonths = (monthlyTotals || [])
    .filter((m) => m.month !== currentMonthLabel)
    .slice(-3);
  const historicalAvg =
    historicalMonths.length > 0
      ? historicalMonths.reduce((s, m) => s + m.total, 0) /
        historicalMonths.length
      : 0;
  const completionRatio = today / daysInMonth;
  const expectedSoFar = historicalAvg * completionRatio;
  const deviation = expectedSoFar > 0 ? totalSoFar / expectedSoFar : 1;
  const historicalDailyAvg =
    historicalAvg > 0 ? historicalAvg / daysInMonth : totalSoFar / (today || 1);
  const projectedRemaining = historicalDailyAvg * daysRemaining * deviation;
  const projectedTotal = Math.round(totalSoFar + projectedRemaining);
  const rangeLow = Math.round(projectedTotal * 0.87);
  const rangeHigh = Math.round(projectedTotal * 1.13);

  if (isCurrentMonth && daysRemaining > 0) {
    chartData[today - 1].projected = chartData[today - 1].actual;
    let projCum = totalSoFar;
    const dailyStep =
      daysRemaining > 0 ? projectedRemaining / daysRemaining : 0;
    for (let d = today + 1; d <= daysInMonth; d++) {
      projCum += dailyStep;
      chartData[d - 1].projected = Math.round(projCum);
    }
  }

  const maxDaySpend = Math.max(...(data || []).map((d) => d.total), 0);
  const maxDay = (data || []).find((d) => d.total === maxDaySpend);
  const deviationPct = Math.round(Math.abs(deviation - 1) * 100);
  const deviationUp = deviation > 1;
  const tickColor = isDark ? "#44445A" : "#6C6C70";
  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const fmtY = (v) =>
    v >= 100000
      ? `₹${(v / 100000).toFixed(1)}L`
      : v >= 1000
      ? `₹${(v / 1000).toFixed(0)}k`
      : `₹${v}`;

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
          marginBottom: "20px",
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
            Spending Velocity
          </p>
          <p
            style={{
              fontSize: "28px",
              fontWeight: "800",
              color: "var(--text-1)",
              letterSpacing: "-1.5px",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}
          >
            ₹{totalSoFar.toLocaleString("en-IN")}
          </p>
          {isCurrentMonth && daysRemaining > 0 && (
            <div style={{ marginTop: "8px" }}>
              <p style={{ fontSize: "13px", color: "var(--text-3)" }}>
                Projected{" "}
                <span
                  style={{
                    color: "var(--accent-dim)",
                    fontWeight: "700",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  ₹{rangeLow.toLocaleString("en-IN")} – ₹
                  {rangeHigh.toLocaleString("en-IN")}
                </span>
              </p>
              {historicalMonths.length > 0 && deviationPct > 0 && (
                <p
                  style={{
                    fontSize: "12px",
                    marginTop: "3px",
                    color: deviationUp ? "var(--red)" : "var(--green)",
                    fontWeight: "600",
                  }}
                >
                  {deviationUp ? "↑" : "↓"} {deviationPct}%{" "}
                  {deviationUp ? "above" : "below"} your usual pace
                </p>
              )}
            </div>
          )}
        </div>
        {maxDay && maxDaySpend > 0 && (
          <div
            style={{
              textAlign: "right",
              padding: "10px 14px",
              background: "var(--red-bg)",
              borderRadius: "10px",
              border: "1px solid var(--red-border)",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                color: "var(--text-3)",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "3px",
              }}
            >
              Biggest day
            </p>
            <p
              style={{
                fontSize: "14px",
                fontWeight: "800",
                color: "var(--red)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              ₹{Number(maxDaySpend).toLocaleString("en-IN")}
            </p>
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-4)",
                marginTop: "2px",
              }}
            >
              {new Date(maxDay.date_only + "T00:00:00").toLocaleDateString(
                "en-IN",
                { day: "numeric", month: "short" }
              )}
            </p>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="velGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="#FF4D6D"
                stopOpacity={isDark ? 0.25 : 0.12}
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
            width={45}
          />
          <Tooltip
            content={<VelocityTooltip />}
            cursor={{
              stroke: "var(--border-strong)",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#FF4D6D"
            strokeWidth={2.5}
            fill="url(#velGradient)"
            dot={false}
            activeDot={{
              r: 4,
              fill: "#FF4D6D",
              stroke: isDark ? "#111115" : "#fff",
              strokeWidth: 2,
            }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="projected"
            stroke="var(--accent-dim)"
            strokeWidth={1.5}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 3, fill: "var(--accent-dim)" }}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "12px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "20px",
                height: "2.5px",
                background: "#FF4D6D",
                borderRadius: "2px",
              }}
            />
            <span style={{ fontSize: "11px", color: "var(--text-3)" }}>
              Actual
            </span>
          </div>
          {isCurrentMonth && daysRemaining > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "20px",
                  height: "0",
                  borderTop: "2px dashed var(--accent-dim)",
                }}
              />
              <span style={{ fontSize: "11px", color: "var(--text-3)" }}>
                Projected
              </span>
            </div>
          )}
        </div>
        {historicalMonths.length > 0 && (
          <span style={{ fontSize: "11px", color: "var(--text-4)" }}>
            Based on {historicalMonths.length} month
            {historicalMonths.length > 1 ? "s" : ""} history · avg ₹
            {Math.round(historicalAvg).toLocaleString("en-IN")}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Monthly bar tooltip ───────────────────────────────────
function MonthlyBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "10px 14px",
        boxShadow: "var(--shadow-elevated)",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          color: "var(--text-3)",
          marginBottom: "4px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "15px",
          fontWeight: "700",
          color: "var(--red)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        ₹{Number(value).toLocaleString("en-IN")}
      </p>
    </div>
  );
}

// ── Monthly Overview bar chart (last 12 months) ───────────
function MonthlyOverview({ monthlyTotals = [], selectedMonth, selectedYear }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const now = new Date();
  const currentMonthLabel = new Date(
    selectedYear || now.getFullYear(),
    (selectedMonth || now.getMonth() + 1) - 1,
    1
  ).toLocaleDateString("en-IN", { month: "short", year: "numeric" });

  const data = (monthlyTotals || []).map((m) => ({
    month: m.month,
    total: m.total,
    isCurrent: m.month === currentMonthLabel,
  }));

  if (!data.length) return null;

  const avg = data.reduce((s, d) => s + d.total, 0) / data.length;
  const highest = data.reduce(
    (max, d) => (d.total > max.total ? d : max),
    data[0]
  );
  const tickColor = isDark ? "#44445A" : "#6C6C70";
  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const fmtY = (v) =>
    v >= 100000
      ? `₹${(v / 100000).toFixed(1)}L`
      : v >= 1000
      ? `₹${(v / 1000).toFixed(0)}k`
      : `₹${v}`;

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
          marginBottom: "16px",
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
            Monthly Overview
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-4)" }}>
            Avg ₹{Math.round(avg).toLocaleString("en-IN")}/month · Highest{" "}
            {highest.month}
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridColor}
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: tickColor, fontFamily: "Inter" }}
            tickLine={false}
            axisLine={false}
            interval={data.length > 8 ? 1 : 0}
          />
          <YAxis
            tick={{ fontSize: 10, fill: tickColor, fontFamily: "Inter" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtY}
            width={45}
          />
          <Tooltip
            content={<MonthlyBarTooltip />}
            cursor={{ fill: "var(--bg-inset)" }}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={36}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.isCurrent ? "var(--accent)" : "#FF4D6D"}
                fillOpacity={entry.isCurrent ? 1 : isDark ? 0.55 : 0.4}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "3px",
              background: "var(--accent)",
            }}
          />
          <span style={{ fontSize: "11px", color: "var(--text-3)" }}>
            Selected month
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "3px",
              background: "#FF4D6D",
              opacity: 0.5,
            }}
          />
          <span style={{ fontSize: "11px", color: "var(--text-3)" }}>
            Other months
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Budget widget (top urgent budgets) ────────────────────
function BudgetWidget({ budgets, spendMap }) {
  if (!budgets || budgets.length === 0) {
    return (
      <div
        style={{
          background: "var(--bg-surface)",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: "1px",
            marginBottom: "10px",
          }}
        >
          Budgets
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-3)",
            marginBottom: "14px",
            lineHeight: "1.6",
          }}
        >
          Set spending limits per category to stay on track.
        </p>
        <Link
          href="/budgets"
          style={{
            fontSize: "13px",
            color: "var(--accent-dim)",
            fontWeight: "600",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          Create a budget <ArrowRight size={13} strokeWidth={2} />
        </Link>
      </div>
    );
  }

  // Sort by urgency: over-budget first, then by % used descending
  const withStatus = budgets.map((b) => {
    const spent = spendMap[b.category] || 0;
    const pct = b.budget_amount > 0 ? (spent / b.budget_amount) * 100 : 0;
    return { ...b, spent, pct };
  });
  const sorted = [...withStatus].sort((a, b) => b.pct - a.pct).slice(0, 3);
  const overCount = withStatus.filter((b) => b.pct >= 100).length;

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
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <p
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Budgets
        </p>
        {overCount > 0 && (
          <span
            style={{
              fontSize: "11px",
              color: "var(--red)",
              fontWeight: "700",
              background: "var(--red-bg)",
              padding: "2px 8px",
              borderRadius: "10px",
            }}
          >
            {overCount} over limit
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          marginBottom: "16px",
        }}
      >
        {sorted.map((b) => {
          const color =
            b.pct >= 100
              ? "var(--red)"
              : b.pct >= 80
              ? "var(--yellow)"
              : "var(--green)";
          const pct = Math.min(b.pct, 100);
          return (
            <div key={b.id}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "var(--text-1)",
                  }}
                >
                  {b.category}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--text-3)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  ₹{b.spent.toLocaleString("en-IN")} / ₹
                  {b.budget_amount.toLocaleString("en-IN")}
                </span>
              </div>
              <div
                style={{
                  height: "6px",
                  background: "var(--border-subtle)",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: color,
                    borderRadius: "3px",
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Link
        href="/budgets"
        style={{
          fontSize: "13px",
          color: "var(--accent-dim)",
          fontWeight: "600",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        Manage budgets <ArrowRight size={13} strokeWidth={2} />
      </Link>
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
            href="/budgets"
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
            <Wallet2 size={14} strokeWidth={2} />
            Budgets
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
        minHeight: fullWidth ? "320px" : "300px",
      }}
    >
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
        { href: "/budgets", icon: Wallet2, label: "Budgets" },
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

// ── Page tab switcher (Overview / Analytics) ──────────────
function PageTabs({ active, onChange }) {
  const tabs = [
    { id: "overview", label: "Overview", Icon: LayoutGrid },
    { id: "analytics", label: "Analytics", Icon: BarChart2 },
  ];
  return (
    <div
      style={{
        display: "inline-flex",
        background: "var(--bg-surface)",
        borderRadius: "12px",
        padding: "4px",
        boxShadow: "var(--shadow-card)",
        marginBottom: "16px",
      }}
    >
      {tabs.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              background: isActive ? "var(--accent-gradient)" : "transparent",
              color: isActive ? "#fff" : "var(--text-3)",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 150ms ease",
              boxShadow: isActive ? "var(--shadow-accent)" : "none",
            }}
          >
            <Icon size={14} strokeWidth={2} />
            {label}
          </button>
        );
      })}
    </div>
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
  const [monthlyTotals, setMonthlyTotals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
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
    const [sumRes, pieRes, heatRes, totalsRes, budRes] =
      await Promise.allSettled([
        getSummary(month, year),
        getPieSummary(month, year),
        getHeatmap(month, year),
        getMonthlyTotals(),
        getBudgets(),
      ]);
    if (sumRes.status === "fulfilled" && sumRes.value?.success)
      setSummary(sumRes.value.data);
    if (pieRes.status === "fulfilled" && pieRes.value?.success)
      setPieData(pieRes.value.data);
    if (heatRes.status === "fulfilled" && heatRes.value?.success)
      setHeatmapData(heatRes.value.data);
    if (totalsRes.status === "fulfilled" && totalsRes.value?.success)
      setMonthlyTotals(totalsRes.value.data);
    if (budRes.status === "fulfilled") setBudgets(budRes.value?.results || []);
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

  const isCurrentMonthSelected =
    selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();

  useEffect(() => {
    if (summary?.total_transactions > 0)
      localStorage.setItem("has_transactions", "true");
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
        {/* Mobile month switcher */}
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
            {/* ── HERO: Total Spent dominant, others inline ── */}
            <div
              style={{
                background: "var(--bg-surface)",
                borderRadius: "20px",
                padding: "28px 24px",
                boxShadow: "var(--shadow-card)",
                marginBottom: "16px",
                borderTop: "3px solid var(--red)",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--text-3)",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                  marginBottom: "10px",
                }}
              >
                Total Spent · {MONTHS[selectedMonth - 1]} {selectedYear}
              </p>
              <p
                style={{
                  fontSize: "48px",
                  fontWeight: "800",
                  color: "var(--text-1)",
                  letterSpacing: "-2.5px",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                  marginBottom: "18px",
                }}
              >
                <CountUp to={summary?.total_expense || 0} prefix="₹" />
              </p>
              <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                <div>
                  <p
                    style={{
                      fontSize: "10px",
                      color: "var(--text-4)",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.6px",
                      marginBottom: "3px",
                    }}
                  >
                    Transactions
                  </p>
                  <p
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "var(--accent-dim)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    <CountUp to={summary?.total_transactions || 0} />
                  </p>
                </div>
                <div style={{ width: "1px", background: "var(--border)" }} />
                <div>
                  <p
                    style={{
                      fontSize: "10px",
                      color: "var(--text-4)",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.6px",
                      marginBottom: "3px",
                    }}
                  >
                    Top Category
                  </p>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: "700",
                      color: "var(--green)",
                    }}
                  >
                    {summary?.top_category || "-"}
                  </p>
                </div>
                {summary?.category_amount && (
                  <>
                    <div
                      style={{ width: "1px", background: "var(--border)" }}
                    />
                    <div>
                      <p
                        style={{
                          fontSize: "10px",
                          color: "var(--text-4)",
                          fontWeight: "600",
                          textTransform: "uppercase",
                          letterSpacing: "0.6px",
                          marginBottom: "3px",
                        }}
                      >
                        In that category
                      </p>
                      <p
                        style={{
                          fontSize: "15px",
                          fontWeight: "700",
                          color: "var(--text-2)",
                        }}
                      >
                        ₹
                        {Number(summary.category_amount).toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Chat — full width, primary action ── */}
            <div style={{ marginBottom: "20px" }}>
              <ChatBox {...chatProps} fullWidth={true} />
            </div>

            {/* ── Tab switcher ── */}
            <PageTabs active={activeTab} onChange={setActiveTab} />

            {/* ── Overview tab ── */}
            {activeTab === "overview" && (
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
                      minHeight: "260px",
                    }}
                  >
                    <ExpensePieChart data={pieData} />
                  </div>
                </div>
                <BudgetWidget
                  budgets={budgets}
                  spendMap={Object.fromEntries(
                    (pieData || []).map((c) => [c.category_name, c.total])
                  )}
                />
              </div>
            )}

            {/* ── Analytics tab ── */}
            {activeTab === "analytics" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div className="bottom-grid">
                  <SpendingHeatmap
                    data={heatmapData}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                  />
                  <SpendingTrend
                    data={heatmapData}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                  />
                </div>
                <SpendingVelocity
                  data={heatmapData}
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  monthlyTotals={monthlyTotals}
                />
                <MonthlyOverview
                  monthlyTotals={monthlyTotals}
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                />
              </div>
            )}
          </>
        )}
      </main>
      <BottomTabs active="dashboard" />
      <Toast />
    </div>
  );
}
