// Ringover API client using API Key authentication
// Rate limit: 60 requests/minute (assumed similar to Aircall)

const RINGOVER_BASE_URL = 'https://public-api.ringover.com/v2';

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 1000; // 1 second between requests

async function rateLimitedFetch(
  url: string,
  options: RequestInit
): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
  return fetch(url, options);
}

function getApiKey(): string {
  const apiKey = process.env.RINGOVER_API_KEY;

  if (!apiKey) {
    throw new Error('RINGOVER_API_KEY must be configured');
  }

  return apiKey;
}

async function ringoverFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${RINGOVER_BASE_URL}${endpoint}`;

  const response = await rateLimitedFetch(url, {
    ...options,
    headers: {
      Authorization: getApiKey(),
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ringover API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

export async function testRingoverConnection(): Promise<boolean> {
  try {
    // Use /groups endpoint as it's confirmed to work
    await ringoverFetch('/groups');
    return true;
  } catch (error) {
    console.error('Ringover connection test failed:', error);
    return false;
  }
}

export interface RingoverUser {
  user_id: number;
  team_id: number;
  email: string;
  firstname: string;
  lastname: string;
  concat_name: string;
  initial?: string;
  color?: string;
  company?: string;
  picture?: string;
}

export interface RingoverGroup {
  group_id: number;
  name: string;
  total_users_count: number;
  color: string | null;
  is_jumper: boolean;
}

interface RingoverGroupsResponse {
  list_count: number;
  list: RingoverGroup[];
}

export async function fetchRingoverGroups(): Promise<RingoverGroup[]> {
  try {
    const response = await ringoverFetch<RingoverGroupsResponse>('/groups');
    return response.list || [];
  } catch (error) {
    console.error('Failed to fetch Ringover groups:', error);
    throw error;
  }
}

// Extract unique users from recent calls (since /team endpoint doesn't work)
export async function fetchRingoverUsers(): Promise<RingoverUser[]> {
  try {
    const calls = await fetchRingoverCalls(undefined, undefined, 100);
    const usersMap = new Map<number, RingoverUser>();

    for (const call of calls) {
      if (call.user && !usersMap.has(call.user.user_id)) {
        usersMap.set(call.user.user_id, call.user);
      }
    }

    return Array.from(usersMap.values());
  } catch (error) {
    console.error('Failed to fetch Ringover users:', error);
    throw error;
  }
}

export interface RingoverCall {
  call_id: string;
  cdr_id: number;
  channel_id?: string;
  type?: string; // 'IVR', etc.
  direction: 'in' | 'out';
  is_answered: boolean;
  last_state: 'ANSWERED' | 'MISSED' | 'CANCELLED' | 'VOICEMAIL' | 'BUSY' | 'FAILED';
  start_time: string; // ISO timestamp
  answered_time: string | null;
  end_time: string;
  incall_duration: number | null; // seconds
  total_duration: number; // seconds
  contact_number: string;
  queue_duration?: number;
  ringing_duration?: number;
  hold_duration?: number;
  hangup_by?: 'CALLER' | 'CALLEE';
  from_number: string;
  to_number: string;
  note?: string | null;
  record: string | null; // recording URL
  contact?: {
    contact_id: number;
    firstname: string | null;
    lastname: string | null;
    company: string | null;
  } | null;
  user?: RingoverUser | null;
  ivr?: {
    ivr_id: number;
    name: string;
    color: string;
    is_open: boolean;
  } | null;
  amd?: boolean; // Answering machine detection
  groups?: number[] | null;
}

interface RingoverCallsResponse {
  user_id: number;
  team_id: number;
  total_call_count: number;
  total_missed_call_count: number;
  call_list_count: number;
  call_list: RingoverCall[];
}

export async function fetchRingoverCalls(
  startDate?: Date,
  endDate?: Date,
  limit: number = 100
): Promise<RingoverCall[]> {
  try {
    let endpoint = `/calls?limit=${limit}`;

    if (startDate) {
      endpoint += `&start_date=${startDate.toISOString()}`;
    }

    if (endDate) {
      endpoint += `&end_date=${endDate.toISOString()}`;
    }

    const response = await ringoverFetch<RingoverCallsResponse>(endpoint);

    return response.call_list || [];
  } catch (error) {
    console.error('Failed to fetch Ringover calls:', error);
    throw error;
  }
}

// Transcriptions API (GET /transcriptions/{call_id})
// Returns speech segments with channelId-based speaker identification:
//   For outbound calls: channelId 1 = agent, channelId 0 = customer
//   For inbound calls:  channelId 0 = agent, channelId 1 = customer

export interface RingoverTranscriptSegment {
  speaker: 'agent' | 'customer';
  text: string;
  start_time: number; // seconds
  end_time: number;
}

interface RingoverSpeechSegment {
  channelId: number;
  start: number;
  end: number;
  duration: number;
  text: string;
  words?: Array<{ text: string; start: number; end: number }>;
  named_entities?: Array<{ label: string; text: string; score: number }>;
}

interface RingoverTranscriptionItem {
  id: number;
  team_id: number;
  user_id: number;
  call_id: string;
  channel_id: string;
  provider: string;
  transcription_status: string;
  transcription_data: {
    duration: number;
    num_channels: number | null;
    speeches: RingoverSpeechSegment[];
    text?: string;
  } | null;
}

export async function fetchCallTranscription(
  callId: string,
  direction: 'in' | 'out' = 'out'
): Promise<RingoverTranscriptSegment[] | null> {
  try {
    const data = await ringoverFetch<RingoverTranscriptionItem[]>(
      `/transcriptions/${callId}`
    );

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log(`No transcription available for call ${callId}`);
      return null;
    }

    const item = data[0];

    if (item.transcription_status !== 'DONE' || !item.transcription_data?.speeches) {
      console.log(`Transcription not ready for call ${callId}: status=${item.transcription_status}`);
      return null;
    }

    // For outbound calls: channelId 1 = agent (rep), channelId 0 = customer
    // For inbound calls: channelId 0 = agent (rep), channelId 1 = customer
    const agentChannelId = direction === 'out' ? 1 : 0;

    return item.transcription_data.speeches.map((seg) => ({
      speaker: seg.channelId === agentChannelId ? 'agent' : 'customer',
      text: seg.text,
      start_time: seg.start,
      end_time: seg.end,
    }));
  } catch (error) {
    console.log(`No transcription available for call ${callId}:`, error);
    return null;
  }
}

interface RingoverCallDetailResponse {
  call: RingoverCall;
}

export async function fetchCallDetails(
  callId: string
): Promise<RingoverCall | null> {
  try {
    const response = await ringoverFetch<RingoverCallDetailResponse>(
      `/calls/${callId}`
    );

    return response.call;
  } catch (error) {
    console.error(`Failed to fetch call ${callId} details:`, error);
    return null;
  }
}
