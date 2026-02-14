import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/supabase/server';
import { AppLayout } from '@/components/layout/app-layout';
import { DrillsContent } from '@/components/practice/drills-content';

export default async function ObjectionDrillsPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect('/login');
  }

  return (
    <AppLayout profile={profile}>
      <DrillsContent />
    </AppLayout>
  );
}
