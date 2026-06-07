import { groqComplete } from './groqClient.js';

const VALID_CATEGORIES = ['pricing', 'roi', 'timing', 'competitor', 'champion', 'technical', 'procurement'];

const EXTRACTION_SYSTEM_PROMPT = `You are a sales intelligence extraction engine.

Given a raw sales interaction (email, call transcript, or meeting notes), extract structured information in JSON format.

Return ONLY valid JSON. No markdown, no explanation, no backticks.

Your output must match this exact schema:
{
  "summary": "2-3 sentence summary of what happened in this interaction",
  "participants": ["Name 1", "Name 2"],
  "stakeholders": [
    {
      "name": "Full Name",
      "role": "Their job title",
      "seniority": "one of: c_suite | vp | director | manager | ic",
      "sentiment": "one of: positive | neutral | skeptical | blocking",
      "primary_concern": "The main concern or interest they expressed (1 sentence)"
    }
  ],
  "objections": [
    {
      "text": "Exact objection as expressed (1-2 sentences)",
      "category": "one of: pricing | roi | timing | competitor | champion | technical | procurement",
      "response_used": null
    }
  ],
  "commitments": [
    "Any commitments made by either side (e.g. 'Will send ROI case study by Friday')"
  ]
}

Rules:
- Only include stakeholders who are PROSPECTS (not your own team members)
- Only extract objections that are genuine concerns — not questions or neutral statements
- Category must be exactly one of the enum values — never free-form
- If no objections, return empty array []
- If no commitments, return empty array []
- sentiment=blocking means the person is actively opposing the deal`;

function validateCategories(parsed) {
  if (!parsed.objections) return parsed;
  parsed.objections = parsed.objections.map(obj => ({
    ...obj,
    category: VALID_CATEGORIES.includes(obj.category) ? obj.category : 'technical',
  }));
  return parsed;
}

export async function extractFromText(rawContent, dealId) {
  try {
    const text = await groqComplete({
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Extract structured information from this sales interaction:\n\n${rawContent}`,
        },
      ],
      max_tokens: 1024,
    });

    const parsed = JSON.parse(text.trim());
    return validateCategories(parsed);
  } catch (e) {
    console.error('Extraction error:', e.message);
    return {
      summary: rawContent.slice(0, 200),
      participants: [],
      stakeholders: [],
      objections: [],
      commitments: [],
    };
  }
}
