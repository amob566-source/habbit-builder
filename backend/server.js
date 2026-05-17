const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./database');
const axios = require('axios');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

function getUTCWeekStart() {
  const now = new Date();
  const day = now.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - daysSinceMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

function formatUTCDate(date) {
  return date.toISOString().slice(0, 10);
}

function attachHabitWeekHistory(habits, res, single = false) {
  const habitIds = habits.map(h => h.id);
  const weekStart = getUTCWeekStart();
  const startISO = weekStart.toISOString();
  const dayKeys = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
    return formatUTCDate(d);
  });
  const todayKey = formatUTCDate(new Date());

  if (habitIds.length === 0) {
    const result = habits.map(h => ({
      ...h,
      weekHistory: Array(7).fill(false),
      done: false,
    }))
    return res.json(single && result.length === 1 ? result[0] : result)
  }

  const placeholders = habitIds.map(() => '?').join(', ');
  db.all(
    `SELECT habitId, completedAt FROM habit_completions WHERE habitId IN (${placeholders}) AND completedAt >= ?`,
    [...habitIds, startISO],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const historyByHabit = rows.reduce((acc, row) => {
        const hId = row.habitId;
        const dateKey = formatUTCDate(new Date(row.completedAt));
        if (!acc[hId]) acc[hId] = new Set();
        acc[hId].add(dateKey);
        return acc;
      }, {});

      const result = habits.map(h => {
        const completedDays = historyByHabit[h.id] || new Set();
        return {
          ...h,
          weekHistory: dayKeys.map(key => completedDays.has(key)),
          done: completedDays.has(todayKey),
        };
      });

      return res.json(single && result.length === 1 ? result[0] : result);
    }
  );
}

// ==================== GOALS ENDPOINTS ====================

// Get all goals
app.get('/api/goals', (req, res) => {
  db.all('SELECT * FROM goals WHERE status = "active"', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // rows may contain children as TEXT; return as-is and let frontend parse
    return res.json(rows);
  });
});

// Create goal
app.post('/api/goals', (req, res) => {
  const { title, description, priority, icon, color, children, pct } = req.body;
  const childrenStr = typeof children === 'string' ? children : JSON.stringify(children ?? []);
  const pctVal = typeof pct === 'number' ? pct : (pct ? Number(pct) : 0);
  db.run(
    'INSERT INTO goals (title, description, priority, icon, color, children, pct) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [title, description, priority, icon || null, color || null, childrenStr, pctVal],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      // return the created row
      db.get('SELECT * FROM goals WHERE id = ?', [this.lastID], (e, row) => {
        if (e) return res.status(500).json({ error: e.message });
        return res.json(row);
      });
    }
  );
});

// Update goal
app.put('/api/goals/:id', (req, res) => {
  const { title, description, priority, status, icon, color, children, pct } = req.body;
  const childrenStr = typeof children === 'string' ? children : JSON.stringify(children ?? []);
  const pctVal = typeof pct === 'number' ? pct : (pct ? Number(pct) : 0);
  db.run(
    'UPDATE goals SET title = ?, description = ?, priority = ?, status = ?, icon = ?, color = ?, children = ?, pct = ? WHERE id = ?',
    [title, description, priority, status, icon || null, color || null, childrenStr, pctVal, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM goals WHERE id = ?', [req.params.id], (e, row) => {
        if (e) return res.status(500).json({ error: e.message });
        return res.json(row);
      });
    }
  );
});

// Delete goal
app.delete('/api/goals/:id', (req, res) => {
  db.run('DELETE FROM goals WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    return res.json({ message: 'Goal deleted' });
  });
});

// ==================== HABITS ENDPOINTS ====================

// Get all habits for a goal
app.get('/api/habits/:goalId', (req, res) => {
  db.all(
    'SELECT * FROM habits WHERE goalId = ? AND status = "active"',
    [req.params.goalId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      return attachHabitWeekHistory(rows, res);
    }
  );
});

