import { useState, useEffect, useRef, useCallback } from 'react'

const TOTAL = 25 * 60
const TOTAL_SESSIONS = 4

const SOUNDS = [
  { id: 'none', icon: 'volume_off', label: 'Silent' },
  { id: 'rain', icon: 'rainy', label: 'Rain' },
  { id: 'wind', icon: 'air', label: 'Wind' },
  { id: 'cafe', icon: 'local_cafe', label: 'Café' },
  { id: 'fire', icon: 'local_fire_department', label: 'Fire' },
]

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function FocusMode() {
  const [seconds, setSeconds] = useState(TOTAL)
  const [running, setRunning] = useState(false)
  const [session, setSession] = useState(1)
  const [sound, setSound] = useState('rain')
  const intervalRef = useRef(null)

  const circ = 2 * Math.PI * 135
  const pct = seconds / TOTAL
  const offset = circ * (1 - pct)

  const stop = useCallback(() => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setSeconds(TOTAL)
    setSession(1)
  }, [])

  const skip = useCallback(() => {
    if (session < TOTAL_SESSIONS) {
      setSession(s => s + 1)
      setSeconds(TOTAL)
    }
  }, [session])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            if (session < TOTAL_SESSIONS) {
              setSession(prev => prev + 1)
              return TOTAL
            } else {
              setRunning(false)
              clearInterval(intervalRef.current)
              return 0
            }
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, session])

  return (
    <div className="page-enter" style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', minHeight: '100%',
      padding: '24px 16px',
    }}>
      {/* Ambient background glow */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle at center, rgba(78,222,163,0.04) 0%, transparent 65%)',
        animation: 'breathe 5s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Streak badge */}
      <div className="glass" style={{
        position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 18px', borderRadius: 9999,
        font: 'var(--text-label-sm)', letterSpacing: '0.1em', textTransform: 'uppercase',
        whiteSpace: 'nowrap', zIndex: 10,
        animation: 'fade-in 0.5s ease both',
      }}>
        <span className="material-symbols-outlined icon-fill icon-sm" style={{ color: 'var(--tertiary)', fontSize: 16 }}>local_fire_department</span>
        <span style={{ color: 'var(--text-subtle)' }}>4 Day Streak</span>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(60,74,66,0.8)' }} />
        <span style={{ color: 'var(--primary)' }}>Momentum Maintained</span>
      </div>

      {/* Objective card */}
      <div className="glass" style={{
        borderRadius: 16, padding: '24px 32px', textAlign: 'center',
        maxWidth: 420, width: '100%', marginBottom: 44, position: 'relative', overflow: 'hidden',
        animation: 'fade-up 0.5s 0.1s ease both',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(78,222,163,0.35), transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', animation: 'ping 2s ease-in-out infinite' }} />
          <span style={{ font: 'var(--text-label-sm)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary)' }}>Current Objective</span>
        </div>
        <h2 style={{ font: 'var(--text-h1)', color: 'var(--text)', marginBottom: 10, letterSpacing: '-0.02em' }}>Architect Core API</h2>
        <p style={{ font: 'var(--text-body)', color: 'var(--text-subtle)', lineHeight: 1.7, maxWidth: 280, margin: '0 auto' }}>
          Deep work session focused on finalizing routing logic and authentication middleware.
        </p>
      </div>

      {/* Timer ring */}
      <div style={{
        position: 'relative', width: 300, height: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 48,
        animation: 'fade-up 0.5s 0.2s ease both',
      }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 300 300">
          <circle cx="150" cy="150" r="135" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
          <circle cx="150" cy="150" r="135" fill="none"
            stroke="var(--primary)" strokeWidth="3.5" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s linear', filter: 'drop-shadow(0 0 8px rgba(78,222,163,0.5))' }} />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
          <div style={{
            fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 'clamp(52px, 10vw, 78px)',
            letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            color: 'var(--text)', animation: running ? 'none' : undefined,
          }}>{fmt(seconds)}</div>
          <div style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)', marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            <span className="material-symbols-outlined icon-sm" style={{ fontSize: 15 }}>timelapse</span>
            Session {session} of {TOTAL_SESSIONS}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, animation: 'fade-up 0.5s 0.3s ease both', marginBottom: 40 }}>
        <button onClick={stop} style={{
          width: 56, height: 56, borderRadius: '50%', border: '1px solid rgba(60,74,66,0.4)',
          background: 'var(--surface)', color: 'var(--text-subtle)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>stop</span>
        </button>

        <button onClick={() => setRunning(r => !r)} style={{
          width: 76, height: 76, borderRadius: '50%', border: 'none',
          background: 'var(--primary)', color: '#002113', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
          boxShadow: running ? '0 0 24px rgba(78,222,163,0.4), 0 0 60px rgba(78,222,163,0.15)' : 'none',
          animation: running ? 'glow-pulse 2s ease-in-out infinite' : 'none',
        }}>
          <span className="material-symbols-outlined icon-fill" style={{ fontSize: 34 }}>{running ? 'pause' : 'play_arrow'}</span>
        </button>

        <button onClick={skip} style={{
          width: 56, height: 56, borderRadius: '50%', border: '1px solid rgba(60,74,66,0.4)',
          background: 'var(--surface)', color: 'var(--text-subtle)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>skip_next</span>
        </button>
      </div>

      {/* Sound bar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, animation: 'fade-up 0.5s 0.4s ease both' }}>
        <span style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Ambient Soundscape</span>
        <div className="glass" style={{ display: 'flex', alignItems: 'center', padding: 6, borderRadius: 9999, gap: 4 }}>
          {SOUNDS.map((s, i) => (
            <>
              {i === 1 && <div key="div" style={{ width: 1, height: 20, background: 'rgba(60,74,66,0.4)', margin: '0 2px' }} />}
              <button key={s.id} onClick={() => setSound(s.id)} style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: sound === s.id ? 'rgba(78,222,163,0.15)' : 'transparent',
                color: sound === s.id ? 'var(--primary)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                outline: sound === s.id ? '1px solid rgba(78,222,163,0.3)' : 'none',
              }}>
                <span className={`material-symbols-outlined${sound === s.id ? ' icon-fill' : ''}`} style={{ fontSize: 17 }}>{s.icon}</span>
              </button>
            </>
          ))}
        </div>
      </div>
    </div>
  )
}
