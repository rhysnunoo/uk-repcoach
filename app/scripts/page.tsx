import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/supabase/server';
import { AppLayout } from '@/components/layout/app-layout';
import { ScriptReference } from '@/components/scripts/script-reference';

export default async function ScriptsPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect('/login');
  }

  return (
    <AppLayout profile={profile}>
      <ScriptReference />
    </AppLayout>
  );
}
