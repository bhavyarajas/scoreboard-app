// const API_BASE = "http://localhost:8000";
// client/src/api.js
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

export async function fetchConfig() {
  const r = await fetch(`${API_BASE}/config`);
  if (!r.ok) throw new Error("Failed to load config");
  return r.json();
}

export async function fetchScores() {
  const r = await fetch(`${API_BASE}/scores`);
  if (!r.ok) throw new Error("Failed to load scores");
  return r.json(); // { scores: [...] }
}

export async function postAction(payload) {
  const r = await fetch(`${API_BASE}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    let message = "Action failed";
    try {
      const data = await r.json();
      if (data && data.detail) message = data.detail;
    } catch {}
    const e = new Error(message);
    e.status = r.status;
    throw e;
  }
  return r.json(); // { person, game, total }
}