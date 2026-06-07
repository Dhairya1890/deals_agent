import { mockDeals, mockExtractionResult } from "../mock/mockDeals";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const USE_MOCK = false;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getDeals() {
  if (USE_MOCK) {
    await delay(300);
    return { deals: mockDeals };
  }
  const res = await fetch(`${API_BASE}/deals`);
  return res.json();
}

export async function getDeal(id) {
  if (USE_MOCK) {
    await delay(200);
    const deal = mockDeals.find((d) => d.id === id);
    if (!deal) throw new Error("Deal not found");
    return {
      deal,
      stakeholders: deal.stakeholders,
      interactions: deal.interactions,
      objections: deal.objections,
    };
  }
  const res = await fetch(`${API_BASE}/deals/${id}`);
  return res.json();
}

export async function createDeal(data) {
  if (USE_MOCK) {
    await delay(500);
    const newDeal = {
      id: `deal_${Date.now()}`,
      title: data.title,
      company: data.company,
      stage: data.stage || "prospecting",
      outcome: null,
      value_usd: data.value_usd,
      industry: data.industry,
      rep_id: "rep_001",
      created_at: new Date().toISOString(),
      stakeholders: [],
      interactions: [],
      objections: [],
    };
    mockDeals.push(newDeal);
    return { deal: newDeal };
  }
  const res = await fetch(`${API_BASE}/deals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function importDeals(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/import`, { method: "POST", body: form });
  return res.json();
}

export async function syncDeal(dealId) {
  const res = await fetch(`${API_BASE}/sync/${dealId}`, { method: "POST" });
  return res.json();
}

export async function ingestInteraction(dealId, type, rawContent) {
  if (USE_MOCK) {
    await delay(1500);
    const result = { ...mockExtractionResult };
    result.interaction.type = type;
    return result;
  }
  const res = await fetch(`${API_BASE}/interactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deal_id: dealId, type, raw_content: rawContent }),
  });
  return res.json();
}
