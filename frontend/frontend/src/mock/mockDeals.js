export const mockDeals = [
  {
    id: "deal_001",
    title: "Acme Corp Enterprise",
    company: "Acme Corp",
    stage: "negotiation",
    outcome: null,
    value_usd: 120000,
    industry: "SaaS",
    rep_id: "rep_001",
    created_at: "2026-05-01T09:00:00Z",
    stakeholders: [
      {
        id: "s_001",
        name: "Sarah Chen",
        role: "CFO",
        seniority: "c_suite",
        sentiment: "skeptical",
        influence_score: 0.9,
        primary_concern: "ROI projections seem optimistic",
      },
      {
        id: "s_002",
        name: "James Patel",
        role: "VP Engineering",
        seniority: "vp",
        sentiment: "positive",
        influence_score: 0.7,
        primary_concern: "Integration complexity with legacy systems",
      },
    ],
    interactions: [
      {
        id: "i_001",
        type: "call",
        summary:
          "Discovery call. James expressed enthusiasm. Sarah raised concerns about ROI.",
        occurred_at: "2026-05-05T14:00:00Z",
        participants: ["Sarah Chen", "James Patel"],
      },
      {
        id: "i_002",
        type: "email",
        summary:
          "Sent proposal deck. Sarah replied asking for ROI breakdown by department.",
        occurred_at: "2026-05-20T10:00:00Z",
        participants: ["Sarah Chen"],
      },
    ],
    objections: [
      {
        id: "o_001",
        text: "ROI projections seem optimistic without departmental breakdown",
        category: "roi",
        was_resolved: false,
        response_used: null,
      },
      {
        id: "o_002",
        text: "Concerned about integration timeline with our legacy ERP",
        category: "technical",
        was_resolved: false,
        response_used: null,
      },
    ],
  },
  {
    id: "deal_002",
    title: "TechFlow Solutions",
    company: "TechFlow Solutions",
    stage: "proposal",
    outcome: null,
    value_usd: 65000,
    industry: "Fintech",
    rep_id: "rep_001",
    created_at: "2026-05-15T09:00:00Z",
    stakeholders: [
      {
        id: "s_003",
        name: "Marcus Webb",
        role: "CEO",
        seniority: "c_suite",
        sentiment: "positive",
        influence_score: 1.0,
        primary_concern: "Wants to move fast before Q3",
      },
    ],
    interactions: [
      {
        id: "i_003",
        type: "meeting",
        summary:
          "In-person meeting. Marcus wants to close before Q3 board meeting.",
        occurred_at: "2026-06-01T11:00:00Z",
        participants: ["Marcus Webb"],
      },
    ],
    objections: [
      {
        id: "o_003",
        text: "Price is above our initial budget allocation",
        category: "pricing",
        was_resolved: false,
        response_used: null,
      },
    ],
  },
];

export const mockAgentResponses = {
  "What's the biggest risk to this deal?": {
    reply:
      "Based on my analysis, the biggest risk to closing Acme Corp is **Sarah Chen's unresolved ROI concern**. As CFO with a 0.9 influence score, her skepticism is a critical blocker. She specifically needs auditable, department-level ROI evidence before presenting to the board.\n\n**Recommended actions:**\n1. Prepare a department-by-department ROI breakdown using verified customer data\n2. Connect Sarah with a CFO reference from a similar SaaS deal we closed\n3. Address this before the next call — every day of delay increases risk",
    retrieved_deals: [
      {
        company: "DataSync Inc",
        outcome: "closed-won",
        objection_text: "CFO wanted proof of ROI across departments",
        response_used:
          "Provided detailed case study with 3 verified customer ROI breakdowns by department. Arranged CFO-to-CFO reference call.",
        closed_at: "2026-02-15",
      },
      {
        company: "CloudFirst Ltd",
        outcome: "closed-lost",
        objection_text: "ROI projections not backed by evidence",
        response_used:
          "Only provided generic ROI calculator — insufficient for board-level decision.",
        closed_at: "2025-11-20",
      },
    ],
  },
  "How have we handled this objection before?": {
    reply:
      "I found **3 past deals** where ROI skepticism was the primary objection. Here's what worked:\n\n✅ **DataSync Inc** (Won): Provided verified, department-level ROI data from 3 existing customers. Key was connecting their CFO directly with our reference customer's CFO.\n\n❌ **CloudFirst Ltd** (Lost): We only provided a generic ROI calculator. The CFO deemed it insufficient.\n\n✅ **NexGen Systems** (Won): Created a custom pilot program with measurable KPIs tied to their specific use case. ROI was proven within 30 days.\n\n**Pattern**: Deals succeed when we provide specific, verifiable evidence rather than projections.",
    retrieved_deals: [
      {
        company: "DataSync Inc",
        outcome: "closed-won",
        objection_text: "ROI concerns from CFO",
        response_used:
          "Department-level case studies + CFO reference call",
        closed_at: "2026-02-15",
      },
      {
        company: "NexGen Systems",
        outcome: "closed-won",
        objection_text: "Needed proof before committing budget",
        response_used:
          "30-day pilot with measurable KPIs",
        closed_at: "2026-01-10",
      },
    ],
  },
  "What should I focus on in the next call?": {
    reply:
      "For your next call with Acme Corp, here's your priority list:\n\n**1. Lead with ROI evidence** (for Sarah Chen)\n- Bring verified case studies with departmental breakdown\n- Offer to connect her with a reference CFO\n\n**2. Leverage James Patel's support**\n- He's your internal champion — ask him to share his positive experience with Sarah\n- Address his integration concern with a concrete timeline\n\n**3. Create urgency**\n- Anchor to their internal timeline\n- Offer a time-limited incentive for decision within 2 weeks\n\n**4. Nail down next steps**\n- Propose a specific follow-up date\n- Get commitment on decision criteria",
    retrieved_deals: [],
  },
  default: {
    reply:
      "I've analyzed the current deal context and past deal patterns. Based on the interaction history and stakeholder dynamics, I recommend focusing on building consensus among key stakeholders while addressing open objections systematically. Would you like me to dive deeper into any specific area?",
    retrieved_deals: [],
  },
};

