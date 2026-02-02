import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/supabase/server';
import { AppLayout } from '@/components/layout/app-layout';
import { ChallengeDetail } from '@/components/practice/challenges';

interface ChallengeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChallengeDetailPage({ params }: ChallengeDetailPageProps) {
  const { id } = await params;
  const profile = await getProfile();

  if (!profile) {
    redirect('/login');
  }

  return (
    <AppLayout profile={profile}>
      <ChallengeDetail challengeId={id} />
    </AppLayout>
  );
}
