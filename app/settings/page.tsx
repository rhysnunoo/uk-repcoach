import { redirect } from 'next/navigation';
import { getProfile, createClient } from '@/lib/supabase/server';
import { AppLayout } from '@/components/layout/app-layout';
import { UserManagement } from '@/components/settings/user-management';
import { DataManagement } from '@/components/settings/data-management';

export default async function SettingsPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect('/login');
  }

  // Only managers and admins can access settings
  if (profile.role !== 'manager' && profile.role !== 'admin') {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  // Fetch all profiles for user management
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name');

  // Fetch calls for data management (admin only)
  const { data: calls } = profile.role === 'admin'
    ? await supabase
        .from('calls')
        .select('*, rep:profiles!calls_rep_id_fkey(id, email, full_name)')
        .order('call_date', { ascending: false })
        .limit(100)
    : { data: [] };

  // Fetch practice sessions for data management (admin only)
  const { data: practiceSessions } = profile.role === 'admin'
    ? await supabase
        .from('practice_sessions')
        .select('*, rep:profiles!practice_sessions_rep_id_fkey(id, email, full_name)')
        .order('started_at', { ascending: false })
        .limit(100)
    : { data: [] };

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage team members and roles
          </p>
        </div>

        {/* User Management */}
        <UserManagement profiles={profiles || []} />

        {/* Data Management - Admin Only */}
        {profile.role === 'admin' && (
          <DataManagement
            calls={calls || []}
            practiceSessions={practiceSessions || []}
          />
        )}
      </div>
    </AppLayout>
  );
}
