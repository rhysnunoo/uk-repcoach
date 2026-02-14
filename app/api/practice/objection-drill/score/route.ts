import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { objections, type Objection } from '@/lib/practice/objections';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { objectionId, response } = body;

    if (!objectionId || !response) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find the objection
    const objection = objections.find(o => o.id === objectionId);
    if (!objection) {
      return NextResponse.json({ error: 'Objection not found' }, { status: 404 });
    }

    // Score the response using GPT-4
    const scoreResult = await scoreObjectionResponse(objection, response);

    return NextResponse.json(scoreResult);
  } catch (error) {
    console.error('Error scoring objection response:', error);
    return NextResponse.json(
      { error: 'Failed to score response' },
      { status: 500 }
    );
  }
}

async function scoreObjectionResponse(
  objection: Objection,
  response: string
): Promise<{ score: number; feedback: string }> {
  const prompt = `You are a sales coaching expert evaluating how well a sales rep handled an objection.

## The Objection
Category: ${objection.category}
Difficulty: ${objection.difficulty}
Prospect said: "${objection.objection}"

## Tips for Handling This Objection
${objection.tips.map((t, i) => `${i + 1}. ${t}`).join('\n')}

## Sample Expert Response
"${objection.sampleResponse}"

## Rep's Actual Response
"${response}"

## Scoring Criteria
Score the rep's response on a scale of 0-100 based on:
1. Acknowledgment (20 pts): Did they acknowledge the concern before responding?
2. Empathy (20 pts): Did they show understanding of the prospect's perspective?
3. Value/Counter (30 pts): Did they effectively address the objection with value or reframe?
4. Next Step (20 pts): Did they move the conversation forward or offer a solution?
5. Tone (10 pts): Was the tone appropriate - not defensive or pushy?

Provide a score (0-100) and brief, specific feedback (2-3 sentences).

Respond in this exact JSON format:
{"score": <number>, "feedback": "<feedback string>"}`;

  const completion = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 300,
  });

  const content = completion.choices[0]?.message?.content || '';

  try {
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(100, Math.max(0, result.score)),
        feedback: result.feedback,
      };
    }
  } catch {
    // Parse failed
  }

  // Default response if parsing fails
  return {
    score: 50,
    feedback: 'Unable to fully evaluate response. Compare with the sample response for guidance.',
  };
}
