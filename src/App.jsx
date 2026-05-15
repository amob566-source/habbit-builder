import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import GoalTree from './pages/GoalTree.jsx'
import HabitSystem from './pages/HabitSystem.jsx'
import FocusMode from './pages/FocusMode.jsx'
import Analytics from './pages/Analytics.jsx'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: 'home', fillIcon: 'home' },
  { to: '/goals', label: 'Goal Tree', icon: 'account_tree', fillIcon: 'account_tree' },
  { to: '/habits', label: 'Habit System', icon: 'settings_accessibility', fillIcon: 'settings_accessibility' },
  { to: '/focus', label: 'Focus Mode', icon: 'timer', fillIcon: 'timer' },
  { to: '/analytics', label: 'Analytics', icon: 'monitoring', fillIcon: 'monitoring' },
]

const BOTTOM_NAV = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/goals', label: 'Tree', icon: 'account_tree' },
  { to: '/habits', label: 'Habits', icon: 'settings_accessibility' },
  { to: '/focus', label: 'Focus', icon: 'timer' },
  { to: '/analytics', label: 'Data', icon: 'monitoring' },
]

function NavItemLink({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
    >
      {({ isActive }) => (
        <>
          <span className={`material-symbols-outlined${isActive ? ' icon-fill' : ''}`}>{icon}</span>
          {label}
        </>
      )}
    </NavLink>
  )
}

function BottomNavLink({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
    >
      {({ isActive }) => (
        <>
          <span className={`material-symbols-outlined${isActive ? ' icon-fill' : ''}`}>{icon}</span>
          {label}
        </>
      )}
    </NavLink>
  )
}

function PageTitles() {
  const loc = useLocation()
  const titles = {
    '/': 'Growth System',
    '/goals': 'Goal Tree',
    '/habits': 'Habit System',
    '/focus': 'Focus Mode',
    '/analytics': 'Analytics',
  }
  return titles[loc.pathname] || 'Growth System'
}

export default function App() {
  return (
    <div className="app-shell">
      {/* Sidebar (desktop) */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <span className="material-symbols-outlined icon-fill" style={{ fontSize: 18 }}>person</span>
          </div>
          <div>
            <div className="logo-text-primary">Growth<br />System</div>
            <div className="logo-text-sub">Technical Sophistication</div>
          </div>
        </div>
        <div className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavItemLink key={item.to} {...item} />
          ))}
        </div>
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--primary-dim)', border: '1px solid var(--border-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--primary)', fontWeight: 700, fontSize: 13
            }}>G</div>
            <div>
              <div style={{ font: 'var(--text-body)', color: 'var(--text)', fontWeight: 600, fontSize: 13 }}>User</div>
              <div style={{ font: 'var(--text-label-sm)', color: 'var(--text-muted)' }}>Free Plan</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main area */}
      <div className="main-content">
        {/* Mobile header */}
        <header className="mobile-header">
          <span style={{ font: 'var(--text-h3)', color: 'var(--primary)', fontWeight: 800 }}>
            <PageTitles />
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn-icon btn">
              <span className="material-symbols-outlined icon-sm">notifications</span>
            </button>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--primary-dim)', border: '1px solid var(--border-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--primary)', fontWeight: 700, fontSize: 12
            }}>G</div>
          </div>
        </header>

        {/* Page content */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/goals" element={<GoalTree />} />
          <Route path="/habits" element={<HabitSystem />} />
          <Route path="/focus" element={<FocusMode />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>

        {/* Mobile bottom nav */}
        <nav className="bottom-nav">
          {BOTTOM_NAV.map(item => (
            <BottomNavLink key={item.to} {...item} />
          ))}
        </nav>
      </div>
    </div>
  )
}
