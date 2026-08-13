"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
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
  Sun,
  Moon,
  AlertCircle,
  Wallet2,
} from "lucide-react";
import { getReport, fetchMonthlyReport, removeTokens } from "@/lib/api";
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

// ── Parse and display plain text report ──────────────────
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
                marginBottom: "14px",
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
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
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
                        padding: "10px 14px",
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
                const isTableRow =
                  t.includes("₹") ||
                  t.includes("↓") ||
                  t.includes("↑") ||
                  t.includes("No data");
                return (
                  <p
                    key={j}
                    style={{
                      fontSize: "13px",
                      color: isTableRow ? "var(--text-2)" : "var(--text-3)",
                      lineHeight: "1.65",
                      margin: 0,
                      fontFamily: isTableRow
                        ? "'Courier New', monospace"
                        : "inherit",
                      fontWeight:
                        t.includes(":") && !isTableRow ? "500" : "400",
                    }}
                  >
                    {t}
                  </p>
                );
              })}
            </div>
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

// ── Tab switcher (Download / AI Analysis) ─────────────────
function ReportTabs({ active, onChange }) {
  const tabs = [
    { id: "download", label: "Download", Icon: Download },
    { id: "ai", label: "AI Analysis", Icon: Sparkles },
  ];
  return (
    <div
      style={{
        display: "inline-flex",
        background: "var(--bg-surface)",
        borderRadius: "12px",
        padding: "4px",
        boxShadow: "var(--shadow-card)",
        marginBottom: "20px",
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
  const [activeTab, setActiveTab] = useState("download");

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
            style={{
              padding: "7px 14px",
              background: "transparent",
              border: "none",
              borderRadius: "8px",
              color: "var(--text-3)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "6px",
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
        style={{ maxWidth: "720px", margin: "0 auto", padding: "24px 20px" }}
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
            Reports
          </h1>
          <p style={{ color: "var(--text-3)", fontSize: "14px" }}>
            Download your expenses or get an AI-powered analysis
          </p>
        </div>

        {/* TAB SWITCHER */}
        <ReportTabs active={activeTab} onChange={setActiveTab} />

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

        <div style={{ height: "40px" }} />
      </main>

      {/* BOTTOM TABS */}
      <nav className="bottom-tab-bar">
        {[
          { href: "/dashboard", Icon: LayoutDashboard, label: "Dashboard" },
          { href: "/transactions", Icon: Receipt, label: "Transactions" },
          { href: "/budgets", Icon: Wallet2, label: "Budgets" },
          { href: "/report", Icon: BarChart3, label: "Reports" },
        ].map(({ href, Icon, label }) => {
          const active = label === "Reports";
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
