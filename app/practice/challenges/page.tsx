import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getProfile } from '@/lib/supabase/server';
import { AppLayout } from '@/components/layout/app-layout';
import { ChallengeListClient } from './client';

export default async function ChallengesPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect('/login');
  }

  const isManager = profile.role === 'manager' || profile.role === 'admin';

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href="/practice" className="text-gray-500 hover:text-gray-700">
                ← Back to Practice
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Team Challenges</h1>
            <p className="text-gray-600 mt-1">
              Compete with your team on practice challenges and climb the leaderboard
            </p>
          </div>
        </div>

        <ChallengeListClient isManager={isManager} />
      </div>
    </AppLayout>
  );
}
