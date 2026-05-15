import { useState } from 'react'

const HABITS = [
  { id: 1, label: 'Morning Routine', icon: 'wb_sunny', color: 'var(--tertiary)', streak: 12, target: '1x daily', time: '06:30', pct: 100, done: true, category: 'Mindset' },
  { id: 2, label: 'Hydration Protocol', icon: 'water_drop', color: 'var(--secondary)', streak: 8, target: '3L daily', time: 'All day', pct: 100, done: true, category: 'Health' },
  { id: 3, label: 'Deep Work Blocks', icon: 'work', color: 'var(--primary)', streak: 4, target: '3x daily', time: '09:00', pct: 67, done: false, category: 'Focus' },
  { id: 4, label: 'Mobility Routine', icon: 'self_improvement', color: 'var(--primary)', streak: 3, target: '1x daily', time: '18:00', pct: 0, done: false, category: 'Health' },
  { id: 5, label: 'Evening Review', icon: 'menu_book', color: 'var(--secondary)', streak: 9, target: '1x daily', time: '21:00', pct: 0, done: false, category: 'Mindset' },
  { id: 6, label: 'Cold Exposure', icon: 'ac_unit', color: 'var(--secondary)', streak: 2, target: '1x daily', time: '07:00', pct: 100, done: true, category: 'Health' },
]

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
// random completion pattern for demo
const weekData = HABITS.map(h => WEEK.map((_, i) => Math.random() > 0.3))

function CircleProgress({ pct, size = 44, color = 'var(--primary)' }) {
  const sw = 3
  const r = (size - sw * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={sw} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
        strokeWidth={sw} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  )
}

function HabitRow({ habit, weekRow }) {
  const [done, setDone] = useState(habit.done)
  return (
    <div className="card" style={{
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      borderLeft: done ? `3px solid ${habit.color}` : '3px solid transparent',
      opacity: done ? 0.8 : 1,
    }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <CircleProgress pct={done ? 100 : habit.pct} color={habit.color} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined icon-sm" style={{ color: habit.color, fontSize: 14 }}>{habit.icon}</span>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ font: 'var(--text-body)', fontWeight: 600, color: 'var(--text)', textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.7 : 1 }}>{habit.label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
          <span style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)' }}>{habit.target}</span>
          <span style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)' }}>·</span>
          <span style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)' }}>{habit.time}</span>
          <span className="badge badge-primary" style={{ padding: '1px 6px' }}>
            <span className="material-symbols-outlined icon-sm icon-fill" style={{ fontSize: 10, color: 'var(--tertiary)' }}>local_fire_department</span>
            {habit.streak}d
          </span>
        </div>
      </div>

      {/* Weekly dots */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        {WEEK.map((d, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: weekRow[i] ? habit.color : 'rgba(255,255,255,0.08)',
              boxShadow: weekRow[i] ? `0 0 6px ${habit.color}88` : 'none',
              transition: 'background 0.2s',
            }} />
          </div>
        ))}
      </div>

      <button
        onClick={() => setDone(d => !d)}
        style={{
          width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: done ? habit.color : 'var(--surface-highest)',
          color: done ? '#002113' : 'var(--text-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', flexShrink: 0,
          boxShadow: done ? `0 0 12px ${habit.color}66` : 'none',
        }}
      >
        <span className="material-symbols-outlined icon-sm icon-fill" style={{ fontSize: 16 }}>{done ? 'check_circle' : 'radio_button_unchecked'}</span>
      </button>
    </div>
  )
}

export default function HabitSystem() {
  const [filter, setFilter] = useState('All')
  const categories = ['All', 'Focus', 'Health', 'Mindset']
  const filtered = filter === 'All' ? HABITS : HABITS.filter(h => h.category === filter)
  const doneCount = HABITS.filter(h => h.done).length

  return (
    <main className="page page-enter">
      <div className="page-header fade-up">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">Habit System</h1>
            <p className="page-subtitle">{doneCount}/{HABITS.length} habits complete today</p>
          </div>
          <button className="btn btn-primary">
            <span className="material-symbols-outlined icon-sm">add</span>
            Add Habit
          </button>
        </div>

        {/* Daily progress bar */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Daily Progress</span>
            <span style={{ font: 'var(--text-label-sm)', color: 'var(--primary)' }}>{Math.round(doneCount/HABITS.length*100)}%</span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <div className="progress-bar-fill" style={{ width: `${doneCount/HABITS.length*100}%` }} />
          </div>
        </div>

        {/* Week header */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 5, marginTop: 12, paddingRight: 46 }}>
          {WEEK.map((d, i) => (
            <div key={i} style={{ width: 8, textAlign: 'center', font: 'var(--text-label-sm)', color: 'var(--text-muted)', fontSize: 10 }}>{d}</div>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div className="fade-up" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={filter === c ? 'btn btn-primary' : 'btn btn-ghost'}
            style={{ fontSize: 12, padding: '6px 14px' }}
          >{c}</button>
        ))}
      </div>

      {/* Habit list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((h, i) => (
          <div key={h.id} className={`fade-up d${Math.min(i+1, 5)}`}>
            <HabitRow habit={h} weekRow={weekData[i]} />
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 24 }}>
        {[
          { label: 'Best Streak', value: '12', unit: 'days', icon: 'local_fire_department', color: 'var(--tertiary)' },
          { label: 'Avg Completion', value: '78', unit: '%', icon: 'insights', color: 'var(--primary)' },
          { label: 'This Week', value: '34', unit: '/42', icon: 'calendar_view_week', color: 'var(--secondary)' },
        ].map(s => (
          <div key={s.label} className="card fade-up" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="material-symbols-outlined icon-fill" style={{ color: s.color, fontSize: 22 }}>{s.icon}</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</span>
                <span style={{ font: 'var(--text-label)', color: 'var(--text-muted)' }}>{s.unit}</span>
              </div>
              <div style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
