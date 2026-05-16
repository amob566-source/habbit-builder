import { useState, useEffect, useRef } from 'react'

// ─── Constants ──────────────────────────────────────────────────
const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const CATEGORIES = ['All', 'Focus', 'Health', 'Mindset', 'Fitness', 'Learning']
const HABIT_CATEGORIES = ['Focus', 'Health', 'Mindset', 'Fitness', 'Learning']

const ICON_OPTIONS = [
  'wb_sunny', 'water_drop', 'work', 'self_improvement', 'menu_book', 'ac_unit',
  'fitness_center', 'psychology', 'local_fire_department', 'favorite', 'bolt',
  'music_note', 'directions_run', 'nightlight', 'eco', 'coffee',
  'timer', 'school', 'brush', 'star',
]

const COLOR_OPTIONS = [
  { label: 'Green', value: 'var(--primary)' },
  { label: 'Amber', value: 'var(--tertiary)' },
  { label: 'Blue', value: 'var(--secondary)' },
  { label: 'Rose', value: '#f87171' },
  { label: 'Purple', value: '#c084fc' },
  { label: 'Cyan', value: '#22d3ee' },
]

let nextId = 10

function uid() { return ++nextId }

const INITIAL_HABITS = [
  { id: 1, label: 'Morning Routine', icon: 'wb_sunny', color: 'var(--tertiary)', streak: 12, target: '1x daily', time: '06:30', pct: 100, done: true, category: 'Mindset' },
  { id: 2, label: 'Hydration Protocol', icon: 'water_drop', color: 'var(--secondary)', streak: 8, target: '3L daily', time: 'All day', pct: 100, done: true, category: 'Health' },
  { id: 3, label: 'Deep Work Blocks', icon: 'work', color: 'var(--primary)', streak: 4, target: '3x daily', time: '09:00', pct: 67, done: false, category: 'Focus' },
  { id: 4, label: 'Mobility Routine', icon: 'self_improvement', color: 'var(--primary)', streak: 3, target: '1x daily', time: '18:00', pct: 0, done: false, category: 'Health' },
  { id: 5, label: 'Evening Review', icon: 'menu_book', color: 'var(--secondary)', streak: 9, target: '1x daily', time: '21:00', pct: 0, done: false, category: 'Mindset' },
  { id: 6, label: 'Cold Exposure', icon: 'ac_unit', color: 'var(--secondary)', streak: 2, target: '1x daily', time: '07:00', pct: 100, done: true, category: 'Health' },
]

// generate stable week data per habit id
function makeWeekRow(id) {
  return WEEK.map((_, i) => ((id * 7 + i * 3) % 10) > 3)
}

// ─── Shared Styles ───────────────────────────────────────────────
const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
  padding: '9px 12px', color: 'var(--text)', fontSize: 13,
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}
const labelStyle = {
  fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
  letterSpacing: '0.09em', textTransform: 'uppercase',
  color: 'var(--text-muted)', display: 'block', marginBottom: 6,
}
const btnPrimary = {
  flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none',
  background: 'var(--primary)', color: '#001a10',
  fontWeight: 700, fontSize: 13, cursor: 'pointer',
}
const btnGhost = {
  flex: 1, padding: '10px 16px', borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.1)', background: 'none',
  color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
}
const btnDanger = {
  padding: '10px 16px', borderRadius: 10,
  border: '1px solid rgba(248,113,113,0.25)', background: 'rgba(248,113,113,0.08)',
  color: '#f87171', fontSize: 13, cursor: 'pointer',
}
const btnIconSm = {
  width: 28, height: 28, borderRadius: 7,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
  color: 'var(--text-muted)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
}

// ─── CircleProgress ──────────────────────────────────────────────
function CircleProgress({ pct, size = 44, color = 'var(--primary)' }) {
  const sw = 3
  const r = (size - sw * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={sw} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={sw} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  )
}

