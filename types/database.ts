export type UserRole = 'rep' | 'manager' | 'admin';
export type CallSource = 'hubspot' | 'ringover' | 'manual';
export type CallStatus = 'pending' | 'transcribing' | 'scoring' | 'complete' | 'error';
export type PracticeStatus = 'active' | 'completed' | 'abandoned';
export type PersonaType = 'skeptical_parent' | 'price_sensitive' | 'engaged_ready' | 'spouse_blocker' | 'math_hater';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  hubspot_owner_id: string | null;
  ringover_user_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Script {
  id: string;
  name: string;
  course: string;
  version: number;
  is_active: boolean;
  content: ScriptContent;
  created_at: string;
  updated_at: string;
}

export interface ScriptContent {
  framework?: string;
  target_duration?: string;
  course_details: CourseDetails;
  closer_phases: CloserPhases;
  scoring_criteria?: ScoringCriteria;
  banned_phrases?: string[];
  pricing: PricingInfo;
  conviction_tonality?: {
    banned_phrases: string[];
  };
  [key: string]: unknown;
}

export interface CourseDetails {
  name: string;
  schedule: {
    days: string;
    pacific_time: string;
    eastern_time: string;
  };
  teacher: {
    name: string;
    credentials: string[];
  };
}

export interface CloserPhases {
  opening?: FrameworkPhase;
  clarify?: FrameworkPhase;
  label?: FrameworkPhase;
  overview?: FrameworkPhase;
  sell_vacation?: FrameworkPhase;
  explain?: FrameworkPhase;
  reinforce?: FrameworkPhase;
}

