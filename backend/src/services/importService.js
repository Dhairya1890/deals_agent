import { parse as csvParse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { XMLParser } from 'fast-xml-parser';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import supabase from '../db/supabase.js';

// ─── Stage mapping ────────────────────────────────────────────────────────────

const STAGE_MAP = {
  new: 'prospecting',
  lead: 'prospecting',
  contacted: 'prospecting',
  outreach: 'prospecting',
  qualified: 'discovery',
  qualifying: 'discovery',
  'proposal sent': 'proposal',
  proposal: 'proposal',
  negotiation: 'negotiation',
  negotiating: 'negotiation',
  won: 'closed',
  'closed won': 'closed',
  'closed-won': 'closed',
  lost: 'closed',
  'closed lost': 'closed',
  'closed-lost': 'closed',
};

const OUTCOME_MAP = {
  won: 'won', 'closed won': 'won', 'closed-won': 'won',
  lost: 'lost', 'closed lost': 'lost', 'closed-lost': 'lost',
};

// ─── Field name normaliser (handles any CRM's column names) ──────────────────

function findField(row, candidates) {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const match = keys.find(k => k.toLowerCase().trim() === candidate.toLowerCase());
    if (match) return row[match];
  }
  return null;
}

function mapRowToDeal(row) {
  const company   = findField(row, ['company', 'account', 'account name', 'organization', 'company name']);
  const title     = findField(row, ['interested service', 'opportunity', 'opportunity name', 'deal name', 'service', 'product', 'title']);
  const name      = findField(row, ['full name', 'name', 'contact', 'contact name', 'lead name']);
  const jobTitle  = findField(row, ['job title', 'title', 'position', 'role', 'designation']);
  const email     = findField(row, ['email', 'email address', 'e-mail']);
  const phone     = findField(row, ['phone', 'mobile', 'phone number']);
  const statusRaw = findField(row, ['lead status', 'status', 'stage', 'deal stage', 'pipeline stage']);
  const valueRaw  = findField(row, ['amount', 'value', 'deal value', 'revenue', 'value_usd']);
  const industry  = findField(row, ['industry', 'sector', 'vertical']);

  if (!company) return null;

  const statusKey = statusRaw?.toLowerCase().trim() || '';
  const stage   = STAGE_MAP[statusKey]   || 'prospecting';
  const outcome = OUTCOME_MAP[statusKey] || null;
  const value   = valueRaw ? parseInt(String(valueRaw).replace(/[^0-9]/g, ''), 10) || 0 : 0;

  return {
    deal: {
      title:     title || `${company} Deal`,
      company,
      stage,
      outcome,
      value_usd: value,
      industry:  industry || null,
      rep_id:    'rep_001',
    },
    stakeholder: (name || email) ? {
      name:            name || email,
      role:            jobTitle || null,
      seniority:       guessSeniority(jobTitle),
      sentiment:       'neutral',
      influence_score: 0.7,
      primary_concern: null,
      email:           email || null,
      phone:           phone || null,
    } : null,
  };
}

function guessSeniority(title) {
  if (!title) return 'ic';
  const t = title.toLowerCase();
  if (t.includes('ceo') || t.includes('cfo') || t.includes('cto') || t.includes('coo') || t.includes('founder') || t.includes('owner') || t.includes('president')) return 'c_suite';
  if (t.includes('vp') || t.includes('vice president')) return 'vp';
  if (t.includes('director')) return 'director';
  if (t.includes('manager') || t.includes('head')) return 'manager';
  return 'ic';
}

// ─── Format parsers ───────────────────────────────────────────────────────────

function parseCSV(buffer) {
  return csvParse(buffer.toString('utf-8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

function parseExcel(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

function parseJSON(buffer) {
  const parsed = JSON.parse(buffer.toString('utf-8'));
  return Array.isArray(parsed) ? parsed : parsed.leads || parsed.deals || parsed.contacts || parsed.data || [];
}

function parseXML(buffer) {
  const parser = new XMLParser({ ignoreAttributes: false });
  const result = parser.parse(buffer.toString('utf-8'));
  const root = Object.values(result)[0];
  const items = Object.values(root)[0];
  return Array.isArray(items) ? items : [items];
}

async function parsePDF(buffer) {
  const data = await pdfParse(buffer);
  const lines = data.text.split('\n').map(l => l.trim()).filter(Boolean);

  // Try to detect header row and data rows
  const headerIdx = lines.findIndex(l =>
    l.toLowerCase().includes('company') || l.toLowerCase().includes('name') || l.toLowerCase().includes('email')
  );
  if (headerIdx === -1) return [];

  const headers = lines[headerIdx].split(/\t|  +/).map(h => h.trim()).filter(Boolean);
  const rows = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cells = lines[i].split(/\t|  +/).map(c => c.trim());
    if (cells.length < 2) continue;
    const row = {};
    headers.forEach((h, j) => { row[h] = cells[j] || ''; });
    rows.push(row);
  }
  return rows;
}

// ─── Main import function ─────────────────────────────────────────────────────

export async function importFromFile(buffer, mimetype, filename) {
  const ext = filename.split('.').pop().toLowerCase();

  let rows = [];
  if (ext === 'csv' || mimetype === 'text/csv') {
    rows = parseCSV(buffer);
  } else if (['xlsx', 'xls'].includes(ext) || mimetype.includes('spreadsheet') || mimetype.includes('excel')) {
    rows = parseExcel(buffer);
  } else if (ext === 'json' || mimetype === 'application/json') {
    rows = parseJSON(buffer);
  } else if (ext === 'xml' || mimetype === 'application/xml' || mimetype === 'text/xml') {
    rows = parseXML(buffer);
  } else if (ext === 'pdf' || mimetype === 'application/pdf') {
    rows = await parsePDF(buffer);
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  const mapped = rows.map(mapRowToDeal).filter(Boolean);
  const results = [];

  for (const { deal, stakeholder } of mapped) {
    // Check for duplicate company
    const { data: existing } = await supabase
      .from('deals')
      .select('id')
      .eq('company', deal.company)
      .eq('rep_id', 'rep_001')
      .maybeSingle();

    if (existing) {
      results.push({ skipped: true, company: deal.company, reason: 'already exists' });
      continue;
    }

    const { data: newDeal, error } = await supabase
      .from('deals')
      .insert(deal)
      .select()
      .single();

    if (error) {
      results.push({ skipped: true, company: deal.company, reason: error.message });
      continue;
    }

    if (stakeholder) {
      await supabase.from('stakeholders').insert({
        deal_id: newDeal.id,
        ...stakeholder,
      });
    }

    results.push({ imported: true, deal: newDeal });
  }

  return {
    total: rows.length,
    imported: results.filter(r => r.imported).length,
    skipped: results.filter(r => r.skipped).length,
    deals: results.filter(r => r.imported).map(r => r.deal),
  };
}
