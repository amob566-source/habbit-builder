import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHabits, getGoals, getAnalytics, generateAISequence, updateHabit } from '../services/api'

// ─── helpers ────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getDayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: 'long' })
}

// Map a backend habit to the props HabitItem expects
function habitToItemProps(habit) {
  const completed = !!habit.done
  const pct = completed ? 100 : habit.pct ?? 0
  const sub = completed
    ? `Completed${habit.lastCompletedAt ? ' · ' + new Date(habit.lastCompletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`
    : habit.target
      ? `${habit.target}${habit.time ? ' · ' + habit.time : ''}`
      : habit.time
        ? `Scheduled ${habit.time}`
        : habit.category ?? ''
  return {
    id: habit.id,
    label: habit.title,
    status: completed ? 'done' : 'active',
    pct,
    sub,
    done: completed,
  }
}

// Derive summary stats from a habits array
function buildStats(habits) {
  const done = habits.filter(h => !!h.done).length
  const total = habits.length
  const focusHrs = 0
  return { done, total, focusHrs }
}

// ─── sub-components ──────────────────────────────────────────────────────────

function CircleProgress({ pct, size = 40, strokeWidth = 3, color = 'var(--primary)' }) {
  const r = (size - strokeWidth * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  )
}

function HabitItem({ id, label, status, pct, sub, action, onClick }) {
  const done = status === 'done'
  const active = status === 'active'
  return (
    <div
      className="card fade-up d2"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        borderLeft: active ? '3px solid var(--primary)' : done ? '3px solid transparent' : undefined,
        opacity: done ? 0.55 : 1,
        position: 'relative', overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {active && <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 60,
        background: 'linear-gradient(to right, rgba(78,222,163,0.08), transparent)',
        pointerEvents: 'none',
      }} />}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <CircleProgress pct={pct} size={40} />
        <span style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontFamily: 'var(--font-mono)', color: done ? 'var(--text-muted)' : 'var(--primary)',
        }}>{done ? '✓' : pct === 0 ? '' : `${pct}%`}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: 'var(--text-body)', fontWeight: 500, color: 'var(--text)', textDecoration: done ? 'line-through' : 'none' }}>{label}</div>
        <div style={{ font: 'var(--text-label-sm)', color: active ? 'var(--primary)' : 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
      </div>
      {action && (
        <button
          className="btn btn-ghost"
          style={{ fontSize: 11, padding: '6px 12px', flexShrink: 0 }}
          onClick={e => { e.stopPropagation(); onClick && onClick() }}
        >{action}</button>
      )}
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()

  const [habits, setHabits] = useState([])
  const [goals, setGoals] = useState([])
  const [aiSequence, setAiSequence] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    Promise.allSettled([getHabits('all'), getGoals(), getAnalytics()])
      .then(([habitsRes, goalsRes, analyticsRes]) => {
        if (habitsRes.status === 'fulfilled') setHabits(habitsRes.value ?? [])
        if (goalsRes.status === 'fulfilled') setGoals(goalsRes.value ?? [])
        if (analyticsRes.status === 'fulfilled') {
          const daily = analyticsRes.value?.daily ?? []
          let count = 0
          for (let i = daily.length - 1; i >= 0; i -= 1) {
            if (daily[i].completed > 0) count += 1
            else break
          }
          setStreak(count)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Dashboard load error:', err)
        setLoading(false)
      })
  }, [])

  async function handleAIOverview() {
    setAiLoading(true)
    try {
      const data = await generateAISequence()
      setAiSequence(data)
    } catch (err) {
      console.error('AI sequence error:', err)
    } finally {
      setAiLoading(false)
    }
  }

  async function handleHabitToggle(id) {
    const current = habits.find(h => h.id === id)
    if (!current) return

    const updatedHabit = {
      ...current,
      done: current.done ? 0 : 1,
      pct: current.done ? 0 : 100,
    }

    setHabits(hs => hs.map(h => h.id === id ? updatedHabit : h))

    try {
      const persisted = await updateHabit(id, {
        title: updatedHabit.title,
        description: updatedHabit.description ?? '',
        frequency: updatedHabit.frequency ?? updatedHabit.target ?? null,
        icon: updatedHabit.icon ?? null,
        color: updatedHabit.color ?? null,
        target: updatedHabit.target ?? null,
        time: updatedHabit.time ?? null,
        category: updatedHabit.category ?? null,
        streak: updatedHabit.streak ?? 0,
        pct: updatedHabit.pct ?? 0,
        done: updatedHabit.done ? 1 : 0,
      })
      setHabits(hs => hs.map(h => h.id === id ? { ...h, ...persisted } : h))
    } catch (err) {
      console.error('Failed to toggle habit:', err)
    }
  }

  function handleTaskClick(taskId) {
    if (taskId) navigate(`/focus/${taskId}`)
  }

  // Derived display data
  const stats = buildStats(habits)
  const habitProps = habits.map(habitToItemProps)

  // AI insights: prefer backend response, otherwise show static fallback
  const insights = aiSequence?.insights ?? [
    { color: 'var(--secondary)', text: 'You tend to experience a 15% drop in focus retention after 2PM. Consider scheduling low-cognitive tasks next.' },
    { color: 'var(--primary)', text: 'Consistent completion of Morning Routine nodes is correlating strongly with higher daily Momentum scores (+12%).' },
  ]

  // Sequence items: prefer backend response, otherwise show static fallback
  const sequenceItems = aiSequence?.sequence ?? [
    { time: '14:00 – 15:30', label: 'Deep Work: Architecture', active: true },
    { time: '16:00 – 16:30', label: 'System Review', active: false },
    { time: '18:00 – 18:30', label: 'Mobility Routine', active: false },
  ]

  const momentumScore = aiSequence?.momentumScore ?? Math.round((stats.done / Math.max(stats.total, 1)) * 100)
  const energyPct = aiSequence?.energyPct ?? momentumScore
  const energyLabel = energyPct >= 80 ? 'Optimal' : energyPct >= 50 ? 'Moderate' : 'Low'
  const energyDesc = aiSequence?.energyDesc ?? 'Energy levels are stable. Ideal conditions for executing remaining Deep Work block.'

  const statCards = [
    { label: 'Momentum Score', value: String(momentumScore), unit: '%', color: 'var(--primary)', icon: 'trending_up' },
    { label: 'Habits Done', value: String(stats.done), unit: `/${stats.total || 5}`, color: 'var(--secondary)', icon: 'check_circle' },
    { label: 'Focus Time', value: stats.focusHrs > 0 ? stats.focusHrs.toFixed(1) : '—', unit: 'hrs', color: 'var(--tertiary)', icon: 'timer' },
    { label: 'Streak', value: String(streak || 4), unit: 'days', color: 'var(--tertiary)', icon: 'local_fire_department' },
  ]

  return (
    <main className="page page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="page-header fade-up">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="badge badge-primary" style={{ marginBottom: 10 }}>
              <span className="material-symbols-outlined icon-sm icon-fill">local_fire_department</span>
              {streak || 4} Day Streak
            </div>
            <h1 className="page-title">{getGreeting()}, User</h1>
            <p className="page-subtitle">{getDayLabel()} · System Status: {loading ? 'Loading…' : 'Optimal'}</p>
          </div>
          <button
            className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={handleAIOverview}
            disabled={aiLoading}
          >
            <span className="material-symbols-outlined icon-sm">auto_awesome</span>
            {aiLoading ? 'Generating…' : 'AI Overview'}
          </button>
        </div>
      </div>

      {/* Momentum + stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {statCards.map((s, i) => (
          <div key={s.label} className={`card fade-up d${i + 1}`} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
              <span className="material-symbols-outlined icon-sm" style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
              <span style={{ font: 'var(--text-label)', color: 'var(--text-muted)' }}>{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Two-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(260px, 360px)', gap: 20, alignItems: 'start' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          {/* Today's Habits / Tasks */}
          <section>
            <div className="card-title fade-up"><span className="material-symbols-outlined icon-sm">checklist</span> Today's Habits</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loading ? (
                <div className="card fade-up d2" style={{ color: 'var(--text-muted)', font: 'var(--text-body)' }}>Loading habits…</div>
              ) : habitProps.length > 0 ? (
                habitProps.map(h => (
                  <HabitItem
                    key={h.id}
                    {...h}
                    action={h.done ? 'Undo' : 'Complete'}
                    onClick={() => handleHabitToggle(h.id)}
                  />
                ))
              ) : (
                // Static fallback when backend has no habits yet
                <>
                  <HabitItem label="Morning Routine" status="done" pct={100} sub="Completed · 06:30" />
                  <HabitItem label="Hydration Protocol" status="done" pct={100} sub="3/3 Liters completed" />
                  <HabitItem label="Deep Work Blocks" status="active" pct={60} sub="In progress · 2/3 Sessions" action="Log Session" />
                  <HabitItem label="Mobility Routine" status="pending" pct={0} sub="0/1 Session · Scheduled 18:00" />
                  <HabitItem label="Evening Review" status="pending" pct={0} sub="Scheduled 21:00" />
                </>
              )}
            </div>
          </section>

          {/* System Energy */}
          <div className="card fade-up d3">
            <div className="card-title"><span className="material-symbols-outlined icon-sm">battery_charging_full</span> System Energy</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ font: 'var(--text-h3)', color: 'var(--text)' }}>{energyLabel}</span>
              <span style={{ font: 'var(--text-mono)', color: 'var(--primary)' }}>{energyPct}%</span>
            </div>
            <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${energyPct}%` }} /></div>
            <p style={{ font: 'var(--text-body)', color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.6 }}>
              {energyDesc}
            </p>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* AI Insights */}
          <div className="card glass fade-up d2" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -24, right: -24, width: 96, height: 96, background: 'rgba(173,198,255,0.06)', borderRadius: '50%', filter: 'blur(24px)', pointerEvents: 'none' }} />
            <div className="card-title" style={{ color: 'var(--secondary)' }}><span className="material-symbols-outlined icon-sm">psychology</span> Nexus Insights</div>
            {aiLoading ? (
              <p style={{ font: 'var(--text-body)', color: 'var(--text-muted)' }}>Generating insights…</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {insights.map((ins, i) => (
                  <div key={i}>
                    {i > 0 && <div className="divider" style={{ marginBottom: 14 }} />}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ marginTop: 5, width: 7, height: 7, borderRadius: '50%', background: ins.color, flexShrink: 0, boxShadow: `0 0 8px ${ins.color}99` }} />
                      <p style={{ font: 'var(--text-body)', color: 'var(--text)', lineHeight: 1.6 }}>{ins.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Sequence */}
          <div className="card fade-up d3">
            <div className="card-title"><span className="material-symbols-outlined icon-sm">schedule</span> Upcoming Sequence</div>
            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 10, top: 4, bottom: 4, width: 2, background: 'var(--border)' }} />
              {sequenceItems.map((item, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', gap: 16, padding: '10px 0', alignItems: 'flex-start', position: 'relative', zIndex: 1, cursor: item.taskId ? 'pointer' : 'default' }}
                  onClick={() => item.taskId && handleTaskClick(item.taskId)}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: 'var(--surface-lowest)',
                    border: `2px solid ${item.active ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item.active && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />}
                  </div>
                  <div style={{ opacity: item.active ? 1 : 0.6 }}>
                    <div style={{ font: 'var(--text-label-sm)', color: item.active ? 'var(--primary)' : 'var(--text-muted)', marginBottom: 2 }}>{item.time}</div>
                    <div style={{ font: 'var(--text-body)', color: 'var(--text)', fontWeight: 500 }}>{item.label}</div>
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