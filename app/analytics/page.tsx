import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/supabase/server';
import { AppLayout } from '@/components/layout/app-layout';
import dynamic from 'next/dynamic';

const RepComparison = dynamic(
  () => import('@/components/analytics/rep-comparison').then(m => ({ default: m.RepComparison })),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false,
  }
);

export default async function AnalyticsPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect('/login');
  }

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">
            Compare rep performance and identify areas for improvement
          </p>
        </div>

        <RepComparison />
      </div>
    </AppLayout>
  );
}
