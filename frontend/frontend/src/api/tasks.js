const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export async function getTasks(dealId) {
  const res = await fetch(`${API_BASE}/tasks/${dealId}`);
  return res.json();
}

export async function suggestTasks(dealId) {
  const res = await fetch(`${API_BASE}/tasks/${dealId}/suggest`, { method: "POST" });
  return res.json();
}

export async function selectTask(taskId, selected) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: selected ? "selected" : "suggested" }),
  });
  return res.json();
}

export async function executeTask(taskId, toEmail) {
  const res = await fetch(`${API_BASE}/tasks/${taskId}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to_email: toEmail || null }),
  });
  return res.json();
}
