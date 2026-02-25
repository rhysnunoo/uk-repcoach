'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import { generateCoachingHints, getPhaseProgress } from '@/lib/practice/coaching';
import { useAutoSave, formatTimeAgo } from '@/lib/hooks/use-auto-save';
import type { PersonaConfig, PracticeMessage, SessionState, Script } from '@/types/database';
import { getScoreColor, getWarmthColor } from '@/lib/utils/format';

interface DraftState {
  input: string;
  messages: PracticeMessage[];
}

// Dynamic imports for heavy components
const VoicePractice = dynamic(() => import('./voice-practice').then(m => ({ default: m.VoicePractice })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>,
});

const CoachingPanel = dynamic(() => import('./coaching-panel').then(m => ({ default: m.CoachingPanel })), {
  ssr: false,
});

const SessionReplay = dynamic(() => import('./session-replay').then(m => ({ default: m.SessionReplay })), {
  ssr: false,
});

interface PracticeChatProps {
  sessionId: string;
  persona: PersonaConfig;
  messages: PracticeMessage[];
  sessionState: SessionState | null;
  status: string;
  finalScore: number | null;
  finalFeedback: string | null;
  mode?: 'chat' | 'voice';
  script?: Script;
}

export function PracticeChat({
  sessionId,
  persona,
  messages: initialMessages,
  sessionState: initialState,
  status,
  finalScore,
  finalFeedback,
  mode = 'chat',
  script,
}: PracticeChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<PracticeMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState | null>(initialState);
  const [isComplete, setIsComplete] = useState(status !== 'active');
  const [coachModeEnabled, setCoachModeEnabled] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [draftAge, setDraftAge] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-save hook for draft recovery
  const { save: saveDraft, restore: restoreDraft, clear: clearDraft, hasDraft, getDraftAge } = useAutoSave<DraftState>({
    key: `practice_${sessionId}`,
    debounceMs: 500,
  });

  // Check for existing draft on mount
  useEffect(() => {
    if (!isComplete && hasDraft()) {
      const age = getDraftAge();
      setDraftAge(age);
      setShowDraftRecovery(true);
    }
  }, [isComplete, hasDraft, getDraftAge]);

  // Auto-save when input or messages change
  useEffect(() => {
    if (!isComplete && (input || messages.length > initialMessages.length)) {
      saveDraft({ input, messages });
    }
  }, [input, messages, isComplete, saveDraft, initialMessages.length]);

  // Handle draft recovery
  const handleRestoreDraft = useCallback(() => {
    const draft = restoreDraft();
    if (draft) {
      if (draft.input) setInput(draft.input);
      if (draft.messages && draft.messages.length > messages.length) {
        setMessages(draft.messages);
      }
    }
    setShowDraftRecovery(false);
  }, [restoreDraft, messages.length]);

  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    setShowDraftRecovery(false);
  }, [clearDraft]);

  // Clear draft when session completes
  useEffect(() => {
    if (isComplete) {
      clearDraft();
    }
  }, [isComplete, clearDraft]);

  // Generate coaching hints based on current state
  const lastProspectMessage = useMemo(() => {
    const prospectMessages = messages.filter(m => m.role === 'prospect');
    return prospectMessages[prospectMessages.length - 1]?.content || null;
  }, [messages]);

  const coachingHints = useMemo(() =>
    generateCoachingHints(messages, sessionState, lastProspectMessage, script?.content),
    [messages, sessionState, lastProspectMessage, script?.content]
  );

  const phaseProgress = useMemo(() =>
    getPhaseProgress(messages),
    [messages]
  );

  // Scroll to bottom when messages change - must be before any conditional returns
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle voice mode
  if (mode === 'voice' && script && !isComplete) {
    return (
      <VoicePractice
        sessionId={sessionId}
        script={script}
        persona={persona}
        onEnd={() => {
          setIsComplete(true);
          router.refresh();
        }}
      />
    );
  }

  const sendMessage = async () => {
    if (!input.trim() || sending || isComplete) return;

    const userMessage: PracticeMessage = {
      role: 'rep',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      const response = await fetch(`/api/practice/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Add prospect response
      const prospectMessage: PracticeMessage = {
        role: 'prospect',
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, prospectMessage]);

      // Update session state
      if (data.state) {
        setSessionState(data.state);
      }

      // Check if session ended
      if (data.ended) {
        setIsComplete(true);
        router.refresh();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the user message on error
      setMessages((prev) => prev.slice(0, -1));
      setInput(userMessage.content);
    } finally {
      setSending(false);
    }
  };

  const endSession = async () => {
    if (isComplete) return;

    setSending(true);
    try {
      const response = await fetch(`/api/practice/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' }),
      });

      if (!response.ok) {
        throw new Error('Failed to end session');
      }

      setIsComplete(true);
      router.refresh();
    } catch (error) {
      console.error('Error ending session:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="font-semibold text-gray-900">
              {sessionState?.prospect_name || 'Prospect'}
            </h2>
            <p className="text-sm text-gray-600">{persona.name}</p>
          </div>
          <div className="flex items-center gap-4">
            {sessionState && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Warmth:</span>
                <div className="w-24 h-2 bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full transition-all ${getWarmthColor(sessionState.warmth)}`}
                    style={{ width: `${sessionState.warmth * 100}%` }}
                  />
                </div>
              </div>
            )}
            {!isComplete && (
              <button
                onClick={endSession}
                disabled={sending}
                className="btn-secondary btn-sm"
              >
                End Session
              </button>
            )}
          </div>
        </div>

      {/* Draft Recovery Banner */}
      {showDraftRecovery && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-amber-800">
              Unsaved draft found {draftAge ? `(${formatTimeAgo(draftAge)})` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestoreDraft}
              className="text-sm text-amber-700 hover:text-amber-900 font-medium"
            >
              Restore
            </button>
            <button
              onClick={handleDiscardDraft}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p className="mb-2">Start the conversation!</p>
            <p className="text-sm">
              You&apos;re calling <strong>{sessionState?.prospect_name || 'the prospect'}</strong> who booked a call about math help for their child.
              Introduce yourself and start the call using the CLOSER framework.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'rep' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 ${
                message.role === 'rep'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.role === 'rep' ? 'text-primary-200' : 'text-gray-500'
                }`}
              >
                {format(new Date(message.timestamp), 'h:mm a')}
              </p>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="w-2 h-2 bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

        {/* Completion Message */}
        {isComplete && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 overflow-y-auto max-h-[60vh]">
            {finalScore !== null && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Session Complete</h3>
                  <span className={`text-2xl font-bold ${getScoreColor(finalScore)}`}>
                    {finalScore.toFixed(0)}%
                  </span>
                </div>
                <PracticeScoreDetails feedback={finalFeedback} />
              </div>
            )}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setShowReplay(true)}
                className="btn-secondary"
              >
                Replay & Compare
              </button>
              <button
                onClick={() => router.push('/practice')}
                className="btn-primary"
              >
                Start New Session
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="btn-secondary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        {!isComplete && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response..."
                className="input flex-1 min-h-[60px] max-h-[150px] resize-y"
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="btn-primary self-end"
              >
                {sending ? '...' : 'Send'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        )}
      </div>

      {/* Coaching Panel */}
      {!isComplete && (
        <CoachingPanel
          hints={coachingHints}
          phaseProgress={phaseProgress}
          isEnabled={coachModeEnabled}
          onToggle={() => setCoachModeEnabled(!coachModeEnabled)}
        />
      )}

      {/* Session Replay Modal */}
      {showReplay && isComplete && (
        <SessionReplay
          sessionId={sessionId}
          messages={messages}
          persona={persona}
          onClose={() => setShowReplay(false)}
        />
      )}
    </div>
  );
}

const PHASE_LABELS: Record<string, string> = {
  opening: 'Opening',
  clarify: 'Clarify',
  label: 'Label',
  overview: 'Overview',
  sell_vacation: 'Sell Vacation',
  explain: 'Explain',
  reinforce: 'Reinforce',
};

interface PhaseScore {
  phase: string;
  score: number;
  feedback: string;
  highlights: string[];
  improvements: string[];
  you_said?: string[];
  should_say?: string[];
}

interface DetailedFeedback {
  feedback: string;
  phaseScores: PhaseScore[];
  strengths: string[];
  improvements: string[];
}

function PracticeScoreDetails({ feedback }: { feedback: string | null }) {
  if (!feedback) return null;

  // Try to parse as JSON (new format), fallback to plain text (old format)
  let details: DetailedFeedback | null = null;
  try {
    details = JSON.parse(feedback);
  } catch {
    // Old format - just show as text
    return <p className="text-sm text-gray-600">{feedback}</p>;
  }

  if (!details || !details.phaseScores?.length) {
    return <p className="text-sm text-gray-600">{details?.feedback || feedback}</p>;
  }

  return (
    <div className="space-y-4">
      {/* Overall Feedback */}
      <p className="text-sm text-gray-600">{details.feedback}</p>

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-3">
        {details.strengths?.length > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <h4 className="text-sm font-medium text-green-800 mb-2">Strengths</h4>
            <ul className="text-sm text-green-700 space-y-1">
              {details.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span>+</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {details.improvements?.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded">
            <h4 className="text-sm font-medium text-amber-800 mb-2">Areas to Improve</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              {details.improvements.map((s, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span>-</span> {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Phase Scores */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">CLOSER Phase Scores</h4>
        <div className="space-y-2">
          {details.phaseScores.map((phase) => (
            <details key={phase.phase} className="group border border-gray-200 rounded">
              <summary className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50">
                <span className="text-sm font-medium text-gray-700">
                  {PHASE_LABELS[phase.phase] || phase.phase}
                </span>
                <span className={`text-sm font-bold ${getScoreColor(phase.score)}`}>
                  {phase.score}%
                </span>
              </summary>
              <div className="p-3 pt-0 text-sm space-y-3">
                <p className="text-gray-600">{phase.feedback}</p>

                {/* You Said vs Should Say comparison */}
                {((phase.you_said?.length ?? 0) > 0 || (phase.should_say?.length ?? 0) > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(phase.you_said?.length ?? 0) > 0 && (
                      <div className="bg-red-50 p-3 border border-red-200 rounded">
                        <h5 className="text-xs font-semibold text-red-800 mb-2 flex items-center gap-1">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          You Said
                        </h5>
                        {phase.you_said!.map((quote, i) => (
                          <p key={i} className="text-sm text-red-700 italic mb-1">
                            {`"${quote}"`}
                          </p>
                        ))}
                      </div>
                    )}
                    {(phase.should_say?.length ?? 0) > 0 && (
                      <div className="bg-green-50 p-3 border border-green-200 rounded">
                        <h5 className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Try This Instead
                        </h5>
                        {phase.should_say!.map((suggestion, i) => (
                          <p key={i} className="text-sm text-green-700 mb-1">
                            {suggestion}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {phase.highlights?.length > 0 && (
                  <div className="text-green-600">
                    {phase.highlights.map((h, i) => (
                      <div key={i}>+ {h}</div>
                    ))}
                  </div>
                )}
                {phase.improvements?.length > 0 && (
                  <div className="text-amber-600">
                    {phase.improvements.map((h, i) => (
                      <div key={i}>- {h}</div>
                    ))}
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