// ─── Modal ───────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <style>{`@keyframes modal-in{from{opacity:0;transform:scale(0.92) translateY(8px)}to{opacity:1;transform:none}}`}</style>
      <div style={{
        background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, padding: '28px 28px 24px', width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflowY: 'auto',
        animation: 'modal-in 0.22s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>{title}</span>
          <button onClick={onClose} style={btnIconSm}>
            <span className="material-symbols-outlined icon-sm">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Confirm Modal ───────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onClose }) {
  return (
    <Modal title="Confirm Delete" onClose={onClose}>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={btnGhost} onClick={onClose}>Cancel</button>
        <button style={{ ...btnDanger, flex: 1 }} onClick={onConfirm}>Yes, Delete</button>
      </div>
    </Modal>
  )
}

// ─── Habit Form ──────────────────────────────────────────────────
function HabitForm({ initial, onSave, onDelete, onClose }) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? 'star')
  const [color, setColor] = useState(initial?.color ?? 'var(--primary)')
  const [target, setTarget] = useState(initial?.target ?? '1x daily')
  const [time, setTime] = useState(initial?.time ?? '08:00')
  const [category, setCategory] = useState(initial?.category ?? 'Focus')
  const [streak, setStreak] = useState(initial?.streak ?? 0)
  const [pct, setPct] = useState(initial?.pct ?? 0)

  const valid = label.trim().length > 0

  const save = () => {
    if (!valid) return
    onSave({ label: label.trim(), icon, color, target: target.trim(), time: time.trim(), category, streak: Number(streak), pct: Number(pct), done: pct === 100 })
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Label */}
        <div>
          <label style={labelStyle}>Habit Name</label>
          <input style={inputStyle} value={label} placeholder="e.g. Morning Routine"
            onChange={e => setLabel(e.target.value)} autoFocus />
        </div>

        {/* Target + Time row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Target</label>
            <input style={inputStyle} value={target} placeholder="e.g. 3x daily"
              onChange={e => setTarget(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Time</label>
            <input style={inputStyle} value={time} placeholder="e.g. 09:00"
              onChange={e => setTime(e.target.value)} />
          </div>
        </div>

        {/* Streak + Progress row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Streak (days)</label>
            <input style={inputStyle} type="number" min={0} value={streak}
              onChange={e => setStreak(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Today's Progress — {pct}%</label>
            <input type="range" min={0} max={100} step={1} value={pct}
              onChange={e => setPct(Number(e.target.value))}
              style={{ width: '100%', marginTop: 6, accentColor: color }} />
          </div>
        </div>

        {/* Category */}
        <div>
          <label style={labelStyle}>Category</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {HABIT_CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} style={{
                padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                fontFamily: 'JetBrains Mono, monospace',
                border: `1px solid ${category === c ? color : 'rgba(255,255,255,0.1)'}`,
                background: category === c ? 'rgba(78,222,163,0.08)' : 'rgba(255,255,255,0.02)',
                color: category === c ? color : 'var(--text-muted)',
              }}>{c}</button>
            ))}
          </div>
        </div>

        {/* Icon */}
        <div>
          <label style={labelStyle}>Icon</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ICON_OPTIONS.map(ic => (
              <button key={ic} onClick={() => setIcon(ic)} style={{
                width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${ic === icon ? color : 'rgba(255,255,255,0.1)'}`,
                background: ic === icon ? 'rgba(78,222,163,0.08)' : 'rgba(255,255,255,0.03)',
                color: ic === icon ? color : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined icon-sm">{ic}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label style={labelStyle}>Color</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLOR_OPTIONS.map(c => (
              <button key={c.value} onClick={() => setColor(c.value)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                borderRadius: 8, cursor: 'pointer', fontSize: 12,
                border: `1px solid ${color === c.value ? c.value : 'rgba(255,255,255,0.1)'}`,
                background: color === c.value ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                color: c.value,
              }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.value, flexShrink: 0 }} />
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        {onDelete && (
          <button style={btnDanger} onClick={onDelete}>
            <span className="material-symbols-outlined icon-sm">delete</span>
          </button>
        )}
        <button style={btnGhost} onClick={onClose}>Cancel</button>
        <button
          style={{ ...btnPrimary, opacity: valid ? 1 : 0.5, cursor: valid ? 'pointer' : 'not-allowed' }}
          disabled={!valid} onClick={save}>
          {initial ? 'Save Changes' : 'Create Habit'}
        </button>
      </div>
    </>
  )
}

// ─── HabitRow ────────────────────────────────────────────────────
function HabitRow({ habit, weekRow, onEdit, onToggle }) {
  return (
    <div className="card" style={{
      display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      borderLeft: habit.done ? `3px solid ${habit.color}` : '3px solid transparent',
      transition: 'border-color 0.3s, opacity 0.3s',
      opacity: habit.done ? 0.82 : 1,
    }}>
      {/* Circle */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <CircleProgress pct={habit.done ? 100 : habit.pct} color={habit.color} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined icon-sm" style={{ color: habit.color, fontSize: 14 }}>{habit.icon}</span>
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{
          fontWeight: 600, fontSize: 14, color: 'var(--text)',
          textDecoration: habit.done ? 'line-through' : 'none',
          opacity: habit.done ? 0.65 : 1, transition: 'all 0.2s',
        }}>{habit.label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{habit.target}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>·</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{habit.time}</span>
          <span className="badge badge-primary" style={{ padding: '1px 6px', display: 'flex', alignItems: 'center', gap: 3 }}>
            <span className="material-symbols-outlined icon-fill" style={{ fontSize: 10, color: 'var(--tertiary)' }}>local_fire_department</span>
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{habit.streak}d</span>
          </span>
          <span style={{
            fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em',
            padding: '1px 6px', borderRadius: 99,
            background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)',
          }}>{habit.category}</span>
        </div>
      </div>

      {/* Weekly dots */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        {weekRow.map((done, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: done ? habit.color : 'rgba(255,255,255,0.08)',
            boxShadow: done ? `0 0 6px ${habit.color}88` : 'none',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>

      {/* Edit button */}
      <button
        title="Edit habit"
        onClick={() => onEdit(habit)}
        style={{ ...btnIconSm }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
      >
        <span className="material-symbols-outlined icon-sm">edit</span>
      </button>

      {/* Done toggle */}
      <button
        onClick={() => onToggle(habit.id)}
        style={{
          width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: habit.done ? habit.color : 'var(--surface-highest)',
          color: habit.done ? '#002113' : 'var(--text-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', flexShrink: 0,
          boxShadow: habit.done ? `0 0 12px ${habit.color}66` : 'none',
        }}
      >
        <span className="material-symbols-outlined icon-fill" style={{ fontSize: 16 }}>
          {habit.done ? 'check_circle' : 'radio_button_unchecked'}
        </span>
      </button>
    </div>
  )
}

// ─── Root Component ──────────────────────────────────────────────
export default function HabitSystem() {
  const [habits, setHabits] = useState(INITIAL_HABITS)
  const [weekRows] = useState(() => {
    const map = {}
    INITIAL_HABITS.forEach(h => { map[h.id] = makeWeekRow(h.id) })
    return map
  })
  const [weekRowsState, setWeekRowsState] = useState(weekRows)

  const [filter, setFilter] = useState('All')
  const [addOpen, setAddOpen] = useState(false)
  const [editHabit, setEditHabit] = useState(null)        // habit being edited
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  // ── CRUD ──────────────────────────────────────────────────────
  const addHabit = (data) => {
    const id = uid()
    setHabits(hs => [...hs, { id, ...data }])
    setWeekRowsState(wr => ({ ...wr, [id]: makeWeekRow(id) }))
    setAddOpen(false)
  }

  const saveEdit = (data) => {
    setHabits(hs => hs.map(h => h.id === editHabit.id ? { ...h, ...data } : h))
    setEditHabit(null)
  }

  const deleteHabit = (id) => {
    setHabits(hs => hs.filter(h => h.id !== id))
    setWeekRowsState(wr => { const n = { ...wr }; delete n[id]; return n })
    setConfirmDeleteId(null)
    setEditHabit(null)
  }

  const toggleDone = (id) => {
    setHabits(hs => hs.map(h => h.id === id
      ? { ...h, done: !h.done, pct: !h.done ? 100 : 0 }
      : h
    ))
  }

  // ── Derived ───────────────────────────────────────────────────
  const filtered = filter === 'All' ? habits : habits.filter(h => h.category === filter)
  const doneCount = habits.filter(h => h.done).length

  return (
    <main className="page page-enter">

      {/* ── Header ── */}
      <div className="page-header fade-up">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">Habit System</h1>
            <p className="page-subtitle">{doneCount}/{habits.length} habits complete today</p>
          </div>
          <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
            <span className="material-symbols-outlined icon-sm">add</span>
            Add Habit
          </button>
        </div>

        {/* Daily progress bar */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Daily Progress</span>
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary)' }}>
              {habits.length ? Math.round(doneCount / habits.length * 100) : 0}%
            </span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <div className="progress-bar-fill" style={{ width: `${habits.length ? doneCount / habits.length * 100 : 0}%`, transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {/* Week header */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 5, marginTop: 12, paddingRight: 80 }}>
          {WEEK.map((d, i) => (
            <div key={i} style={{ width: 8, textAlign: 'center', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>{d}</div>
          ))}
        </div>
      </div>

      {/* ── Category Filter ── */}
      <div className="fade-up" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={filter === c ? 'btn btn-primary' : 'btn btn-ghost'}
            style={{ fontSize: 12, padding: '6px 14px' }}>
            {c}
          </button>
        ))}
      </div>

      {/* ── Habit List ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 14,
            color: 'var(--text-muted)', fontSize: 14,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 36, marginBottom: 10, display: 'block', opacity: 0.35 }}>
              {filter === 'All' ? 'check_circle' : 'filter_list'}
            </span>
            {filter === 'All' ? 'No habits yet. Create your first habit!' : `No habits in "${filter}".`}
          </div>
        )}
        {filtered.map((h, i) => (
          <div key={h.id} className={`fade-up d${Math.min(i + 1, 5)}`}>
            <HabitRow
              habit={h}
              weekRow={weekRowsState[h.id] ?? makeWeekRow(h.id)}
              onEdit={setEditHabit}
              onToggle={toggleDone}
            />
          </div>
        ))}
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 24 }}>
        {[
          { label: 'Best Streak', value: habits.length ? Math.max(...habits.map(h => h.streak)) : 0, unit: 'days', icon: 'local_fire_department', color: 'var(--tertiary)' },
          { label: 'Avg Completion', value: habits.length ? Math.round(habits.reduce((s, h) => s + (h.done ? 100 : h.pct), 0) / habits.length) : 0, unit: '%', icon: 'insights', color: 'var(--primary)' },
          { label: 'Total Habits', value: habits.length, unit: '', icon: 'calendar_view_week', color: 'var(--secondary)' },
        ].map(s => (
          <div key={s.label} className="card fade-up" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="material-symbols-outlined icon-fill" style={{ color: s.color, fontSize: 22 }}>{s.icon}</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.unit}</span>
              </div>
              <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Add Habit Modal ── */}
      {addOpen && (
        <Modal title="New Habit" onClose={() => setAddOpen(false)}>
          <HabitForm onClose={() => setAddOpen(false)} onSave={addHabit} />
        </Modal>
      )}

      {/* ── Edit Habit Modal ── */}
      {editHabit && (
        <Modal title="Edit Habit" onClose={() => setEditHabit(null)}>
          <HabitForm
            initial={editHabit}
            onClose={() => setEditHabit(null)}
            onDelete={() => { setEditHabit(null); setConfirmDeleteId(editHabit.id) }}
            onSave={saveEdit}
          />
        </Modal>
      )}

      {/* ── Confirm Delete ── */}
      {confirmDeleteId && (
        <ConfirmModal
          message={`Delete "${habits.find(h => h.id === confirmDeleteId)?.label}"? This cannot be undone.`}
          onClose={() => setConfirmDeleteId(null)}
          onConfirm={() => deleteHabit(confirmDeleteId)}
        />
      )}
    </main>
  )
}