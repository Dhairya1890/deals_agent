-- =============================================
-- SEED DATA: 5 closed past deals
-- =============================================

-- Deal 1: WON — SaaS, ROI objection handled correctly
insert into deals (id, title, company, stage, outcome, value_usd, industry, rep_id, created_at, closed_at) values
('d1000000-0000-0000-0000-000000000001', 'Nexus Analytics Platform', 'Nexus Analytics', 'closed', 'won', 95000, 'SaaS', 'rep_001', '2026-01-10', '2026-02-28');

insert into stakeholders (deal_id, name, role, seniority, sentiment, influence_score, primary_concern) values
('d1000000-0000-0000-0000-000000000001', 'Linda Cho', 'CFO', 'c_suite', 'positive', 0.9, 'Needed verified ROI before board approval'),
('d1000000-0000-0000-0000-000000000001', 'Raj Mehta', 'VP Product', 'vp', 'positive', 0.75, 'Feature completeness for analytics use case');

insert into interactions (deal_id, type, summary, occurred_at) values
('d1000000-0000-0000-0000-000000000001', 'call', 'Discovery call. Linda raised ROI concerns. Raj enthusiastic about product.', '2026-01-15'),
('d1000000-0000-0000-0000-000000000001', 'email', 'Sent ROI case study from Stripe and Shopify deployments. Linda responded positively.', '2026-02-01'),
('d1000000-0000-0000-0000-000000000001', 'meeting', 'Closed. Linda approved after 90-day success clause was added to contract.', '2026-02-28');

insert into objections (deal_id, text, category, response_used, outcome, was_resolved) values
('d1000000-0000-0000-0000-000000000001', 'ROI projections are not substantiated enough for board approval', 'roi', 'Shared two customer case studies (Stripe, Shopify) showing 3.2x ROI with auditable data. Also added a 90-day success review clause with defined KPIs.', 'resolved', true),
('d1000000-0000-0000-0000-000000000001', 'Not sure if the analytics features cover our edge cases', 'technical', 'Scheduled a technical deep-dive with Raj and our solutions engineer. Demoed three of their specific edge cases live.', 'resolved', true);

-- Deal 2: WON — Fintech, Pricing objection overcome with phased pricing
insert into deals (id, title, company, stage, outcome, value_usd, industry, rep_id, created_at, closed_at) values
('d2000000-0000-0000-0000-000000000002', 'Clearwater Payments Integration', 'Clearwater Payments', 'closed', 'won', 78000, 'Fintech', 'rep_001', '2026-01-05', '2026-02-15');

insert into stakeholders (deal_id, name, role, seniority, sentiment, influence_score, primary_concern) values
('d2000000-0000-0000-0000-000000000002', 'Tom Reyes', 'CEO', 'c_suite', 'positive', 1.0, 'Annual contract too large for current runway'),
('d2000000-0000-0000-0000-000000000002', 'Dana Kim', 'Head of Finance', 'director', 'skeptical', 0.8, 'Budget allocated for only $50k this quarter');

insert into interactions (deal_id, type, summary, occurred_at) values
('d2000000-0000-0000-0000-000000000002', 'call', 'Tom loves the product but Dana flagged they cannot commit to annual $78k upfront.', '2026-01-12'),
('d2000000-0000-0000-0000-000000000002', 'email', 'Proposed phased pricing: $30k Q1, $25k Q2, $23k Q3 (10% total discount for commitment). Dana approved.', '2026-02-10'),
('d2000000-0000-0000-0000-000000000002', 'meeting', 'Contract signed with phased payment structure.', '2026-02-15');

insert into objections (deal_id, text, category, response_used, outcome, was_resolved) values
('d2000000-0000-0000-0000-000000000002', 'Annual contract price is above our current budget allocation', 'pricing', 'Offered phased payment structure across 3 quarters with a 10% total discount for commitment. Eliminated the upfront risk for finance team.', 'resolved', true),
('d2000000-0000-0000-0000-000000000002', 'Need internal approval from board before signing this size of deal', 'procurement', 'Provided a one-page executive summary designed specifically for board presentation. Offered to join the board call.', 'resolved', true);

