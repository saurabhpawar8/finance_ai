"use client";
import Link from "next/link";
import {
  ArrowLeft,
  Sun,
  Moon,
  MessageSquare,
  Receipt,
  Wallet2,
  BarChart3,
  Calendar,
  TrendingUp,
  Activity,
  GitCompare,
  Sparkles,
  Download,
  LayoutGrid,
  Smartphone,
  Chrome,
} from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

const FEATURE_GROUPS = [
  {
    label: "Record expenses",
    items: [
      {
        icon: MessageSquare,
        color: "var(--accent-dim)",
        bg: "var(--accent-bg)",
        title: "Chat tracking",
        desc: 'Type naturally on the Dashboard , "Spent 200 at Zomato" , and it\'s parsed, categorized, and saved automatically. No forms, no dropdowns.',
      },
      {
        icon: Receipt,
        color: "var(--red)",
        bg: "var(--red-bg)",
        title: "Transactions",
        desc: "View every expense grouped by date. Search by name, filter by category, wallet, or a custom date range. Tap any transaction to edit or delete it.",
      },
    ],
  },
  {
    label: "Stay on budget",
    items: [
      {
        icon: Wallet2,
        color: "var(--green)",
        bg: "var(--green-bg)",
        title: "Budgets",
        desc: "Set a monthly limit per category. Each budget shows spent vs limit with a progress bar that turns amber near the limit and red once you're over.",
      },
    ],
  },
  {
    label: "Understand your spending",
    items: [
      {
        icon: LayoutGrid,
        color: "var(--accent-dim)",
        bg: "var(--accent-bg)",
        title: "Spending by Category",
        desc: "A donut chart on the Dashboard's Overview tab showing where your money went this month, category by category.",
      },
      {
        icon: Calendar,
        color: "var(--red)",
        bg: "var(--red-bg)",
        title: "Spending Calendar",
        desc: "A heatmap on the Analytics tab , darker days mean more spending. Hover or tap any day to see the exact amount.",
      },
      {
        icon: TrendingUp,
        color: "var(--red)",
        bg: "var(--red-bg)",
        title: "Spending Trend & Velocity",
        desc: "Two charts on Analytics: a daily trend line, and a cumulative Velocity chart that projects your likely month-end total based on your pace and history.",
      },
      {
        icon: Activity,
        color: "var(--green)",
        bg: "var(--green-bg)",
        title: "Tap any spending day",
        desc: "Click a point on the Trend or Velocity chart to instantly see every transaction from that day, without leaving the Dashboard.",
      },
    ],
  },
  {
    label: "Reports",
    items: [
      {
        icon: Download,
        color: "var(--accent-dim)",
        bg: "var(--accent-bg)",
        title: "Excel export",
        desc: "Download your transactions as a spreadsheet for any range , this week, last month, this year, and more.",
      },
      {
        icon: Sparkles,
        color: "var(--yellow)",
        bg: "rgba(245,158,11,0.12)",
        title: "AI Analysis",
        desc: "Get a written monthly breakdown , spending overview, category trends, advice, and things to watch next month.",
      },
      {
        icon: GitCompare,
        color: "var(--accent-dim)",
        bg: "var(--accent-bg)",
        title: "Compare months",
        desc: "Pick any two months and see totals, category-by-category changes, and daily spending patterns side by side.",
      },
    ],
  },
  {
    label: "The app itself",
    items: [
      {
        icon: Sun,
        color: "var(--yellow)",
        bg: "rgba(245,158,11,0.12)",
        title: "Light & dark mode",
        desc: "Toggle the theme from any page header , your choice is remembered across sessions.",
      },
      {
        icon: Smartphone,
        color: "var(--green)",
        bg: "var(--green-bg)",
        title: "Install as an app",
        desc: "Add Outgo to your home screen from your browser for a fullscreen, native-app-like experience , no app store needed.",
      },
    ],
  },
];

export default function FeaturesPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-inset)",
        color: "var(--text-1)",
      }}
    >
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
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          padding: "32px 20px 80px",
        }}
      >
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: "800",
              letterSpacing: "-0.7px",
              marginBottom: "8px",
            }}
          >
            What Outgo can do
          </h1>
          <p style={{ color: "var(--text-3)", fontSize: "14px" }}>
            A quick tour of every feature, in case you missed something.
          </p>
        </div>

        {FEATURE_GROUPS.map((group, gi) => (
          <div key={gi} style={{ marginBottom: "28px" }}>
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
              {group.label}
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {group.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--bg-surface)",
                    borderRadius: "16px",
                    padding: "18px 20px",
                    boxShadow: "var(--shadow-card)",
                    display: "flex",
                    gap: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: item.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <item.icon size={19} color={item.color} strokeWidth={1.8} />
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "14.5px",
                        fontWeight: "700",
                        color: "var(--text-1)",
                        marginBottom: "4px",
                        letterSpacing: "-0.1px",
                      }}
                    >
                      {item.title}
                    </p>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--text-3)",
                        lineHeight: "1.6",
                        margin: 0,
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ textAlign: "center", marginTop: "8px" }}>
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              background: "var(--accent-gradient)",
              borderRadius: "10px",
              color: "#fff",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "700",
              boxShadow: "var(--shadow-accent)",
            }}
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
