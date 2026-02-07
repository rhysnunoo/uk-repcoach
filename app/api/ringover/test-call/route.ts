import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/supabase/server';

// Test endpoint to see what data Ringover returns for calls
// Only accessible to admins
// Version 4 - try multiple auth formats
export async function GET() {
  const VERSION = 'v4-multi-auth';
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

    // Try multiple auth formats
    const callsUrl = 'https://public-api.ringover.com/v2/calls?limit=3';
    const authFormats = [
      { name: 'raw', value: apiKey },
      { name: 'Bearer', value: `Bearer ${apiKey}` },
      { name: 'Basic', value: `Basic ${apiKey}` },
    ];

    const results: Record<string, { status: number; body: string }> = {};

    for (const format of authFormats) {
      const response = await fetch(callsUrl, {
        headers: {
          'Authorization': format.value,
          'Content-Type': 'application/json',
        },
      });
      const text = await response.text();
      results[format.name] = { status: response.status, body: text.substring(0, 200) };

      // If one works, return success
      if (response.ok) {
        let data;
        try { data = JSON.parse(text); } catch { data = text; }
        return NextResponse.json({
          version: VERSION,
          message: 'Success!',
          workingAuthFormat: format.name,
          data: data,
          sampleCall: data?.call_log_list?.[0] || null,
        });
      }
    }

    // None worked - return all results for debugging
    return NextResponse.json({
      version: VERSION,
      error: 'All auth formats failed',
      keyPreview: `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`,
      keyLength: apiKey.length,
      results: results,
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
      { version: 'v4-multi-auth', error: error instanceof Error ? error.message : 'Failed to fetch calls' },
      { status: 500 }
    );
  }
}
