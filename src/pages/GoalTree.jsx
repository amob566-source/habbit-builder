import { useState, useEffect } from 'react'
import { getGoals, createGoal, updateGoal as apiUpdateGoal } from '../services/api'

const ICON_OPTIONS = [
  'code', 'fitness_center', 'psychology', 'star', 'rocket_launch', 'bolt',
  'school', 'book', 'brush', 'music_note', 'science', 'eco',
  'account_balance', 'favorite', 'flag', 'emoji_events',
  'self_improvement', 'diversity_3', 'lightbulb', 'hub',
]

const COLOR_OPTIONS = [
  { label: 'Green', value: 'var(--primary)' },
  { label: 'Amber', value: 'var(--tertiary)' },
  { label: 'Blue', value: 'var(--secondary)' },
  { label: 'Rose', value: '#f87171' },
  { label: 'Purple', value: '#c084fc' },
  { label: 'Cyan', value: '#22d3ee' },
]

const STATUS_OPTIONS = ['active', 'pending', 'done', 'locked']

// ─── Helpers ────────────────────────────────────────────────────
function calcParentPct(children) {
  if (!children.length) return 0
  return Math.round(children.reduce((s, c) => s + c.pct, 0) / children.length)
}

// ─── Circular Progress ─────────────────────────────────────────
function CircleProgress({ pct, size = 52, strokeWidth = 3.5, color = 'var(--primary)' }) {
  const r = (size - strokeWidth * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
    </svg>
  )
}

// ─── Status Badge ──────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    active: { label: 'Active', bg: 'rgba(78,222,163,0.1)', color: 'var(--primary)', border: 'rgba(78,222,163,0.25)' },
    done: { label: 'Complete', bg: 'rgba(78,222,163,0.06)', color: 'var(--text-muted)', border: 'var(--border)' },
    pending: { label: 'Queued', bg: 'rgba(173,198,255,0.08)', color: 'var(--secondary)', border: 'rgba(173,198,255,0.2)' },
    locked: { label: 'Locked', bg: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: 'var(--border)' },
  }
  const s = map[status] || map.pending
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 9999, whiteSpace: 'nowrap',
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em',
    }}>{s.label}</span>
  )
}