export interface FrameworkPhase {
  description?: string;
  purpose?: string;
  key_questions?: string[];
  key_points?: string[];
  techniques?: string[];
  eddie_intro?: string;
  proof_points?: Record<string, string>;
  aaa_framework?: {
    acknowledge: string;
    associate: string;
    alter: string;
  };
  common_objections?: Record<string, ObjectionResponse>;
  pricing_presentation?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ObjectionResponse {
  response: string;
  technique?: string;
}

export interface ScoringCriteria {
  excellent: string;
  good: string;
  needs_improvement: string;
  poor: string;
}

export interface PricingInfo {
  annual_premium: { price: number; value_statement: string };
  monthly_premium: { price: number; value_statement: string };
  trial: { price: number; duration: string; value_statement: string };
}

export type CloserPhase = 'opening' | 'clarify' | 'label' | 'overview' | 'sell_vacation' | 'price_presentation' | 'explain' | 'reinforce';

export interface CallBookmark {
  id: string;
  start_time: number;
  end_time: number;
  note: string;
  tag: string;
  created_at: string;
  created_by: string;
}

export interface Call {
  id: string;
  rep_id: string;
  script_id: string | null;
  source: CallSource;
  status: CallStatus;
  hubspot_call_id: string | null;
  hubspot_contact_id: string | null;
  hubspot_deal_id: string | null;
  ringover_call_id: string | null;
  recording_url: string | null;
  storage_path: string | null;
  transcript: TranscriptSegment[] | null;
  duration_seconds: number | null;
  call_date: string;
  contact_name: string | null;
  contact_phone: string | null;
  outcome: string | null;
  overall_score: number | null;
  error_message: string | null;
  bookmarks: CallBookmark[] | null;
  created_at: string;
  updated_at: string;
}

export interface TranscriptSegment {
  speaker: 'rep' | 'prospect';
  text: string;
  start_time: number;
  end_time: number;
}

export interface Score {
  id: string;
  call_id: string;
  phase: CloserPhase;
  score: number;
  feedback: string;
  highlights: string[];
  improvements: string[];
  quotes: ScoreQuote[];
  created_at: string;
}

export interface ScoreQuote {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  timestamp?: number;
}

export interface PracticeSession {
  id: string;
  rep_id: string;
  script_id: string;
  persona: PersonaType;
  status: PracticeStatus;
  messages: PracticeMessage[];
  final_score: number | null;
  final_feedback: string | null;
  session_state: SessionState | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

export interface PracticeMessage {
  role: 'rep' | 'prospect';
  content: string;
  timestamp: string;
}

export interface SessionState {
  warmth: number;
  objections_raised: string[];
  topics_covered: string[];
  close_attempted: boolean;
  outcome: 'pending' | 'closed' | 'declined' | 'timeout' | null;
  prospect_name?: string;
  [key: string]: unknown;
}

export interface CallNote {
  id: string;
  call_id: string;
  author_id: string;
  content: string;
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
}

export interface HubspotSyncLog {
  id: string;
  sync_type: 'manual' | 'cron';
  started_at: string;
  ended_at: string | null;
  calls_synced: number;
  calls_failed: number;
  error_message: string | null;
  details: Record<string, unknown> | null;
}

export interface RingoverSyncLog {
  id: string;
  sync_type: 'manual' | 'cron';
  started_at: string;
  ended_at: string | null;
  calls_synced: number;
  calls_failed: number;
  error_message: string | null;
  details: Record<string, unknown> | null;
}

// Dashboard Types
export interface RepStats {
  average_score: number;
  calls_this_week: number;
  calls_this_month: number;
  practice_sessions_this_week: number;
  score_trend: number;
  scores_by_phase: PhaseScore[];
  improvement_areas: ImprovementArea[];
}

export interface PhaseScore {
  phase: string;
  score: number;
  label: string;
}

export interface ImprovementArea {
  phase: string;
  description: string;
  frequency: number;
}

export interface ManagerStats {
  team_average_score: number;
  total_calls_this_week: number;
  reps_below_threshold: number;
  practice_completion_rate: number;
  score_distribution: ScoreDistribution[];
  team_leaderboard: LeaderboardEntry[];
  alerts: ManagerAlert[];
  common_issues: CommonIssue[];
}

export interface ScoreDistribution {
  range: string;
  count: number;
}

export interface LeaderboardEntry {
  rep_id: string;
  rep_name: string;
  average_score: number;
  calls_count: number;
  trend: number;
}

export interface ManagerAlert {
  type: 'score_drop' | 'no_practice' | 'below_threshold';
  rep_id: string;
  rep_name: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface CommonIssue {
  phase: string;
  description: string;
  affected_reps: number;
  suggestions: string[];
}

// Persona Configuration
export interface PersonaConfig {
  type: PersonaType;
  name: string;
  description: string;
  traits: string[];
  initial_warmth: number;
  objection_likelihood: number;
  patience: number;
  decision_maker: boolean;
  system_prompt: string;
}

// Practice Challenge Types
export type ChallengeStatus = 'draft' | 'active' | 'completed';
export type ChallengeType = 'practice' | 'objection_drill';

export interface PracticeChallenge {
  id: string;
  title: string;
  description: string;
  created_by: string;
  challenge_type: ChallengeType;
  persona?: PersonaType;
  scenario_id?: string;
  target_score: number;
  start_date: string;
  end_date: string;
  status: ChallengeStatus;
  created_at: string;
  updated_at: string;
}

export interface ChallengeParticipation {
  id: string;
  challenge_id: string;
  rep_id: string;
  practice_session_id?: string;
  best_score: number | null;
  attempts: number;
  completed_at: string | null;
  created_at: string;
}

export interface ChallengeLeaderboard {
  rep_id: string;
  rep_name: string;
  best_score: number;
  attempts: number;
  completed_at: string | null;
  rank: number;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Form Types
export interface CallUploadForm {
  file: File;
  scriptId: string;
  contactName?: string;
  callDate?: string;
}

export interface ScoreRequest {
  callId: string;
  force?: boolean;
}

// Database types for Supabase
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          hubspot_owner_id: string | null;
          ringover_user_id: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: UserRole;
          hubspot_owner_id?: string | null;
          ringover_user_id?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          role?: UserRole;
          hubspot_owner_id?: string | null;
          ringover_user_id?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      scripts: {
        Row: {
          id: string;
          name: string;
          course: string;
          version: number;
          is_active: boolean;
          content: ScriptContent;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          course: string;
          version?: number;
          is_active?: boolean;
          content: ScriptContent;
        };
        Update: {
          name?: string;
          course?: string;
          version?: number;
          is_active?: boolean;
          content?: ScriptContent;
        };
        Relationships: [];
      };
      calls: {
        Row: {
          id: string;
          rep_id: string;
          script_id: string | null;
          source: CallSource;
          status: CallStatus;
          hubspot_call_id: string | null;
          hubspot_contact_id: string | null;
          hubspot_deal_id: string | null;
          ringover_call_id: string | null;
          recording_url: string | null;
          storage_path: string | null;
          transcript: TranscriptSegment[] | null;
          duration_seconds: number | null;
          call_date: string;
          contact_name: string | null;
          contact_phone: string | null;
          outcome: string | null;
          overall_score: number | null;
          error_message: string | null;
          bookmarks: CallBookmark[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          rep_id: string;
          script_id?: string | null;
          source: CallSource;
          status?: CallStatus;
          hubspot_call_id?: string | null;
          hubspot_contact_id?: string | null;
          hubspot_deal_id?: string | null;
          ringover_call_id?: string | null;
          recording_url?: string | null;
          storage_path?: string | null;
          transcript?: TranscriptSegment[] | null;
          duration_seconds?: number | null;
          call_date: string;
          contact_name?: string | null;
          contact_phone?: string | null;
          outcome?: string | null;
          overall_score?: number | null;
          error_message?: string | null;
          bookmarks?: CallBookmark[] | null;
        };
        Update: {
          rep_id?: string;
          script_id?: string | null;
          source?: CallSource;
          status?: CallStatus;
          hubspot_call_id?: string | null;
          hubspot_contact_id?: string | null;
          hubspot_deal_id?: string | null;
          ringover_call_id?: string | null;
          recording_url?: string | null;
          storage_path?: string | null;
          transcript?: TranscriptSegment[] | null;
          duration_seconds?: number | null;
          call_date?: string;
          contact_name?: string | null;
          contact_phone?: string | null;
          outcome?: string | null;
          overall_score?: number | null;
          error_message?: string | null;
          bookmarks?: CallBookmark[] | null;
        };
        Relationships: [];
      };
      scores: {
        Row: {
          id: string;
          call_id: string;
          phase: CloserPhase;
          score: number;
          feedback: string;
          highlights: string[];
          improvements: string[];
          quotes: ScoreQuote[];
          created_at: string;
        };
        Insert: {
          call_id: string;
          phase: CloserPhase;
          score: number;
          feedback: string;
          highlights: string[];
          improvements: string[];
          quotes: ScoreQuote[];
        };
        Update: {
          call_id?: string;
          phase?: CloserPhase;
          score?: number;
          feedback?: string;
          highlights?: string[];
          improvements?: string[];
          quotes?: ScoreQuote[];
        };
        Relationships: [];
      };
      practice_sessions: {
        Row: {
          id: string;
          rep_id: string;
          script_id: string;
          persona: PersonaType;
          status: PracticeStatus;
          messages: PracticeMessage[];
          final_score: number | null;
          final_feedback: string | null;
          session_state: SessionState | null;
          started_at: string;
          ended_at: string | null;
          created_at: string;
        };
        Insert: {
          rep_id: string;
          script_id: string;
          persona: PersonaType;
          status?: PracticeStatus;
          messages?: PracticeMessage[];
          final_score?: number | null;
          final_feedback?: string | null;
          session_state?: SessionState | null;
          started_at?: string;
          ended_at?: string | null;
        };
        Update: {
          rep_id?: string;
          script_id?: string;
          persona?: PersonaType;
          status?: PracticeStatus;
          messages?: PracticeMessage[];
          final_score?: number | null;
          final_feedback?: string | null;
          session_state?: SessionState | null;
          started_at?: string;
          ended_at?: string | null;
        };
        Relationships: [];
      };
      call_notes: {
        Row: {
          id: string;
          call_id: string;
          author_id: string;
          content: string;
          is_flagged: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          call_id: string;
          author_id: string;
          content: string;
          is_flagged?: boolean;
        };
        Update: {
          call_id?: string;
          author_id?: string;
          content?: string;
          is_flagged?: boolean;
        };
        Relationships: [];
      };
      hubspot_sync_log: {
        Row: {
          id: string;
          sync_type: 'manual' | 'cron';
          started_at: string;
          ended_at: string | null;
          calls_synced: number;
          calls_failed: number;
          error_message: string | null;
          details: Record<string, unknown> | null;
        };
        Insert: {
          sync_type: 'manual' | 'cron';
          started_at: string;
          ended_at?: string | null;
          calls_synced?: number;
          calls_failed?: number;
          error_message?: string | null;
          details?: Record<string, unknown> | null;
        };
        Update: {
          sync_type?: 'manual' | 'cron';
          started_at?: string;
          ended_at?: string | null;
          calls_synced?: number;
          calls_failed?: number;
          error_message?: string | null;
          details?: Record<string, unknown> | null;
        };
        Relationships: [];
      };
      ringover_sync_log: {
        Row: {
          id: string;
          sync_type: 'manual' | 'cron';
          started_at: string;
          ended_at: string | null;
          calls_synced: number;
          calls_failed: number;
          error_message: string | null;
          details: Record<string, unknown> | null;
        };
        Insert: {
          sync_type: 'manual' | 'cron';
          started_at: string;
          ended_at?: string | null;
          calls_synced?: number;
          calls_failed?: number;
          error_message?: string | null;
          details?: Record<string, unknown> | null;
        };
        Update: {
          sync_type?: 'manual' | 'cron';
          started_at?: string;
          ended_at?: string | null;
          calls_synced?: number;
          calls_failed?: number;
          error_message?: string | null;
          details?: Record<string, unknown> | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_rep_stats: {
        Args: { p_rep_id: string };
        Returns: RepStats;
      };
      get_manager_stats: {
        Args: { p_manager_id: string };
        Returns: ManagerStats;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