// Get all habits (no goal filter)
app.get('/api/habits', (req, res) => {
  db.all('SELECT * FROM habits WHERE status = "active"', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    return attachHabitWeekHistory(rows, res);
  });
});

// Create habit
app.post('/api/habits', (req, res) => {
  const { title, description, frequency, goalId, icon, color, target, time, category, streak, pct, done, lastCompletedAt } = req.body;
  const last = lastCompletedAt || null;
  db.run(
    'INSERT INTO habits (title, description, frequency, goalId, icon, color, target, time, category, streak, pct, done, lastCompletedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [title, description, frequency, goalId, icon || null, color || null, target || null, time || null, category || null, streak || 0, pct || 0, done ? 1 : 0, last],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM habits WHERE id = ?', [this.lastID], (e, row) => {
        if (e) return res.status(500).json({ error: e.message });
        return res.json(row);
      });
    }
  );
});

// Update habit
app.put('/api/habits/:id', (req, res) => {
  const { title, description, frequency, goalId, icon, color, target, time, category, pct, done, status } = req.body;
  const id = req.params.id;

  // Read existing habit to compute streak/lastCompletedAt correctly
  db.get('SELECT * FROM habits WHERE id = ?', [id], (err, existing) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!existing) return res.status(404).json({ error: 'Habit not found' });

    const now = new Date();
    const nowISO = now.toISOString();
    const todayKey = formatUTCDate(now);
    const prev = existing.lastCompletedAt ? new Date(existing.lastCompletedAt) : null;
    const prevUTC = prev ? Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth(), prev.getUTCDate()) : null;
    const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const yesterdayUTC = todayUTC - 24 * 60 * 60 * 1000;

    let newLast = existing.lastCompletedAt;
    let newStreak = existing.streak || 0;

    const saveHabit = () => {
      db.run(
        'UPDATE habits SET title = ?, description = ?, frequency = ?, goalId = ?, icon = ?, color = ?, target = ?, time = ?, category = ?, streak = ?, pct = ?, done = ?, lastCompletedAt = ?, status = ? WHERE id = ?',
        [title, description, frequency, goalId, icon || null, color || null, target || null, time || null, category || null, newStreak, pct || 0, done ? 1 : 0, newLast, status || 'active', id],
        function (e) {
          if (e) return res.status(500).json({ error: e.message });
          db.get('SELECT * FROM habits WHERE id = ?', [id], (er, row) => {
            if (er) return res.status(500).json({ error: er.message });
            return attachHabitWeekHistory([row], res, true);
          });
        }
      );
    };

    if (typeof done !== 'undefined') {
      if (done) {
        if (prevUTC === todayUTC) {
          newStreak = existing.streak || 1;
        } else if (prevUTC === yesterdayUTC) {
          newStreak = (existing.streak || 0) + 1;
        } else {
          newStreak = 1;
        }
        newLast = nowISO;
        db.run(
          'DELETE FROM habit_completions WHERE habitId = ? AND DATE(completedAt) = ?',
          [id, todayKey],
          (e) => {
            if (e) return res.status(500).json({ error: e.message });
            db.run(
              'INSERT INTO habit_completions (habitId, completedAt) VALUES (?, ?)',
              [id, nowISO],
              (err2) => {
                if (err2) return res.status(500).json({ error: err2.message });
                saveHabit();
              }
            );
          }
        );
      } else {
        newLast = null;
        newStreak = 0;
        db.run(
          'DELETE FROM habit_completions WHERE habitId = ? AND DATE(completedAt) = ?',
          [id, todayKey],
          (e) => {
            if (e) return res.status(500).json({ error: e.message });
            saveHabit();
          }
        );
      }
    } else {
      saveHabit();
    }
  });
});

// Delete habit
app.delete('/api/habits/:id', (req, res) => {
  db.run('DELETE FROM habits WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    return res.json({ message: 'Habit deleted' });
  });
});

// ==================== TASKS ENDPOINTS ====================