// ─── Modal ─────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}>
      <div style={{
        background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, padding: '28px 28px 24px', width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflowY: 'auto',
        animation: 'modal-in 0.22s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <style>{`@keyframes modal-in{from{opacity:0;transform:scale(0.92) translateY(8px)}to{opacity:1;transform:none}}`}</style>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>{title}</span>
          <button onClick={onClose} style={btnIcon}><span className="material-symbols-outlined icon-sm">close</span></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Shared inline styles ──────────────────────────────────────
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
const btnIcon = {
  width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
}

// ─── Goal Form (create & edit parent goal) ─────────────────────
function GoalForm({ initial, onSave, onDelete, onClose }) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? 'star')
  const [color, setColor] = useState(initial?.color ?? 'var(--primary)')
  const [pct, setPct] = useState(initial?.pct ?? 0)

  const valid = label.trim().length > 0

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Goal Title</label>
          <input
            style={inputStyle} value={label} placeholder="e.g. Technical Mastery"
            onChange={e => setLabel(e.target.value)} autoFocus
          />
        </div>

        <div>
          <label style={labelStyle}>Overall Progress — {pct}%</label>
          <input type="range" min={0} max={100} value={pct}
            onChange={e => setPct(Number(e.target.value))}
            style={{ width: '100%', accentColor: color }} />
        </div>

        <div>
          <label style={labelStyle}>Icon</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ICON_OPTIONS.map(ic => (
              <button key={ic} onClick={() => setIcon(ic)} style={{
                width: 36, height: 36, borderRadius: 8, border: `1px solid ${ic === icon ? color : 'rgba(255,255,255,0.1)'}`,
                background: ic === icon ? `rgba(78,222,163,0.1)` : 'rgba(255,255,255,0.03)',
                color: ic === icon ? color : 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined icon-sm">{ic}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Color</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLOR_OPTIONS.map(c => (
              <button key={c.value} onClick={() => setColor(c.value)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                borderRadius: 8, border: `1px solid ${color === c.value ? c.value : 'rgba(255,255,255,0.1)'}`,
                background: color === c.value ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                color: c.value, cursor: 'pointer', fontSize: 12,
              }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.value, flexShrink: 0 }} />
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        {onDelete && (
          <button style={btnDanger} onClick={onDelete}>
            <span className="material-symbols-outlined icon-sm">delete</span>
          </button>
        )}
        <button style={btnGhost} onClick={onClose}>Cancel</button>
        <button
          style={{ ...btnPrimary, background: valid ? 'var(--primary)' : 'rgba(255,255,255,0.08)', color: valid ? '#001a10' : 'var(--text-muted)', cursor: valid ? 'pointer' : 'not-allowed' }}
          disabled={!valid}
          onClick={() => valid && onSave({ label: label.trim(), icon, color, pct })}>
          {initial ? 'Save Changes' : 'Create Goal'}
        </button>
      </div>
    </>
  )
}

// ─── Sub-Goal Form ─────────────────────────────────────────────
function SubGoalForm({ initial, goalColor, onSave, onDelete, onClose }) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [sub, setSub] = useState(initial?.sub ?? '')
  const [pct, setPct] = useState(initial?.pct ?? 0)
  const [status, setStatus] = useState(initial?.status ?? 'active')

  const valid = label.trim().length > 0

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Sub-Goal Title</label>
          <input style={inputStyle} value={label} placeholder="e.g. API Design Patterns"
            onChange={e => setLabel(e.target.value)} autoFocus />
        </div>
        <div>
          <label style={labelStyle}>Description / Note</label>
          <input style={inputStyle} value={sub} placeholder="e.g. In Progress · Q2"
            onChange={e => setSub(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Progress — {pct}%</label>
          <input type="range" min={0} max={100} value={pct}
            onChange={e => setPct(Number(e.target.value))}
            style={{ width: '100%', accentColor: goalColor ?? 'var(--primary)' }} />
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={() => setStatus(s)} style={{
                padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${status === s ? (goalColor ?? 'var(--primary)') : 'rgba(255,255,255,0.1)'}`,
                background: status === s ? 'rgba(78,222,163,0.08)' : 'rgba(255,255,255,0.02)',
                color: status === s ? (goalColor ?? 'var(--primary)') : 'var(--text-muted)',
                fontSize: 12, fontFamily: 'JetBrains Mono, monospace', textTransform: 'capitalize',
              }}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        {onDelete && (
          <button style={btnDanger} onClick={onDelete}>
            <span className="material-symbols-outlined icon-sm">delete</span>
          </button>
        )}
        <button style={btnGhost} onClick={onClose}>Cancel</button>
        <button
          style={{ ...btnPrimary, background: valid ? 'var(--primary)' : 'rgba(255,255,255,0.08)', color: valid ? '#001a10' : 'var(--text-muted)', cursor: valid ? 'pointer' : 'not-allowed' }}
          disabled={!valid}
          onClick={() => valid && onSave({ label: label.trim(), sub: sub.trim(), pct, status })}>
          {initial ? 'Save Changes' : 'Add Sub-Goal'}
        </button>
      </div>
    </>
  )
}

// ─── Confirm Dialog ────────────────────────────────────────────
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

// ─── GoalNode ──────────────────────────────────────────────────
function GoalNode({ goal, onUpdateGoal, onDeleteGoal, onAddSubGoal, onUpdateSubGoal, onDeleteSubGoal }) {
  const [open, setOpen] = useState(true)
  const [editGoalOpen, setEditGoalOpen] = useState(false)
  const [addSubOpen, setAddSubOpen] = useState(false)
  const [editSubId, setEditSubId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const editingSub = goal.children.find(c => c.id === editSubId)

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ── Parent Card ── */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
          <CircleProgress pct={goal.pct} color={goal.color} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined icon-sm icon-fill" style={{ color: goal.color }}>{goal.icon}</span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{goal.label}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
            {goal.pct}% complete · {goal.children.length} sub-goals
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button title="Edit Goal" onClick={() => setEditGoalOpen(true)} style={btnIcon}>
            <span className="material-symbols-outlined icon-sm">edit</span>
          </button>
          <button title="Add Sub-Goal" onClick={() => setAddSubOpen(true)} style={{ ...btnIcon, color: 'var(--primary)', borderColor: 'rgba(78,222,163,0.25)' }}>
            <span className="material-symbols-outlined icon-sm">add</span>
          </button>
          <button title={open ? 'Collapse' : 'Expand'} onClick={() => setOpen(o => !o)} style={btnIcon}>
            <span className="material-symbols-outlined icon-sm" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>expand_more</span>
          </button>
        </div>
      </div>

      {/* ── Children ── */}
      {open && (
        <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 24, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />

          {goal.children.map(child => (
            <div key={child.id} className="card" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              opacity: child.status === 'locked' ? 0.5 : 1,
              marginLeft: 20, position: 'relative',
              transition: 'opacity 0.2s',
            }}>
              <div style={{
                position: 'absolute', left: -24, top: '50%', transform: 'translateY(-50%)',
                width: 8, height: 8, borderRadius: '50%',
                background: child.status === 'done' ? 'var(--primary)' : '#2a2a2a',
                border: `2px solid ${child.status === 'active' ? goal.color : 'rgba(255,255,255,0.18)'}`,
                flexShrink: 0,
              }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{child.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>{child.sub}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: goal.color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{child.pct}%</div>
                  <div style={{ width: 72, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 99, marginTop: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${child.pct}%`, background: goal.color, borderRadius: 99, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
                <StatusBadge status={child.status} />
              </div>

              <button title="Edit Sub-Goal" onClick={() => setEditSubId(child.id)} style={{ ...btnIcon, flexShrink: 0 }}>
                <span className="material-symbols-outlined icon-sm">edit</span>
              </button>
            </div>
          ))}

          <button onClick={() => setAddSubOpen(true)} style={{
            marginLeft: 20, display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--text-muted)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace',
            background: 'none', border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
            transition: 'all 0.2s', letterSpacing: '0.04em',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(78,222,163,0.35)'; e.currentTarget.style.color = 'var(--primary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            <span className="material-symbols-outlined icon-sm">add</span>Add sub-goal
          </button>
        </div>
      )}

      {/* ── Modals ── */}
      {editGoalOpen && (
        <Modal title="Edit Goal" onClose={() => setEditGoalOpen(false)}>
          <GoalForm
            initial={goal}
            onClose={() => setEditGoalOpen(false)}
            onDelete={() => { setEditGoalOpen(false); setConfirmDelete('goal') }}
            onSave={data => { onUpdateGoal(goal.id, data); setEditGoalOpen(false) }}
          />
        </Modal>
      )}

      {addSubOpen && (
        <Modal title="Add Sub-Goal" onClose={() => setAddSubOpen(false)}>
          <SubGoalForm
            goalColor={goal.color}
            onClose={() => setAddSubOpen(false)}
            onSave={data => { onAddSubGoal(goal.id, data); setAddSubOpen(false) }}
          />
        </Modal>
      )}

      {editSubId && editingSub && (
        <Modal title="Edit Sub-Goal" onClose={() => setEditSubId(null)}>
          <SubGoalForm
            initial={editingSub}
            goalColor={goal.color}
            onClose={() => setEditSubId(null)}
            onDelete={() => { setEditSubId(null); setConfirmDelete(editSubId) }}
            onSave={data => { onUpdateSubGoal(goal.id, editSubId, data); setEditSubId(null) }}
          />
        </Modal>
      )}

      {confirmDelete === 'goal' && (
        <ConfirmModal
          message={`Delete "${goal.label}" and all its sub-goals? This cannot be undone.`}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => { onDeleteGoal(goal.id); setConfirmDelete(null) }}
        />
      )}

      {typeof confirmDelete === 'number' && (
        <ConfirmModal
          message={`Delete "${goal.children.find(c => c.id === confirmDelete)?.label}"? This cannot be undone.`}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => { onDeleteSubGoal(goal.id, confirmDelete); setConfirmDelete(null) }}
        />
      )}
    </div>
  )
}

