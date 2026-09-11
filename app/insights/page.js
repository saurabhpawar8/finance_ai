"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  ScatterChart,
  Scatter,
  Cell,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  LogOut,
  Download,
  Sparkles,
  Trophy,
  TrendingUp,
  TrendingDown,
  Activity,
  Lightbulb,
  ArrowLeft,
  Sun,
  Moon,
  AlertCircle,
  Wallet2,
  GitCompare,
  Minus,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  X,
  HelpCircle,
} from "lucide-react";
import {
  getReport,
  fetchMonthlyReport,
  getSummary,
  getPieSummary,
  getHeatmap,
  getMonthlyTotals,
  getTransactions,
  removeTokens,
} from "@/lib/api";
import Toast, { showToast } from "@/components/Toast";
import { useTheme } from "@/lib/ThemeContext";

const MONTHS = [
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
];
const RANGES = [
  { label: "This Week", value: "this_week" },
  { label: "Last Week", value: "last_week" },
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "This Year", value: "this_year" },
];
const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 2, currentYear - 1, currentYear];

// ── Parse and display plain text AI report ────────────────
// ── Parse a single category comparison line ───────────────
// e.g. "Bills & Utilities ₹3,600 ↓ 74.17% No data ⚠️"
function parseCategoryLine(line) {
  let t = line.trim();
  const hasWarning = t.includes("⚠️");
  t = t.replace(/⚠️/g, "").trim();

  const match = t.match(
    /^(.+?)\s+₹([\d,]+(?:\.\d+)?)\s*(?:(↓|↑)\s*([\d.]+%))?\s*(.*)$/
  );
  if (!match) return null;

  const [, name, amount, dir, pct, rest] = match;
  return {
    name: name.trim(),
    amount: amount.trim(),
    direction: dir || null,
    pct: pct || null,
    note: rest.trim(),
    warning: hasWarning,
  };
}

// ── Parse an overview stat line ────────────────────────────
// e.g. "Total Spend: ₹11,191"  or  "vs Last Month: ↓ 72.39% (July: ₹40,500)"
function parseOverviewLine(line) {
  const t = line.trim();
  const idx = t.indexOf(":");
  if (idx === -1) return null;
  const label = t.slice(0, idx).trim();
  const rest = t.slice(idx + 1).trim();
  const dirMatch = rest.match(/^(↓|↑)\s*([\d.]+%)\s*(.*)$/);
  if (dirMatch) {
    return {
      label,
      direction: dirMatch[1],
      pct: dirMatch[2],
      note: dirMatch[3].trim(),
      value: null,
    };
  }
  return { label, value: rest, direction: null, pct: null, note: "" };
}

