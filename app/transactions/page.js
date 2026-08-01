"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  LogOut,
  Search,
  X,
  ArrowLeft,
  Pencil,
  Check,
  Trash2,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  FileText,
  Gamepad2,
  Heart,
  Grid3X3,
  Sun,
  Moon,
} from "lucide-react";
import {
  getTransactions,
  getCategories,
  getWallets,
  updateTransaction,
  deleteTransaction,
  removeTokens,
} from "@/lib/api";
import Toast, { showToast } from "@/components/Toast";
import { useTheme } from "@/lib/ThemeContext";

// Category metadata with icons
const CAT_META = {
  "Food & Dining": {
    bg: "var(--accent-bg)",
    text: "#818CF8",
    Icon: UtensilsCrossed,
  },
  Transport: { bg: "var(--green-bg)", text: "#34D399", Icon: Car },
  Shopping: { bg: "rgba(139,92,246,0.15)", text: "#A78BFA", Icon: ShoppingBag },
  "Bills & Utilities": {
    bg: "rgba(6,182,212,0.15)",
    text: "#22D3EE",
    Icon: FileText,
  },
  Entertainment: {
    bg: "rgba(245,158,11,0.15)",
    text: "#FCD34D",
    Icon: Gamepad2,
  },
  Health: { bg: "var(--red-bg)", text: "#FCA5A5", Icon: Heart },
  General: { bg: "rgba(249,115,22,0.15)", text: "#FB923C", Icon: Grid3X3 },
};
const DEFAULT_META = {
  bg: "rgba(100,116,139,0.15)",
  text: "#94A3B8",
  Icon: Grid3X3,
};

// Highlight search match in text
function Highlight({ text, query }) {
  if (!query || !text) return <>{text}</>;
  const idx = String(text).toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark
        style={{
          background: "rgba(245,158,11,0.25)",
          color: "#FCD34D",
          borderRadius: "2px",
          padding: "0 2px",
          fontWeight: "600",
        }}
      >
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const fmtAmount = (a) =>
  a != null ? `₹${Number(a).toLocaleString("en-IN")}` : "-";

// Returns "Today", "Yesterday", "Monday", "19 Jul" etc.
const getDateLabel = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const txDate = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yester = new Date(today);
  yester.setDate(today.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 6);

  if (txDate.getTime() === today.getTime()) return "Today";
  if (txDate.getTime() === yester.getTime()) return "Yesterday";
  if (txDate >= weekAgo)
    return txDate.toLocaleDateString("en-IN", { weekday: "long" });
  if (txDate.getFullYear() === today.getFullYear())
    return txDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  return txDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Groups rows by date label, preserving API order
const groupTransactions = (rows) => {
  const map = new Map();
  rows.forEach((tx) => {
    const label = getDateLabel(tx.date);
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(tx);
  });
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
};

const selectStyle = {
  padding: "10px 36px 10px 14px",
  width: "100%",
  background: "var(--bg-inset)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  color: "var(--text-1)",
  fontSize: "14px",
  outline: "none",
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
};
const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  background: "var(--bg-inset)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  color: "var(--text-1)",
  fontSize: "14px",
  outline: "none",
};

// Category badge with icon
function CatBadge({ category }) {
  const m = CAT_META[category] || DEFAULT_META;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 10px",
        borderRadius: "20px",
        background: m.bg,
        color: m.text,
        fontSize: "12px",
        fontWeight: "600",
        whiteSpace: "nowrap",
      }}
    >
      <m.Icon size={11} strokeWidth={2.5} />
      {category}
    </span>
  );
}

