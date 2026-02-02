import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/supabase/server';
import { AppLayout } from '@/components/layout/app-layout';
import { AnalyticsTabs } from '@/components/analytics/analytics-tabs';

export default async function AnalyticsPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect('/login');
  }

  const isManager = profile.role === 'manager' || profile.role === 'admin';

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">
            Understand what drives conversions and identify areas for improvement
          </p>
        </div>

        <AnalyticsTabs isManager={isManager} />
      </div>
    </AppLayout>
  );
}
