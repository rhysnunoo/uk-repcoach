import { Client } from '@hubspot/api-client';

let hubspotClient: Client | null = null;

export function getHubspotClient(): Client {
  if (!hubspotClient) {
    const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error('HUBSPOT_ACCESS_TOKEN is not configured');
    }

    hubspotClient = new Client({ accessToken });
  }

  return hubspotClient;
}

export async function testHubspotConnection(): Promise<boolean> {
  try {
    const client = getHubspotClient();
    await client.crm.owners.ownersApi.getPage();
    return true;
  } catch (error) {
    console.error('HubSpot connection test failed:', error);
    return false;
  }
}

export interface HubspotOwner {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export async function fetchHubspotOwners(): Promise<HubspotOwner[]> {
  const client = getHubspotClient();
  const owners: HubspotOwner[] = [];

  try {
    let after: string | undefined;

    do {
      const response = await client.crm.owners.ownersApi.getPage(undefined, after);

      for (const owner of response.results) {
        owners.push({
          id: owner.id,
          email: owner.email || '',
          firstName: owner.firstName || undefined,
          lastName: owner.lastName || undefined,
        });
      }

      after = response.paging?.next?.after;
    } while (after);

    return owners;
  } catch (error) {
    console.error('Failed to fetch HubSpot owners:', error);
    throw error;
  }
}

export interface HubspotCall {
  id: string;
  properties: {
    hs_call_body?: string;
    hs_call_callee_object_id?: string;
    hs_call_callee_object_type?: string;
    hs_call_direction?: string;
    hs_call_disposition?: string;
    hs_call_duration?: string;
    hs_call_from_number?: string;
    hs_call_recording_url?: string;
    hs_call_status?: string;
    hs_call_title?: string;
    hs_call_to_number?: string;
    hs_timestamp?: string;
    hubspot_owner_id?: string;
    hs_call_transcript?: string;
  };
  associations?: {
    contacts?: Array<{ id: string }>;
    deals?: Array<{ id: string }>;
  };
}

export async function fetchHubspotCalls(
  sinceTimestamp?: string
): Promise<HubspotCall[]> {
  const client = getHubspotClient();
  const calls: HubspotCall[] = [];

  try {
    const properties = [
      'hs_call_body',
      'hs_call_callee_object_id',
      'hs_call_callee_object_type',
      'hs_call_direction',
      'hs_call_disposition',
      'hs_call_duration',
      'hs_call_from_number',
      'hs_call_recording_url',
      'hs_call_status',
      'hs_call_title',
      'hs_call_to_number',
      'hs_timestamp',
      'hubspot_owner_id',
      'hs_call_transcript',
    ];

    let after: string | undefined;

    do {
      const searchRequest = {
        filterGroups: sinceTimestamp
          ? [
              {
                filters: [
                  {
                    propertyName: 'hs_timestamp',
                    operator: 'GTE' as const,
                    value: sinceTimestamp,
                  },
                  {
                    propertyName: 'hs_call_status',
                    operator: 'EQ' as const,
                    value: 'COMPLETED',
                  },
                ],
              },
            ]
          : [
              {
                filters: [
                  {
                    propertyName: 'hs_call_status',
                    operator: 'EQ' as const,
                    value: 'COMPLETED',
                  },
                ],
              },
            ],
        properties,
        sorts: ['hs_timestamp'],
        limit: 100,
        ...(after ? { after } : {}),
      };

      // @ts-ignore - HubSpot API types don't match exactly
      const response = await client.crm.objects.calls.searchApi.doSearch(searchRequest);

      for (const call of response.results) {
        calls.push({
          id: call.id,
          properties: call.properties,
        });
      }

      after = response.paging?.next?.after;
    } while (after);

    return calls;
  } catch (error) {
    console.error('Failed to fetch HubSpot calls:', error);
    throw error;
  }
}

export async function fetchContactDetails(contactId: string): Promise<{
  name: string;
  phone: string | null;
} | null> {
  const client = getHubspotClient();

  try {
    const contact = await client.crm.contacts.basicApi.getById(contactId, [
      'firstname',
      'lastname',
      'phone',
    ]);

    const firstName = contact.properties.firstname || '';
    const lastName = contact.properties.lastname || '';
    const name = `${firstName} ${lastName}`.trim() || 'Unknown';

    return {
      name,
      phone: contact.properties.phone || null,
    };
  } catch (error) {
    console.error('Failed to fetch contact details:', error);
    return null;
  }
}
