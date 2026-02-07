import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/supabase/server';

// Test endpoint to see what data Ringover returns for calls
// Only accessible to admins
// Version 3 - test /calls endpoint
export async function GET() {
  const VERSION = 'v3-calls';
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

    // Test direct API call to fetch calls
    const callsUrl = 'https://public-api.ringover.com/v2/calls?limit=3';
    const response = await fetch(callsUrl, {
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
        testedUrl: callsUrl,
      });
    }

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
      { version: 'v3-calls', error: error instanceof Error ? error.message : 'Failed to fetch calls' },
      { status: 500 }
    );
  }
}
