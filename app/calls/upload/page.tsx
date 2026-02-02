import { redirect } from 'next/navigation';
import { getProfile, createClient } from '@/lib/supabase/server';
import { AppLayout } from '@/components/layout/app-layout';
import { CallUploader } from '@/components/calls/call-uploader';
import { BulkUploader } from '@/components/calls/bulk-uploader';
import { RingoverUploader } from '@/components/calls/ringover-uploader';
import { UploadTabs } from '@/components/calls/upload-tabs';

interface UploadPageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function UploadCallPage({ searchParams }: UploadPageProps) {
  const profile = await getProfile();

  if (!profile) {
    redirect('/login');
  }

  const params = await searchParams;
  const mode = params.mode || 'single';

  // Check if user is manager/admin
  const isManager = profile.role === 'manager' || profile.role === 'admin';

  // Fetch all reps for manager/admin to select from
  let reps: { id: string; email: string; full_name: string | null }[] = [];

  if (isManager) {
    const supabase = await createClient();
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .order('full_name');

    reps = profiles || [];
  }

  return (
    <AppLayout profile={profile}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Calls</h1>
          <p className="mt-1 text-sm text-gray-600">
            Upload call recordings or transcripts to get CLOSER framework scoring and feedback
          </p>
        </div>

        <UploadTabs currentMode={mode} />

        {mode === 'single' && (
          <CallUploader
            isManager={isManager}
            reps={reps}
            currentUserId={profile.id}
          />
        )}
        {mode === 'bulk' && (
          <BulkUploader
            isManager={isManager}
            reps={reps}
            currentUserId={profile.id}
          />
        )}
        {mode === 'ringover' && (
          <RingoverUploader />
        )}
      </div>
    </AppLayout>
  );
}
