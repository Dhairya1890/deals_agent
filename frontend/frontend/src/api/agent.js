import { mockAgentResponses, mockBriefing } from "../mock/mockDeals";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const USE_MOCK = false;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendMessage(dealId, message, history) {
  if (USE_MOCK) {
    await delay(1200);
    const match = mockAgentResponses[message];
    if (match) return match;
    return mockAgentResponses.default;
  }
  const res = await fetch(`${API_BASE}/agent/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deal_id: dealId, message, history }),
  });
  return res.json();
}

export async function generateBriefing(dealId) {
  if (USE_MOCK) {
    await delay(1000);
    return mockBriefing[dealId] || mockBriefing.deal_001;
  }
  const res = await fetch(`${API_BASE}/agent/briefing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deal_id: dealId }),
  });
  return res.json();
}