function ReportDisplay({ text }) {
  const sections = useMemo(() => {
    const lines = text.split("\n");
    const result = [];
    let currentTitle = null;
    let currentLines = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextTrimmed = (lines[i + 1] || "").trim();
      if (nextTrimmed.match(/^[-=]{3,}$/)) {
        if (currentTitle !== null)
          result.push({ title: currentTitle, lines: [...currentLines] });
        currentTitle = line.trim();
        currentLines = [];
        i++;
      } else {
        currentLines.push(line);
      }
    }
    if (currentTitle !== null)
      result.push({ title: currentTitle, lines: currentLines });
    return result;
  }, [text]);

  const SECTION_META = {
    OVERVIEW: { icon: TrendingUp, color: "var(--cyan)" },
    "CATEGORY BREAKDOWN": { icon: BarChart3, color: "var(--purple)" },
    ADVICE: { icon: Lightbulb, color: "var(--yellow)" },
    "POSITIVE HIGHLIGHTS": { icon: Trophy, color: "var(--green)" },
    "WATCH OUT NEXT MONTH": { icon: AlertCircle, color: "var(--red)" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {sections.map(({ title, lines }, i) => {
        const content = lines.filter((l) => l.trim());

        // ── Report header (first section) ──
        if (i === 0) {
          return (
            <div
              key={i}
              style={{
                padding: "20px 24px",
                background: "var(--bg-surface)",
                borderRadius: "16px",
                boxShadow: "var(--shadow-card)",
                borderTop: "2px solid var(--accent)",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--text-3)",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "6px",
                }}
              >
                AI Report
              </p>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: "800",
                  color: "var(--text-1)",
                  letterSpacing: "-0.4px",
                }}
              >
                {title}
              </p>
              {content.map((l, j) => (
                <p
                  key={j}
                  style={{
                    fontSize: "13px",
                    color: "var(--text-3)",
                    marginTop: "4px",
                  }}
                >
                  {l.trim()}
                </p>
              ))}
            </div>
          );
        }

        if (!content.length) return null;
        const meta = SECTION_META[title] || {
          icon: Activity,
          color: "var(--accent-dim)",
        };
        const Icon = meta.icon;
        const titleUpper = title.toUpperCase();

        return (
          <div
            key={i}
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
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  background: "var(--bg-elevated)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={15} color={meta.color} strokeWidth={2} />
              </div>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: meta.color,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {title}
              </p>
            </div>

            {/* ── OVERVIEW: structured stat cards ── */}
            {titleUpper === "OVERVIEW" &&
              (() => {
                const prose = content.filter((l) => !l.includes(":"));
                const statLines = content
                  .filter((l) => l.includes(":"))
                  .map(parseOverviewLine)
                  .filter(Boolean);
                return (
                  <>
                    {prose.map((l, j) => (
                      <p
                        key={j}
                        style={{
                          fontSize: "13px",
                          color: "var(--text-3)",
                          lineHeight: "1.65",
                          marginBottom: "14px",
                        }}
                      >
                        {l.trim()}
                      </p>
                    ))}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${statLines.length}, 1fr)`,
                        gap: "10px",
                      }}
                    >
                      {statLines.map((s, j) => {
                        const dirColor =
                          s.direction === "↓"
                            ? "var(--green)"
                            : s.direction === "↑"
                            ? "var(--red)"
                            : "var(--text-1)";
                        return (
                          <div
                            key={j}
                            style={{
                              padding: "14px",
                              background: "var(--bg-inset)",
                              borderRadius: "12px",
                            }}
                          >
                            <p
                              style={{
                                fontSize: "10px",
                                fontWeight: "700",
                                color: "var(--text-3)",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                marginBottom: "8px",
                              }}
                            >
                              {s.label}
                            </p>
                            {s.value ? (
                              <p
                                style={{
                                  fontSize: "18px",
                                  fontWeight: "800",
                                  color: "var(--text-1)",
                                  fontVariantNumeric: "tabular-nums",
                                }}
                              >
                                {s.value}
                              </p>
                            ) : (
                              <>
                                <p
                                  style={{
                                    fontSize: "18px",
                                    fontWeight: "800",
                                    color: dirColor,
                                    fontVariantNumeric: "tabular-nums",
                                  }}
                                >
                                  {s.direction} {s.pct}
                                </p>
                                {s.note && (
                                  <p
                                    style={{
                                      fontSize: "11px",
                                      color: "var(--text-4)",
                                      marginTop: "3px",
                                    }}
                                  >
                                    {s.note}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}

            {/* ── CATEGORY BREAKDOWN: structured rows ── */}
            {titleUpper === "CATEGORY BREAKDOWN" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1px",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                {content.map((line, j) => {
                  const cat = parseCategoryLine(line);
                  if (!cat) return null;
                  const dirColor =
                    cat.direction === "↓"
                      ? "var(--green)"
                      : cat.direction === "↑"
                      ? "var(--red)"
                      : "var(--text-3)";
                  return (
                    <div
                      key={j}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 6px",
                        borderBottom:
                          j < content.length - 1
                            ? "1px solid var(--border-subtle)"
                            : "none",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "var(--text-1)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {cat.name}
                        </span>
                        {cat.warning && (
                          <AlertCircle
                            size={12}
                            color="var(--yellow)"
                            strokeWidth={2.5}
                            style={{ flexShrink: 0 }}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: "700",
                            color: "var(--text-1)",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          ₹{cat.amount}
                        </span>
                        {cat.direction && (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "700",
                              color: dirColor,
                              background:
                                cat.direction === "↓"
                                  ? "var(--green-bg)"
                                  : "var(--red-bg)",
                              padding: "2px 7px",
                              borderRadius: "10px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {cat.direction} {cat.pct}
                          </span>
                        )}
                        {!cat.direction && cat.note && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "var(--text-4)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {cat.note}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Everything else: bullet cards (Advice, Highlights, Watch Out) ── */}
            {titleUpper !== "OVERVIEW" &&
              titleUpper !== "CATEGORY BREAKDOWN" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {content.map((line, j) => {
                    const t = line.trim();
                    if (!t || t.match(/^-{3,}$/)) return null;
                    const isPositive = t.startsWith("✅");
                    const isWarning = t.startsWith("⚠️");
                    const isAdvice =
                      t.startsWith("🟡") ||
                      t.startsWith("🔴") ||
                      t.startsWith("🟢");
                    const isBullet = isPositive || isWarning || isAdvice;
                    const borderColor = isPositive
                      ? "var(--green)"
                      : isWarning
                      ? "var(--red)"
                      : "var(--yellow)";
                    if (isBullet) {
                      return (
                        <div
                          key={j}
                          style={{
                            padding: "12px 14px",
                            background: "var(--bg-inset)",
                            borderRadius: "10px",
                            borderLeft: `3px solid ${borderColor}`,
                          }}
                        >
                          <p
                            style={{
                              fontSize: "13px",
                              color: "var(--text-2)",
                              lineHeight: "1.7",
                              margin: 0,
                            }}
                          >
                            {t}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <p
                        key={j}
                        style={{
                          fontSize: "13px",
                          color: "var(--text-3)",
                          lineHeight: "1.65",
                          margin: 0,
                        }}
                      >
                        {t}
                      </p>
                    );
                  })}
                </div>
              )}
          </div>
        );
      })}
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {[140, 200, 120, 100, 100].map((h, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: h, borderRadius: "16px" }}
        />
      ))}
    </div>
  );
}

const selectStyle = {
  padding: "12px 36px 12px 14px",
  width: "100%",
  background: "var(--bg-inset)",
  boxShadow: "var(--shadow-card)",
  borderRadius: "10px",
  color: "var(--text-1)",
  fontSize: "14px",
  outline: "none",
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
};

// ── Day Detail modal ───────────────────────────────────────
function DayDetailModal({ date, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getTransactions({ page_size: 100 });
        const dayTx = (res?.results || []).filter((tx) => tx.date === date);
        if (!cancelled) setTransactions(dayTx);
      } catch {
        if (!cancelled) setError("Could not connect. Please try again.");
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const dayTotal = transactions.reduce(
    (s, tx) => s + Number(tx.amount || 0),
    0
  );

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "var(--bg-surface)",
          borderRadius: "20px",
          padding: "28px",
          width: "100%",
          maxWidth: "440px",
          boxShadow: "var(--shadow-elevated)",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "var(--text-1)",
            }}
          >
            {dateLabel}
          </p>
          <button
            onClick={onClose}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              background: "var(--bg-elevated)",
              border: "none",
              color: "var(--text-3)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
        {!loading && transactions.length > 0 && (
          <div
            style={{
              marginBottom: "16px",
              padding: "14px 16px",
              background: "var(--bg-inset)",
              borderRadius: "12px",
            }}
          >
            <p
              style={{
                fontSize: "24px",
                fontWeight: "800",
                color: "var(--red)",
                letterSpacing: "-0.5px",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              ₹{dayTotal.toLocaleString("en-IN")}
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-3)",
                marginTop: "2px",
              }}
            >
              {transactions.length} transaction
              {transactions.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
        {loading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 20px",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", gap: "5px" }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "var(--accent-dim)",
                    animation: `bounce 1.2s infinite ${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-3)" }}>
              Loading transactions…
            </p>
          </div>
        )}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              background: "var(--red-bg)",
              border: "1px solid var(--red-border)",
              color: "var(--red-dim)",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}
        {!loading && !error && transactions.length === 0 && (
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-3)",
              textAlign: "center",
              padding: "20px 0",
            }}
          >
            No transactions on this day.
          </p>
        )}
        {!loading && transactions.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1px",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            {transactions.map((tx, i) => (
              <div
                key={tx.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 4px",
                  borderBottom:
                    i < transactions.length - 1
                      ? "1px solid var(--border-subtle)"
                      : "none",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "var(--text-1)",
                    }}
                  >
                    {tx.name}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text-3)" }}>
                    {tx.category}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "var(--red)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  ₹{Number(tx.amount).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Spending Calendar Heatmap ─────────────────────────────
// ── Reusable "what does this mean" expandable ─────────────
function ChartExplain({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: "10px" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          background: "transparent",
          border: "none",
          color: "var(--text-4)",
          fontSize: "11px",
          fontWeight: "600",
          cursor: "pointer",
          padding: "0",
        }}
      >
        <HelpCircle size={12} strokeWidth={2} />
        {open ? "Hide explanation" : "What does this mean?"}
      </button>
      {open && (
        <div
          style={{
            marginTop: "8px",
            padding: "12px 14px",
            background: "var(--bg-inset)",
            borderRadius: "10px",
          }}
        >
          <p
            style={{
              fontSize: "12.5px",
              color: "var(--text-3)",
              lineHeight: "1.6",
              margin: 0,
            }}
          >
            {children}
          </p>
        </div>
      )}
    </div>
  );
}

