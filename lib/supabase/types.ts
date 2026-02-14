/**
 * Type-safe utilities for Supabase queries
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  Profile,
  Call,
  Score,
  Script,
  PracticeSession,
  CallNote,
  TranscriptSegment,
  CallBookmark,
} from '@/types/database';

// Type for the Supabase client with our Database schema
export type TypedSupabaseClient = SupabaseClient<Database>;

// Table names for type-safe table access
export type TableName = keyof Database['public']['Tables'];

// Row types for each table
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type CallRow = Database['public']['Tables']['calls']['Row'];
export type ScoreRow = Database['public']['Tables']['scores']['Row'];
export type ScriptRow = Database['public']['Tables']['scripts']['Row'];
export type PracticeSessionRow = Database['public']['Tables']['practice_sessions']['Row'];
export type CallNoteRow = Database['public']['Tables']['call_notes']['Row'];

// Insert types for each table
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type CallInsert = Database['public']['Tables']['calls']['Insert'];
export type ScoreInsert = Database['public']['Tables']['scores']['Insert'];
export type ScriptInsert = Database['public']['Tables']['scripts']['Insert'];
export type PracticeSessionInsert = Database['public']['Tables']['practice_sessions']['Insert'];
export type CallNoteInsert = Database['public']['Tables']['call_notes']['Insert'];

// Update types for each table
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type CallUpdate = Database['public']['Tables']['calls']['Update'];
export type ScoreUpdate = Database['public']['Tables']['scores']['Update'];
export type ScriptUpdate = Database['public']['Tables']['scripts']['Update'];
export type PracticeSessionUpdate = Database['public']['Tables']['practice_sessions']['Update'];
export type CallNoteUpdate = Database['public']['Tables']['call_notes']['Update'];

// Query result types with proper typing
export interface CallWithScores extends Call {
  scores?: Score[];
}

export interface CallWithScript extends Call {
  scripts?: Script | null;
}

export interface CallWithProfile extends Call {
  profiles?: Profile | null;
}

export interface CallFull extends Call {
  scripts?: Script | null;
  scores?: Score[];
  call_notes?: CallNote[];
}

export interface PracticeSessionWithScript extends PracticeSession {
  scripts?: Script | null;
}

// Helper type for making specific fields required
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> };

// Common query patterns as types
export type CompletedCall = WithRequired<Call, 'overall_score' | 'transcript'>;
export type ScoredCall = WithRequired<Call, 'overall_score'>;
export type TranscribedCall = WithRequired<Call, 'transcript'>;

// Type guard functions
export function isCompletedCall(call: Call): call is CompletedCall {
  return call.status === 'complete' && call.overall_score !== null && call.transcript !== null;
}

export function isScoredCall(call: Call): call is ScoredCall {
  return call.overall_score !== null;
}

export function isTranscribedCall(call: Call): call is TranscribedCall {
  return call.transcript !== null && Array.isArray(call.transcript) && call.transcript.length > 0;
}

export function hasBookmarks(call: Call): call is Call & { bookmarks: CallBookmark[] } {
  return call.bookmarks !== null && Array.isArray(call.bookmarks) && call.bookmarks.length > 0;
}

// Type-safe score phase literals
export const CLOSER_PHASES = ['opening', 'clarify', 'label', 'overview', 'sell_vacation', 'price_presentation', 'explain', 'reinforce'] as const;
export type CloserPhase = typeof CLOSER_PHASES[number];

export function isCloserPhase(phase: string): phase is CloserPhase {
  return CLOSER_PHASES.includes(phase as CloserPhase);
}

// Type-safe outcome literals
export const CALL_OUTCOMES = ['annual', 'monthly', 'trial', 'not_interested', 'callback', 'no_show'] as const;
export type CallOutcome = typeof CALL_OUTCOMES[number];

export const CLOSED_OUTCOMES: CallOutcome[] = ['annual', 'monthly', 'trial'];

export function isClosedOutcome(outcome: string | null): boolean {
  return outcome !== null && CLOSED_OUTCOMES.includes(outcome as CallOutcome);
}

// Type-safe status literals
export const CALL_STATUSES = ['pending', 'transcribing', 'scoring', 'complete', 'error'] as const;
export type CallStatus = typeof CALL_STATUSES[number];

export function isCallStatus(status: string): status is CallStatus {
  return CALL_STATUSES.includes(status as CallStatus);
}

// Type-safe user role literals
export const USER_ROLES = ['rep', 'manager', 'admin'] as const;
export type UserRole = typeof USER_ROLES[number];

export function isManager(profile: Profile): boolean {
  return profile.role === 'manager' || profile.role === 'admin';
}

export function isAdmin(profile: Profile): boolean {
  return profile.role === 'admin';
}

// Utility to safely parse transcript
export function parseTranscript(data: unknown): TranscriptSegment[] {
  if (!data || !Array.isArray(data)) return [];
  return data.filter((seg): seg is TranscriptSegment =>
    typeof seg === 'object' &&
    seg !== null &&
    typeof seg.speaker === 'string' &&
    typeof seg.text === 'string' &&
    typeof seg.start_time === 'number' &&
    typeof seg.end_time === 'number'
  );
}

// Utility to safely parse bookmarks
export function parseBookmarks(data: unknown): CallBookmark[] {
  if (!data || !Array.isArray(data)) return [];
  return data.filter((b): b is CallBookmark =>
    typeof b === 'object' &&
    b !== null &&
    typeof b.id === 'string' &&
    typeof b.start_time === 'number' &&
    typeof b.end_time === 'number'
  );
}
