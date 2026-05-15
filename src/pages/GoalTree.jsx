import { useState } from 'react'

const GOALS = [
  {
    id: 1, label: 'Technical Mastery', icon: 'code', color: 'var(--primary)', pct: 68,
    children: [
      { id: 11, label: 'System Architecture', pct: 80, status: 'active', sub: 'In Progress · Q2' },
      { id: 12, label: 'API Design Patterns', pct: 55, status: 'active', sub: 'In Progress' },
      { id: 13, label: 'Performance Optimization', pct: 30, status: 'pending', sub: 'Queued · Q3' },
    ]
  },
  {
    id: 2, label: 'Physical Excellence', icon: 'fitness_center', color: 'var(--tertiary)', pct: 52,
    children: [
      { id: 21, label: 'Strength Foundation', pct: 70, status: 'active', sub: 'In Progress' },
      { id: 22, label: 'Mobility & Recovery', pct: 40, status: 'active', sub: '3/5 Sessions/wk' },
      { id: 23, label: 'Endurance Protocol', pct: 0, status: 'locked', sub: 'Locked · Complete Foundation first' },
    ]
  },
  {
    id: 3, label: 'Deep Focus Capacity', icon: 'psychology', color: 'var(--secondary)', pct: 75,
    children: [
      { id: 31, label: 'Pomodoro Mastery', pct: 90, status: 'done', sub: 'Complete' },
      { id: 32, label: 'Environment Design', pct: 75, status: 'active', sub: 'In Progress' },
      { id: 33, label: 'Flow State Protocol', pct: 45, status: 'active', sub: 'In Progress' },
    ]
  },
]

function CircleProgress({ pct, size = 52, strokeWidth = 3.5, color = 'var(--primary)' }) {
  const r = (size - strokeWidth * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
        strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
    </svg>
  )
}

function StatusBadge({ status }) {
  const map = {
    active: { label: 'Active', bg: 'rgba(78,222,163,0.1)', color: 'var(--primary)', border: 'var(--border-primary)' },
    done: { label: 'Complete', bg: 'rgba(78,222,163,0.06)', color: 'var(--text-muted)', border: 'var(--border)' },
    pending: { label: 'Queued', bg: 'rgba(173,198,255,0.08)', color: 'var(--secondary)', border: 'rgba(173,198,255,0.2)' },
    locked: { label: 'Locked', bg: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: 'var(--border)' },
  }
  const s = map[status] || map.pending
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 9999,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      font: 'var(--text-label-sm)', letterSpacing: '0.06em',
    }}>{s.label}</span>
  )
}

function GoalNode({ goal }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Parent */}
      <div
        className="card"
        style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <CircleProgress pct={goal.pct} color={goal.color} />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined icon-sm icon-fill" style={{ color: goal.color }}>{goal.icon}</span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: 'var(--text-h3)', color: 'var(--text)', fontWeight: 700 }}>{goal.label}</div>
          <div style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)', marginTop: 4 }}>{goal.pct}% complete · {goal.children.length} sub-goals</div>
        </div>
        <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
          expand_more
        </span>
      </div>

      {/* Children */}
      {open && (
        <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 24, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />
          {goal.children.map(child => (
            <div key={child.id} className="card" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              opacity: child.status === 'locked' ? 0.45 : 1,
              marginLeft: 20, position: 'relative',
            }}>
              {/* connector dot */}
              <div style={{
                position: 'absolute', left: -24, top: '50%', transform: 'translateY(-50%)',
                width: 8, height: 8, borderRadius: '50%',
                background: child.status === 'done' ? 'var(--primary)' : child.status === 'locked' ? 'var(--surface-highest)' : 'var(--surface-highest)',
                border: `2px solid ${child.status === 'active' ? goal.color : 'var(--border-strong)'}`,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: 'var(--text-body)', fontWeight: 600, color: 'var(--text)' }}>{child.label}</div>
                <div style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)', marginTop: 2 }}>{child.sub}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ font: 'var(--text-mono)', color: goal.color, fontSize: 13 }}>{child.pct}%</div>
                  <div className="progress-bar" style={{ width: 72, marginTop: 4 }}>
                    <div className="progress-bar-fill" style={{ width: `${child.pct}%`, background: goal.color }} />
                  </div>
                </div>
                <StatusBadge status={child.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function GoalTree() {
  return (
    <main className="page page-enter">
      <div className="page-header fade-up">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">Goal Tree</h1>
            <p className="page-subtitle">Your hierarchical growth structure — track every node.</p>
          </div>
          <button className="btn btn-primary">
            <span className="material-symbols-outlined icon-sm">add</span>
            Add Goal
          </button>
        </div>

        {/* Summary row */}
        <div style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Active Goals', value: 7, color: 'var(--primary)' },
            { label: 'Completed', value: 3, color: 'var(--text-muted)' },
            { label: 'Locked', value: 2, color: 'var(--text-muted)' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
              <span style={{ font: 'var(--text-body)', color: 'var(--text-muted)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {GOALS.map(g => <GoalNode key={g.id} goal={g} />)}
      </div>
    </main>
  )
}