// Get all tasks
app.get('/api/tasks', (req, res) => {
  db.all(
    'SELECT * FROM tasks WHERE status != "completed" ORDER BY sequence ASC',
    (err, rows) => {
      if (err) res.status(500).json({ error: err.message });
      else res.json(rows);
    }
  );
});

// Get single task (for FocusMode)
app.get('/api/tasks/:id', (req, res) => {
  db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id], (err, row) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(row);
  });
});

// Create task
app.post('/api/tasks', (req, res) => {
  const { title, description, habitId, goalId, dueDate, sequence } = req.body;
  db.run(
    'INSERT INTO tasks (title, description, habitId, goalId, dueDate, sequence) VALUES (?, ?, ?, ?, ?, ?)',
    [title, description, habitId, goalId, dueDate, sequence],
    function (err) {
      if (err) res.status(500).json({ error: err.message });
      else res.json({ id: this.lastID, title, description, habitId, goalId });
    }
  );
});

// Mark task as completed
app.post('/api/tasks/:id/complete', (req, res) => {
  db.run(
    'UPDATE tasks SET status = "completed" WHERE id = ?',
    [req.params.id],
    function (err) {
      if (err) res.status(500).json({ error: err.message });
      else {
        // Log completion for analytics
        db.run('INSERT INTO task_completions (taskId) VALUES (?)', [req.params.id]);
        res.json({ message: 'Task completed' });
      }
    }
  );
});

// ==================== AI ENDPOINTS ====================

// Generate AI recommendations and task sequence
app.post('/api/ai/generate-sequence', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'OpenAI API key not configured' });
    }

    // Get all goals and habits from database
    db.all('SELECT * FROM goals', async (err, goals) => {
      db.all('SELECT * FROM habits', async (err2, habits) => {
        const prompt = `
You are a productivity coach. Based on these goals and habits, create an optimized daily task sequence and provide feedback.

Goals:
${JSON.stringify(goals, null, 2)}

Habits:
${JSON.stringify(habits, null, 2)}

Provide:
1. Optimized task sequence (order them by priority and dependencies)
2. Specific feedback on how to improve habit tracking
3. Motivational tips

Format as JSON with keys: taskSequence (array), feedback (string), tips (array)
        `;

        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const aiResponse = response.data.choices[0].message.content;
        const parsed = JSON.parse(aiResponse);

        // Save to database
        db.run(
          'INSERT INTO ai_recommendations (content, taskSequence) VALUES (?, ?)',
          [parsed.feedback, JSON.stringify(parsed.taskSequence)],
          function (err) {
            res.json(parsed);
          }
        );
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DEBUG ENDPOINTS ====================

app.get('/api/debug/all', (req, res) => {
  const queries = {
    goals: 'SELECT * FROM goals',
    habits: 'SELECT * FROM habits',
    tasks: 'SELECT * FROM tasks',
    task_completions: 'SELECT * FROM task_completions',
    ai_recommendations: 'SELECT * FROM ai_recommendations',
  };

  const results = {};
  let remaining = Object.keys(queries).length;
  let hasError = false;

  Object.entries(queries).forEach(([table, sql]) => {
    db.all(sql, (err, rows) => {
      if (hasError) return;
      if (err) {
        hasError = true;
        return res.status(500).json({ error: err.message });
      }
      results[table] = rows;
      remaining -= 1;
      if (remaining === 0) {
        res.json(results);
      }
    });
  });
});

// ==================== ANALYTICS ENDPOINTS ====================

// Get analytics data
app.get('/api/analytics', (req, res) => {
  db.all(
    `SELECT 
      DATE(tc.completedAt) as date,
      COUNT(*) as completed_count
     FROM task_completions tc
     GROUP BY DATE(tc.completedAt)
     ORDER BY date DESC
     LIMIT 30`,
    (err, rows) => {
      if (err) res.status(500).json({ error: err.message });
      else res.json(rows);
    }
  );
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});