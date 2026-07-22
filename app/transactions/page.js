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
  Search,
  X,
  ArrowLeft,
} from "lucide-react";
import {
  getTransactions,
  getCategories,
  getWallets,
  removeTokens,
} from "@/lib/api";

const CAT_STYLE = {
  "Food & Dining": { bg: "rgba(99,102,241,0.15)", text: "#818CF8" },
  Transport: { bg: "rgba(16,185,129,0.15)", text: "#34D399" },
  Shopping: { bg: "rgba(139,92,246,0.15)", text: "#A78BFA" },
  "Bills & Utilities": { bg: "rgba(6,182,212,0.15)", text: "#22D3EE" },
  Entertainment: { bg: "rgba(245,158,11,0.15)", text: "#FCD34D" },
  Health: { bg: "rgba(239,68,68,0.15)", text: "#FCA5A5" },
  General: { bg: "rgba(249,115,22,0.15)", text: "#FB923C" },
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const selectStyle = {
  padding: "10px 36px 10px 14px",
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
  backgroundPosition: "right 12px center",
};

export default function TransactionsPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [wallet, setWallet] = useState("All");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(["All"]);
  const [wallets, setWallets] = useState(["All"]);

  const fetchData = async (pg, q, cat, wal) => {
    setLoading(true);
    try {
      const params = { page: pg };
      if (q) params.search = q;
      if (cat && cat !== "All") params.category = cat;
      if (wal && wal !== "All") params.wallet = wal;
      const res = await getTransactions(params);
      setRows(res?.results || []);
      setCount(res?.count || 0);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.push("/auth");
      return;
    }
    getCategories().then((res) => {
      if (res?.success) setCategories(["All", ...res.data]);
    });
    getWallets().then((res) => {
      if (res?.success)
        setWallets(["All", ...res.data.filter((w) => w && w !== "null")]);
    });
    fetchData(1, "", "All", "All");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchData(1, search, category, wallet);
    }, 420);
    return () => clearTimeout(t);
  }, [search, category, wallet]);

  useEffect(() => {
    fetchData(page, search, category, wallet);
  }, [page]);

  const totalPages = Math.ceil(count / 10);
  const filtersActive = search || category !== "All" || wallet !== "All";
  const handleLogout = () => {
    removeTokens();
    router.push("/auth");
  };

  const Spinner = () => (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <div
        style={{
          width: "28px",
          height: "28px",
          margin: "0 auto",
          border: "3px solid #1E293B",
          borderTop: "3px solid #6366F1",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
    </div>
  );

  const EmptyState = () => (
    <div
      style={{ padding: "60px 20px", textAlign: "center", color: "#475569" }}
    >
      <Search
        size={36}
        color="#334155"
        strokeWidth={1.5}
        style={{ margin: "0 auto 12px" }}
      />
      <p style={{ fontSize: "15px", fontWeight: "600", color: "#64748B" }}>
        No transactions found
      </p>
      <p style={{ fontSize: "13px", marginTop: "4px" }}>
        Try adjusting your filters
      </p>
    </div>
  );

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
        style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px 20px" }}
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
            Transactions
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px" }}>
            {loading
              ? "Loading…"
              : `${count} transaction${count !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {/* FILTERS */}
        <div
          style={{
            background: "#1E293B",
            borderRadius: "14px",
            padding: "16px",
            border: "1px solid rgba(255,255,255,0.07)",
            marginBottom: "20px",
          }}
        >
          <div className="filter-bar">
            <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
              <Search
                size={14}
                color="#475569"
                style={{
                  position: "absolute",
                  left: "13px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name…"
                style={{
                  ...selectStyle,
                  padding: "10px 14px 10px 36px",
                  background: "#0F172A",
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: "140px" }}>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={selectStyle}
              >
                {categories.map((c) => (
                  <option key={c} value={c} style={{ background: "#1E293B" }}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: "140px" }}>
              <select
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                style={selectStyle}
              >
                {wallets.map((w) => (
                  <option key={w} value={w} style={{ background: "#1E293B" }}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
            {filtersActive && (
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                  setWallet("All");
                }}
                style={{
                  padding: "10px 14px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: "10px",
                  color: "#FCA5A5",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <X size={13} strokeWidth={2.5} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* DESKTOP TABLE */}
        <div
          className="tx-table-view"
          style={{
            background: "#1E293B",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.07)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1.5fr",
              padding: "12px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "#0F172A",
            }}
          >
            {["Name", "Category", "Wallet", "Date", "Notes"].map((h) => (
              <span
                key={h}
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.7px",
                }}
              >
                {h}
              </span>
            ))}
          </div>
          {loading ? (
            <Spinner />
          ) : rows.length === 0 ? (
            <EmptyState />
          ) : (
            rows.map((tx, i) => {
              const cs = CAT_STYLE[tx.category] || {
                bg: "rgba(100,116,139,0.15)",
                text: "#94A3B8",
              };
              return (
                <div
                  key={tx.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1.5fr",
                    padding: "14px 20px",
                    alignItems: "center",
                    borderBottom:
                      i < rows.length - 1
                        ? "1px solid rgba(255,255,255,0.04)"
                        : "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.02)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#E2E8F0",
                    }}
                  >
                    {tx.name}
                  </span>
                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        background: cs.bg,
                        color: cs.text,
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {tx.category}
                    </span>
                  </div>
                  <span style={{ fontSize: "13px", color: "#64748B" }}>
                    {tx.wallet}
                  </span>
                  <span style={{ fontSize: "13px", color: "#64748B" }}>
                    {fmtDate(tx.date)}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#475569",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tx.notes || <span style={{ color: "#334155" }}>—</span>}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* MOBILE CARDS */}
        <div className="tx-cards-view">
          {loading ? (
            <Spinner />
          ) : rows.length === 0 ? (
            <div
              style={{
                background: "#1E293B",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <EmptyState />
            </div>
          ) : (
            rows.map((tx) => {
              const cs = CAT_STYLE[tx.category] || {
                bg: "rgba(100,116,139,0.15)",
                text: "#94A3B8",
              };
              return (
                <div
                  key={tx.id}
                  style={{
                    background: "#1E293B",
                    borderRadius: "14px",
                    padding: "16px",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: "700",
                        color: "#E2E8F0",
                      }}
                    >
                      {tx.name}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#64748B",
                        flexShrink: 0,
                        marginLeft: "8px",
                      }}
                    >
                      {fmtDate(tx.date)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "20px",
                        background: cs.bg,
                        color: cs.text,
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {tx.category}
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>
                      · {tx.wallet}
                    </span>
                    {tx.notes && (
                      <span style={{ fontSize: "12px", color: "#475569" }}>
                        · {tx.notes}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "20px",
            }}
          >
            <span style={{ color: "#64748B", fontSize: "13px" }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                ["← Prev", page - 1, page === 1],
                ["Next →", page + 1, page === totalPages],
              ].map(([label, target, disabled]) => (
                <button
                  key={label}
                  onClick={() => setPage(target)}
                  disabled={disabled || loading}
                  style={{
                    padding: "10px 20px",
                    background: disabled ? "#1E293B" : "rgba(99,102,241,0.15)",
                    border: `1px solid ${
                      disabled
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(99,102,241,0.3)"
                    }`,
                    borderRadius: "8px",
                    color: disabled ? "#334155" : "#818CF8",
                    cursor: disabled ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM TAB BAR */}
      <nav className="bottom-tab-bar">
        <Link href="/dashboard" className="bottom-tab-link">
          <LayoutDashboard size={22} strokeWidth={1.5} />
          Dashboard
        </Link>
        <Link
          href="/transactions"
          className="bottom-tab-link bottom-tab-active"
        >
          <Receipt size={22} strokeWidth={1.5} />
          Transactions
        </Link>
        <Link href="/report" className="bottom-tab-link">
          <BarChart3 size={22} strokeWidth={1.5} />
          Reports
        </Link>
      </nav>
    </div>
  );
}
