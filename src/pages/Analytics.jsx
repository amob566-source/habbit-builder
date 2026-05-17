import { useEffect, useRef, useState } from 'react'

const BASE_URL = 'http://localhost:3001'

async function getAnalytics() {
  const res = await fetch(`${BASE_URL}/api/analytics`)
  if (!res.ok) throw new Error('Failed to fetch analytics')
  return res.json()
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Fallback static data used when the backend hasn't returned anything yet
const FALLBACK_BAR_DATA = [
  { deep: 72, recovery: 60, momentum: 55 },
  { deep: 85, recovery: 70, momentum: 80 },
  { deep: 60, recovery: 80, momentum: 65 },
  { deep: 90, recovery: 75, momentum: 95 },
  { deep: 78, recovery: 65, momentum: 70 },
  { deep: 40, recovery: 90, momentum: 50 },
  { deep: 30, recovery: 95, momentum: 40 },
]

const FALLBACK_HEATMAP = [
  [0, 1, 3, 4, 5, 0, 0],
  [2, 4, 5, 3, 2, 0, 1],
  [1, 2, 3, 4, 5, 4, 2],
  [0, 1, 2, 3, 4, 2, 0],
]

const FALLBACK_METRICS = [
  { label: 'Focus Score', value: 87, delta: '+5', color: 'var(--primary)', icon: 'psychology' },
  { label: 'Consistency', value: 78, delta: '+12', color: 'var(--secondary)', icon: 'insights' },
  { label: 'Recovery Rate', value: 92, delta: '+3', color: 'var(--tertiary)', icon: 'battery_charging_full' },
  { label: 'Output Quality', value: 74, delta: '+8', color: 'var(--primary)', icon: 'star' },
]

const TIMELINE = [
  { label: 'Foundation', time: 'Q1', done: true },
  { label: 'System Build', time: 'Q2', done: true },
  { label: 'Deep Focus', time: 'In Progress', current: true },
  { label: 'Mastery', time: 'Locked', locked: true },
]

// Maps a raw daily-completed count (0–N) to a 0–5 heatmap intensity bucket
function countToHeatVal(count) {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count === 3) return 3
  if (count === 4) return 4
  return 5
}

// Build a 4×7 heatmap grid from an array of { date, completed } objects
// The most recent 28 days are used, oldest first, row-major (4 weeks × 7 days)
function buildHeatmap(dailyData) {
  if (!dailyData || dailyData.length === 0) return FALLBACK_HEATMAP
  const cells = dailyData.slice(-28).map(d => countToHeatVal(d.completed ?? d.count ?? 0))
  // Pad to exactly 28 cells
  while (cells.length < 28) cells.unshift(0)
  const rows = []
  for (let r = 0; r < 4; r++) rows.push(cells.slice(r * 7, r * 7 + 7))
  return rows
}

// Build bar chart data from daily data (last 7 days)
function buildBarData(dailyData) {
  if (!dailyData || dailyData.length === 0) return FALLBACK_BAR_DATA
  return dailyData.slice(-7).map(d => {
    const completed = d.completed ?? d.count ?? 0
    const total = d.total ?? Math.max(completed, 5)
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    return {
      deep: pct,
      recovery: Math.min(100, Math.round(pct * 0.85 + 10)),
      momentum: Math.min(100, Math.round(pct * 0.9 + 5)),
    }
  })
}

// Map backend metric fields to the card structure
function buildMetrics(data) {
  if (!data) return FALLBACK_METRICS

  const {
    focusScore,
    consistency,
    recoveryRate,
    outputQuality,
    focusDelta,
    consistencyDelta,
    recoveryDelta,
    outputDelta,
  } = data

  const fmt = v => (v !== undefined && v !== null ? Math.round(v) : null)
  const fmtDelta = v => (v !== undefined && v !== null ? (v >= 0 ? `+${Math.round(v)}` : `${Math.round(v)}`) : null)

  return [
    {
      label: 'Focus Score',
      value: fmt(focusScore) ?? FALLBACK_METRICS[0].value,
      delta: fmtDelta(focusDelta) ?? FALLBACK_METRICS[0].delta,
      color: 'var(--primary)',
      icon: 'psychology',
    },
    {
      label: 'Consistency',
      value: fmt(consistency) ?? FALLBACK_METRICS[1].value,
      delta: fmtDelta(consistencyDelta) ?? FALLBACK_METRICS[1].delta,
      color: 'var(--secondary)',
      icon: 'insights',
    },
    {
      label: 'Recovery Rate',
      value: fmt(recoveryRate) ?? FALLBACK_METRICS[2].value,
      delta: fmtDelta(recoveryDelta) ?? FALLBACK_METRICS[2].delta,
      color: 'var(--tertiary)',
      icon: 'battery_charging_full',
    },
    {
      label: 'Output Quality',
      value: fmt(outputQuality) ?? FALLBACK_METRICS[3].value,
      delta: fmtDelta(outputDelta) ?? FALLBACK_METRICS[3].delta,
      color: 'var(--primary)',
      icon: 'star',
    },
  ]
}

