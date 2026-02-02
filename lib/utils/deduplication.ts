import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Check if a call already exists based on phone number and call time
 * Used to prevent duplicates between HubSpot and Ringover imports
 *
 * Matching criteria:
 * 1. Same phone number (normalized)
 * 2. Call date within 10 minutes of each other
 * 3. Duration within 30 seconds (if available)
 */
export async function findDuplicateCall(
  supabase: SupabaseClient,
  params: {
    contactPhone: string | null;
    callDate: string;
    durationSeconds?: number | null;
    excludeSource?: string; // Don't match calls from the same source
  }
): Promise<{ isDuplicate: boolean; existingCallId: string | null }> {
  if (!params.contactPhone) {
    return { isDuplicate: false, existingCallId: null };
  }

  // Normalize phone number (remove non-digits)
  const normalizedPhone = normalizePhone(params.contactPhone);
  if (!normalizedPhone || normalizedPhone.length < 7) {
    return { isDuplicate: false, existingCallId: null };
  }

  const callTime = new Date(params.callDate);
  const windowStart = new Date(callTime.getTime() - 10 * 60 * 1000); // 10 minutes before
  const windowEnd = new Date(callTime.getTime() + 10 * 60 * 1000); // 10 minutes after

  // Query for potential duplicates
  let query = supabase
    .from('calls')
    .select('id, contact_phone, call_date, duration_seconds, source')
    .gte('call_date', windowStart.toISOString())
    .lte('call_date', windowEnd.toISOString());

  if (params.excludeSource) {
    query = query.neq('source', params.excludeSource);
  }

  const { data: potentialDuplicates, error } = await query;

  if (error || !potentialDuplicates) {
    console.error('Error checking for duplicates:', error);
    return { isDuplicate: false, existingCallId: null };
  }

  // Check each potential duplicate
  for (const call of potentialDuplicates) {
    const existingPhone = normalizePhone(call.contact_phone);

    // Phone number must match (last 10 digits)
    if (!phonesMatch(normalizedPhone, existingPhone)) {
      continue;
    }

    // If duration is available, check it's within 30 seconds
    if (params.durationSeconds && call.duration_seconds) {
      const durationDiff = Math.abs(params.durationSeconds - call.duration_seconds);
      if (durationDiff > 30) {
        continue;
      }
    }

    // Found a duplicate
    console.log(`[Deduplication] Found duplicate call:`, {
      existingId: call.id,
      existingSource: call.source,
      existingPhone: call.contact_phone,
      newPhone: params.contactPhone,
      existingDate: call.call_date,
      newDate: params.callDate,
    });

    return { isDuplicate: true, existingCallId: call.id };
  }

  return { isDuplicate: false, existingCallId: null };
}

/**
 * Normalize phone number by removing non-digits
 */
function normalizePhone(phone: string | null): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Check if two phone numbers match (comparing last 10 digits)
 */
function phonesMatch(phone1: string, phone2: string): boolean {
  if (!phone1 || !phone2) return false;

  // Get last 10 digits of each number
  const last10_1 = phone1.slice(-10);
  const last10_2 = phone2.slice(-10);

  return last10_1 === last10_2 && last10_1.length >= 7;
}
