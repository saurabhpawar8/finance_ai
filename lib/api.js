const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token");
  }
  return null;
};

export const removeTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_email");
};

// Central 401 handler — clears session and redirects to login automatically
const handle401 = () => {
  removeTokens();
  window.location.href = "/auth";
};

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export const register = async (email, password) => {
  const res = await fetch(`${BASE_URL}/account/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

export const login = async (email, password) => {
  const res = await fetch(`${BASE_URL}/account/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

export const sendChat = async (query) => {
  const res = await fetch(`${BASE_URL}/api/chat/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ query }),
  });
  if (res.status === 401) {
    handle401();
    return;
  }
  return res.json();
};

export const getSummary = async () => {
  const res = await fetch(`${BASE_URL}/api/transaction/summary/`, {
    headers: authHeaders(),
  });
  if (res.status === 401) {
    handle401();
    return;
  }
  return res.json();
};

export const getPieSummary = async () => {
  const res = await fetch(`${BASE_URL}/api/transaction/pie_summary/`, {
    headers: authHeaders(),
  });
  if (res.status === 401) {
    handle401();
    return;
  }
  return res.json();
};

export const getReport = async (month, year) => {
  const res = await fetch(`${BASE_URL}/report/expense_report/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ month, year }),
  });
  if (res.status === 401) {
    handle401();
    return;
  }
  return res.json();
};

export const getTransactions = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category__name", params.category);
  if (params.wallet) query.set("wallet__name", params.wallet);
  if (params.page > 1) query.set("page", params.page);
  const res = await fetch(`${BASE_URL}/api/transaction/?${query}`, {
    headers: authHeaders(),
  });
  if (res.status === 401) {
    handle401();
    return;
  }
  return res.json();
};

export const getCategories = async () => {
  const res = await fetch(`${BASE_URL}/api/category/category_list/`, {
    headers: authHeaders(),
  });
  if (res.status === 401) {
    handle401();
    return;
  }
  return res.json();
};

export const getWallets = async () => {
  const res = await fetch(`${BASE_URL}/api/wallet/wallet_list/`, {
    headers: authHeaders(),
  });
  if (res.status === 401) {
    handle401();
    return;
  }
  return res.json();
};

export const fetchMonthlyReport = async (range) => {
  const res = await fetch(`${BASE_URL}/report/statement/?range=${range}`, {
    headers: authHeaders(),
  });
  if (res.status === 401) {
    handle401();
    return null;
  }
  return res; // raw response — handled as blob in the page
};
