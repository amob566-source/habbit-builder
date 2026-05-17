import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'

const BASE_URL = 'http://localhost:3001'

async function getTask(id) {
  const res = await fetch(`${BASE_URL}/api/tasks/${id}`)
  if (!res.ok) throw new Error('Failed to fetch task')
  return res.json()
}

async function completeTask(id) {
  const res = await fetch(`${BASE_URL}/api/tasks/${id}/complete`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to complete task')
  return res.json()
}

const TOTAL_SESSIONS = 4

const TIMER_PRESETS = [
  { label: '15m', seconds: 15 * 60 },
  { label: '25m', seconds: 25 * 60 },
  { label: '30m', seconds: 30 * 60 },
  { label: '45m', seconds: 45 * 60 },
  { label: 'Custom', seconds: null },
]

const SOUNDS = [
  { id: 'none',  icon: 'volume_off',            label: 'Silent' },
  { id: 'rain',  icon: 'rainy',                 label: 'Rain'   },
  { id: 'wind',  icon: 'air',                   label: 'Wind'   },
  { id: 'cafe',  icon: 'local_cafe',            label: 'Café'   },
  { id: 'fire',  icon: 'local_fire_department', label: 'Fire'   },
]

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/* ── Web Audio ─────────────────────────────────────────────────────────────── */
function buildAudio(id, vol) {
  if (id === 'none') return null
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const master = ctx.createGain()
  master.gain.value = vol
  master.connect(ctx.destination)

  const mkBuf = () => {
    const n = ctx.sampleRate * 2
    const buf = ctx.createBuffer(1, n, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
    return buf
  }
  const noise = () => { const s = ctx.createBufferSource(); s.buffer = mkBuf(); s.loop = true; return s }

  let stopFn
  if (id === 'rain') {
    const s = noise(); const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.3
    const g = ctx.createGain(); g.gain.value = 0.5
    s.connect(f); f.connect(g); g.connect(master); s.start()
    stopFn = () => { try { s.stop() } catch {} }
  } else if (id === 'wind') {
    const s = noise(); const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400
    const g = ctx.createGain(); g.gain.value = 0.65
    const lfo = ctx.createOscillator(); const lg = ctx.createGain()
    lfo.frequency.value = 0.15; lg.gain.value = 0.15; lfo.connect(lg); lg.connect(g.gain); lfo.start()
    s.connect(f); f.connect(g); g.connect(master); s.start()
    stopFn = () => { try { s.stop(); lfo.stop() } catch {} }
  } else if (id === 'cafe') {
    const srcs = [0, 1, 2].map(i => {
      const s = noise(); const f = ctx.createBiquadFilter(); f.type = 'bandpass'
      f.frequency.value = 300 + i * 600; f.Q.value = 0.8 + i * 0.3
      const g = ctx.createGain(); g.gain.value = 0.35
      s.connect(f); f.connect(g); g.connect(master); s.start(ctx.currentTime + i * 0.3)
      return s
    })
    stopFn = () => srcs.forEach(s => { try { s.stop() } catch {} })
  } else if (id === 'fire') {
    const s1 = noise(); const s2 = noise()
    const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 800; f1.Q.value = 0.5
    const f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = 200
    const g1 = ctx.createGain(); g1.gain.value = 0.4; const g2 = ctx.createGain(); g2.gain.value = 0.35
    s1.connect(f1); f1.connect(g1); g1.connect(master)
    s2.connect(f2); f2.connect(g2); g2.connect(master)
    s1.start(); s2.start()
    stopFn = () => { try { s1.stop(); s2.stop() } catch {} }
  }
  return { ctx, master, stop: stopFn }
}

/* ── Component ─────────────────────────────────────────────────────────────── */
export default function FocusMode() {
  const { taskId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  // Objective — seeded from route state if available, otherwise fetched
  const [objTitle,    setObjTitle]    = useState(location.state?.title ?? 'Architect Core API')
  const [objDesc,     setObjDesc]     = useState(location.state?.description ?? 'Deep work session focused on finalizing routing logic and authentication middleware.')
  const [editing,     setEditing]     = useState(false)
  const [draftTitle,  setDraftTitle]  = useState('')
  const [draftDesc,   setDraftDesc]   = useState('')

  // Task loading / completion state
  const [taskLoading,   setTaskLoading]   = useState(!!taskId)
  const [completing,    setCompleting]    = useState(false)
  const [completed,     setCompleted]     = useState(false)
  const [completeError, setCompleteError] = useState(null)

  // Timer
  const [selectedPreset, setSelectedPreset] = useState(1)
  const [customMinutes,  setCustomMinutes]  = useState('')
  const [showCustom,     setShowCustom]     = useState(false)
  const [total,    setTotal]   = useState(25 * 60)
  const [seconds,  setSeconds] = useState(25 * 60)
  const [running,  setRunning] = useState(false)
  const [session,  setSession] = useState(1)

  // Sound
  const [sound,  setSound]  = useState('rain')
  const [volume, setVolume] = useState(0.7)
  const audioRef    = useRef(null)
  const intervalRef = useRef(null)

  /* ── Fetch task from backend ── */
  useEffect(() => {
    if (!taskId) return
    setTaskLoading(true)
    getTask(taskId)
      .then(task => {
        if (task.title)       setObjTitle(task.title)
        if (task.description) setObjDesc(task.description)
        if (task.completed)   setCompleted(true)
      })
      .catch(err => console.error('Failed to load task:', err))
      .finally(() => setTaskLoading(false))
  }, [taskId])

  /* ── Complete task handler ── */
  const handleCompleteTask = () => {
    if (!taskId || completing || completed) return
    setCompleting(true)
    setCompleteError(null)
    completeTask(taskId)
      .then(() => {
        setCompleted(true)
        setRunning(false)
      })
      .catch(err => {
        console.error('Failed to complete task:', err)
        setCompleteError('Could not mark complete. Try again.')
      })
      .finally(() => setCompleting(false))
  }

  /* ── Audio ── */
  const stopAudio = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.stop?.()
    try { audioRef.current.ctx?.close() } catch {}
    audioRef.current = null
  }, [])

  useEffect(() => {
    if (running && sound !== 'none') {
      stopAudio()
      audioRef.current = buildAudio(sound, volume)
    } else {
      stopAudio()
    }
    return stopAudio
  }, [running, sound]) // eslint-disable-line

  useEffect(() => {
    if (audioRef.current?.master) audioRef.current.master.gain.value = volume
  }, [volume])

  /* ── Timer ── */
  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          if (session < TOTAL_SESSIONS) { setSession(p => p + 1); return total }
          setRunning(false); clearInterval(intervalRef.current); return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running, session, total])

  const handleStop = () => {
    clearInterval(intervalRef.current)
    setRunning(false); setSeconds(total); setSession(1)
  }

  const handleSkip = () => {
    if (session < TOTAL_SESSIONS) { setSession(s => s + 1); setSeconds(total) }
  }

  /* ── Preset ── */
  const selectPreset = (idx) => {
    if (running) return
    const p = TIMER_PRESETS[idx]
    setSelectedPreset(idx)
    if (p.seconds === null) { setShowCustom(true); return }
    setShowCustom(false)
    setTotal(p.seconds); setSeconds(p.seconds); setSession(1)
  }

  const applyCustom = () => {
    const mins = parseInt(customMinutes, 10)
    if (!mins || mins < 1 || mins > 180) return
    const s = mins * 60
    setTotal(s); setSeconds(s); setSession(1); setRunning(false); setShowCustom(false)
  }

  /* ── Objective editing ── */
  const openEdit  = () => { setDraftTitle(objTitle); setDraftDesc(objDesc); setEditing(true) }
  const saveEdit  = () => {
    if (draftTitle.trim()) { setObjTitle(draftTitle.trim()); setObjDesc(draftDesc.trim()) }
    setEditing(false)
  }
  const cancelEdit = () => setEditing(false)

  const circ      = 2 * Math.PI * 108
  const dashOffset = circ * (1 - (total - seconds) / total)

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      position: 'relative', overflow: 'hidden', minHeight: '100%',
      padding: '10px 16px 18px', boxSizing: 'border-box',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', width: 520, height: 520, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(78,222,163,0.05) 0%, transparent 65%)',
        animation: 'breathe 5s ease-in-out infinite',
      }} />

      {/* ── TOP BAR ── */}
      <div style={{
        width: '100%', maxWidth: 460, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12, animation: 'fade-in 0.4s ease both', flexShrink: 0,
      }}>
        <div className="glass" style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '5px 13px', borderRadius: 9999,
          font: 'var(--text-label-sm)', letterSpacing: '0.08em',
        }}>
          <span className="material-symbols-outlined icon-fill" style={{ color: 'var(--tertiary)', fontSize: 14 }}>local_fire_department</span>
          <span style={{ color: 'var(--text-subtle)' }}>4 Day Streak</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(60,74,66,0.6)' }} />
          <span style={{ color: 'var(--primary)', fontSize: 11 }}>Momentum ✓</span>
        </div>

        {/* Session pip track */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {Array.from({ length: TOTAL_SESSIONS }).map((_, i) => (
            <div key={i} style={{
              width: i + 1 === session ? 18 : 7, height: 7, borderRadius: 4,
              background: i + 1 <= session ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
              opacity: i + 1 > session ? 0.35 : 1,
              transition: 'all 0.35s ease',
              boxShadow: i + 1 === session ? '0 0 7px rgba(78,222,163,0.5)' : 'none',
            }} />
          ))}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>

        {/* ── OBJECTIVE CARD ── */}
        <div className="glass" style={{
          borderRadius: 14, padding: '14px 16px', position: 'relative', overflow: 'hidden',
          animation: 'fade-up 0.4s 0.05s ease both', flexShrink: 0,
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(78,222,163,0.35), transparent)' }} />

          {taskLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--primary)', animation: 'ping 1.5s ease-in-out infinite' }} />
              <span style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Loading task…</span>
            </div>
          ) : editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--primary)' }} />
                <span style={{ font: 'var(--text-label-sm)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--primary)' }}>Edit Objective</span>
              </div>
              <input
                autoFocus value={draftTitle}
                onChange={e => setDraftTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveEdit()}
                placeholder="Session title…"
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(78,222,163,0.25)',
                  borderRadius: 8, color: 'var(--text)', padding: '7px 11px',
                  fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', outline: 'none',
                  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />
              <textarea
                value={draftDesc}
                onChange={e => setDraftDesc(e.target.value)}
                placeholder="Describe your focus…"
                rows={2}
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(78,222,163,0.15)',
                  borderRadius: 8, color: 'var(--text-subtle)', padding: '7px 11px',
                  fontSize: 13, outline: 'none', resize: 'none', lineHeight: 1.6,
                  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />
              <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
                <button onClick={cancelEdit} style={{
                  padding: '5px 14px', borderRadius: 7, border: '1px solid rgba(60,74,66,0.4)',
                  background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
                  font: 'var(--text-label-sm)',
                }}>Cancel</button>
                <button onClick={saveEdit} style={{
                  padding: '5px 14px', borderRadius: 7, border: 'none',
                  background: 'rgba(78,222,163,0.18)', color: 'var(--primary)', cursor: 'pointer',
                  font: 'var(--text-label-sm)',
                }}>Save</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: completed ? 'var(--secondary)' : 'var(--primary)', animation: completed ? 'none' : 'ping 2s ease-in-out infinite', flexShrink: 0 }} />
                  <span style={{ font: 'var(--text-label-sm)', letterSpacing: '0.1em', textTransform: 'uppercase', color: completed ? 'var(--secondary)' : 'var(--primary)' }}>
                    {completed ? 'Completed' : 'Current Objective'}
                  </span>
                </div>
                <h2 style={{ font: 'var(--text-h2)', color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.02em', lineHeight: 1.2, textDecoration: completed ? 'line-through' : 'none', opacity: completed ? 0.6 : 1 }}>{objTitle}</h2>
                <p style={{ color: 'var(--text-subtle)', margin: 0, fontSize: 13, lineHeight: 1.55 }}>{objDesc}</p>
              </div>
              {!completed && (
                <button onClick={openEdit}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(78,222,163,0.1)'; e.currentTarget.style.color = 'var(--primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
                  style={{
                    width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(60,74,66,0.35)',
                    background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.2s',
                  }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>edit</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── COMPLETE TASK BUTTON (only when a real task is loaded) ── */}
        {taskId && !taskLoading && (
          <div style={{ animation: 'fade-up 0.4s 0.08s ease both', flexShrink: 0 }}>
            {completed ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 9, justifyContent: 'center',
                padding: '10px 16px', borderRadius: 10,
                background: 'rgba(78,222,163,0.08)', border: '1px solid rgba(78,222,163,0.2)',
              }}>
                <span className="material-symbols-outlined icon-fill" style={{ fontSize: 16, color: 'var(--primary)' }}>task_alt</span>
                <span style={{ font: 'var(--text-label-sm)', color: 'var(--primary)', letterSpacing: '0.06em' }}>Task marked complete</span>
                <button
                  onClick={() => navigate(-1)}
                  style={{
                    marginLeft: 'auto', padding: '4px 12px', borderRadius: 7, border: 'none',
                    background: 'rgba(78,222,163,0.15)', color: 'var(--primary)', cursor: 'pointer',
                    font: 'var(--text-label-sm)',
                  }}
                >← Back</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  onClick={handleCompleteTask}
                  disabled={completing}
                  style={{
                    width: '100%', padding: '10px 16px', borderRadius: 10, border: 'none', cursor: completing ? 'wait' : 'pointer',
                    background: completing ? 'rgba(78,222,163,0.08)' : 'rgba(78,222,163,0.14)',
                    color: 'var(--primary)', font: 'var(--text-label-sm)', letterSpacing: '0.07em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    outline: '1px solid rgba(78,222,163,0.2)', transition: 'all 0.2s',
                    opacity: completing ? 0.6 : 1,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{completing ? 'hourglass_empty' : 'task_alt'}</span>
                  {completing ? 'Marking complete…' : 'Mark Task Complete'}
                </button>
                {completeError && (
                  <span style={{ font: 'var(--text-label-sm)', color: 'rgba(255,100,100,0.8)', textAlign: 'center' }}>{completeError}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TIMER RING + CONTROLS ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20,
          animation: 'fade-up 0.4s 0.12s ease both', flexShrink: 0,
        }}>
          {/* Ring */}
          <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
              <circle cx="100" cy="100" r="88" fill="none"
                stroke="var(--primary)" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 88}
                strokeDashoffset={2 * Math.PI * 88 * (1 - (total - seconds) / total)}
                style={{ transition: 'stroke-dashoffset 1s linear', filter: 'drop-shadow(0 0 6px rgba(78,222,163,0.55))' }} />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, gap: 5 }}>
              <div style={{
                fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 46,
                letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                color: 'var(--text)',
              }}>{fmt(seconds)}</div>
              <div style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>timelapse</span>
                {session}/{TOTAL_SESSIONS}
              </div>
            </div>
          </div>

          {/* Controls stacked vertically beside ring */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'center', flex: 1 }}>
            {/* Play/Pause */}
            <button onClick={() => setRunning(r => !r)} style={{
              width: 64, height: 64, borderRadius: '50%', border: 'none',
              background: 'var(--primary)', color: '#002113', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
              boxShadow: running ? '0 0 22px rgba(78,222,163,0.45), 0 0 50px rgba(78,222,163,0.12)' : 'none',
              animation: running ? 'glow-pulse 2s ease-in-out infinite' : 'none',
            }}>
              <span className="material-symbols-outlined icon-fill" style={{ fontSize: 28 }}>{running ? 'pause' : 'play_arrow'}</span>
            </button>
            {/* Stop + Skip row */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={handleStop} title="Stop & reset" style={{
                width: 42, height: 42, borderRadius: '50%', border: '1px solid rgba(60,74,66,0.4)',
                background: 'var(--surface)', color: 'var(--text-subtle)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>stop</span>
              </button>
              <button onClick={handleSkip} title="Skip session" style={{
                width: 42, height: 42, borderRadius: '50%', border: '1px solid rgba(60,74,66,0.4)',
                background: 'var(--surface)', color: 'var(--text-subtle)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>skip_next</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── DURATION ── */}
        <div className="glass" style={{
          borderRadius: 12, padding: '12px 14px', flexShrink: 0,
          animation: 'fade-up 0.4s 0.2s ease both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
            <span style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Duration</span>
            {running && <span style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)', fontSize: 10, opacity: 0.55, letterSpacing: '0.06em' }}>Pause to change</span>}
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {TIMER_PRESETS.map((p, i) => {
              const active = selectedPreset === i
              return (
                <button key={p.label} onClick={() => selectPreset(i)} disabled={running} style={{
                  flex: 1, height: 30, borderRadius: 7, border: 'none', cursor: running ? 'not-allowed' : 'pointer',
                  background: active ? 'rgba(78,222,163,0.15)' : 'rgba(255,255,255,0.04)',
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                  font: 'var(--text-label-sm)', letterSpacing: '0.05em',
                  outline: active ? '1px solid rgba(78,222,163,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  transition: 'all 0.2s', opacity: running ? 0.45 : 1,
                }}>{p.label}</button>
              )
            })}
          </div>
          {showCustom && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 9 }}>
              <input
                type="number" min="1" max="180" placeholder="Minutes…"
                value={customMinutes} onChange={e => setCustomMinutes(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyCustom()}
                style={{
                  flex: 1, height: 30, borderRadius: 7, border: '1px solid rgba(78,222,163,0.2)',
                  background: 'rgba(255,255,255,0.04)', color: 'var(--text)', textAlign: 'center',
                  font: 'var(--text-label-sm)', outline: 'none', padding: '0 8px', boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
              <button onClick={applyCustom} style={{
                height: 30, padding: '0 13px', borderRadius: 7, border: 'none', cursor: 'pointer',
                background: 'rgba(78,222,163,0.18)', color: 'var(--primary)', font: 'var(--text-label-sm)',
              }}>Set</button>
            </div>
          )}
        </div>

        {/* ── SOUND ── */}
        <div className="glass" style={{
          borderRadius: 12, padding: '12px 14px', flexShrink: 0,
          animation: 'fade-up 0.4s 0.28s ease both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
            <span style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Ambient Sound</span>
            {running && sound !== 'none' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{
                    width: 2.5, borderRadius: 2, background: 'var(--primary)', opacity: 0.75,
                    animation: `soundbar 1.1s ease-in-out ${i * 0.17}s infinite alternate`,
                  }} />
                ))}
                <span style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)', fontSize: 10, marginLeft: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {SOUNDS.find(s => s.id === sound)?.label}
                </span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {SOUNDS.map((s, i) => (
              <span key={s.id} style={{ display: 'contents' }}>
                {i === 1 && <div style={{ width: 1, height: 16, background: 'rgba(60,74,66,0.4)', flexShrink: 0 }} />}
                <button onClick={() => setSound(s.id)} title={s.label} style={{
                  flex: 1, height: 34, borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: sound === s.id ? 'rgba(78,222,163,0.15)' : 'rgba(255,255,255,0.04)',
                  color: sound === s.id ? 'var(--primary)' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                  outline: sound === s.id ? '1px solid rgba(78,222,163,0.3)' : '1px solid rgba(255,255,255,0.06)',
                }}>
                  <span className={`material-symbols-outlined${sound === s.id ? ' icon-fill' : ''}`} style={{ fontSize: 15 }}>{s.icon}</span>
                </button>
              </span>
            ))}
          </div>
          {sound !== 'none' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>volume_down</span>
              <input type="range" min="0" max="1" step="0.01" value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--primary)', cursor: 'pointer', height: 3 }} />
              <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>volume_up</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes soundbar {
          from { height: 3px; }
          to   { height: 13px; }
        }
      `}</style>
    </div>
  )
}