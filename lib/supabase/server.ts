import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { createAdminClient } from './admin';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    // Profile lookup failed - use admin client to bypass RLS issues
    const adminClient = createAdminClient();

    // First try to fetch with admin client (bypasses RLS)
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      return existingProfile;
    }

    // Profile doesn't exist - create it
    const { data: newProfile, error: insertError } = await adminClient
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || '',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[getProfile] Failed to create profile:', insertError);
      return null;
    }

    return newProfile;
  }

  return profile;
}

export async function requireAuth() {
  const user = await getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

export async function requireProfile() {
  const profile = await getProfile();

  if (!profile) {
    throw new Error('Profile not found');
  }

  return profile;
}

export async function requireManager() {
  const profile = await requireProfile();

  if (profile.role !== 'manager' && profile.role !== 'admin') {
    throw new Error('Forbidden: Manager access required');
  }

  return profile;
}