// Skeleton row for table
function TableSkeleton() {
  return (
    <div style={{ padding: "16px 20px" }}>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 2fr 1fr 1.2fr 32px",
            gap: "0 20px",
            gap: "16px",
            marginBottom: "16px",
            alignItems: "center",
          }}
        >
          <div className="skeleton" style={{ height: "14px", width: "70%" }} />
          <div className="skeleton" style={{ height: "14px", width: "60%" }} />
          <div
            className="skeleton"
            style={{ height: "24px", width: "80%", borderRadius: "20px" }}
          />
          <div className="skeleton" style={{ height: "14px", width: "55%" }} />
          <div className="skeleton" style={{ height: "14px", width: "65%" }} />
          <div
            className="skeleton"
            style={{ height: "28px", width: "28px", borderRadius: "6px" }}
          />
        </div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          style={{
            background: "var(--bg-surface)",
            borderRadius: "14px",
            padding: "16px",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <div
              className="skeleton"
              style={{ height: "16px", width: "40%" }}
            />
            <div
              className="skeleton"
              style={{ height: "16px", width: "20%" }}
            />
          </div>
          <div
            className="skeleton"
            style={{ height: "22px", width: "25%", marginBottom: "10px" }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <div
              className="skeleton"
              style={{ height: "22px", width: "100px", borderRadius: "20px" }}
            />
            <div
              className="skeleton"
              style={{ height: "22px", width: "80px" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Edit / Add modal
function TxModal({ tx, categories, wallets, onClose, onSaved, onDeleted }) {
  const isEdit = !!tx?.id;
  const [form, setForm] = useState({
    name: tx?.name || "",
    date: tx?.date || new Date().toISOString().slice(0, 10),
    amount: tx?.amount ?? "",
    category: tx?.category || categories.filter((c) => c !== "All")[0] || "",
    wallet: tx?.wallet || wallets.filter((w) => w !== "All")[0] || "",
    notes: tx?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.date) {
      setError("Name and date are required.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: form.amount === "" ? null : Number(form.amount),
      };
      let res;
      if (isEdit) {
        res = await updateTransaction(tx.id, payload);
        if (res?.id) {
          showToast("Transaction updated", "success");
          onSaved(res);
          onClose();
        } else setError("Update failed. Please try again.");
      } else {
        showToast("No add API yet - use chat on Dashboard", "info");
        onClose();
      }
    } catch {
      setError("Could not connect to server.");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await deleteTransaction(tx.id);
      if (res?.success) {
        showToast("Transaction deleted", "success");
        onDeleted(tx.id);
        onClose();
      } else setError("Delete failed.");
    } catch {
      setError("Could not connect.");
    }
    setDeleting(false);
  };

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
          maxWidth: "460px",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "17px",
                fontWeight: "700",
                color: "var(--text-1)",
              }}
            >
              {isEdit ? "Edit Transaction" : "Add Transaction"}
            </h2>
            {isEdit && (
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-3)",
                  marginTop: "2px",
                }}
              >
                ID #{tx.id}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "var(--text-3)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "var(--text-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "6px",
                }}
              >
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Zomato"
                style={inputStyle}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "var(--text-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "6px",
                }}
              >
                Amount (₹)
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                style={{ ...inputStyle, MozAppearance: "textfield" }}
              />
            </div>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--text-3)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "6px",
              }}
            >
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              style={{ ...inputStyle, colorScheme: "dark" }}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "var(--text-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "6px",
                }}
              >
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                style={{ ...selectStyle, background: "var(--bg-inset)" }}
              >
                {categories
                  .filter((c) => c !== "All")
                  .map((c) => (
                    <option
                      key={c}
                      value={c}
                      style={{ background: "var(--bg-surface)" }}
                    >
                      {c}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "var(--text-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "6px",
                }}
              >
                Wallet
              </label>
              <select
                value={form.wallet}
                onChange={(e) => set("wallet", e.target.value)}
                style={{ ...selectStyle, background: "var(--bg-inset)" }}
              >
                {wallets
                  .filter((w) => w !== "All")
                  .map((w) => (
                    <option
                      key={w}
                      value={w}
                      style={{ background: "var(--bg-surface)" }}
                    >
                      {w}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "600",
                color: "var(--text-3)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "6px",
              }}
            >
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Optional…"
              rows={2}
              style={{
                ...inputStyle,
                resize: "vertical",
                fontFamily: "inherit",
                lineHeight: "1.5",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: "var(--red-bg)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#FCA5A5",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          {confirmDelete && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: "10px",
                background: "var(--red-bg)",
                border: "1px solid rgba(239,68,68,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <p style={{ fontSize: "13px", color: "#FCA5A5", margin: 0 }}>
                Delete permanently?
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    padding: "6px 12px",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "6px",
                    color: "var(--text-2)",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  Keep it
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    padding: "6px 12px",
                    background: "#EF4444",
                    border: "none",
                    borderRadius: "6px",
                    color: "#fff",
                    cursor: deleting ? "not-allowed" : "pointer",
                    fontSize: "12px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  {deleting ? (
                    <>
                      <div
                        style={{
                          width: "11px",
                          height: "11px",
                          border: "2px solid rgba(255,255,255,0.4)",
                          borderTop: "2px solid #fff",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 size={12} />
                      Yes, Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            {isEdit && (
              <button
                onClick={() => {
                  setConfirmDelete(true);
                  setError("");
                }}
                disabled={confirmDelete}
                style={{
                  padding: "12px 14px",
                  background: "transparent",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "10px",
                  color: confirmDelete ? "#334155" : "#F87171",
                  cursor: confirmDelete ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trash2 size={15} strokeWidth={2} />
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                color: "var(--text-2)",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 2,
                padding: "12px",
                background: saving ? "#334155" : "var(--accent-gradient)",
                border: "none",
                borderRadius: "10px",
                color: saving ? "#64748B" : "#fff",
                cursor: saving ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: saving ? "none" : "0 4px 12px rgba(99,102,241,0.35)",
              }}
            >
              {saving ? (
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
                  Saving…
                </>
              ) : (
                <>
                  <Check size={15} strokeWidth={2.5} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  // Skip initial run of filter + page effects (prevent triple API call on mount)
  const filterMounted = useRef(false);
  const pageMounted = useRef(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [wallet, setWallet] = useState("All");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(["All"]);
  const [wallets, setWallets] = useState(["All"]);
  const [modalTx, setModalTx] = useState(null); // null=closed, {}=add, tx=edit

  const fetchData = async (pg, q, cat, wal) => {
    setLoading(true);
    try {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      const params = { page: pg, page_size: isMobile ? 8 : 20 };
      if (q) params.search = q;
      if (cat && cat !== "All") params.category = cat;
      if (wal && wal !== "All") params.wallet = wal;
      const res = await getTransactions(params);
      setRows(res?.results || []);
      setCount(res?.count || 0);
      setHasNext(!!res?.next);
      setHasPrev(!!res?.previous);
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
  }, []);

  useEffect(() => {
    if (!filterMounted.current) {
      filterMounted.current = true;
      return;
    }
    const t = setTimeout(() => {
      setPage(1);
      fetchData(1, search, category, wallet);
    }, 420);
    return () => clearTimeout(t);
  }, [search, category, wallet]);

  useEffect(() => {
    if (!pageMounted.current) {
      pageMounted.current = true;
    }
    fetchData(page, search, category, wallet);
  }, [page]);

  const handleSaved = (u) =>
    setRows((prev) => prev.map((r) => (r.id === u.id ? u : r)));
  const handleDeleted = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setCount((c) => c - 1);
  };
  const filtersActive = search || category !== "All" || wallet !== "All";
  const handleLogout = () => {
    removeTokens();
    router.push("/auth");
  };
  const { theme, toggleTheme } = useTheme();

  const EmptyState = () => (
    <div style={{ padding: "60px 20px", textAlign: "center" }}>
      <Search
        size={36}
        color="#334155"
        strokeWidth={1.5}
        style={{ margin: "0 auto 12px" }}
      />
      <p
        style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-3)" }}
      >
        No transactions found
      </p>
      <p style={{ fontSize: "13px", color: "var(--text-3)", marginTop: "4px" }}>
        Try adjusting your filters
      </p>
    </div>
  );

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
          background: "var(--bg-surface)",
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
          <img
            src="/icons/icon-192.png"
            alt="FinanceAI"
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
            FinanceAI
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="hide-mobile" style={{ gap: "10px" }}>
            <Link
              href="/dashboard"
              style={{
                padding: "7px 14px",
                background: "var(--border-subtle)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "var(--text-2)",
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
                background: "var(--accent-bg)",
                border: "1px solid rgba(99,102,241,0.25)",
                borderRadius: "8px",
                color: "var(--accent-dim)",
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
              color: "var(--text-2)",
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
          <button
            onClick={toggleTheme}
            title="Toggle theme"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--bg-inset)",
              border: "1px solid var(--border)",
              color: "var(--text-2)",
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
          <p style={{ color: "var(--text-3)", fontSize: "13px" }}>
            {loading
              ? "Loading…"
              : `${count} transaction${count !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {/* FILTERS */}
        <div
          style={{
            background: "var(--bg-surface)",
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
                  background: "var(--bg-inset)",
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
                  <option
                    key={c}
                    value={c}
                    style={{ background: "var(--bg-surface)" }}
                  >
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
                  <option
                    key={w}
                    value={w}
                    style={{ background: "var(--bg-surface)" }}
                  >
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
                  background: "var(--red-bg)",
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
            background: "var(--bg-surface)",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.07)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 2fr 1fr 1.2fr 32px",
              gap: "0 20px",
              padding: "12px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "var(--bg-inset)",
            }}
          >
            {["Name", "Amount", "Category", "Wallet", "Date", ""].map(
              (h, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "var(--text-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.7px",
                    textAlign: i === 1 ? "right" : "left",
                  }}
                >
                  {h}
                </span>
              )
            )}
          </div>
          {loading ? (
            <TableSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState />
          ) : (
            groupTransactions(rows).map(({ label, items }) => (
              <div key={label}>
                {/* Date group header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "8px 20px",
                    background: "var(--border-subtle)",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "var(--text-3)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: "1px",
                      background: "var(--border-subtle)",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-4)" }}>
                    {items.length}
                  </span>
                </div>
                {items.map((tx, i) => (
                  <div
                    key={tx.id}
                    onClick={() => setModalTx(tx)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 2fr 1fr 1.2fr 32px",
                      gap: "0 20px",
                      padding: "13px 20px",
                      alignItems: "center",
                      borderBottom:
                        i < items.length - 1
                          ? "1px solid rgba(255,255,255,0.04)"
                          : "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(99,102,241,0.04)";
                      e.currentTarget.querySelector(
                        ".row-action"
                      ).style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.querySelector(
                        ".row-action"
                      ).style.opacity = "0";
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "var(--text-1)",
                      }}
                    >
                      <Highlight text={tx.name} query={search} />
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "#F87171",
                        textAlign: "right",
                      }}
                    >
                      {fmtAmount(tx.amount)}
                    </span>
                    <CatBadge category={tx.category} />
                    <span style={{ fontSize: "13px", color: "var(--text-3)" }}>
                      {tx.wallet}
                    </span>
                    <span style={{ fontSize: "13px", color: "var(--text-3)" }}>
                      {fmtDate(tx.date)}
                    </span>
                    <div
                      className="row-action"
                      style={{
                        opacity: 0,
                        transition: "opacity 0.15s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        background: "var(--accent-bg)",
                        border: "1px solid rgba(99,102,241,0.2)",
                      }}
                    >
                      <Pencil size={12} color="#818CF8" strokeWidth={2} />
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* MOBILE CARDS */}
        <div className="tx-cards-view">
          {loading ? (
            <CardSkeleton />
          ) : rows.length === 0 ? (
            <div
              style={{
                background: "var(--bg-surface)",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <EmptyState />
            </div>
          ) : (
            groupTransactions(rows).map(({ label, items }) => (
              <div key={label}>
                {/* Date group label */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginTop: "8px",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "var(--text-3)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: "1px",
                      background: "var(--border)",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-4)" }}>
                    {items.length}
                  </span>
                </div>
                {/* Cards */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {items.map((tx) => {
                    const m = CAT_META[tx.category] || DEFAULT_META;
                    return (
                      <div
                        key={tx.id}
                        onClick={() => setModalTx(tx)}
                        style={{
                          background: "var(--bg-surface)",
                          borderRadius: "14px",
                          padding: "16px",
                          borderLeft: `3px solid ${m.text}`,
                          border: `1px solid rgba(255,255,255,0.07)`,
                          borderLeftWidth: "3px",
                          borderLeftColor: m.text,
                          cursor: "pointer",
                          transition: "border-color 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.borderColor =
                            "var(--accent-glow)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.borderColor = "var(--border)")
                        }
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "6px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "15px",
                              fontWeight: "700",
                              color: "var(--text-1)",
                            }}
                          >
                            <Highlight text={tx.name} query={search} />
                          </span>
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: "800",
                              color: "#F87171",
                              letterSpacing: "-0.5px",
                            }}
                          >
                            {fmtAmount(tx.amount)}
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
                          <CatBadge category={tx.category} />
                          <span
                            style={{ fontSize: "12px", color: "var(--text-3)" }}
                          >
                            · {tx.wallet}
                          </span>
                          {tx.notes && (
                            <span
                              style={{
                                fontSize: "12px",
                                color: "var(--text-3)",
                              }}
                            >
                              · {tx.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* PAGINATION */}
        {(hasPrev || hasNext) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "20px",
            }}
          >
            <span style={{ color: "var(--text-3)", fontSize: "13px" }}>
              Page {page} · {count} total
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                ["← Prev", page - 1, !hasPrev],
                ["Next →", page + 1, !hasNext],
              ].map(([label, target, disabled]) => (
                <button
                  key={label}
                  onClick={() => setPage(target)}
                  disabled={disabled || loading}
                  style={{
                    padding: "10px 20px",
                    background: disabled ? "#1E293B" : "var(--accent-bg)",
                    border: `1px solid ${
                      disabled ? "var(--border)" : "var(--accent-glow)"
                    }`,
                    borderRadius: "8px",
                    color: disabled ? "#475569" : "#818CF8",
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
        {/* Spacer - keeps pagination above the fixed tab bar on mobile */}
        <div style={{ height: "80px" }} />
      </main>

      {/* BOTTOM TABS */}
      <nav className="bottom-tab-bar">
        {[
          { href: "/dashboard", Icon: LayoutDashboard, label: "Dashboard" },
          { href: "/transactions", Icon: Receipt, label: "Transactions" },
          { href: "/report", Icon: BarChart3, label: "Reports" },
        ].map(({ href, Icon, label }) => {
          const active = label === "Transactions";
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

      {/* MODAL */}
      {modalTx !== null && (
        <TxModal
          tx={modalTx}
          categories={categories}
          wallets={wallets}
          onClose={() => setModalTx(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}

      <Toast />
    </div>
  );
}
