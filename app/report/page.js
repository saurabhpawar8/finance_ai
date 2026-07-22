"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getReport, fetchMonthlyReport, removeTokens } from "@/lib/api";

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

const COLORS = [
  "#6366F1",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#F97316",
];

function scoreColor(s) {
  if (s >= 8) return "#34D399";
  if (s >= 6) return "#10B981";
  if (s >= 4) return "#F59E0B";
  return "#F87171";
}
function scoreLabel(s) {
  if (s >= 8) return "Excellent";
  if (s >= 6) return "Good";
  if (s >= 4) return "Fair";
  return "Needs Work";
}

function HealthRing({ score }) {
  const color = scoreColor(score);
  const r = 48;
  const circ = 2 * Math.PI * r;
  return (
    <div
      style={{
        position: "relative",
        width: "140px",
        height: "140px",
        flexShrink: 0,
      }}
    >
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="12"
        />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - score / 10)}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{ fontSize: "32px", fontWeight: "800", color, lineHeight: 1 }}
        >
          {score}
        </span>
        <span style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
          /10
        </span>
        <span
          style={{
            fontSize: "11px",
            color,
            fontWeight: "600",
            marginTop: "2px",
          }}
        >
          {scoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

function CategoryBar({ item, index, maxTotal }) {
  const pct = Math.round((item.total / maxTotal) * 100);
  const color = COLORS[index % COLORS.length];
  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
        }}
      >
        <span style={{ fontSize: "13px", color: "#CBD5E1", fontWeight: "500" }}>
          {item.category_name}
        </span>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#64748B" }}>{pct}%</span>
          <span
            style={{ fontSize: "13px", color: "#F1F5F9", fontWeight: "600" }}
          >
            ₹{item.total.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
      <div
        style={{
          background: "rgba(255,255,255,0.05)",
          borderRadius: "6px",
          height: "8px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: "6px",
            transition: "width 0.8s ease",
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>
    </div>
  );
}

const selectStyle = {
  padding: "12px 36px 12px 16px",
  background: "#0F172A",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  color: "#F1F5F9",
  fontSize: "14px",
  outline: "none",
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
};

export default function ReportPage() {
  const router = useRouter();
  const now = new Date();

  // AI report state
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Download state
  const [range, setRange] = useState("this_month");
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("access_token")) router.push("/auth");
  }, [router]);

  // ── AI report ──
  const handleGenerate = async () => {
    setError("");
    setReport(null);
    setLoading(true);
    try {
      const res = await getReport(month, year);
      if (res?.total_expense !== undefined) setReport(res);
      else setError("No data found for the selected period.");
    } catch {
      setError("Could not connect. Make sure your backend is running.");
    }
    setLoading(false);
  };

  // ── Excel download ──
  const handleDownload = async () => {
    setDlError("");
    setDownloading(true);
    try {
      const res = await fetchMonthlyReport(range);
      if (!res || !res.ok) {
        setDlError("Download failed. Please try again.");
        return;
      }

      const buffer = await res.arrayBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `statement_${range}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setDlError("Download failed. Please try again.");
    }
    setDownloading(false);
  };

  const handleLogout = () => {
    removeTokens();
    router.push("/auth");
  };
  const selectedMonthLabel = MONTHS.find((m) => m.value === month)?.label;
  const maxTotal = report
    ? Math.max(...report.breakdown.map((b) => b.total))
    : 1;

  return (
    <div
      style={{ minHeight: "100vh", background: "#0F172A", color: "#F1F5F9" }}
    >
      {/* HEADER */}
      <header
        style={{
          background: "#1E293B",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "0 24px",
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
          <Link
            href="/dashboard"
            style={{
              padding: "7px 14px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#94A3B8",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: "600",
            }}
          >
            ← Dashboard
          </Link>
          <button
            onClick={handleLogout}
            style={{
              padding: "7px 14px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "8px",
              color: "#94A3B8",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main
        style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px" }}
      >
        <div style={{ marginBottom: "28px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "800",
              letterSpacing: "-0.5px",
              marginBottom: "6px",
            }}
          >
            Reports
          </h1>
          <p style={{ color: "#64748B", fontSize: "14px" }}>
            Download your expenses or get an AI-powered monthly analysis
          </p>
        </div>

        {/* ── DOWNLOAD EXCEL CARD ── */}
        <div
          style={{
            background: "#1E293B",
            borderRadius: "16px",
            padding: "24px",
            border: "1px solid rgba(16,185,129,0.2)",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "18px",
            }}
          >
            <span style={{ fontSize: "20px" }}>📥</span>
            <div>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#F1F5F9",
                }}
              >
                Download Excel Report
              </p>
              <p
                style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}
              >
                Export your transactions as a spreadsheet
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              style={{ ...selectStyle, background: "#0F172A" }}
            >
              {RANGES.map((r) => (
                <option
                  key={r.value}
                  value={r.value}
                  style={{ background: "#1E293B" }}
                >
                  {r.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleDownload}
              disabled={downloading}
              style={{
                padding: "12px 24px",
                background: downloading
                  ? "#334155"
                  : "linear-gradient(135deg, #10B981, #34D399)",
                border: "none",
                borderRadius: "10px",
                color: downloading ? "#64748B" : "#fff",
                fontSize: "14px",
                fontWeight: "700",
                cursor: downloading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                boxShadow: downloading
                  ? "none"
                  : "0 6px 20px rgba(16,185,129,0.3)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                whiteSpace: "nowrap",
              }}
            >
              {downloading ? (
                <>
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      border: "2px solid #475569",
                      borderTop: "2px solid #94A3B8",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Downloading…
                </>
              ) : (
                <> ⬇ Download .xlsx </>
              )}
            </button>

            {dlError && (
              <span style={{ fontSize: "13px", color: "#FCA5A5" }}>
                {dlError}
              </span>
            )}
          </div>
        </div>

        {/* ── AI REPORT CARD ── */}
        <div
          style={{
            background: "#1E293B",
            borderRadius: "16px",
            padding: "24px",
            border: "1px solid rgba(255,255,255,0.07)",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "18px",
            }}
          >
            <span style={{ fontSize: "20px" }}>🤖</span>
            <div>
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#F1F5F9",
                }}
              >
                AI Financial Analysis
              </p>
              <p
                style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}
              >
                Get a detailed AI breakdown for any month
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              style={{ ...selectStyle, background: "#0F172A" }}
            >
              {MONTHS.map((m) => (
                <option
                  key={m.value}
                  value={m.value}
                  style={{ background: "#1E293B" }}
                >
                  {m.label}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={{ ...selectStyle, background: "#0F172A" }}
            >
              {YEARS.map((y) => (
                <option key={y} value={y} style={{ background: "#1E293B" }}>
                  {y}
                </option>
              ))}
            </select>

            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                padding: "12px 24px",
                background: loading
                  ? "#334155"
                  : "linear-gradient(135deg, #6366F1, #818CF8)",
                border: "none",
                borderRadius: "10px",
                color: loading ? "#64748B" : "#fff",
                fontSize: "14px",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading
                  ? "none"
                  : "0 6px 20px rgba(99,102,241,0.35)",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "Generating…" : "Generate Report"}
            </button>
          </div>

          {error && (
            <div
              style={{
                marginTop: "14px",
                padding: "12px 16px",
                borderRadius: "10px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#FCA5A5",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* LOADING SKELETON */}
        {loading && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {[200, 300, 180, 240].map((h, i) => (
              <div
                key={i}
                style={{
                  height: `${h}px`,
                  background: "#1E293B",
                  borderRadius: "16px",
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        )}

        {/* REPORT RESULTS */}
        {report && !loading && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* Health Score + Total */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div
                style={{
                  background: "#1E293B",
                  borderRadius: "16px",
                  padding: "28px 24px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  alignItems: "center",
                  gap: "24px",
                }}
              >
                <HealthRing score={report.health_score} />
                <div>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#64748B",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.8px",
                      marginBottom: "8px",
                    }}
                  >
                    Financial Health Score
                  </p>
                  <p style={{ fontSize: "14px", color: "#94A3B8" }}>
                    {selectedMonthLabel} {report.year}
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: scoreColor(report.health_score),
                      fontWeight: "600",
                      marginTop: "4px",
                    }}
                  >
                    {scoreLabel(report.health_score)} — {report.health_score}/10
                  </p>
                </div>
              </div>

              <div
                style={{
                  background: "#1E293B",
                  borderRadius: "16px",
                  padding: "28px 24px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    color: "#64748B",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    marginBottom: "12px",
                  }}
                >
                  Total Expenses
                </p>
                <p
                  style={{
                    fontSize: "38px",
                    fontWeight: "800",
                    color: "#F87171",
                    letterSpacing: "-1.5px",
                    lineHeight: 1,
                  }}
                >
                  ₹{report.total_expense.toLocaleString("en-IN")}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#475569",
                    marginTop: "8px",
                  }}
                >
                  {selectedMonthLabel} {report.year} · {report.breakdown.length}{" "}
                  categories
                </p>
              </div>
            </div>

            {/* Breakdown */}
            <div
              style={{
                background: "#1E293B",
                borderRadius: "16px",
                padding: "24px",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <p
                style={{
                  fontSize: "11px",
                  color: "#64748B",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  marginBottom: "20px",
                }}
              >
                Spending Breakdown
              </p>
              {report.breakdown.map((item, i) => (
                <CategoryBar
                  key={i}
                  item={item}
                  index={i}
                  maxTotal={maxTotal}
                />
              ))}
            </div>

            {/* Top Category */}
            <div
              style={{
                background: "rgba(99,102,241,0.08)",
                borderRadius: "16px",
                padding: "20px 24px",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: "22px", flexShrink: 0 }}>🏆</span>
                <div>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#818CF8",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.6px",
                      marginBottom: "6px",
                    }}
                  >
                    Top Category
                  </p>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#CBD5E1",
                      lineHeight: "1.7",
                    }}
                  >
                    {report.top_category}
                  </p>
                </div>
              </div>
            </div>

            {/* Spending Trend */}
            <div
              style={{
                background: "#1E293B",
                borderRadius: "16px",
                padding: "20px 24px",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: "22px", flexShrink: 0 }}>📈</span>
                <div>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#64748B",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.6px",
                      marginBottom: "8px",
                    }}
                  >
                    Spending Trend
                  </p>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#CBD5E1",
                      lineHeight: "1.7",
                    }}
                  >
                    {report.spending_trend}
                  </p>
                </div>
              </div>
            </div>

            {/* Patterns */}
            <div
              style={{
                background: "#1E293B",
                borderRadius: "16px",
                padding: "20px 24px",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: "22px", flexShrink: 0 }}>🔍</span>
                <div>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#64748B",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.6px",
                      marginBottom: "8px",
                    }}
                  >
                    Patterns Identified
                  </p>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#CBD5E1",
                      lineHeight: "1.7",
                    }}
                  >
                    {report.patterns}
                  </p>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            <div
              style={{
                background: "#1E293B",
                borderRadius: "16px",
                padding: "24px",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <span style={{ fontSize: "22px" }}>💡</span>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#64748B",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                  }}
                >
                  AI Suggestions
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {report.suggestions.map((tip, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: "14px",
                      alignItems: "flex-start",
                      padding: "16px",
                      background: "#0F172A",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      style={{
                        width: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #6366F1, #818CF8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#CBD5E1",
                        lineHeight: "1.65",
                        margin: 0,
                      }}
                    >
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!report && !loading && !error && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#475569",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
            <p
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#64748B",
                marginBottom: "6px",
              }}
            >
              Select a month and year above
            </p>
            <p style={{ fontSize: "13px" }}>
              Your AI-powered financial report will appear here
            </p>
          </div>
        )}
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
