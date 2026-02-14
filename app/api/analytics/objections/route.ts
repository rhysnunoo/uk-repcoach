import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cache, cacheKey, CACHE_TTL } from '@/lib/cache/simple-cache';
import OpenAI from 'openai';
import type { TranscriptSegment } from '@/types/database';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

// In-memory cache for individual call objection extractions (persists across requests)
const objectionCache = new Map<string, { objections: DetectedObjection[]; extractedAt: number }>();
const OBJECTION_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Common objection categories
const OBJECTION_CATEGORIES = [
  'price',
  'timing',
  'spouse',
  'skepticism',
  'past_failures',
  'competition',
  'commitment',
  'other',
] as const;

type ObjectionCategory = typeof OBJECTION_CATEGORIES[number];

interface DetectedObjection {
  objection: string;
  category: ObjectionCategory;
  handling_score: number;
  used_aaa: boolean;
  rep_response: string;
  outcome_after: 'handled_well' | 'handled_poorly' | 'unresolved';
}

interface CallObjectionData {
  call_id: string;
  rep_id: string;
  rep_name: string;
  call_date: string;
  outcome: string | null;
  objections: DetectedObjection[];
}

export async function GET() {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check response cache first (5 minute TTL for full response)
    const responseCacheKey = cacheKey.analytics('objections');
    const cachedResponse = cache.get(responseCacheKey);
    if (cachedResponse) {
      return NextResponse.json({ ...(cachedResponse as Record<string, unknown>), cached: true });
    }

    // Fetch calls with transcripts
    const { data: calls, error: callsError } = await adminClient
      .from('calls')
      .select('id, rep_id, transcript, call_date, outcome, overall_score')
      .eq('status', 'complete')
      .not('transcript', 'is', null)
      .order('call_date', { ascending: false })
      .limit(50); // Reduced limit for faster processing

    if (callsError) {
      console.error('Error fetching calls:', callsError);
      return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
    }

    if (!calls || calls.length === 0) {
      return NextResponse.json({
        stats: {
          totalObjections: 0,
          avgHandlingScore: 0,
          aaaUsageRate: 0,
          byCategory: [],
          byRep: [],
          topObjections: [],
          bestResponses: [],
        },
        callDetails: [],
      });
    }

    // Fetch rep names
    const repIds = [...new Set(calls.map(c => c.rep_id))];
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, full_name, email')
      .in('id', repIds);

    const repNames: Record<string, string> = {};
    profiles?.forEach(p => {
      repNames[p.id] = p.full_name || p.email;
    });

    // Extract objections from calls using GPT-4 (with per-call caching)
    const objectionAnalyses: CallObjectionData[] = [];
    const now = Date.now();

    // Periodically prune expired cache entries
    if (Math.random() < 0.01) {
      const pruneNow = Date.now();
      for (const [key, val] of objectionCache.entries()) {
        if (pruneNow - val.extractedAt > OBJECTION_CACHE_TTL) objectionCache.delete(key);
      }
    }

    // Separate cached and uncached calls
    const callsToProcess = calls.filter(call => {
      const transcript = call.transcript as TranscriptSegment[] | null;
      return transcript && transcript.length >= 5;
    });

    // Process cached calls immediately
    const uncachedCalls: typeof callsToProcess = [];
    for (const call of callsToProcess) {
      const cachedObjections = objectionCache.get(call.id);
      if (cachedObjections && (now - cachedObjections.extractedAt) < OBJECTION_CACHE_TTL) {
        objectionAnalyses.push({
          call_id: call.id,
          rep_id: call.rep_id,
          rep_name: repNames[call.rep_id] || 'Unknown Rep',
          call_date: call.call_date,
          outcome: call.outcome,
          objections: cachedObjections.objections,
        });
      } else {
        uncachedCalls.push(call);
      }
    }

    // Process uncached calls with batched concurrency
    const CONCURRENCY = 5;
    for (let i = 0; i < uncachedCalls.length; i += CONCURRENCY) {
      const batch = uncachedCalls.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(async (call) => {
        const transcript = call.transcript as TranscriptSegment[];
        const objections = await extractObjectionsFromTranscript(transcript);
        objectionCache.set(call.id, { objections, extractedAt: now });

        objectionAnalyses.push({
          call_id: call.id,
          rep_id: call.rep_id,
          rep_name: repNames[call.rep_id] || 'Unknown Rep',
          call_date: call.call_date,
          outcome: call.outcome,
          objections,
        });
      }));
    }

    // Aggregate objection statistics
    const stats = calculateObjectionStats(objectionAnalyses);

    const response = {
      stats,
      callDetails: objectionAnalyses,
    };

    // Cache the full response for 5 minutes
    cache.set(responseCacheKey, response, CACHE_TTL.MEDIUM);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Objection analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to generate objection analytics' },
      { status: 500 }
    );
  }
}

