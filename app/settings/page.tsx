import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AppLayout } from '@/components/layout/app-layout';
import { UserManagement } from '@/components/settings/user-management';

export default async function SettingsPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect('/login');
  }

  // Only managers and admins can access settings
  if (profile.role !== 'manager' && profile.role !== 'admin') {
    redirect('/dashboard');
  }

  // Use admin client to fetch all profiles (bypasses RLS)
  const adminClient = createAdminClient();
  const { data: profiles, error } = await adminClient
    .from('profiles')
    .select('*')
    .order('full_name');

  if (error) {
    console.error('Failed to fetch profiles:', error);
  }

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage team members, roles, and integrations
          </p>
        </div>

        <UserManagement profiles={profiles || []} />
      </div>
    </AppLayout>
  );
}
