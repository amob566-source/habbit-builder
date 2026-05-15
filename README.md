# Growth System — React + Vite

A production-ready SPA migrated from 5 separate HTML files to a unified React + Vite app with:
- **Instant client-side navigation** (React Router — no page reloads, no font flicker)
- **Unified design tokens** — single CSS file with all colors, typography, spacing
- **Consistent typography** across all pages (Inter + JetBrains Mono)
- **Working focus timer** with play/pause/stop/skip
- **Interactive habits** (toggle complete)
- **Collapsible goal tree**
- **Animated analytics** (bar chart, heatmap)
- **Responsive** — sidebar on desktop, bottom nav on mobile

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (hot reload)
npm run dev
# → Open http://localhost:5173

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```

## Project Structure

```
growth-system/
├── index.html              # Entry point
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx            # React root
    ├── App.jsx             # Layout shell + routing
    ├── index.css           # All design tokens + global styles
    └── pages/
        ├── Dashboard.jsx
        ├── GoalTree.jsx
        ├── HabitSystem.jsx
        ├── FocusMode.jsx
        └── Analytics.jsx
```

## Pages

| Route | Page |
|-------|------|
| `/` | Dashboard |
| `/goals` | Goal Tree |
| `/habits` | Habit System |
| `/focus` | Focus Mode |
| `/analytics` | Analytics |

## Deployment

After `npm run build`, the `dist/` folder is a static site — deploy to:
- **Vercel**: `vercel --prod`
- **Netlify**: drag `dist/` into Netlify dashboard
- **GitHub Pages**: use `gh-pages` package
