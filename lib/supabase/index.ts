// Re-export all supabase utilities
export { createClient, getUser, getProfile, requireAuth, requireProfile, requireManager } from './server';
export { createAdminClient } from './admin';

// Re-export types
export type {
  TypedSupabaseClient,
  TableName,
  ProfileRow,
  CallRow,
  ScoreRow,
  ScriptRow,
  PracticeSessionRow,
  CallNoteRow,
  ProfileInsert,
  CallInsert,
  ScoreInsert,
  ScriptInsert,
  PracticeSessionInsert,
  CallNoteInsert,
  ProfileUpdate,
  CallUpdate,
  ScoreUpdate,
  ScriptUpdate,
  PracticeSessionUpdate,
  CallNoteUpdate,
  CallWithScores,
  CallWithScript,
  CallWithProfile,
  CallFull,
  PracticeSessionWithScript,
  CompletedCall,
  ScoredCall,
  TranscribedCall,
  CloserPhase,
  CallOutcome,
  CallStatus,
  UserRole,
} from './types';

// Re-export type guards and utilities
export {
  isCompletedCall,
  isScoredCall,
  isTranscribedCall,
  hasBookmarks,
  isCloserPhase,
  isClosedOutcome,
  isCallStatus,
  isManager,
  isAdmin,
  parseTranscript,
  parseBookmarks,
  CLOSER_PHASES,
  CALL_OUTCOMES,
  CLOSED_OUTCOMES,
  CALL_STATUSES,
  USER_ROLES,
} from './types';