-- Deal 3: WON — Healthcare, Timing and compliance objections
insert into deals (id, title, company, stage, outcome, value_usd, industry, rep_id, created_at, closed_at) values
('d3000000-0000-0000-0000-000000000003', 'MedCore EHR Migration', 'MedCore Health', 'closed', 'won', 210000, 'Healthcare', 'rep_001', '2025-11-01', '2026-01-20');

insert into stakeholders (deal_id, name, role, seniority, sentiment, influence_score, primary_concern) values
('d3000000-0000-0000-0000-000000000003', 'Patricia Owens', 'CIO', 'c_suite', 'positive', 0.95, 'HIPAA compliance and data residency'),
('d3000000-0000-0000-0000-000000000003', 'Dr. Samuel Ford', 'Chief Medical Officer', 'c_suite', 'neutral', 0.85, 'Clinical workflow disruption during migration');

insert into interactions (deal_id, type, summary, occurred_at) values
('d3000000-0000-0000-0000-000000000003', 'meeting', 'Patricia concerned about HIPAA. Dr. Ford worried about disruption to clinical workflows during switch.', '2025-11-15'),
('d3000000-0000-0000-0000-000000000003', 'email', 'Shared HIPAA BAA, SOC 2 Type II certification, and US-only data residency documentation.', '2025-12-01'),
('d3000000-0000-0000-0000-000000000003', 'call', 'Proposed phased migration: pilot with one department first, full rollout only after sign-off. Dr Ford agreed.', '2026-01-05'),
('d3000000-0000-0000-0000-000000000003', 'meeting', 'Contract signed. Migration starting Q2.', '2026-01-20');

insert into objections (deal_id, text, category, response_used, outcome, was_resolved) values
('d3000000-0000-0000-0000-000000000003', 'We need HIPAA compliance guarantees and data residency in the US', 'technical', 'Provided HIPAA BAA, SOC 2 Type II report, and written data residency guarantee. Legal reviewed and approved.', 'resolved', true),
('d3000000-0000-0000-0000-000000000003', 'A full migration will disrupt our clinical workflows too severely', 'timing', 'Proposed a phased rollout starting with one non-critical department as a 60-day pilot before full deployment. Dr. Ford accepted immediately.', 'resolved', true);

-- Deal 4: LOST — SaaS, Competitor with deeper integrations
insert into deals (id, title, company, stage, outcome, value_usd, industry, rep_id, created_at, closed_at) values
('d4000000-0000-0000-0000-000000000004', 'BrightPath CRM Upgrade', 'BrightPath Media', 'closed', 'lost', 55000, 'Media', 'rep_001', '2026-02-01', '2026-03-15');

insert into stakeholders (deal_id, name, role, seniority, sentiment, influence_score, primary_concern) values
('d4000000-0000-0000-0000-000000000004', 'Kevin Lam', 'VP Operations', 'vp', 'neutral', 0.8, 'Their existing stack is heavily integrated with HubSpot'),
('d4000000-0000-0000-0000-000000000004', 'Anna Brooks', 'CTO', 'c_suite', 'blocking', 0.9, 'Native HubSpot integration is non-negotiable');

insert into interactions (deal_id, type, summary, occurred_at) values
('d4000000-0000-0000-0000-000000000004', 'call', 'Anna made clear that HubSpot native integration is a hard requirement. We had only a Zapier-based workaround.', '2026-02-20'),
('d4000000-0000-0000-0000-000000000004', 'email', 'Sent Zapier integration guide. Anna said it was insufficient. Deal lost to competitor with native HubSpot integration.', '2026-03-10');

insert into objections (deal_id, text, category, response_used, outcome, was_resolved) values
('d4000000-0000-0000-0000-000000000004', 'You do not have a native HubSpot integration — we cannot use Zapier workarounds', 'competitor', 'Offered Zapier-based integration guide and promised native integration on roadmap for Q4. CTO rejected — said Q4 is too late.', 'persisted', false),
('d4000000-0000-0000-0000-000000000004', 'Competitor X already has everything we need natively', 'competitor', 'Highlighted our superior analytics and reporting vs competitor. Not enough to overcome the integration gap.', 'persisted', false);

