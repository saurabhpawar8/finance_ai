"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Wallet2,
  LogOut,
  Sun,
  Moon,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getPieSummary,
  getCategories,
  removeTokens,
} from "@/lib/api";
import Toast, { showToast } from "@/components/Toast";
import { useTheme } from "@/lib/ThemeContext";

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
const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  background: "var(--bg-inset)",
  boxShadow: "var(--shadow-card)",
  borderRadius: "10px",
  color: "var(--text-1)",
  fontSize: "14px",
  outline: "none",
};

const statusFor = (spent, limit) => {
  if (!limit) return { color: "var(--text-3)", label: "No limit" };
  const pct = (spent / limit) * 100;
  if (pct >= 100)
    return {
      color: "var(--red)",
      label: "Over budget",
      pct: Math.min(pct, 130),
    };
  if (pct >= 80) return { color: "var(--yellow)", label: "Near limit", pct };
  return { color: "var(--green)", label: "On track", pct };
};

// ── Budget card ────────────────────────────────────────────
function BudgetCard({ budget, spent, onEdit, onDelete }) {
  const status = statusFor(spent, budget.budget_amount);
  const pct = Math.min((spent / budget.budget_amount) * 100, 100);
  const remaining = budget.budget_amount - spent;

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        borderRadius: "16px",
        padding: "18px 20px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "12px",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "15px",
              fontWeight: "700",
              color: "var(--text-1)",
            }}
          >
            {budget.category}
          </p>
          <p
            style={{
              fontSize: "12px",
              color: status.color,
              fontWeight: "600",
              marginTop: "2px",
            }}
          >
            {status.label}
          </p>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            onClick={() => onEdit(budget)}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "7px",
              background: "var(--bg-elevated)",
              border: "none",
              color: "var(--text-3)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Pencil size={12} strokeWidth={2} />
          </button>
          <button
            onClick={() => onDelete(budget)}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "7px",
              background: "var(--red-bg)",
              border: "none",
              color: "var(--red-dim)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Trash2 size={12} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "8px",
        }}
      >
        <span
          style={{
            fontSize: "20px",
            fontWeight: "800",
            color: "var(--text-1)",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.5px",
          }}
        >
          ₹{spent.toLocaleString("en-IN")}
        </span>
        <span style={{ fontSize: "13px", color: "var(--text-3)" }}>
          of ₹{budget.budget_amount.toLocaleString("en-IN")}
        </span>
      </div>

      <div
        style={{
          height: "8px",
          background: "var(--border-subtle)",
          borderRadius: "4px",
          overflow: "hidden",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: status.color,
            borderRadius: "4px",
            transition: "width 0.6s ease",
          }}
        />
      </div>

      <p
        style={{
          fontSize: "12px",
          color: remaining >= 0 ? "var(--text-3)" : "var(--red)",
          fontWeight: remaining >= 0 ? "400" : "600",
        }}
      >
        {remaining >= 0
          ? `₹${remaining.toLocaleString("en-IN")} remaining`
          : `₹${Math.abs(remaining).toLocaleString("en-IN")} over budget`}
      </p>
    </div>
  );
}

