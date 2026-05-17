// src/services/api.js
const API_URL = 'http://localhost:5000/api';

async function handleRes(res) {
  const text = await res.text();
  try { return JSON.parse(text || 'null'); } catch { return text; }
}

export async function getGoals() {
  const res = await fetch(`${API_URL}/goals`);
  if (!res.ok) throw new Error(`getGoals: ${res.status}`);
  return handleRes(res);
}

export async function createGoal(goal) {
  const res = await fetch(`${API_URL}/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal),
  });
  if (!res.ok) throw new Error(`createGoal: ${res.status}`);
  return handleRes(res);
}

export async function updateGoal(id, goal) {
  const res = await fetch(`${API_URL}/goals/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal),
  });
  if (!res.ok) throw new Error(`updateGoal: ${res.status}`);
  return handleRes(res);
}

export async function getHabits(goalId) {
  const url = (!goalId || goalId === 'all') ? `${API_URL}/habits` : `${API_URL}/habits/${encodeURIComponent(goalId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`getHabits: ${res.status}`);
  return handleRes(res);
}

export async function createHabit(habit) {
  const res = await fetch(`${API_URL}/habits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(habit),
  });
  if (!res.ok) throw new Error(`createHabit: ${res.status}`);
  return handleRes(res);
}

export async function updateHabit(id, habit) {
  const res = await fetch(`${API_URL}/habits/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(habit),
  });
  if (!res.ok) throw new Error(`updateHabit: ${res.status}`);
  return handleRes(res);
}

export async function deleteHabit(id) {
  const res = await fetch(`${API_URL}/habits/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`deleteHabit: ${res.status}`);
  return handleRes(res);
}

export async function getTasks() {
  const res = await fetch(`${API_URL}/tasks`);
  if (!res.ok) throw new Error(`getTasks: ${res.status}`);
  return handleRes(res);
}

export async function getTask(id) {
  const res = await fetch(`${API_URL}/tasks/${id}`);
  if (!res.ok) throw new Error(`getTask: ${res.status}`);
  return handleRes(res);
}

export async function createTask(task) {
  const res = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error(`createTask: ${res.status}`);
  return handleRes(res);
}

export async function completeTask(id) {
  const res = await fetch(`${API_URL}/tasks/${id}/complete`, { method: 'POST' });
  if (!res.ok) throw new Error(`completeTask: ${res.status}`);
  return handleRes(res);
}

export async function generateAISequence() {
  const res = await fetch(`${API_URL}/ai/generate-sequence`, { method: 'POST' });
  if (!res.ok) throw new Error(`generateAISequence: ${res.status}`);
  return handleRes(res);
}

export async function getAnalytics() {
  const res = await fetch(`${API_URL}/analytics`);
  if (!res.ok) throw new Error(`getAnalytics: ${res.status}`);
  return handleRes(res);
}