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
    await ringoverFetch('/team');
    return true;
  } catch (error) {
    console.error('Ringover connection test failed:', error);
    return false;
  }
}

export interface RingoverUser {
  user_id: number;
  email: string;
  firstname: string;
  lastname: string;
  concat_name: string;
  numbers: Array<{
    number: string;
    country: string;
  }>;
}

interface RingoverTeamResponse {
  team: {
    users: RingoverUser[];
  };
}

export async function fetchRingoverUsers(): Promise<RingoverUser[]> {
  try {
    const response = await ringoverFetch<RingoverTeamResponse>('/team');
    return response.team?.users || [];
  } catch (error) {
    console.error('Failed to fetch Ringover users:', error);
    throw error;
  }
}

export interface RingoverCall {
  call_id: string;
  cdr_id: number;
  user_id: number;
  direction: 'INBOUND' | 'OUTBOUND';
  status: 'ANSWERED' | 'MISSED' | 'VOICEMAIL' | 'BUSY' | 'FAILED';
  start_time: string; // ISO timestamp
  answer_time: string | null;
  end_time: string;
  duration: number; // seconds
  wait_duration: number;
  talk_duration: number;
  from_number: string;
  to_number: string;
  from_name: string | null;
  to_name: string | null;
  recording_url: string | null;
  contact?: {
    contact_id: number;
    firstname: string | null;
    lastname: string | null;
    company: string | null;
  };
  user?: {
    user_id: number;
    firstname: string;
    lastname: string;
    email: string;
  };
}

interface RingoverCallsResponse {
  call_log_list: RingoverCall[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export async function fetchRingoverCalls(
  startDate?: Date,
  endDate?: Date,
  limit: number = 100
): Promise<RingoverCall[]> {
  const allCalls: RingoverCall[] = [];
  let page = 1;

  try {
    while (true) {
      let endpoint = `/calls?limit=${limit}&page=${page}`;

      if (startDate) {
        endpoint += `&start_date=${startDate.toISOString()}`;
      }

      if (endDate) {
        endpoint += `&end_date=${endDate.toISOString()}`;
      }

      const response = await ringoverFetch<RingoverCallsResponse>(endpoint);

      if (!response.call_log_list || response.call_log_list.length === 0) {
        break;
      }

      allCalls.push(...response.call_log_list);

      // Check if we've fetched all pages
      if (response.pagination) {
        if (page >= response.pagination.pages) {
          break;
        }
      } else {
        // No pagination info, assume single page
        break;
      }

      page++;
    }

    return allCalls;
  } catch (error) {
    console.error('Failed to fetch Ringover calls:', error);
    throw error;
  }
}

// Empower API for transcriptions
const EMPOWER_BASE_URL = 'https://public-api.ringover.com/v2/empower';

export interface RingoverTranscriptSegment {
  speaker: 'agent' | 'customer';
  text: string;
  start_time: number; // seconds
  end_time: number;
}

interface EmpowerTranscriptionResponse {
  transcription?: {
    segments: Array<{
      speaker: string;
      text: string;
      start: number;
      end: number;
    }>;
  };
  transcript?: Array<{
    speaker: string;
    content: string;
    timestamp_start: number;
    timestamp_end: number;
  }>;
}

export async function fetchCallTranscription(
  callId: string
): Promise<RingoverTranscriptSegment[] | null> {
  try {
    const response = await rateLimitedFetch(
      `${EMPOWER_BASE_URL}/call/${callId}`,
      {
        headers: {
          Authorization: getApiKey(),
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // Transcription might not be available
      console.log(`No transcription available for call ${callId}`);
      return null;
    }

    const data: EmpowerTranscriptionResponse = await response.json();

    // Try to extract transcription from various response formats
    if (data.transcription?.segments) {
      return data.transcription.segments.map((seg) => ({
        speaker: seg.speaker === 'agent' ? 'agent' : 'customer',
        text: seg.text,
        start_time: seg.start,
        end_time: seg.end,
      }));
    }

    if (data.transcript) {
      return data.transcript.map((seg) => ({
        speaker: seg.speaker === 'agent' ? 'agent' : 'customer',
        text: seg.content,
        start_time: seg.timestamp_start,
        end_time: seg.timestamp_end,
      }));
    }

    return null;
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
