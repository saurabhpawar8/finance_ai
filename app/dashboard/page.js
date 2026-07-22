'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getSummary, getPieSummary, sendChat, removeTokens } from '@/lib/api';

const ExpensePieChart = dynamic(() => import('@/components/ExpensePieChart'), { ssr: false });

const SUGGESTIONS = [
  'Spent 200 at Zomato',
  'Paid 1200 for electricity bill',
  'Bought groceries for 800',
  'Movie tickets 400',
];

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState(null);
  const [pieData, setPieData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: 'Hello! Tell me about your expenses in plain English.\nE.g. "Spent 500 at Swiggy" or "Paid 1200 for electricity"',
    },
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const messagesEndRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const [sumRes, pieRes] = await Promise.all([getSummary(), getPieSummary()]);
      if (sumRes.success) setSummary(sumRes.data);
      if (pieRes.success) setPieData(pieRes.data);
    } catch (e) {
      if (e.message === 'unauthorized') {
        removeTokens();
        router.push('/auth');
      }
    }
    setDataLoading(false);
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.push('/auth'); return; }
    setUserEmail(localStorage.getItem('user_email') || '');
    loadData();
  }, [loadData, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const handleSend = async (text) => {
    const msg = (text || input).trim();
    if (!msg || chatLoading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      const res = await sendChat(msg);
      if (res.success) {
        setMessages((prev) => [...prev, { role: 'bot', text: res.message }]);
        loadData(); // refresh summary + pie after recording
      } else {
        setMessages((prev) => [...prev, { role: 'bot', text: res.message || 'Something went wrong.' }]);
      }
    } catch (e) {
      if (e.message === 'unauthorized') {
        removeTokens();
        router.push('/auth');
      } else {
        setMessages((prev) => [...prev, { role: 'bot', text: 'Could not connect. Is your backend running?' }]);
      }
    }
    setChatLoading(false);
  };

  const handleLogout = () => {
    removeTokens();
    router.push('/auth');
  };

  const fmt = (n) => (n ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0');

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', color: '#F1F5F9' }}>

      {/* ─── HEADER ─── */}
      <header style={{
        background: '#1E293B',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 24px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px',
            background: 'linear-gradient(135deg, #6366F1, #818CF8)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '17px',
          }}>💰</div>
          <span style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '-0.4px' }}>FinanceAI</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/report" style={{
            padding: '7px 16px',
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '8px',
            color: '#818CF8',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: '600',
          }}>
            📊 Reports
          </Link>
          <Link href="/transactions" style={{
            padding: '7px 16px',
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: '8px',
            color: '#34D399',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: '600',
          }}>
            📋 Transactions
          </Link>
          <button onClick={handleLogout} style={{
            padding: '7px 16px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            color: '#94A3B8',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
          }}>
            Sign Out
          </button>
        </div>
      </header>

      {/* ─── MAIN ─── */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 24px' }}>

        {/* Month label */}
        <p style={{
          fontSize: '12px', fontWeight: '600', color: '#475569',
          textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px',
        }}>
          {dataLoading ? 'Loading…' : (summary?.month || 'This Month')}
        </p>

        {/* ─── SUMMARY CARDS ─── */}
        <div className="cards-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}>
          {/* Total Expenses */}
          <div style={{
            background: '#1E293B',
            borderRadius: '16px',
            padding: '22px 24px',
            border: '1px solid rgba(255,255,255,0.07)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '-20px', right: '-20px',
              width: '80px', height: '80px',
              background: 'rgba(239,68,68,0.08)',
              borderRadius: '50%',
            }} />
            <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
              Total Spent
            </p>
            <p style={{ fontSize: '28px', fontWeight: '800', color: '#F87171', letterSpacing: '-1px', lineHeight: 1 }}>
              {dataLoading ? '—' : fmt(summary?.total_expense)}
            </p>
            <p style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>This month</p>
          </div>

          {/* Transactions */}
          <div style={{
            background: '#1E293B',
            borderRadius: '16px',
            padding: '22px 24px',
            border: '1px solid rgba(255,255,255,0.07)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '-20px', right: '-20px',
              width: '80px', height: '80px',
              background: 'rgba(99,102,241,0.08)',
              borderRadius: '50%',
            }} />
            <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
              Transactions
            </p>
            <p style={{ fontSize: '28px', fontWeight: '800', color: '#818CF8', letterSpacing: '-1px', lineHeight: 1 }}>
              {dataLoading ? '—' : (summary?.total_transactions ?? 0)}
            </p>
            <p style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>Recorded this month</p>
          </div>

          {/* Top Category */}
          <div style={{
            background: '#1E293B',
            borderRadius: '16px',
            padding: '22px 24px',
            border: '1px solid rgba(255,255,255,0.07)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '-20px', right: '-20px',
              width: '80px', height: '80px',
              background: 'rgba(16,185,129,0.08)',
              borderRadius: '50%',
            }} />
            <p style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
              Top Category
            </p>
            <p style={{ fontSize: '20px', fontWeight: '800', color: '#34D399', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              {dataLoading ? '—' : (summary?.top_category || '—')}
            </p>
            <p style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>
              {summary?.category_amount ? `${fmt(summary.category_amount)} spent` : 'No data yet'}
            </p>
          </div>
        </div>

        {/* ─── BOTTOM ROW: PIE + CHAT ─── */}
        <div className="bottom-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
        }}>

          {/* ── PIE CHART ── */}
          <div style={{
            background: '#1E293B',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '400px',
          }}>
            <p style={{
              fontSize: '11px', fontWeight: '600', color: '#64748B',
              textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px',
            }}>
              Spending by Category
            </p>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <ExpensePieChart data={pieData} />
            </div>
          </div>

          {/* ── CHAT ── */}
          <div style={{
            background: '#1E293B',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '400px',
          }}>
            <p style={{
              fontSize: '11px', fontWeight: '600', color: '#64748B',
              textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px',
            }}>
              Record Expense
            </p>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '16px',
              paddingRight: '4px',
            }}>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '11px 15px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #6366F1, #818CF8)'
                    : '#0F172A',
                  color: msg.role === 'user' ? '#fff' : '#CBD5E1',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  border: msg.role === 'bot' ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  whiteSpace: 'pre-wrap',
                  boxShadow: msg.role === 'user' ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                }}>
                  {msg.text}
                </div>
              ))}

              {chatLoading && (
                <div style={{
                  alignSelf: 'flex-start',
                  padding: '12px 16px',
                  borderRadius: '16px 16px 16px 4px',
                  background: '#0F172A',
                  border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center',
                }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: '#475569',
                      animation: `bounce 1.2s infinite ${i * 0.2}s`,
                    }} />
                  ))}
                  <style>{`
                    @keyframes bounce {
                      0%, 80%, 100% { transform: translateY(0); }
                      40% { transform: translateY(-6px); }
                    }
                  `}</style>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px',
              }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => handleSend(s)} style={{
                    padding: '6px 12px',
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    borderRadius: '20px',
                    color: '#818CF8',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.15s',
                  }}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input row */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="e.g. Spent 200 at Zomato…"
                disabled={chatLoading}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: '#0F172A',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  color: '#F1F5F9',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border 0.2s',
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={chatLoading || !input.trim()}
                style={{
                  padding: '12px 20px',
                  background: (!input.trim() || chatLoading)
                    ? '#1E3A5F'
                    : 'linear-gradient(135deg, #6366F1, #818CF8)',
                  border: 'none',
                  borderRadius: '10px',
                  color: (!input.trim() || chatLoading) ? '#475569' : '#fff',
                  fontSize: '20px',
                  cursor: (!input.trim() || chatLoading) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: (!input.trim() || chatLoading) ? 'none' : '0 4px 12px rgba(99,102,241,0.35)',
                  flexShrink: 0,
                }}
              >
                ↑
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