function SpendingHeatmap({ data, month, year, onDayClick }) {
  const [tooltip, setTooltip] = useState(null);
  const now = new Date();
  const monthIdx = month - 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, monthIdx, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const dataMap = {};
  (data || []).forEach((d) => {
    dataMap[d.date_only] = d.total;
  });
  const maxTotal = Math.max(...(data || []).map((d) => d.total), 1);
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
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
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;
  const todayDay = isCurrentMonth ? now.getDate() : -1;

  const validCells = cells.filter((c) => c && c.total > 0);
  const biggestDay =
    validCells.length > 0
      ? validCells.reduce(
          (max, c) => (c.total > max.total ? c : max),
          validCells[0]
        )
      : null;
  const takeaway = biggestDay
    ? `Your biggest spending day was ${new Date(
        biggestDay.date + "T00:00:00"
      ).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })} (₹${Number(biggestDay.total).toLocaleString("en-IN")}).`
    : "No spending logged this month yet.";

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
        Spending Calendar
      </p>
      <p
        style={{
          fontSize: "13px",
          color: "var(--text-2)",
          marginBottom: "14px",
        }}
      >
        {takeaway}
      </p>
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
            onClick={() => cell?.total > 0 && onDayClick?.(cell.date)}
            style={{
              aspectRatio: "1",
              borderRadius: "4px",
              background: cell ? getColor(cell.total) : "transparent",
              border:
                cell?.day === todayDay
                  ? "1.5px solid var(--accent)"
                  : "1px solid transparent",
              cursor: cell?.total > 0 ? "pointer" : "default",
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
      {onDayClick && (
        <p
          style={{ fontSize: "11px", color: "var(--text-4)", marginTop: "4px" }}
        >
          Tap a day to see transactions
        </p>
      )}
    </div>
  );
}

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

function SpendingTrend({ data, month, year, onDayClick }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const now = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today =
    year === now.getFullYear() && month === now.getMonth() + 1
      ? now.getDate()
      : daysInMonth;
  const dataMap = {};
  (data || []).forEach((d) => {
    dataMap[d.date_only] = d.total;
  });
  const chartData = [];
  for (let d = 1; d <= today; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
      d
    ).padStart(2, "0")}`;
    chartData.push({ day: d, amount: dataMap[dateStr] || 0 });
  }
  const totalSpend = (data || []).reduce((s, d) => s + d.total, 0);
  const dailyAvg = today > 0 ? totalSpend / today : 0;
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
          marginBottom: "6px",
        }}
      >
        ₹{totalSpend.toLocaleString("en-IN")}
      </p>
      <p
        style={{
          fontSize: "13px",
          color: "var(--text-2)",
          marginBottom: "8px",
        }}
      >
        {dailyAvg > 0
          ? `You're spending ₹${Math.round(dailyAvg).toLocaleString(
              "en-IN"
            )} per day on average.`
          : "No spending logged yet this month."}
      </p>
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
              r: 5,
              fill: "#FF4D6D",
              stroke: isDark ? "#111115" : "#FFFFFF",
              strokeWidth: 2,
              style: { cursor: onDayClick ? "pointer" : "default" },
              onClick: (e, payload) => {
                if (onDayClick && payload?.payload?.day) {
                  const dateStr = `${year}-${String(month).padStart(
                    2,
                    "0"
                  )}-${String(payload.payload.day).padStart(2, "0")}`;
                  onDayClick(dateStr);
                }
              },
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
      {onDayClick && (
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-4)",
            marginTop: "8px",
            textAlign: "center",
          }}
        >
          Tap any point to see that day's transactions
        </p>
      )}
    </div>
  );
}

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

function SpendingVelocity({
  data,
  month,
  year,
  monthlyTotals = [],
  onDayClick,
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const now = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;
  const today = isCurrentMonth ? now.getDate() : daysInMonth;
  const dataMap = {};
  (data || []).forEach((d) => {
    dataMap[d.date_only] = d.total;
  });
  let cumulative = 0;
  const chartData = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
      d
    ).padStart(2, "0")}`;
    cumulative += dataMap[dateStr] || 0;
    chartData.push({
      day: d,
      actual: d <= today ? cumulative : null,
      projected: null,
    });
  }
  const totalSoFar = chartData[today - 1]?.actual || 0;
  const daysRemaining = daysInMonth - today;
  const currentMonthLabel = new Date(year, month - 1, 1).toLocaleDateString(
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
          marginBottom: "8px",
        }}
      >
        ₹{totalSoFar.toLocaleString("en-IN")}
      </p>
      {isCurrentMonth && daysRemaining > 0 && (
        <div style={{ marginBottom: "16px" }}>
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
              r: 5,
              fill: "#FF4D6D",
              stroke: isDark ? "#111115" : "#fff",
              strokeWidth: 2,
              style: { cursor: onDayClick ? "pointer" : "default" },
              onClick: (e, payload) => {
                if (onDayClick && payload?.payload?.day) {
                  const dateStr = `${year}-${String(month).padStart(
                    2,
                    "0"
                  )}-${String(payload.payload.day).padStart(2, "0")}`;
                  onDayClick(dateStr);
                }
              },
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
      {onDayClick && (
        <p
          style={{ fontSize: "11px", color: "var(--text-4)", marginTop: "8px" }}
        >
          Tap the actual line to see that day's transactions
        </p>
      )}
      {historicalMonths.length > 0 && (
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-4)",
            marginTop: "10px",
          }}
        >
          Based on {historicalMonths.length} month
          {historicalMonths.length > 1 ? "s" : ""} history · avg ₹
          {Math.round(historicalAvg).toLocaleString("en-IN")}
        </p>
      )}
      <ChartExplain>
        This projects where you'll likely end up by month-end. It looks at your
        recent months' average, compares your current pace to that average, and
        scales the rest of the month accordingly. The range (not a single
        number) reflects real uncertainty, one-off big purchases or a light
        history can shift the actual outcome either way.
      </ChartExplain>
    </div>
  );
}

// ── Overview tab content (moved from Dashboard) ───────────
// ── Category Consistency Scatter ──────────────────────────
// X = average monthly spend per category, Y = volatility (coefficient of variation)
const SCATTER_COLORS = [
  "#6366F1",
  "#00D4AA",
  "#FF4D6D",
  "#F59E0B",
  "#06B6D4",
  "#A78BFA",
  "#F97316",
  "#EC4899",
  "#34D399",
  "#818CF8",
];

function ConsistencyTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "12px 14px",
        boxShadow: "var(--shadow-elevated)",
      }}
    >
      <p
        style={{
          fontSize: "13px",
          fontWeight: "700",
          color: "var(--text-1)",
          marginBottom: "6px",
        }}
      >
        {d.category}
      </p>
      <p
        style={{
          fontSize: "12px",
          color: "var(--text-2)",
          marginBottom: "2px",
        }}
      >
        Avg:{" "}
        <b style={{ color: "var(--text-1)" }}>
          ₹{Math.round(d.avg).toLocaleString("en-IN")}
        </b>
        /month
      </p>
      <p style={{ fontSize: "12px", color: "var(--text-2)" }}>
        Volatility:{" "}
        <b style={{ color: "var(--text-1)" }}>{d.volatility.toFixed(0)}%</b>
      </p>
      <p style={{ fontSize: "11px", color: "var(--text-4)", marginTop: "6px" }}>
        {d.quadrantLabel}
      </p>
    </div>
  );
}

