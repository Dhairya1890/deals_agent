import { Client } from '@hubspot/api-client';

const hubspot = new Client({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN });

// CRM object types we pull and how to read their content
const ENGAGEMENT_TYPES = [
  {
    objectType: 'calls',
    interactionType: 'call',
    bodyProp: 'hs_call_body',
    titleProp: 'hs_call_title',
    dateProp: 'hs_timestamp',
  },
  {
    objectType: 'notes',
    interactionType: 'meeting',
    bodyProp: 'hs_note_body',
    titleProp: null,
    dateProp: 'hs_timestamp',
  },
  {
    objectType: 'emails',
    interactionType: 'email',
    bodyProp: 'hs_email_text',
    titleProp: 'hs_email_subject',
    dateProp: 'hs_timestamp',
  },
];

async function findCompanyId(companyName) {
  const res = await hubspot.crm.companies.searchApi.doSearch({
    filterGroups: [{
      filters: [{ propertyName: 'name', operator: 'EQ', value: companyName }],
    }],
    properties: ['name'],
    limit: 1,
  });
  return res.results?.[0]?.id || null;
}

async function fetchEngagementType(objectType, interactionType, bodyProp, titleProp, dateProp, companyId, limit) {
  const properties = [bodyProp, dateProp, titleProp].filter(Boolean);

  // Search engagements associated with this company via the v3 search API
  const res = await hubspot.crm.objects.searchApi.doSearch(objectType, {
    filterGroups: [{
      filters: [{
        propertyName: 'associations.company',
        operator: 'EQ',
        value: companyId,
      }],
    }],
    properties,
    sorts: [{ propertyName: dateProp, direction: 'DESCENDING' }],
    limit,
  });

  return (res.results || [])
    .map(obj => {
      const props = obj.properties;
      const title = titleProp ? (props[titleProp] || '') : '';
      const body  = props[bodyProp] || '';
      const text  = [title, body].filter(Boolean).join('\n').slice(0, 3000);
      const ts    = props[dateProp];

      if (!text) return null;

      return {
        source:      'hubspot',
        source_id:   `hs_${objectType}_${obj.id}`,
        type:        interactionType,
        occurred_at: ts ? new Date(ts).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        raw_content: `[HubSpot ${objectType.slice(0, -1)}] ${text}`.trim(),
      };
    })
    .filter(Boolean);
}

export async function fetchHubSpotActivity({ companyName, maxResults = 20 }) {
  try {
    if (!companyName) return [];

    const companyId = await findCompanyId(companyName);
    if (!companyId) {
      console.warn(`HubSpot: company "${companyName}" not found`);
      return [];
    }

    const perType = Math.ceil(maxResults / ENGAGEMENT_TYPES.length);

    const batches = await Promise.allSettled(
      ENGAGEMENT_TYPES.map(({ objectType, interactionType, bodyProp, titleProp, dateProp }) =>
        fetchEngagementType(objectType, interactionType, bodyProp, titleProp, dateProp, companyId, perType)
      )
    );

    return batches
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
      .slice(0, maxResults);
  } catch (err) {
    console.error('HubSpot fetch error:', err.message);
    return [];
  }
}
