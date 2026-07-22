"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wallet,
  LayoutDashboard,
  Receipt,
  BarChart3,
  LogOut,
  Download,
  Sparkles,
  Trophy,
  TrendingUp,
  Activity,
  Lightbulb,
  ArrowLeft,
} from "lucide-react";
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

const scoreColor = (s) =>
  s >= 8 ? "#34D399" : s >= 6 ? "#10B981" : s >= 4 ? "#F59E0B" : "#F87171";
const scoreLabel = (s) =>
  s >= 8 ? "Excellent" : s >= 6 ? "Good" : s >= 4 ? "Fair" : "Needs Work";

function HealthRing({ score }) {
  const color = scoreColor(score),
    r = 48,
    circ = 2 * Math.PI * r;
  return (
    <div
      style={{
        position: "relative",
        width: "130px",
        height: "130px",
        flexShrink: 0,
      }}
    >
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle
          cx="65"
          cy="65"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="12"
        />
        <circle
          cx="65"
          cy="65"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - score / 10)}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
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
          style={{ fontSize: "28px", fontWeight: "800", color, lineHeight: 1 }}
        >
          {score}
        </span>
        <span style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
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
  const pct = Math.round((item.total / maxTotal) * 100),
    color = COLORS[index % COLORS.length];
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
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
  padding: "12px 36px 12px 14px",
  width: "100%",
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

const SectionCard = ({
  icon: Icon,
  iconColor,
  title,
  children,
  accentBg,
  accentBorder,
}) => (
  <div
    style={{
      background: accentBg || "#1E293B",
      borderRadius: "16px",
      padding: "18px 20px",
      border: `1px solid ${accentBorder || "rgba(255,255,255,0.07)"}`,
    }}
  >
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "8px",
          background: accentBg
            ? "rgba(255,255,255,0.1)"
            : "rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={17} color={iconColor || "#64748B"} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: "11px",
            color: iconColor || "#64748B",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            marginBottom: "8px",
          }}
        >
          {title}
        </p>
        {children}
      </div>
    </div>
  </div>
);

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
  const [dlError, setDlError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("access_token")) router.push("/auth");
  }, [router]);

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
      className="mobile-page-wrap"
      style={{ minHeight: "100vh", background: "#0F172A", color: "#F1F5F9" }}
    >
      {/* HEADER */}
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
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <ArrowLeft size={14} strokeWidth={2} />
              Dashboard
            </Link>
          </div>
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

      <main
        className="mobile-main"
        style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 20px" }}
      >
        <div style={{ marginBottom: "24px" }}>
          <h1
            className="page-title"
            style={{
              fontSize: "22px",
              fontWeight: "800",
              letterSpacing: "-0.5px",
              marginBottom: "4px",
            }}
          >
            Reports
          </h1>
          <p style={{ color: "#64748B", fontSize: "14px" }}>
            Download your expenses or get an AI-powered analysis
          </p>
        </div>

        {/* DOWNLOAD */}
        <div
          style={{
            background: "#1E293B",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid rgba(16,185,129,0.2)",
            marginBottom: "16px",
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
                background: "rgba(16,185,129,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Download size={17} color="#10B981" strokeWidth={1.8} />
            </div>
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
                padding: "13px",
                background: downloading
                  ? "#334155"
                  : "linear-gradient(135deg, #10B981, #34D399)",
                border: "none",
                borderRadius: "10px",
                color: downloading ? "#64748B" : "#fff",
                fontSize: "14px",
                fontWeight: "700",
                cursor: downloading ? "not-allowed" : "pointer",
                boxShadow: downloading
                  ? "none"
                  : "0 6px 20px rgba(16,185,129,0.3)",
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
                      border: "2px solid #475569",
                      borderTop: "2px solid #94A3B8",
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
            {dlError && (
              <span style={{ fontSize: "13px", color: "#FCA5A5" }}>
                {dlError}
              </span>
            )}
          </div>
        </div>

        {/* AI REPORT */}
        <div
          style={{
            background: "#1E293B",
            borderRadius: "16px",
            padding: "20px",
            border: "1px solid rgba(255,255,255,0.07)",
            marginBottom: "24px",
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
                background: "rgba(99,102,241,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={17} color="#818CF8" strokeWidth={1.8} />
            </div>
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
                Detailed AI breakdown for any month
              </p>
            </div>
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
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
                  style={{ background: "#1E293B" }}
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
                <option key={y} value={y} style={{ background: "#1E293B" }}>
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

        {/* LOADING */}
        {loading && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {[180, 280, 160, 200].map((h, i) => (
              <div
                key={i}
                style={{
                  height: h,
                  background: "#1E293B",
                  borderRadius: "16px",
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        )}

        {/* RESULTS */}
        {report && !loading && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div className="report-top-grid">
              <div
                style={{
                  background: "#1E293B",
                  borderRadius: "16px",
                  padding: "24px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
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
                    Financial Health
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
                  padding: "24px",
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
                    fontSize: "34px",
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

            <div
              style={{
                background: "#1E293B",
                borderRadius: "16px",
                padding: "20px",
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

            <SectionCard
              icon={Trophy}
              iconColor="#818CF8"
              title="Top Category"
              accentBg="rgba(99,102,241,0.08)"
              accentBorder="rgba(99,102,241,0.2)"
            >
              <p
                style={{
                  fontSize: "14px",
                  color: "#CBD5E1",
                  lineHeight: "1.7",
                }}
              >
                {report.top_category}
              </p>
            </SectionCard>

            <SectionCard
              icon={TrendingUp}
              iconColor="#34D399"
              title="Spending Trend"
            >
              <p
                style={{
                  fontSize: "14px",
                  color: "#CBD5E1",
                  lineHeight: "1.7",
                }}
              >
                {report.spending_trend}
              </p>
            </SectionCard>

            <SectionCard
              icon={Activity}
              iconColor="#64748B"
              title="Patterns Identified"
            >
              <p
                style={{
                  fontSize: "14px",
                  color: "#CBD5E1",
                  lineHeight: "1.7",
                }}
              >
                {report.patterns}
              </p>
            </SectionCard>

            <div
              style={{
                background: "#1E293B",
                borderRadius: "16px",
                padding: "20px",
                border: "1px solid rgba(255,255,255,0.07)",
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
                    background: "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Lightbulb size={17} color="#F59E0B" strokeWidth={1.8} />
                </div>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#F59E0B",
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
                  gap: "10px",
                }}
              >
                {report.suggestions.map((tip, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                      padding: "14px",
                      background: "#0F172A",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
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

        {!report && !loading && !error && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#475569",
            }}
          >
            <BarChart3
              size={48}
              color="#1E293B"
              strokeWidth={1}
              style={{ margin: "0 auto 16px" }}
            />
            <p
              style={{
                fontSize: "15px",
                fontWeight: "600",
                color: "#64748B",
                marginBottom: "6px",
              }}
            >
              Select a month and generate a report
            </p>
            <p style={{ fontSize: "13px" }}>Or download your statement above</p>
          </div>
        )}
      </main>

      <nav className="bottom-tab-bar">
        <Link href="/dashboard" className="bottom-tab-link">
          <LayoutDashboard size={22} strokeWidth={1.5} />
          Dashboard
        </Link>
        <Link href="/transactions" className="bottom-tab-link">
          <Receipt size={22} strokeWidth={1.5} />
          Transactions
        </Link>
        <Link href="/report" className="bottom-tab-link bottom-tab-active">
          <BarChart3 size={22} strokeWidth={1.5} />
          Reports
        </Link>
      </nav>
    </div>
  );
}