-- Deal 5: LOST — Retail, Champion left the company mid-deal
insert into deals (id, title, company, stage, outcome, value_usd, industry, rep_id, created_at, closed_at) values
('d5000000-0000-0000-0000-000000000005', 'Vantage Retail Intelligence', 'Vantage Retail', 'closed', 'lost', 88000, 'Retail', 'rep_001', '2026-01-20', '2026-03-01');

insert into stakeholders (deal_id, name, role, seniority, sentiment, influence_score, primary_concern) values
('d5000000-0000-0000-0000-000000000005', 'Chris Dawson', 'VP Strategy', 'vp', 'positive', 0.85, 'Strong internal champion — left company in February'),
('d5000000-0000-0000-0000-000000000005', 'Helen Park', 'CFO', 'c_suite', 'skeptical', 0.9, 'New decision maker with no context on the deal');

insert into interactions (deal_id, type, summary, occurred_at) values
('d5000000-0000-0000-0000-000000000005', 'call', 'Chris Dawson driving the deal. Strong alignment. Ready to move to proposal.', '2026-01-28'),
('d5000000-0000-0000-0000-000000000005', 'email', 'Chris announced he is leaving the company. Introduced Helen Park as new contact.', '2026-02-12'),
('d5000000-0000-0000-0000-000000000005', 'call', 'Helen has no context on the deal evaluation. Asked us to restart the process. Lost momentum.', '2026-02-20'),
('d5000000-0000-0000-0000-000000000005', 'email', 'Helen decided not to proceed — new priorities under new leadership.', '2026-03-01');

insert into objections (deal_id, text, category, response_used, outcome, was_resolved) values
('d5000000-0000-0000-0000-000000000005', 'Our internal champion left — I have no context on why this was being evaluated', 'champion', 'Sent Helen a full deal summary, ROI analysis, and offer to re-run the evaluation. She did not re-engage.', 'persisted', false),
('d5000000-0000-0000-0000-000000000005', 'We have new strategic priorities under new leadership that do not include this', 'timing', 'Offered to pause and re-engage in Q2 when priorities settle. No response.', 'persisted', false);

-- =============================================
-- PATTERNS: Pre-seeded cross-deal intelligence
-- =============================================

insert into patterns (objection_category, winning_response, win_count, loss_count, industries) values
('roi', 'Share 2-3 customer case studies with auditable ROI numbers. Add a 90-day success review clause with defined KPIs to the contract. Avoid generic ROI claims — CFOs respond to verified evidence.', 2, 0, ARRAY['SaaS', 'Healthcare']),
('pricing', 'Offer phased payment structure across 2-3 quarters with a small discount for commitment. This eliminates upfront budget risk. Prepare a one-page finance summary for internal approval.', 2, 0, ARRAY['Fintech', 'SaaS']),
('timing', 'Propose a limited pilot (one department or use case) as a 60-day proof of concept before full rollout. This reduces perceived risk and gives the champion an internal win to show stakeholders.', 1, 1, ARRAY['Healthcare']),
('competitor', 'Acknowledge the gap honestly. Highlight 2-3 areas where your product is measurably better. If the gap is a hard blocker, qualify out early — do not waste cycles on an unwinnable deal.', 0, 2, ARRAY['Media']),
('champion', 'When champion leaves, immediately request an intro to the new decision maker. Send a one-page deal summary + ROI snapshot within 24 hours. Re-run a short discovery — never assume context transfers.', 0, 1, ARRAY['Retail']),
('technical', 'Schedule a dedicated technical deep-dive with a solutions engineer. Demo the specific use cases the prospect raised. Provide written documentation (compliance certs, architecture diagrams) for their records.', 2, 0, ARRAY['SaaS', 'Healthcare']),
('procurement', 'Provide an executive summary formatted for board/procurement review. Offer to join the internal presentation call. Include a mutual action plan with clear dates.', 1, 0, ARRAY['Fintech']);