// ─── Root Component ─────────────────────────────────────────────
export default function GoalTree() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [addGoalOpen, setAddGoalOpen] = useState(false)

  // ── Fetch goals from backend on mount ─────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const data = await getGoals()
        const list = (Array.isArray(data) ? data : []).map(g => ({
          ...g,
          label: g.title ?? g.label,
          children: g.children ? (typeof g.children === 'string' ? JSON.parse(g.children) : g.children) : [],
          pct: typeof g.pct === 'number' ? g.pct : (g.pct ? Number(g.pct) : 0),
        }))
        setGoals(list)
      } catch (err) {
        setError(err.message || String(err))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // ── CRUD helpers ──────────────────────────────────────────────

  // Persist parent-goal edits and update local state
  const updateGoal = async (goalId, data) => {
    try {
      // map UI fields to API fields
      const payload = {
        title: data.label ?? data.title,
        description: data.description ?? '',
        priority: data.priority ?? null,
        status: data.status ?? 'active',
        children: JSON.stringify(data.children ?? []),
        pct: data.pct ?? 0,
      }
      const updated = await apiUpdateGoal(goalId, payload)
      // normalize returned row to UI shape
      setGoals(gs => gs.map(g => g.id === goalId ? {
        ...g,
        label: updated.title ?? payload.title,
        description: updated.description ?? payload.description,
        color: updated.color ?? g.color,
        icon: updated.icon ?? g.icon,
        children: updated.children ? (typeof updated.children === 'string' ? JSON.parse(updated.children) : updated.children) : (data.children ?? []),
        pct: typeof updated.pct === 'number' ? updated.pct : payload.pct,
      } : g))
    } catch (err) {
      console.error('Failed to update goal:', err)
    }
  }

  // Local-only delete (no DELETE endpoint in the spec)
  const deleteGoal = async (goalId) => {
    try {
      // optimistic update
      setGoals(gs => gs.filter(g => g.id !== goalId))
      await fetch(`/api/goals/${goalId}`, { method: 'DELETE' })
    } catch (err) {
      console.error('Failed to delete goal:', err)
    }
  }

  // Persist new sub-goal by saving the whole updated parent goal
  const addSubGoal = async (goalId, data) => {
    setGoals(gs => {
      const next = gs.map(g => {
        if (g.id !== goalId) return g
        const children = [...g.children, { id: Date.now(), ...data }]
        return { ...g, children, pct: calcParentPct(children) }
      })
      const parent = next.find(g => g.id === goalId)
      if (parent) {
        // persist parent children/pct
        apiUpdateGoal(goalId, { children: JSON.stringify(parent.children), pct: parent.pct }).catch(console.error)
      }
      return next
    })
  }

  // Persist sub-goal edit by saving the whole updated parent goal
  const updateSubGoal = async (goalId, subId, data) => {
    setGoals(gs => {
      const next = gs.map(g => {
        if (g.id !== goalId) return g
        const children = g.children.map(c => c.id === subId ? { ...c, ...data } : c)
        return { ...g, children, pct: calcParentPct(children) }
      })
      const parent = next.find(g => g.id === goalId)
      if (parent) apiUpdateGoal(goalId, { children: JSON.stringify(parent.children), pct: parent.pct }).catch(console.error)
      return next
    })
  }

  // Local-only sub-goal delete, then persist parent
  const deleteSubGoal = (goalId, subId) => {
    setGoals(gs => {
      const next = gs.map(g => {
        if (g.id !== goalId) return g
        const children = g.children.filter(c => c.id !== subId)
        return { ...g, children, pct: calcParentPct(children) }
      })
      const parent = next.find(g => g.id === goalId)
      if (parent) apiUpdateGoal(goalId, { children: JSON.stringify(parent.children), pct: parent.pct }).catch(console.error)
      return next
    })
  }

  // Persist new top-level goal via POST
  const addGoal = async (data) => {
    try {
      const payload = {
        title: data.label,
        description: data.description ?? '',
        priority: data.priority ?? null,
        children: JSON.stringify([]),
        pct: data.pct ?? 0,
      }
      const created = await createGoal(payload)
      setGoals(gs => [...gs, {
        ...created,
        label: created.title ?? data.label,
        children: created.children ? (typeof created.children === 'string' ? JSON.parse(created.children) : created.children) : [],
        pct: typeof created.pct === 'number' ? created.pct : data.pct ?? 0,
      }])
    } catch (err) {
      console.error('Failed to create goal:', err)
    } finally {
      setAddGoalOpen(false)
    }
  }

  // ── Summary stats ─────────────────────────────────────────────
  const allSubs = goals.flatMap(g => g.children)
  const activeCount = allSubs.filter(c => c.status === 'active').length
  const doneCount = allSubs.filter(c => c.status === 'done').length
  const lockedCount = allSubs.filter(c => c.status === 'locked').length

  return (
    <main className="page page-enter">
      {/* ── Page Header ── */}
      <div className="page-header fade-up">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">Goal Tree</h1>
            <p className="page-subtitle">Your hierarchical growth structure — track every node.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setAddGoalOpen(true)}>
            <span className="material-symbols-outlined icon-sm">add</span>
            Add Goal
          </button>
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Active Goals', value: activeCount, color: 'var(--primary)' },
            { label: 'Completed', value: doneCount, color: 'var(--text-muted)' },
            { label: 'Locked', value: lockedCount, color: 'var(--text-muted)' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Loading / Error ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)', fontSize: 14 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 36, marginBottom: 10, display: 'block', opacity: 0.4 }}>hourglass_empty</span>
          Loading goals…
        </div>
      )}
      {error && (
        <div style={{
          padding: '14px 18px', borderRadius: 12, marginBottom: 16,
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
          color: '#f87171', fontSize: 13,
        }}>
          Failed to load goals: {error}
        </div>
      )}

      {/* ── Goal List ── */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {goals.length === 0 && !error && (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16,
              color: 'var(--text-muted)', fontSize: 14,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, marginBottom: 12, display: 'block', opacity: 0.4 }}>account_tree</span>
              No goals yet. Add your first goal to get started.
            </div>
          )}
          {goals.map(g => (
            <GoalNode
              key={g.id}
              goal={g}
              onUpdateGoal={updateGoal}
              onDeleteGoal={deleteGoal}
              onAddSubGoal={addSubGoal}
              onUpdateSubGoal={updateSubGoal}
              onDeleteSubGoal={deleteSubGoal}
            />
          ))}
        </div>
      )}

      {/* ── Add Goal Modal ── */}
      {addGoalOpen && (
        <Modal title="Create New Goal" onClose={() => setAddGoalOpen(false)}>
          <GoalForm
            onClose={() => setAddGoalOpen(false)}
            onSave={addGoal}
          />
        </Modal>
      )}
    </main>
  )
}