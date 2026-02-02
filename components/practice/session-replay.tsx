'use client';

import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import type { PracticeMessage, PersonaConfig } from '@/types/database';

interface SessionReplayProps {
  sessionId: string;
  messages: PracticeMessage[];
  persona: PersonaConfig;
  onClose: () => void;
}

interface ModelResponse {
  turnIndex: number;
  content: string;
  loading: boolean;
}

export function SessionReplay({ sessionId, messages, persona, onClose }: SessionReplayProps) {
  const [currentTurn, setCurrentTurn] = useState(0);
  const [modelResponses, setModelResponses] = useState<Record<number, ModelResponse>>({});
  const [showComparison, setShowComparison] = useState<number | null>(null);

  // Get rep turns (indexes where rep spoke)
  const repTurns = messages
    .map((msg, idx) => ({ msg, idx }))
    .filter(({ msg }) => msg.role === 'rep')
    .map(({ idx }) => idx);

  const generateModelResponse = useCallback(async (turnIndex: number) => {
    // Don't regenerate if already have it
    if (modelResponses[turnIndex]?.content) {
      setShowComparison(turnIndex);
      return;
    }

    // Set loading state
    setModelResponses(prev => ({
      ...prev,
      [turnIndex]: { turnIndex, content: '', loading: true }
    }));

    try {
      const response = await fetch(`/api/practice/${sessionId}/model-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turnIndex }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate model response');
      }

      const data = await response.json();

      setModelResponses(prev => ({
        ...prev,
        [turnIndex]: { turnIndex, content: data.modelResponse, loading: false }
      }));
      setShowComparison(turnIndex);
    } catch (error) {
      console.error('Error generating model response:', error);
      setModelResponses(prev => ({
        ...prev,
        [turnIndex]: { turnIndex, content: 'Failed to generate model response', loading: false }
      }));
    }
  }, [sessionId, modelResponses]);

  const goToTurn = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentTurn > 0) {
      setCurrentTurn(currentTurn - 1);
    } else if (direction === 'next' && currentTurn < messages.length - 1) {
      setCurrentTurn(currentTurn + 1);
    }
    setShowComparison(null);
  };

  const visibleMessages = messages.slice(0, currentTurn + 1);
  const currentMessage = messages[currentTurn];
  const isRepTurn = currentMessage?.role === 'rep';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="font-semibold text-gray-900">Session Replay</h2>
            <p className="text-sm text-gray-600">
              Step through the conversation and compare with model responses
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Turn Navigation */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => goToTurn('prev')}
            disabled={currentTurn === 0}
            className="btn-secondary btn-sm disabled:opacity-50"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-600">
            Turn {currentTurn + 1} of {messages.length}
          </span>
          <button
            onClick={() => goToTurn('next')}
            disabled={currentTurn >= messages.length - 1}
            className="btn-secondary btn-sm disabled:opacity-50"
          >
            Next →
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {visibleMessages.map((message, index) => {
            const isCurrentTurn = index === currentTurn;
            const hasModelResponse = modelResponses[index]?.content;
            const isLoadingModel = modelResponses[index]?.loading;

            return (
              <div key={index}>
                <div
                  className={`flex ${message.role === 'rep' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 ${
                      message.role === 'rep'
                        ? isCurrentTurn ? 'bg-primary text-white ring-2 ring-primary-300' : 'bg-primary text-white'
                        : isCurrentTurn ? 'bg-gray-200 text-gray-900 ring-2 ring-gray-400' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium opacity-75">
                        {message.role === 'rep' ? 'You (Rep)' : persona.name}
                      </span>
                      {isCurrentTurn && (
                        <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">Current</span>
                      )}
                    </div>
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

                {/* Compare Button - only for rep turns */}
                {message.role === 'rep' && isCurrentTurn && (
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => generateModelResponse(index)}
                      disabled={isLoadingModel}
                      className="btn-secondary btn-sm text-xs"
                    >
                      {isLoadingModel ? 'Generating...' : hasModelResponse ? 'Show Model Response' : 'Compare with Model'}
                    </button>
                  </div>
                )}

                {/* Model Response Comparison */}
                {showComparison === index && hasModelResponse && (
                  <div className="mt-3 ml-auto max-w-[85%]">
                    <div className="bg-green-50 border border-green-200 p-4 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-green-800 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Model Response (What an Expert Would Say)
                        </h4>
                        <button
                          onClick={() => setShowComparison(null)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Hide
                        </button>
                      </div>
                      <p className="text-green-700 whitespace-pre-wrap">
                        {modelResponses[index].content}
                      </p>
                    </div>

                    {/* Side by Side Comparison */}
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded">
                        <h5 className="text-xs font-semibold text-amber-800 mb-2">Your Response</h5>
                        <p className="text-sm text-amber-700">{message.content}</p>
                      </div>
                      <div className="bg-green-50 border border-green-200 p-3 rounded">
                        <h5 className="text-xs font-semibold text-green-800 mb-2">Model Response</h5>
                        <p className="text-sm text-green-700">{modelResponses[index].content}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {isRepTurn ? (
                <span className="text-primary font-medium">Your turn - Click &quot;Compare with Model&quot; to see an ideal response</span>
              ) : (
                <span>Prospect&apos;s response</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentTurn(0)}
                className="btn-secondary btn-sm"
                disabled={currentTurn === 0}
              >
                Start Over
              </button>
              <button
                onClick={() => setCurrentTurn(messages.length - 1)}
                className="btn-secondary btn-sm"
                disabled={currentTurn === messages.length - 1}
              >
                Jump to End
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