// ── Create / Edit modal ────────────────────────────────────
function BudgetModal({
  budget,
  categories,
  existingCategories,
  onClose,
  onSaved,
  onDeleted,
}) {
  const isEdit = !!budget?.id;
  const [category, setCategory] = useState(budget?.category || "");
  const [amount, setAmount] = useState(budget?.budget_amount ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const availableCategories = isEdit
    ? categories
    : categories.filter((c) => !existingCategories.includes(c));

  const handleSave = async () => {
    if (!category) {
      setError("Choose a category.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid budget amount.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      let res;
      if (isEdit) {
        res = await updateBudget(budget.id, Number(amount));
      } else {
        res = await createBudget(category, Number(amount));
      }
      if (res?.success) {
        showToast(isEdit ? "Budget updated" : "Budget created", "success");
        onSaved(res.data);
        onClose();
      } else {
        setError(res?.message || "Something went wrong.");
      }
    } catch {
      setError("Could not connect to server.");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await deleteBudget(budget.id);
      if (res?.success) {
        showToast("Budget deleted", "success");
        onDeleted(budget.id);
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
          maxWidth: "420px",
          boxShadow: "var(--shadow-elevated)",
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
          <h2
            style={{
              fontSize: "17px",
              fontWeight: "700",
              color: "var(--text-1)",
            }}
          >
            {isEdit ? "Edit Budget" : "New Budget"}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              boxShadow: "var(--shadow-card)",
              background: "transparent",
              color: "var(--text-3)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
            }}
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isEdit}
              style={{
                ...selectStyle,
                opacity: isEdit ? 0.6 : 1,
                cursor: isEdit ? "not-allowed" : "pointer",
              }}
            >
              {!isEdit && <option value="">Select category…</option>}
              {(isEdit ? [budget.category] : availableCategories).map((c) => (
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
              Monthly limit (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 7000"
              min="0"
              step="1"
              style={inputStyle}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: "var(--red-bg)",
                border: "1px solid var(--red-border)",
                color: "var(--red-dim)",
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
                border: "1px solid var(--red-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <p
                style={{ fontSize: "13px", color: "var(--red-dim)", margin: 0 }}
              >
                Delete this budget?
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    padding: "6px 12px",
                    background: "transparent",
                    border: "1px solid var(--border-strong)",
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
                    background: "var(--red)",
                    border: "none",
                    borderRadius: "6px",
                    color: "#fff",
                    cursor: deleting ? "not-allowed" : "pointer",
                    fontSize: "12px",
                    fontWeight: "700",
                  }}
                >
                  {deleting ? "Deleting…" : "Yes, Delete"}
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
                  border: "1px solid var(--red-border)",
                  borderRadius: "10px",
                  color: confirmDelete ? "var(--text-4)" : "var(--red-dim)",
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
                boxShadow: "var(--shadow-card)",
                borderRadius: "10px",
                color: "var(--text-2)",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                border: "none",
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
                background: saving
                  ? "var(--disabled-bg)"
                  : "var(--accent-gradient)",
                border: "none",
                borderRadius: "10px",
                color: saving ? "var(--text-3)" : "#fff",
                cursor: saving ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: saving ? "none" : "var(--shadow-accent)",
              }}
            >
              {saving ? (
                "Saving…"
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

function BudgetSkeleton() {
  return (
    <div className="cards-grid">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            background: "var(--bg-surface)",
            borderRadius: "16px",
            padding: "18px 20px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            className="skeleton"
            style={{ height: "16px", width: "50%", marginBottom: "12px" }}
          />
          <div
            className="skeleton"
            style={{ height: "22px", width: "70%", marginBottom: "10px" }}
          />
          <div
            className="skeleton"
            style={{ height: "8px", width: "100%", marginBottom: "8px" }}
          />
          <div className="skeleton" style={{ height: "12px", width: "40%" }} />
        </div>
      ))}
    </div>
  );
}

export default function BudgetsPage() {
  const router = useRouter();
  const [budgets, setBudgets] = useState([]);
  const [spendMap, setSpendMap] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalBudget, setModalBudget] = useState(null); // null=closed, {}=new, budget=edit
  const { theme, toggleTheme } = useTheme();

  const loadData = async () => {
    setLoading(true);
    const now = new Date();
    const [budRes, pieRes, catRes] = await Promise.allSettled([
      getBudgets(),
      getPieSummary(now.getMonth() + 1, now.getFullYear()),
      getCategories(),
    ]);
    if (budRes.status === "fulfilled") setBudgets(budRes.value?.results || []);
    if (pieRes.status === "fulfilled" && pieRes.value?.success) {
      const map = {};
      (pieRes.value.data || []).forEach((c) => {
        map[c.category_name] = c.total;
      });
      setSpendMap(map);
    }
    if (catRes.status === "fulfilled" && catRes.value?.success)
      setCategories(catRes.value.data);
    setLoading(false);
  };

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.push("/auth");
      return;
    }
    loadData();
  }, []);

  const handleSaved = () => loadData();
  const handleDeleted = (id) =>
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  const handleLogout = () => {
    removeTokens();
    router.push("/auth");
  };

  const existingCategories = budgets.map((b) => b.category);
  const overCount = budgets.filter(
    (b) => spendMap[b.category] > b.budget_amount
  ).length;

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
              <LayoutDashboard size={14} strokeWidth={2} />
              Dashboard
            </Link>
            <Link
              href="/transactions"
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
              <Receipt size={14} strokeWidth={2} />
              Transactions
            </Link>
            <Link
              href="/report"
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
              <BarChart3 size={14} strokeWidth={2} />
              Reports
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
        style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px 20px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h1
              className="page-title"
              style={{
                fontSize: "22px",
                fontWeight: "800",
                letterSpacing: "-0.5px",
                marginBottom: "4px",
              }}
            >
              Budgets
            </h1>
            <p style={{ color: "var(--text-3)", fontSize: "13px" }}>
              {loading
                ? "Loading…"
                : budgets.length === 0
                ? "No budgets set yet"
                : `${budgets.length} budget${budgets.length !== 1 ? "s" : ""}${
                    overCount > 0 ? ` · ${overCount} over limit` : ""
                  }`}
            </p>
          </div>
          <button
            onClick={() => setModalBudget({})}
            style={{
              padding: "10px 18px",
              background: "var(--accent-gradient)",
              border: "none",
              borderRadius: "10px",
              color: "#fff",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "var(--shadow-accent)",
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            New Budget
          </button>
        </div>

        {loading ? (
          <BudgetSkeleton />
        ) : budgets.length === 0 ? (
          <div
            style={{
              background: "var(--bg-surface)",
              borderRadius: "16px",
              padding: "60px 20px",
              boxShadow: "var(--shadow-card)",
              textAlign: "center",
            }}
          >
            <TrendingUp
              size={40}
              color="var(--text-4)"
              strokeWidth={1.5}
              style={{ margin: "0 auto 16px" }}
            />
            <p
              style={{
                fontSize: "15px",
                fontWeight: "600",
                color: "var(--text-2)",
                marginBottom: "6px",
              }}
            >
              Set your first budget
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-3)",
                marginBottom: "20px",
              }}
            >
              Track spending limits per category and stay on top of your money
            </p>
            <button
              onClick={() => setModalBudget({})}
              style={{
                padding: "11px 20px",
                background: "var(--accent-gradient)",
                border: "none",
                borderRadius: "10px",
                color: "#fff",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "var(--shadow-accent)",
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Create Budget
            </button>
          </div>
        ) : (
          <div className="cards-grid">
            {budgets.map((b) => (
              <BudgetCard
                key={b.id}
                budget={b}
                spent={spendMap[b.category] || 0}
                onEdit={setModalBudget}
                onDelete={(bud) => setModalBudget(bud)}
              />
            ))}
          </div>
        )}

        <div style={{ height: "80px" }} />
      </main>

      {/* BOTTOM TABS */}
      <nav className="bottom-tab-bar">
        {[
          { href: "/dashboard", Icon: LayoutDashboard, label: "Dashboard" },
          { href: "/transactions", Icon: Receipt, label: "Transactions" },
          { href: "/budgets", Icon: Wallet2, label: "Budgets" },
          { href: "/report", Icon: BarChart3, label: "Reports" },
        ].map(({ href, Icon, label }) => {
          const active = label === "Budgets";
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

      {modalBudget !== null && (
        <BudgetModal
          budget={modalBudget}
          categories={categories}
          existingCategories={existingCategories}
          onClose={() => setModalBudget(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}

      <Toast />
    </div>
  );
}
