import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/supabase/server';

// Test endpoint to see what data Ringover returns for calls
// Only accessible to admins
// Version 2 - with debug info
export async function GET() {
  const VERSION = 'v2-debug';
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

    // Test direct API call with detailed error info
    const testUrl = 'https://public-api.ringover.com/v2/team';
    const response = await fetch(testUrl, {
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();

    if (!response.ok) {
      return NextResponse.json({
        version: VERSION,
        error: 'Ringover API failed',
        status: response.status,
        statusText: response.statusText,
        responseBody: responseText,
        keyPreview: `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`,
        keyLength: apiKey.length,
      });
    }

    // If we got here, try to parse and fetch calls
    const teamData = JSON.parse(responseText);

    // Now fetch calls
    const callsResponse = await fetch('https://public-api.ringover.com/v2/calls?limit=5', {
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
    });

    const callsText = await callsResponse.text();
    let callsData;
    try {
      callsData = JSON.parse(callsText);
    } catch {
      callsData = callsText;
    }

    return NextResponse.json({
      version: VERSION,
      message: 'Ringover API connection successful',
      team: teamData,
      calls: callsData,
    });
  } catch (error) {
    console.error('Test call error:', error);
    return NextResponse.json(
      { version: 'v2-debug', error: error instanceof Error ? error.message : 'Failed to fetch calls' },
      { status: 500 }
    );
  }
}
