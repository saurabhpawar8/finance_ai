// Proxy base — all requests go through Next.js, Django URL never exposed
const BASE = "/api";

const getToken = () => {
  if (typeof window !== "undefined")
    return localStorage.getItem("access_token");
  return null;
};

export const removeTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_email");
};

const handle401 = () => {
  removeTokens();
  window.location.href = "/auth";
};

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const check = (res) => {
  if (res.status === 401) {
    handle401();
    return true;
  }
  return false;
};

// ── Auth ──────────────────────────────────────────────────
export const register = async (email, password) => {
  const res = await fetch(`${BASE}/account/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

export const login = async (email, password) => {
  const res = await fetch(`${BASE}/account/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

// ── Dashboard ─────────────────────────────────────────────
export const getSummary = async (month, year) => {
  const q = month && year ? `?month=${month}&year=${year}` : "";
  const res = await fetch(`${BASE}/api/transaction/summary${q}`, {
    headers: authHeaders(),
  });
  if (check(res)) return;
  return res.json();
};

export const getPieSummary = async (month, year) => {
  const q = month && year ? `?month=${month}&year=${year}` : "";
  const res = await fetch(`${BASE}/api/transaction/pie_summary${q}`, {
    headers: authHeaders(),
  });
  if (check(res)) return;
  return res.json();
};

export const getHeatmap = async (month, year) => {
  const q = month && year ? `?month=${month}&year=${year}` : "";
  const res = await fetch(`${BASE}/api/transaction/heatmap${q}`, {
    headers: authHeaders(),
  });
  if (check(res)) return;
  return res.json();
};

export const sendChat = async (query) => {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ query }),
  });
  if (check(res)) return;
  return res.json();
};

// ── Transactions ──────────────────────────────────────────
export const getTransactions = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category__name", params.category);
  if (params.wallet) query.set("wallet__name", params.wallet);
  if (params.page > 1) query.set("page", params.page);
  if (params.page_size) query.set("page_size", params.page_size);
  const res = await fetch(`${BASE}/api/transaction?${query}`, {
    headers: authHeaders(),
  });
  if (check(res)) return;
  return res.json();
};

export const updateTransaction = async (id, data) => {
  const res = await fetch(`${BASE}/api/transaction/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (check(res)) return;
  return res.json();
};

export const deleteTransaction = async (id) => {
  const res = await fetch(`${BASE}/api/transaction/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (check(res)) return;
  return res.json();
};

// ── Dropdowns ─────────────────────────────────────────────
export const getCategories = async () => {
  const res = await fetch(`${BASE}/api/category/category_list`, {
    headers: authHeaders(),
  });
  if (check(res)) return;
  return res.json();
};

export const getWallets = async () => {
  const res = await fetch(`${BASE}/api/wallet/wallet_list`, {
    headers: authHeaders(),
  });
  if (check(res)) return;
  return res.json();
};

// ── Reports ───────────────────────────────────────────────
export const getReport = async (month, year) => {
  const res = await fetch(`${BASE}/report/expense_report`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ month, year }),
  });
  if (check(res)) return;
  return res.json();
};

export const fetchMonthlyReport = async (range) => {
  const res = await fetch(`${BASE}/report/statement?range=${range}`, {
    headers: authHeaders(),
  });
  if (res.status === 401) {
    handle401();
    return null;
  }
  return res;
};

export const getMonthlyTotals = async () => {
  const res = await apiFetch(`${BASE}/api/transaction/monthly_totals`);
  if (res.status === 401) return;
  return res.json();
};
