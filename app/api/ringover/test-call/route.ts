import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/supabase/server';

// Test endpoint to see what data Ringover returns for calls
// Only accessible to admins
// Version 5 - try multiple endpoints
export async function GET() {
  const VERSION = 'v5-endpoints';
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Debug: Check if API key is set
    const apiKey = process.env.RINGOVER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        version: VERSION,
        error: 'RINGOVER_API_KEY not set',
        envKeys: Object.keys(process.env).filter(k => k.includes('RINGOVER'))
      });
    }

    // Try multiple endpoints to see which ones the key has access to
    const endpoints = [
      '/calls?limit=1',
      '/users',
      '/me',
      '/channels',
      '/groups',
    ];

    const results: Record<string, { status: number; body: string }> = {};

    for (const endpoint of endpoints) {
      const url = `https://public-api.ringover.com/v2${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
      });
      const text = await response.text();
      results[endpoint] = { status: response.status, body: text.substring(0, 300) };

      // If one works, show the data
      if (response.ok) {
        let data;
        try { data = JSON.parse(text); } catch { data = text; }
        return NextResponse.json({
          version: VERSION,
          message: 'Found working endpoint!',
          workingEndpoint: endpoint,
          data: data,
        });
      }
    }

    // None worked
    return NextResponse.json({
      version: VERSION,
      error: 'No endpoints accessible with this API key',
      keyPreview: `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`,
      keyLength: apiKey.length,
      endpointResults: results,
      hint: 'Check Ringover dashboard - you may need an API key with different permissions, or there might be different key types (User API key vs Organization API key)',
    });

    // Parse call data
    let callsData;
    try {
      callsData = JSON.parse(responseText);
    } catch {
      callsData = responseText;
    }

    // Show the raw structure so we can see all available fields
    return NextResponse.json({
      version: VERSION,
      message: 'Ringover API connection successful!',
      rawResponse: callsData,
      // If there are calls, show the first one's structure
      sampleCall: callsData?.call_log_list?.[0] || null,
      availableFields: callsData?.call_log_list?.[0] ? Object.keys(callsData.call_log_list[0]) : [],
    });
  } catch (error) {
    console.error('Test call error:', error);
    return NextResponse.json(
      { version: 'v5-endpoints', error: error instanceof Error ? error.message : 'Failed to fetch calls' },
      { status: 500 }
    );
  }
}