function CategoryConsistencyChart() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthsUsed, setMonthsUsed] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const now = new Date();
      // Build list of last 6 months (including current)
      const monthList = [];
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthList.push({ month: d.getMonth() + 1, year: d.getFullYear() });
      }
      const results = await Promise.allSettled(
        monthList.map((m) => getPieSummary(m.month, m.year))
      );
      if (cancelled) return;

      // category -> array of monthly totals (0 if not present that month)
      const catTotals = {};
      let validMonths = 0;
      results.forEach((r) => {
        if (r.status !== "fulfilled" || !r.value?.success) return;
        validMonths++;
        const monthMap = {};
        (r.value.data || []).forEach((c) => {
          monthMap[c.category_name] = c.total;
        });
        // Merge into catTotals — track all categories seen across all months
        Object.keys(monthMap).forEach((cat) => {
          if (!catTotals[cat]) catTotals[cat] = [];
        });
      });
      // Second pass: for each known category, build a value per valid month (0 if absent)
      const allCats = Object.keys(catTotals);
      const monthMaps = results
        .filter((r) => r.status === "fulfilled" && r.value?.success)
        .map((r) => {
          const m = {};
          (r.value.data || []).forEach((c) => {
            m[c.category_name] = c.total;
          });
          return m;
        });

      allCats.forEach((cat) => {
        catTotals[cat] = monthMaps.map((m) => m[cat] || 0);
      });

      // Compute avg + coefficient of variation (volatility %) per category
      const computed = allCats
        .map((cat) => {
          const vals = catTotals[cat];
          const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
          if (avg === 0) return null;
          const variance =
            vals.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / vals.length;
          const stdDev = Math.sqrt(variance);
          const volatility = (stdDev / avg) * 100; // coefficient of variation as %
          return { category: cat, avg, volatility };
        })
        .filter(Boolean);

      if (!cancelled) {
        setPoints(computed);
        setMonthsUsed(validMonths);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div
        className="skeleton"
        style={{ height: "340px", borderRadius: "16px" }}
      />
    );
  }

  if (points.length < 2) {
    return (
      <div
        style={{
          background: "var(--bg-surface)",
          borderRadius: "16px",
          padding: "40px 20px",
          boxShadow: "var(--shadow-card)",
          textAlign: "center",
        }}
      >
        <Activity
          size={36}
          color="var(--text-4)"
          strokeWidth={1.5}
          style={{ margin: "0 auto 14px" }}
        />
        <p
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "var(--text-2)",
            marginBottom: "6px",
          }}
        >
          Not enough data yet
        </p>
        <p style={{ fontSize: "12px", color: "var(--text-3)" }}>
          Needs at least 2 categories with spending history to compare.
        </p>
      </div>
    );
  }

  const medianX = [...points].sort((a, b) => a.avg - b.avg)[
    Math.floor(points.length / 2)
  ].avg;
  const medianY = [...points].sort((a, b) => a.volatility - b.volatility)[
    Math.floor(points.length / 2)
  ].volatility;
  const maxX = Math.max(...points.map((p) => p.avg)) * 1.15;
  const maxY = Math.max(...points.map((p) => p.volatility), 20) * 1.15;

  const withQuadrant = points.map((p) => ({
    ...p,
    quadrantLabel:
      p.avg >= medianX && p.volatility < medianY
        ? "Predictable & significant — like a fixed bill"
        : p.avg >= medianX && p.volatility >= medianY
        ? "High spend, unpredictable — worth a budget"
        : p.avg < medianX && p.volatility < medianY
        ? "Small and steady"
        : "Occasional, unpredictable spend",
  }));

  const tickColor = isDark ? "#44445A" : "#6C6C70";
  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const fmtX = (v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`);
  const mostVolatile = [...points].sort(
    (a, b) => b.volatility - a.volatility
  )[0];

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
          marginBottom: "6px",
        }}
      >
        Category Consistency
      </p>
      <p
        style={{
          fontSize: "13px",
          color: "var(--text-2)",
          marginBottom: "16px",
        }}
      >
        {mostVolatile.category} is your least predictable category, it swings
        the most month to month.
      </p>

      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            type="number"
            dataKey="avg"
            name="Avg spend"
            tick={{ fontSize: 10, fill: tickColor, fontFamily: "Inter" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmtX}
            domain={[0, maxX]}
            label={{
              value: "Avg monthly spend →",
              position: "insideBottom",
              offset: -6,
              fontSize: 10,
              fill: tickColor,
            }}
          />
          <YAxis
            type="number"
            dataKey="volatility"
            name="Volatility"
            tick={{ fontSize: 10, fill: tickColor, fontFamily: "Inter" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
            domain={[0, maxY]}
            label={{
              value: "Volatility →",
              angle: -90,
              position: "insideLeft",
              fontSize: 10,
              fill: tickColor,
            }}
          />
          <ReferenceLine
            x={medianX}
            stroke="var(--border-strong)"
            strokeDasharray="4 4"
          />
          <ReferenceLine
            y={medianY}
            stroke="var(--border-strong)"
            strokeDasharray="4 4"
          />
          <Tooltip
            content={<ConsistencyTooltip />}
            cursor={{ strokeDasharray: "3 3" }}
          />
          <Scatter data={withQuadrant}>
            {withQuadrant.map((entry, i) => (
              <Cell
                key={i}
                fill={SCATTER_COLORS[i % SCATTER_COLORS.length]}
                fillOpacity={0.85}
                r={7}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          marginTop: "12px",
        }}
      >
        <div
          style={{
            padding: "8px 10px",
            background: "var(--bg-inset)",
            borderRadius: "8px",
          }}
        >
          <p
            style={{
              fontSize: "10px",
              color: "var(--text-3)",
              fontWeight: "600",
            }}
          >
            ↗ High + steady
          </p>
          <p style={{ fontSize: "10px", color: "var(--text-4)" }}>
            Your fixed bills
          </p>
        </div>
        <div
          style={{
            padding: "8px 10px",
            background: "var(--red-bg)",
            borderRadius: "8px",
          }}
        >
          <p
            style={{ fontSize: "10px", color: "var(--red)", fontWeight: "600" }}
          >
            ↗ High + volatile
          </p>
          <p style={{ fontSize: "10px", color: "var(--text-4)" }}>
            Worth budgeting
          </p>
        </div>
        <div
          style={{
            padding: "8px 10px",
            background: "var(--bg-inset)",
            borderRadius: "8px",
          }}
        >
          <p
            style={{
              fontSize: "10px",
              color: "var(--text-3)",
              fontWeight: "600",
            }}
          >
            ↙ Low + steady
          </p>
          <p style={{ fontSize: "10px", color: "var(--text-4)" }}>
            Small, predictable
          </p>
        </div>
        <div
          style={{
            padding: "8px 10px",
            background: "var(--bg-inset)",
            borderRadius: "8px",
          }}
        >
          <p
            style={{
              fontSize: "10px",
              color: "var(--text-3)",
              fontWeight: "600",
            }}
          >
            ↙ Low + volatile
          </p>
          <p style={{ fontSize: "10px", color: "var(--text-4)" }}>
            Occasional spend
          </p>
        </div>
      </div>
      <ChartExplain>
        Each dot is a category. Further right means you spend more on it each
        month, on average. Higher up means the amount changes a lot from month
        to month. Categories in the top-right (red) tend to spike unpredictably
      , those are the best candidates for a budget, since a fixed limit gives
        you a warning before they run away.
      </ChartExplain>
    </div>
  );
}

function OverviewTab({ month, year, onMonthChange, onYearChange }) {
  const [heatmapData, setHeatmapData] = useState([]);
  const [monthlyTotals, setMonthlyTotals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dayDetail, setDayDetail] = useState(null);
  const now = new Date();
  const isCurrent = month === now.getMonth() + 1 && year === now.getFullYear();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const [heatRes, totalsRes] = await Promise.allSettled([
        getHeatmap(month, year),
        getMonthlyTotals(),
      ]);
      if (cancelled) return;
      if (heatRes.status === "fulfilled" && heatRes.value?.success)
        setHeatmapData(heatRes.value.data);
      if (totalsRes.status === "fulfilled" && totalsRes.value?.success)
        setMonthlyTotals(totalsRes.value.data);
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [month, year]);

  const goBack = () => {
    if (month === 1) {
      onMonthChange(12);
      onYearChange(year - 1);
    } else onMonthChange(month - 1);
  };
  const goForward = () => {
    if (isCurrent) return;
    if (month === 12) {
      onMonthChange(1);
      onYearChange(year + 1);
    } else onMonthChange(month + 1);
  };
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
              padding: "9px 13px",
              background: "transparent",
              border: "none",
              borderRight: "1px solid var(--border)",
              color: "var(--text-3)",
              cursor: "pointer",
              display: "flex",
            }}
          >
            <ChevronLeft size={14} strokeWidth={2.5} />
          </button>
          <span
            style={{
              padding: "9px 16px",
              fontSize: "13px",
              fontWeight: "700",
              color: "var(--text-1)",
            }}
          >
            {monthLabel}
          </span>
          <button
            onClick={goForward}
            disabled={isCurrent}
            style={{
              padding: "9px 13px",
              background: "transparent",
              border: "none",
              borderLeft: "1px solid var(--border)",
              color: isCurrent ? "var(--text-4)" : "var(--text-3)",
              cursor: isCurrent ? "not-allowed" : "pointer",
              display: "flex",
            }}
          >
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {loading ? (
        <ReportSkeleton />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="bottom-grid">
            <SpendingHeatmap
              data={heatmapData}
              month={month}
              year={year}
              onDayClick={setDayDetail}
            />
            <SpendingTrend
              data={heatmapData}
              month={month}
              year={year}
              onDayClick={setDayDetail}
            />
          </div>
          <SpendingVelocity
            data={heatmapData}
            month={month}
            year={year}
            monthlyTotals={monthlyTotals}
            onDayClick={setDayDetail}
          />
          <CategoryConsistencyChart />
        </div>
      )}

      {dayDetail && (
        <DayDetailModal date={dayDetail} onClose={() => setDayDetail(null)} />
      )}
    </>
  );
}

// ── Tab switcher (Overview / Download / AI Analysis / Compare) ───────
function ReportTabs({ active, onChange }) {
  const tabs = [
    { id: "overview", label: "Overview", Icon: LayoutGrid },
    { id: "download", label: "Download", Icon: Download },
    { id: "ai", label: "AI Analysis", Icon: Sparkles },
    { id: "compare", label: "Compare", Icon: GitCompare },
  ];
  return (
    <div
      className="insights-tabs"
      style={{
        display: "flex",
        background: "var(--bg-surface)",
        borderRadius: "12px",
        padding: "4px",
        boxShadow: "var(--shadow-card)",
        marginBottom: "20px",
        flexWrap: "wrap",
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
              whiteSpace: "nowrap",
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

// ── Compare tooltip (grouped bar chart) ───────────────────
function CompareBarTooltip({ active, payload, label, labelA, labelB }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "12px 14px",
        boxShadow: "var(--shadow-elevated)",
      }}
    >
      <p
        style={{
          fontSize: "12px",
          color: "var(--text-2)",
          fontWeight: "700",
          marginBottom: "6px",
        }}
      >
        {label}
      </p>
      {payload.map((p, i) => (
        <p
          key={i}
          style={{
            fontSize: "13px",
            color: p.dataKey === "a" ? "var(--accent-dim)" : "#FF4D6D",
            fontWeight: "600",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {p.dataKey === "a" ? labelA : labelB}: ₹
          {Number(p.value).toLocaleString("en-IN")}
        </p>
      ))}
    </div>
  );
}

// ── Compare tooltip (daily overlay line chart) ────────────
function CompareLineTooltip({ active, payload, label, labelA, labelB }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "12px 14px",
        boxShadow: "var(--shadow-elevated)",
      }}
    >
      <p
        style={{
          fontSize: "12px",
          color: "var(--text-2)",
          fontWeight: "700",
          marginBottom: "6px",
        }}
      >
        Day {label}
      </p>
      {payload.map((p, i) => (
        <p
          key={i}
          style={{
            fontSize: "13px",
            color: p.dataKey === "a" ? "var(--accent-dim)" : "#FF4D6D",
            fontWeight: "600",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {p.dataKey === "a" ? labelA : labelB}:{" "}
          {p.value != null
            ? `₹${Number(p.value).toLocaleString("en-IN")}`
            : "-"}
        </p>
      ))}
    </div>
  );
}

// ── Compare tab content ───────────────────────────────────
function CompareView() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const now = new Date();

  const [monthA, setMonthA] = useState(
    now.getMonth() + 1 === 1 ? 12 : now.getMonth()
  );
  const [yearA, setYearA] = useState(
    now.getMonth() + 1 === 1 ? now.getFullYear() - 1 : now.getFullYear()
  );
  const [monthB, setMonthB] = useState(now.getMonth() + 1);
  const [yearB, setYearB] = useState(now.getFullYear());

  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [compared, setCompared] = useState(false);

  const labelA = `${MONTHS.find((m) => m.value === monthA)?.label} ${yearA}`;
  const labelB = `${MONTHS.find((m) => m.value === monthB)?.label} ${yearB}`;

  const handleCompare = async () => {
    setError("");
    setLoading(true);
    setCompared(true);
    try {
      const [sumA, pieA, heatA, sumB, pieB, heatB] = await Promise.allSettled([
        getSummary(monthA, yearA),
        getPieSummary(monthA, yearA),
        getHeatmap(monthA, yearA),
        getSummary(monthB, yearB),
        getPieSummary(monthB, yearB),
        getHeatmap(monthB, yearB),
      ]);
      const ok = (r) => r.status === "fulfilled" && r.value?.success;
      if (ok(sumA) && ok(pieA) && ok(heatA)) {
        setDataA({
          summary: sumA.value.data,
          pie: pieA.value.data,
          heatmap: heatA.value.data,
        });
      } else setDataA(null);
      if (ok(sumB) && ok(pieB) && ok(heatB)) {
        setDataB({
          summary: sumB.value.data,
          pie: pieB.value.data,
          heatmap: heatB.value.data,
        });
      } else setDataB(null);
      if (!ok(sumA) || !ok(sumB))
        setError("Could not load data for one or both months.");
    } catch {
      setError("Could not connect. Make sure your backend is running.");
    }
    setLoading(false);
  };

  // ── Derived comparison data ──────────────────────────────
  const totalA = dataA?.summary?.total_expense || 0;
  const totalB = dataB?.summary?.total_expense || 0;
  const delta = totalA > 0 ? ((totalB - totalA) / totalA) * 100 : 0;
  const deltaUp = delta > 0;

  const categoryChartData = useMemo(() => {
    if (!dataA || !dataB) return [];
    const cats = new Set([
      ...(dataA.pie || []).map((c) => c.category_name),
      ...(dataB.pie || []).map((c) => c.category_name),
    ]);
    const mapA = Object.fromEntries(
      (dataA.pie || []).map((c) => [c.category_name, c.total])
    );
    const mapB = Object.fromEntries(
      (dataB.pie || []).map((c) => [c.category_name, c.total])
    );
    return Array.from(cats)
      .map((cat) => {
        const a = mapA[cat] || 0;
        const b = mapB[cat] || 0;
        const inA = cat in mapA;
        const inB = cat in mapB;
        const changeAmt = b - a;
        const changePct = a > 0 ? (changeAmt / a) * 100 : b > 0 ? 100 : 0;
        return { category: cat, a, b, inA, inB, changeAmt, changePct };
      })
      .sort((x, y) => y.a + y.b - (x.a + x.b));
  }, [dataA, dataB]);

  // Biggest mover (excludes new/dropped categories — those get their own callout)
  const biggestMover = useMemo(() => {
    const candidates = categoryChartData.filter(
      (c) => c.inA && c.inB && c.changeAmt !== 0
    );
    if (!candidates.length) return null;
    return candidates.reduce(
      (max, c) => (Math.abs(c.changeAmt) > Math.abs(max.changeAmt) ? c : max),
      candidates[0]
    );
  }, [categoryChartData]);

  const newCategories = useMemo(
    () => categoryChartData.filter((c) => !c.inA && c.inB),
    [categoryChartData]
  );
  const droppedCategories = useMemo(
    () => categoryChartData.filter((c) => c.inA && !c.inB),
    [categoryChartData]
  );

  const dailyChartData = useMemo(() => {
    if (!dataA || !dataB) return [];
    const daysInA = new Date(yearA, monthA, 0).getDate();
    const daysInB = new Date(yearB, monthB, 0).getDate();
    const maxDays = Math.max(daysInA, daysInB);
    const mapA = {};
    (dataA.heatmap || []).forEach((d) => {
      mapA[d.date_only.split("-")[2]] = d.total;
    });
    const mapB = {};
    (dataB.heatmap || []).forEach((d) => {
      mapB[d.date_only.split("-")[2]] = d.total;
    });
    const rows = [];
    for (let d = 1; d <= maxDays; d++) {
      const key = String(d).padStart(2, "0");
      rows.push({
        day: d,
        a: d <= daysInA ? mapA[key] || 0 : null,
        b: d <= daysInB ? mapB[key] || 0 : null,
      });
    }
    return rows;
  }, [dataA, dataB, monthA, yearA, monthB, yearB]);

  const dailyTakeaway = useMemo(() => {
    if (!dailyChartData.length) return "";
    const half = Math.floor(dailyChartData.length / 2);
    const bFirstHalf = dailyChartData
      .slice(0, half)
      .reduce((s, d) => s + (d.b || 0), 0);
    const bSecondHalf = dailyChartData
      .slice(half)
      .reduce((s, d) => s + (d.b || 0), 0);
    if (bFirstHalf === 0 && bSecondHalf === 0)
      return `No daily data yet for ${labelB}.`;
    if (bFirstHalf > bSecondHalf * 1.3)
      return `${labelB} was front-loaded — more spent in the first half of the month.`;
    if (bSecondHalf > bFirstHalf * 1.3)
      return `${labelB} was back-loaded — more spent in the second half of the month.`;
    return `${labelB} spending was fairly even across the month.`;
  }, [dailyChartData, labelB]);

  const tickColor = isDark ? "#44445A" : "#6C6C70";
  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const fmtY = (v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`);

  return (
    <>
      {/* Month selectors */}
      <div
        style={{
          background: "var(--bg-surface)",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "var(--shadow-card)",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              background: "var(--accent-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GitCompare size={17} color="var(--accent-dim)" strokeWidth={1.8} />
          </div>
          <div>
            <p
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "var(--text-1)",
              }}
            >
              Compare Two Months
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-3)",
                marginTop: "2px",
              }}
            >
              Pick any two months to see the difference
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            gap: "12px",
            alignItems: "center",
          }}
        >
          {/* Month A */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <p
              style={{
                fontSize: "10px",
                fontWeight: "700",
                color: "var(--accent-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.6px",
              }}
            >
              Month A
            </p>
            <select
              value={monthA}
              onChange={(e) => setMonthA(Number(e.target.value))}
              style={selectStyle}
            >
              {MONTHS.map((m) => (
                <option
                  key={m.value}
                  value={m.value}
                  style={{ background: "var(--bg-surface)" }}
                >
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={yearA}
              onChange={(e) => setYearA(Number(e.target.value))}
              style={selectStyle}
            >
              {YEARS.map((y) => (
                <option
                  key={y}
                  value={y}
                  style={{ background: "var(--bg-surface)" }}
                >
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-4)",
            }}
          >
            <Minus size={16} strokeWidth={2.5} />
          </div>

          {/* Month B */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <p
              style={{
                fontSize: "10px",
                fontWeight: "700",
                color: "#FF4D6D",
                textTransform: "uppercase",
                letterSpacing: "0.6px",
              }}
            >
              Month B
            </p>
            <select
              value={monthB}
              onChange={(e) => setMonthB(Number(e.target.value))}
              style={selectStyle}
            >
              {MONTHS.map((m) => (
                <option
                  key={m.value}
                  value={m.value}
                  style={{ background: "var(--bg-surface)" }}
                >
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={yearB}
              onChange={(e) => setYearB(Number(e.target.value))}
              style={selectStyle}
            >
              {YEARS.map((y) => (
                <option
                  key={y}
                  value={y}
                  style={{ background: "var(--bg-surface)" }}
                >
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: "16px",
            padding: "13px",
            background: loading
              ? "var(--disabled-bg)"
              : "var(--accent-gradient)",
            border: "none",
            borderRadius: "10px",
            color: loading ? "var(--text-3)" : "#fff",
            fontSize: "14px",
            fontWeight: "700",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "var(--shadow-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <GitCompare size={15} strokeWidth={2} />
          {loading ? "Comparing…" : "Compare"}
        </button>

        {error && (
          <div
            style={{
              marginTop: "12px",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "var(--red-bg)",
              border: "1px solid var(--red-border)",
              color: "var(--red-dim)",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}
      </div>

      {loading && <ReportSkeleton />}

      {!loading && compared && dataA && dataB && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Total comparison */}
          <div
            style={{
              background: "var(--bg-surface)",
              borderRadius: "16px",
              padding: "24px",
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
                marginBottom: "18px",
              }}
            >
              Total Spend
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
                <div>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "var(--accent-dim)",
                      fontWeight: "600",
                      marginBottom: "6px",
                    }}
                  >
                    {labelA}
                  </p>
                  <p
                    style={{
                      fontSize: "30px",
                      fontWeight: "800",
                      color: "var(--text-1)",
                      letterSpacing: "-1px",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    ₹{totalA.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#FF4D6D",
                      fontWeight: "600",
                      marginBottom: "6px",
                    }}
                  >
                    {labelB}
                  </p>
                  <p
                    style={{
                      fontSize: "30px",
                      fontWeight: "800",
                      color: "var(--text-1)",
                      letterSpacing: "-1px",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    ₹{totalB.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              {totalA > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    background: deltaUp ? "var(--red-bg)" : "var(--green-bg)",
                    border: `1px solid ${
                      deltaUp ? "var(--red-border)" : "var(--green-border)"
                    }`,
                  }}
                >
                  {deltaUp ? (
                    <TrendingUp
                      size={14}
                      color="var(--red)"
                      strokeWidth={2.5}
                    />
                  ) : (
                    <TrendingDown
                      size={14}
                      color="var(--green)"
                      strokeWidth={2.5}
                    />
                  )}
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: deltaUp ? "var(--red)" : "var(--green)",
                    }}
                  >
                    {Math.abs(delta).toFixed(1)}% {deltaUp ? "more" : "less"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Biggest mover callout */}
          {biggestMover && (
            <div
              style={{
                background: "var(--bg-surface)",
                borderRadius: "16px",
                padding: "18px 20px",
                boxShadow: "var(--shadow-card)",
                borderLeft: `3px solid ${
                  biggestMover.changeAmt > 0 ? "var(--red)" : "var(--green)"
                }`,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                {biggestMover.changeAmt > 0 ? (
                  <TrendingUp size={18} color="var(--red)" strokeWidth={2} />
                ) : (
                  <TrendingDown
                    size={18}
                    color="var(--green)"
                    strokeWidth={2}
                  />
                )}
                <div>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-1)",
                      fontWeight: "600",
                    }}
                  >
                    Biggest{" "}
                    {biggestMover.changeAmt > 0 ? "increase" : "decrease"}:{" "}
                    <span
                      style={{
                        color:
                          biggestMover.changeAmt > 0
                            ? "var(--red)"
                            : "var(--green)",
                      }}
                    >
                      {biggestMover.category}
                    </span>
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-3)",
                      marginTop: "2px",
                    }}
                  >
                    {biggestMover.changeAmt > 0 ? "+" : ""}₹
                    {Math.abs(biggestMover.changeAmt).toLocaleString("en-IN")} (
                    {biggestMover.changeAmt > 0 ? "+" : ""}
                    {biggestMover.changePct.toFixed(0)}%) from {labelA} to{" "}
                    {labelB}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* New / dropped category summary — single compact card */}
          {(newCategories.length > 0 || droppedCategories.length > 0) && (
            <div
              style={{
                background: "var(--bg-surface)",
                borderRadius: "16px",
                padding: "18px 20px",
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
                  marginBottom: "12px",
                }}
              >
                Categories that changed
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                {newCategories.map((c) => (
                  <div
                    key={c.category}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 0",
                    }}
                  >
                    <span
                      style={{ fontSize: "12.5px", color: "var(--text-2)" }}
                    >
                      <span style={{ color: "var(--red)", fontWeight: "600" }}>
                        New
                      </span>{" "}
                      · {c.category}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "var(--red)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      ₹{c.b.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
                {droppedCategories.map((c) => (
                  <div
                    key={c.category}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 0",
                    }}
                  >
                    <span
                      style={{ fontSize: "12.5px", color: "var(--text-2)" }}
                    >
                      <span
                        style={{ color: "var(--green)", fontWeight: "600" }}
                      >
                        Dropped
                      </span>{" "}
                      · {c.category}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "var(--text-4)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      had ₹{c.a.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category comparison — grouped bar chart with per-row change indicator */}
          {categoryChartData.length > 0 && (
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
                  marginBottom: "16px",
                }}
              >
                Category Breakdown
              </p>
              <ResponsiveContainer
                width="100%"
                height={Math.max(220, categoryChartData.length * 46)}
              >
                <BarChart
                  data={categoryChartData}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{
                      fontSize: 10,
                      fill: tickColor,
                      fontFamily: "Inter",
                    }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={fmtY}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{
                      fontSize: 11,
                      fill: tickColor,
                      fontFamily: "Inter",
                    }}
                    tickLine={false}
                    axisLine={false}
                    width={110}
                  />
                  <Tooltip
                    content={
                      <CompareBarTooltip labelA={labelA} labelB={labelB} />
                    }
                    cursor={{ fill: "var(--bg-inset)" }}
                  />
                  <Bar
                    dataKey="a"
                    fill="var(--accent)"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={14}
                  />
                  <Bar
                    dataKey="b"
                    fill="#FF4D6D"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={14}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  marginTop: "8px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "3px",
                      background: "var(--accent)",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-3)" }}>
                    {labelA}
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "3px",
                      background: "#FF4D6D",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-3)" }}>
                    {labelB}
                  </span>
                </div>
              </div>

              {/* Per-category change list */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "10px",
                }}
              >
                {categoryChartData
                  .filter((c) => c.inA && c.inB)
                  .map((c) => (
                    <div
                      key={c.category}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 4px",
                      }}
                    >
                      <span
                        style={{ fontSize: "12.5px", color: "var(--text-2)" }}
                      >
                        {c.category}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        {c.changeAmt !== 0 &&
                          (c.changeAmt > 0 ? (
                            <TrendingUp
                              size={11}
                              color="var(--red)"
                              strokeWidth={2.5}
                            />
                          ) : (
                            <TrendingDown
                              size={11}
                              color="var(--green)"
                              strokeWidth={2.5}
                            />
                          ))}
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color:
                              c.changeAmt > 0
                                ? "var(--red)"
                                : c.changeAmt < 0
                                ? "var(--green)"
                                : "var(--text-4)",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {c.changeAmt === 0
                            ? "No change"
                            : `${
                                c.changeAmt > 0 ? "+" : ""
                              }${c.changePct.toFixed(0)}%`}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Daily pattern — overlaid line chart */}
          {dailyChartData.length > 0 && (
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
                  marginBottom: "6px",
                }}
              >
                Daily Spending Pattern
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-2)",
                  marginBottom: "16px",
                }}
              >
                {dailyTakeaway}
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={dailyChartData}
                  margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{
                      fontSize: 10,
                      fill: tickColor,
                      fontFamily: "Inter",
                    }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{
                      fontSize: 10,
                      fill: tickColor,
                      fontFamily: "Inter",
                    }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={fmtY}
                    width={40}
                  />
                  <Tooltip
                    content={
                      <CompareLineTooltip labelA={labelA} labelB={labelB} />
                    }
                    cursor={{
                      stroke: "var(--border-strong)",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="a"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="b"
                    stroke="#FF4D6D"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "2.5px",
                      background: "var(--accent)",
                      borderRadius: "2px",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-3)" }}>
                    {labelA}
                  </span>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "2.5px",
                      background: "#FF4D6D",
                      borderRadius: "2px",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-3)" }}>
                    {labelB}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick stats */}
          <div className="bottom-grid">
            <div
              style={{
                background: "var(--bg-surface)",
                borderRadius: "16px",
                padding: "18px 20px",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <p
                style={{
                  fontSize: "10px",
                  color: "var(--accent-dim)",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  marginBottom: "8px",
                }}
              >
                {labelA}
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-2)",
                  marginBottom: "4px",
                }}
              >
                Transactions:{" "}
                <b style={{ color: "var(--text-1)" }}>
                  {dataA.summary.total_transactions}
                </b>
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-2)" }}>
                Top category:{" "}
                <b style={{ color: "var(--text-1)" }}>
                  {dataA.summary.top_category || "-"}
                </b>
              </p>
            </div>
            <div
              style={{
                background: "var(--bg-surface)",
                borderRadius: "16px",
                padding: "18px 20px",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <p
                style={{
                  fontSize: "10px",
                  color: "#FF4D6D",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  marginBottom: "8px",
                }}
              >
                {labelB}
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-2)",
                  marginBottom: "4px",
                }}
              >
                Transactions:{" "}
                <b style={{ color: "var(--text-1)" }}>
                  {dataB.summary.total_transactions}
                </b>
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-2)" }}>
                Top category:{" "}
                <b style={{ color: "var(--text-1)" }}>
                  {dataB.summary.top_category || "-"}
                </b>
              </p>
            </div>
          </div>
        </div>
      )}

      {!loading && !compared && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "var(--text-3)",
          }}
        >
          <GitCompare
            size={48}
            color="var(--text-4)"
            strokeWidth={1}
            style={{ margin: "0 auto 16px" }}
          />
          <p
            style={{
              fontSize: "15px",
              fontWeight: "600",
              color: "var(--text-3)",
              marginBottom: "6px",
            }}
          >
            Pick two months to compare
          </p>
          <p style={{ fontSize: "13px" }}>
            See spending side by side, by category and by day
          </p>
        </div>
      )}
    </>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [range, setRange] = useState("this_month");
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!localStorage.getItem("access_token")) router.push("/auth");
  }, [router]);

  const handleGenerate = async () => {
    setError("");
    setReport(null);
    setLoading(true);
    try {
      const res = await getReport(month, year);
      if (res?.success && res?.data) setReport(res.data);
      else setError(res?.message || "No data found for the selected period.");
    } catch {
      setError("Could not connect. Make sure your backend is running.");
    }
    setLoading(false);
  };

  const handleDownload = async () => {
    setDownloading(true);
    showToast("Preparing download…", "info");
    try {
      const res = await fetchMonthlyReport(range);
      if (!res || !res.ok) {
        showToast("Download failed", "error");
        return;
      }
      const buffer = await res.arrayBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(
        /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      );
      a.download = match
        ? match[1].replace(/['"]/g, "")
        : `statement_${range}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Downloaded successfully!", "success");
    } catch {
      showToast("Download failed. Please try again.", "error");
    }
    setDownloading(false);
  };

  const handleLogout = () => {
    removeTokens();
    router.push("/auth");
  };
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className="mobile-page-wrap"
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
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              objectFit: "cover",
            }}
          />
          <span
            style={{
              fontSize: "17px",
              fontWeight: "800",
              letterSpacing: "-0.4px",
            }}
          >
            Outgo
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="hide-mobile" style={{ gap: "10px", display: "flex" }}>
            <Link
              href="/dashboard"
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
              Dashboard
            </Link>
            <Link
              href="/budgets"
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
              <Wallet2 size={14} strokeWidth={2} />
              Budgets
            </Link>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
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
            <LogOut size={14} strokeWidth={2} />
          </button>
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
        className="mobile-main"
        style={{ maxWidth: "760px", margin: "0 auto", padding: "24px 20px" }}
      >
        <div style={{ marginBottom: "20px" }}>
          <h1
            className="page-title"
            style={{
              fontSize: "22px",
              fontWeight: "800",
              letterSpacing: "-0.5px",
              marginBottom: "4px",
            }}
          >
            Insights
          </h1>
          <p style={{ color: "var(--text-3)", fontSize: "14px" }}>
            Trends, projections, reports, and comparisons
          </p>
        </div>

        <ReportTabs active={activeTab} onChange={setActiveTab} />

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <OverviewTab
            month={month}
            year={year}
            onMonthChange={setMonth}
            onYearChange={setYear}
          />
        )}

        {/* DOWNLOAD TAB */}
        {activeTab === "download" && (
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
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  background: "var(--accent-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Download
                  size={17}
                  color="var(--accent-dim)"
                  strokeWidth={1.8}
                />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "var(--text-1)",
                  }}
                >
                  Download Excel Report
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-3)",
                    marginTop: "2px",
                  }}
                >
                  Export transactions as a spreadsheet
                </p>
              </div>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                style={selectStyle}
              >
                {RANGES.map((r) => (
                  <option
                    key={r.value}
                    value={r.value}
                    style={{ background: "var(--bg-surface)" }}
                  >
                    {r.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleDownload}
                disabled={downloading}
                style={{
                  padding: "13px",
                  background: downloading
                    ? "var(--disabled-bg)"
                    : "var(--accent-gradient)",
                  border: "none",
                  borderRadius: "10px",
                  color: downloading ? "var(--text-3)" : "#fff",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: downloading ? "not-allowed" : "pointer",
                  boxShadow: downloading ? "none" : "var(--shadow-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {downloading ? (
                  <>
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTop: "2px solid #fff",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    Downloading…
                  </>
                ) : (
                  <>
                    <Download size={15} strokeWidth={2.5} />
                    Download .xlsx
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* AI ANALYSIS TAB */}
        {activeTab === "ai" && (
          <>
            <div
              style={{
                background: "var(--bg-surface)",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "var(--shadow-card)",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    background: "var(--accent-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Sparkles
                    size={17}
                    color="var(--accent-dim)"
                    strokeWidth={1.8}
                  />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "var(--text-1)",
                    }}
                  >
                    AI Financial Analysis
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-3)",
                      marginTop: "2px",
                    }}
                  >
                    Detailed AI breakdown for any month
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  style={selectStyle}
                >
                  {MONTHS.map((m) => (
                    <option
                      key={m.value}
                      value={m.value}
                      style={{ background: "var(--bg-surface)" }}
                    >
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  style={selectStyle}
                >
                  {YEARS.map((y) => (
                    <option
                      key={y}
                      value={y}
                      style={{ background: "var(--bg-surface)" }}
                    >
                      {y}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  style={{
                    padding: "13px",
                    background: loading
                      ? "var(--disabled-bg)"
                      : "var(--accent-gradient)",
                    border: "none",
                    borderRadius: "10px",
                    color: loading ? "var(--text-3)" : "#fff",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: loading ? "none" : "var(--shadow-accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <Sparkles size={15} strokeWidth={2} />
                  {loading ? "Generating…" : "Generate Report"}
                </button>
              </div>
              {error && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    background: "var(--red-bg)",
                    border: "1px solid var(--red-border)",
                    color: "var(--red-dim)",
                    fontSize: "14px",
                  }}
                >
                  {error}
                </div>
              )}
            </div>

            {loading && <ReportSkeleton />}
            {report && !loading && <ReportDisplay text={report} />}
            {!report && !loading && !error && (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "var(--text-3)",
                }}
              >
                <BarChart3
                  size={48}
                  color="var(--text-4)"
                  strokeWidth={1}
                  style={{ margin: "0 auto 16px" }}
                />
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    color: "var(--text-3)",
                    marginBottom: "6px",
                  }}
                >
                  Select a month and generate a report
                </p>
                <p style={{ fontSize: "13px" }}>
                  AI will analyze your spending and give insights
                </p>
              </div>
            )}
          </>
        )}

        {/* COMPARE TAB */}
        {activeTab === "compare" && <CompareView />}

        <div style={{ height: "40px" }} />
      </main>

      {/* BOTTOM TABS */}
      <nav className="bottom-tab-bar">
        {[
          { href: "/dashboard", Icon: LayoutDashboard, label: "Dashboard" },
          { href: "/transactions", Icon: Receipt, label: "Transactions" },
          { href: "/budgets", Icon: Wallet2, label: "Budgets" },
          { href: "/insights", Icon: BarChart3, label: "Insights" },
        ].map(({ href, Icon, label }) => {
          const active = label === "Insights";
          return (
            <Link
              key={href}
              href={href}
              className={`bottom-tab-link ${active ? "bottom-tab-active" : ""}`}
            >
              <div
                className={active ? "tab-active-pill" : ""}
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

      <Toast />
    </div>
  );
}