async function extractObjectionsFromTranscript(
  transcript: TranscriptSegment[]
): Promise<DetectedObjection[]> {
  const formattedTranscript = transcript
    .map((seg) => `${seg.speaker.toUpperCase()}: ${seg.text}`)
    .join('\n');

  const prompt = `Analyze this sales call transcript and identify ALL objections raised by the prospect.

For each objection found, determine:
1. The exact objection text
2. Category: price, timing, spouse, skepticism, past_failures, competition, commitment, or other
3. How well the rep handled it (0-100 score)
4. Whether they used AAA framework (Acknowledge, Associate, Ask)
5. The rep's response
6. Outcome: handled_well, handled_poorly, or unresolved

TRANSCRIPT:
${formattedTranscript}

Return JSON array:
[
  {
    "objection": "exact prospect objection",
    "category": "price|timing|spouse|skepticism|past_failures|competition|commitment|other",
    "handling_score": 0-100,
    "used_aaa": true/false,
    "rep_response": "summary of how rep responded",
    "outcome_after": "handled_well|handled_poorly|unresolved"
  }
]

If no objections found, return empty array [].`;

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a sales coach analyzing call transcripts for objection handling patterns. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content || '[]';
    const parsed = JSON.parse(content);

    // Handle both array and object with array property
    const objections = Array.isArray(parsed) ? parsed : (parsed.objections || []);

    return objections.map((obj: Record<string, unknown>) => ({
      objection: String(obj.objection || ''),
      category: validateCategory(String(obj.category || 'other')),
      handling_score: Number(obj.handling_score || 0),
      used_aaa: Boolean(obj.used_aaa),
      rep_response: String(obj.rep_response || ''),
      outcome_after: validateOutcome(String(obj.outcome_after || 'unresolved')),
    }));
  } catch (error) {
    console.error('Error extracting objections:', error);
    return [];
  }
}

function validateCategory(category: string): ObjectionCategory {
  if (OBJECTION_CATEGORIES.includes(category as ObjectionCategory)) {
    return category as ObjectionCategory;
  }
  return 'other';
}

function validateOutcome(outcome: string): 'handled_well' | 'handled_poorly' | 'unresolved' {
  if (['handled_well', 'handled_poorly', 'unresolved'].includes(outcome)) {
    return outcome as 'handled_well' | 'handled_poorly' | 'unresolved';
  }
  return 'unresolved';
}

interface ObjectionStats {
  totalObjections: number;
  avgHandlingScore: number;
  aaaUsageRate: number;
  byCategory: CategoryStats[];
  byRep: RepObjectionStats[];
  topObjections: TopObjection[];
  bestResponses: BestResponse[];
}

interface CategoryStats {
  category: ObjectionCategory;
  count: number;
  avgScore: number;
  successRate: number;
  aaaRate: number;
}

interface RepObjectionStats {
  rep_id: string;
  rep_name: string;
  totalObjections: number;
  avgHandlingScore: number;
  successRate: number;
  aaaRate: number;
  strongestCategory: string;
  weakestCategory: string;
}

interface TopObjection {
  objection: string;
  category: ObjectionCategory;
  frequency: number;
  avgHandlingScore: number;
}

interface BestResponse {
  objection: string;
  category: ObjectionCategory;
  response: string;
  score: number;
  rep_name: string;
}

