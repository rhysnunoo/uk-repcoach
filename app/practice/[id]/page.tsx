import { redirect, notFound } from 'next/navigation';
import { getProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AppLayout } from '@/components/layout/app-layout';
import { PracticeChat } from '@/components/practice/practice-chat';
import { PracticeModeSelector } from '@/components/practice/practice-mode-selector';
import { personas } from '@/lib/practice/personas';
import type { PracticeMessage, SessionState, Script } from '@/types/database';

interface PracticeSessionPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export default async function PracticeSessionPage({ params, searchParams }: PracticeSessionPageProps) {
  const { id } = await params;
  const { mode } = await searchParams;

  // Voice mode is temporarily disabled - redirect to chat mode
  if (mode === 'voice') {
    redirect(`/practice/${id}?mode=chat`);
  }

  const profile = await getProfile();

  if (!profile) {
    redirect('/login');
  }

  const adminClient = createAdminClient();

  // Fetch session (use admin client to bypass RLS)
  const { data: session, error } = await adminClient
    .from('practice_sessions')
    .select('*, scripts(*)')
    .eq('id', id)
    .single();

  if (error || !session) {
    notFound();
  }

  // Check ownership
  if (session.rep_id !== profile.id) {
    notFound();
  }

  const persona = personas[session.persona as keyof typeof personas];
  const messages = (session.messages || []) as PracticeMessage[];
  const sessionState = session.session_state as SessionState | null;

  // If no messages yet and no mode selected, show mode selector
  const showModeSelector = messages.length === 0 && session.status === 'active' && !mode;

  // Cast scripts to Script type (Supabase types are overly strict)
  const sessionScript = session.scripts as unknown as Script | null;

  return (
    <AppLayout profile={profile}>
      <div className="h-[calc(100vh-180px)] flex flex-col">
        {showModeSelector && sessionScript ? (
          <PracticeModeSelector
            sessionId={session.id}
            script={sessionScript}
            persona={persona}
          />
        ) : (
          <PracticeChat
            sessionId={session.id}
            persona={persona}
            messages={messages}
            sessionState={sessionState}
            status={session.status}
            finalScore={session.final_score}
            finalFeedback={session.final_feedback}
            mode={mode as 'chat' | 'voice' | undefined}
            script={sessionScript || undefined}
          />
        )}
      </div>
    </AppLayout>
  );
}