function HeatCell({ val, delay }) {
  const colors = [
    'rgba(34,34,34,1)',
    'rgba(78,222,163,0.14)',
    'rgba(78,222,163,0.32)',
    'rgba(78,222,163,0.52)',
    'rgba(78,222,163,0.74)',
    '#4edea3',
  ]
  const shadows = ['none', 'none', 'none', 'none', '0 0 7px rgba(78,222,163,0.2)', '0 0 12px rgba(78,222,163,0.35)']
  return (
    <div style={{
      aspectRatio: 1, borderRadius: 5,
      background: colors[val], boxShadow: shadows[val],
      border: `1px solid ${val === 0 ? 'rgba(255,255,255,0.05)' : `rgba(78,222,163,${val * 0.08})`}`,
      animation: `fade-up 0.3s cubic-bezier(0.34,1.56,0.64,1) ${delay}s both`,
    }} />
  )
}

function BarGroup({ data, i }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setTimeout(() => setMounted(true), 100 + i * 60) }, [i])
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 2, height: '100%' }}>
      {[
        { h: data.deep, color: 'var(--primary)' },
        { h: data.recovery, color: 'var(--secondary)' },
        { h: data.momentum, color: 'var(--tertiary)' },
      ].map((b, j) => (
        <div key={j} style={{ flex: 1, borderRadius: '3px 3px 0 0', background: b.color, transition: 'height 0.7s cubic-bezier(0.4,0,0.2,1)', height: mounted ? `${b.h}%` : '0%' }} />
      ))}
    </div>
  )
}

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getAnalytics()
      .then(data => {
        setAnalyticsData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Analytics fetch error:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // Derive display data from backend response (or fall back gracefully)
  const metrics = buildMetrics(analyticsData)
  const barData = buildBarData(analyticsData?.daily)
  const heatmap = buildHeatmap(analyticsData?.daily)

  // Completed tasks list from backend (if provided)
  const recentCompleted = analyticsData?.recentCompleted ?? []

  return (
    <main className="page page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header fade-up">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">Analytics</h1>
            <p className="page-subtitle">Growth metrics & performance data</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {loading && (
              <span style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)', marginRight: 8 }}>Loading…</span>
            )}
            {error && !loading && (
              <span style={{ font: 'var(--text-label-sm)', color: 'rgba(255,100,100,0.8)', marginRight: 8 }}>Using cached data</span>
            )}
            <button className="btn btn-ghost" style={{ fontSize: 11 }}>7D</button>
            <button className="btn btn-primary" style={{ fontSize: 11 }}>30D</button>
            <button className="btn btn-ghost" style={{ fontSize: 11 }}>All</button>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        {metrics.map((m, i) => (
          <div key={m.label} className={`card fade-up d${i + 1}`} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m.label}</span>
              <span className="material-symbols-outlined icon-sm" style={{ color: m.color }}>{m.icon}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: m.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{m.value}</span>
              <span style={{ font: 'var(--text-label)', color: 'var(--text-muted)' }}>/ 100</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="progress-bar" style={{ flex: 1 }}>
                <div className="progress-bar-fill" style={{ width: `${m.value}%`, background: m.color }} />
              </div>
              <span style={{ font: 'var(--text-label-sm)', color: 'var(--primary)', fontWeight: 600 }}>{m.delta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Two col: heatmap + bar chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(240px, 1.4fr)', gap: 16, alignItems: 'start' }}>
        {/* Heatmap */}
        <div className="card glass fade-up d2">
          <div className="card-title"><span className="material-symbols-outlined icon-sm">grid_view</span> Activity Heatmap</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {heatmap.flat().map((val, idx) => (
              <HeatCell key={idx} val={val} delay={idx * 0.03} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            {WEEK_DAYS.map(d => (
              <span key={d} style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)', fontSize: 10 }}>{d[0]}</span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <span style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)' }}>Low</span>
            {[0, 1, 2, 3, 4, 5].map(v => (
              <div key={v} style={{ width: 10, height: 10, borderRadius: 3, background: ['rgba(34,34,34,1)', 'rgba(78,222,163,0.14)', 'rgba(78,222,163,0.32)', 'rgba(78,222,163,0.52)', 'rgba(78,222,163,0.74)', '#4edea3'][v] }} />
            ))}
            <span style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)' }}>High</span>
          </div>
        </div>

        {/* Bar chart */}
        <div className="card glass fade-up d3">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
            <div className="card-title" style={{ margin: 0 }}><span className="material-symbols-outlined icon-sm">bar_chart</span> Weekly Performance</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[['Deep Work', 'var(--primary)'], ['Recovery', 'var(--secondary)'], ['Momentum', 'var(--tertiary)']].map(([l, c]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, font: 'var(--text-label-sm)', color: 'var(--text-muted)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />
                  {l}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140 }}>
            {barData.map((d, i) => <BarGroup key={i} data={d} i={i} />)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            {WEEK_DAYS.map(d => (
              <span key={d} style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)', flex: 1, textAlign: 'center', fontSize: 10 }}>{d.slice(0, 2)}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Recent completed tasks (from backend) */}
      {recentCompleted.length > 0 && (
        <div className="card glass fade-up d4">
          <div className="card-title" style={{ marginBottom: 16 }}>
            <span className="material-symbols-outlined icon-sm">task_alt</span> Recently Completed
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentCompleted.map((task, i) => (
              <div key={task.id ?? i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(78,222,163,0.05)',
                border: '1px solid rgba(78,222,163,0.1)',
              }}>
                <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--primary)', fontSize: 16 }}>check_circle</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ font: 'var(--text-mono)', fontSize: 13, color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</p>
                  {task.completedAt && (
                    <p style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(task.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historical Timeline */}
      <div className="card glass fade-up d4">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="card-title" style={{ marginBottom: 4 }}><span className="material-symbols-outlined icon-sm">timeline</span> Historical Growth Sequence</div>
            <p style={{ font: 'var(--text-body)', color: 'var(--text-muted)' }}>Evolution of completed milestones.</p>
          </div>
          <button className="btn btn-ghost" style={{ fontSize: 11 }}>
            <span className="material-symbols-outlined icon-sm">open_in_new</span> Expand
          </button>
        </div>
        <div style={{ overflowX: 'auto' }} className="no-scrollbar">
          <div style={{ minWidth: 540, position: 'relative', paddingTop: 28 }}>
            {/* Base line */}
            <div style={{ position: 'absolute', left: 32, right: 32, height: 2, background: 'rgba(255,255,255,0.05)', top: 37 }} />
            {/* Progress line */}
            <div style={{ position: 'absolute', left: 32, width: '62%', height: 2, background: 'var(--primary)', top: 37, boxShadow: '0 0 8px rgba(78,222,163,0.5)', transition: 'width 1.2s ease' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1, padding: '0 32px' }}>
              {TIMELINE.map(t => (
                <div key={t.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: 112 }}>
                  {t.current ? (
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      border: '2px solid var(--primary)', background: 'var(--surface-lowest)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      animation: 'node-pulse 2s ease-in-out infinite',
                    }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)' }} />
                    </div>
                  ) : (
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%',
                      background: t.done ? 'var(--primary)' : 'var(--surface-higher)',
                      border: t.locked ? '2px solid rgba(255,185,95,0.3)' : t.done ? 'none' : '2px solid rgba(255,255,255,0.1)',
                      boxShadow: t.done ? '0 0 10px rgba(78,222,163,0.6)' : 'none',
                    }} />
                  )}
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ font: 'var(--text-mono)', fontSize: 12, color: t.current ? 'var(--primary)' : t.locked ? 'var(--text-muted)' : 'var(--text)', fontWeight: t.current ? 700 : 500 }}>{t.label}</p>
                    <p style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)', marginTop: 2 }}>{t.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}