function calculateObjectionStats(data: CallObjectionData[]): ObjectionStats {
  const allObjections = data.flatMap(d =>
    d.objections.map(obj => ({ ...obj, rep_id: d.rep_id, rep_name: d.rep_name, outcome: d.outcome }))
  );

  if (allObjections.length === 0) {
    return {
      totalObjections: 0,
      avgHandlingScore: 0,
      aaaUsageRate: 0,
      byCategory: [],
      byRep: [],
      topObjections: [],
      bestResponses: [],
    };
  }

  // Overall stats
  const avgHandlingScore = allObjections.reduce((sum, o) => sum + o.handling_score, 0) / allObjections.length;
  const aaaUsageRate = allObjections.filter(o => o.used_aaa).length / allObjections.length * 100;

  // By category
  const categoryMap = new Map<ObjectionCategory, typeof allObjections>();
  allObjections.forEach(obj => {
    const existing = categoryMap.get(obj.category) || [];
    existing.push(obj);
    categoryMap.set(obj.category, existing);
  });

  const byCategory: CategoryStats[] = Array.from(categoryMap.entries())
    .map(([category, objs]) => ({
      category,
      count: objs.length,
      avgScore: Math.round(objs.reduce((s, o) => s + o.handling_score, 0) / objs.length),
      successRate: Math.round(objs.filter(o => o.outcome_after === 'handled_well').length / objs.length * 100),
      aaaRate: Math.round(objs.filter(o => o.used_aaa).length / objs.length * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // By rep
  const repMap = new Map<string, typeof allObjections>();
  allObjections.forEach(obj => {
    const existing = repMap.get(obj.rep_id) || [];
    existing.push(obj);
    repMap.set(obj.rep_id, existing);
  });

  const byRep: RepObjectionStats[] = Array.from(repMap.entries())
    .map(([rep_id, objs]) => {
      const rep_name = objs[0]?.rep_name || 'Unknown';
      const avgScore = Math.round(objs.reduce((s, o) => s + o.handling_score, 0) / objs.length);

      // Find strongest and weakest categories for this rep
      const repCategoryScores = new Map<string, number[]>();
      objs.forEach(o => {
        const scores = repCategoryScores.get(o.category) || [];
        scores.push(o.handling_score);
        repCategoryScores.set(o.category, scores);
      });

      let strongestCategory = '';
      let weakestCategory = '';
      let highestAvg = -1;
      let lowestAvg = 101;

      repCategoryScores.forEach((scores, cat) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg > highestAvg) {
          highestAvg = avg;
          strongestCategory = cat;
        }
        if (avg < lowestAvg) {
          lowestAvg = avg;
          weakestCategory = cat;
        }
      });

      return {
        rep_id,
        rep_name,
        totalObjections: objs.length,
        avgHandlingScore: avgScore,
        successRate: Math.round(objs.filter(o => o.outcome_after === 'handled_well').length / objs.length * 100),
        aaaRate: Math.round(objs.filter(o => o.used_aaa).length / objs.length * 100),
        strongestCategory,
        weakestCategory,
      };
    })
    .sort((a, b) => b.avgHandlingScore - a.avgHandlingScore);

  // Top objections by frequency
  const objectionCounts = new Map<string, { count: number; scores: number[]; category: ObjectionCategory }>();
  allObjections.forEach(obj => {
    const normalized = obj.objection.toLowerCase().slice(0, 100);
    const existing = objectionCounts.get(normalized) || { count: 0, scores: [], category: obj.category };
    existing.count++;
    existing.scores.push(obj.handling_score);
    objectionCounts.set(normalized, existing);
  });

  const topObjections: TopObjection[] = Array.from(objectionCounts.entries())
    .map(([objection, data]) => ({
      objection,
      category: data.category,
      frequency: data.count,
      avgHandlingScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  // Best responses (highest scoring)
  const bestResponses: BestResponse[] = allObjections
    .filter(o => o.handling_score >= 80 && o.rep_response)
    .sort((a, b) => b.handling_score - a.handling_score)
    .slice(0, 5)
    .map(o => ({
      objection: o.objection,
      category: o.category,
      response: o.rep_response,
      score: o.handling_score,
      rep_name: o.rep_name,
    }));

  return {
    totalObjections: allObjections.length,
    avgHandlingScore: Math.round(avgHandlingScore),
    aaaUsageRate: Math.round(aaaUsageRate),
    byCategory,
    byRep,
    topObjections,
    bestResponses,
  };
}
