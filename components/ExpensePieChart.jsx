'use client';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#0F172A',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}>
        <p style={{ margin: 0, color: '#94A3B8', fontSize: '12px', fontWeight: '500' }}>
          {payload[0].name}
        </p>
        <p style={{ margin: '4px 0 0', color: '#10B981', fontSize: '16px', fontWeight: '700' }}>
          ₹{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const renderLegend = (props) => {
  const { payload } = props;
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '8px',
      justifyContent: 'center', marginTop: '12px',
    }}>
      {payload.map((entry, index) => (
        <div key={index} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: entry.color, flexShrink: 0,
          }} />
          <span style={{ color: '#94A3B8', fontSize: '12px' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function ExpensePieChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: '#475569', gap: '8px',
      }}>
        <div style={{ fontSize: '32px' }}>📊</div>
        <p style={{ fontSize: '14px' }}>No expenses yet</p>
        <p style={{ fontSize: '12px', color: '#334155' }}>Start chatting to record expenses</p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.category_name,
    value: item.total,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={65}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderLegend} />
      </PieChart>
    </ResponsiveContainer>
  );
}