export const mockBriefing = {
  deal_001: {
    snapshot: { stage: "negotiation", value_usd: 120000, days_in_stage: 37 },
    open_objections: [
      {
        id: "o_001",
        text: "ROI projections seem optimistic without departmental breakdown",
        category: "roi",
      },
      {
        id: "o_002",
        text: "Concerned about integration timeline with our legacy ERP",
        category: "technical",
      },
    ],
    watch_stakeholders: [
      {
        name: "Sarah Chen",
        role: "CFO",
        sentiment: "skeptical",
        influence_score: 0.9,
        primary_concern: "ROI projections seem optimistic",
      },
    ],
    talking_points: [
      "Present department-by-department ROI analysis from DataSync Inc case study (similar SaaS deal, closed-won)",
      "Offer a structured pilot program with measurable KPIs to prove ROI within 30 days",
      "Address integration timeline — propose a phased rollout plan to reduce risk",
      "Leverage James Patel's enthusiasm to build internal consensus with Sarah",
      "Reference NexGen Systems success story — similar objections, closed in 45 days after pilot",
    ],
    next_step:
      "Schedule a 30-minute call with Sarah Chen specifically to walk through the departmental ROI breakdown. Bring a reference CFO from DataSync Inc.",
  },
  deal_002: {
    snapshot: { stage: "proposal", value_usd: 65000, days_in_stage: 23 },
    open_objections: [
      {
        id: "o_003",
        text: "Price is above our initial budget allocation",
        category: "pricing",
      },
    ],
    watch_stakeholders: [],
    talking_points: [
      "Marcus wants to move fast — align with his Q3 board meeting timeline",
      "For pricing, consider offering a phased payment structure or volume discount",
      "Highlight quick time-to-value with a fast onboarding track",
    ],
    next_step:
      "Send Marcus a revised pricing proposal with flexible payment options before end of week.",
  },
};

export const mockExtractionResult = {
  interaction: {
    id: "i_new_001",
    type: "email",
    summary:
      "Sarah Chen reviewed the proposal and finds ROI numbers optimistic. Requesting auditable evidence and customer case studies with verified ROI data before board approval.",
    occurred_at: new Date().toISOString(),
    participants: ["Sarah Chen"],
  },
  extracted: {
    summary:
      "Sarah Chen reviewed the proposal and finds ROI numbers optimistic. Requesting auditable evidence and customer case studies with verified ROI data before board approval.",
    stakeholders: [
      {
        name: "Sarah Chen",
        role: "CFO",
        sentiment_update: "skeptical",
        concern: "ROI numbers feel optimistic — needs auditable evidence",
      },
    ],
    objections: [
      {
        text: "ROI numbers feel optimistic — needs auditable evidence and verified customer case studies",
        category: "roi",
      },
    ],
    commitments: [
      "Provide customer case studies with verified ROI data",
    ],
  },
};
