'use client';

import { useRouter } from 'next/navigation';
import type { Script, PersonaConfig } from '@/types/database';

interface PracticeModeSelectorProps {
  sessionId: string;
  script: Script;
  persona: PersonaConfig;
}

export function PracticeModeSelector({ sessionId, script, persona }: PracticeModeSelectorProps) {
  const router = useRouter();

  const selectMode = (mode: 'chat' | 'voice') => {
    router.push(`/practice/${sessionId}?mode=${mode}`);
  };

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose Practice Mode</h1>
          <p className="text-gray-600">
            Practice with <strong>{persona.name}</strong> using {script.name}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Chat Mode */}
          <button
            onClick={() => selectMode('chat')}
            className="bg-white border-2 border-gray-200 p-6 text-left hover:border-primary hover:bg-primary-50 transition-colors group"
          >
            <div className="w-12 h-12 bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-600 group-hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Chat Mode</h2>
            <p className="text-sm text-gray-600 mb-4">
              Type your responses. Good for practicing script language and taking your time to think.
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Works on all devices
              </li>
              <li className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No microphone needed
              </li>
              <li className="flex items-center gap-1">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Practice at your own pace
              </li>
            </ul>
          </button>

          {/* Voice Mode - Coming Soon */}
          <div
            className="bg-gray-50 border-2 border-gray-200 p-6 text-left opacity-60 cursor-not-allowed relative"
          >
            <div className="absolute top-3 right-3">
              <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1 rounded">
                Coming Soon
              </span>
            </div>
            <div className="w-12 h-12 bg-gray-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-500 mb-2">Voice Mode</h2>
            <p className="text-sm text-gray-400 mb-4">
              Speak naturally and hear responses. Simulates a real phone call experience.
            </p>
            <ul className="text-xs text-gray-400 space-y-1">
              <li className="flex items-center gap-1">
                <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Real call simulation
              </li>
              <li className="flex items-center gap-1">
                <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Practice verbal delivery
              </li>
              <li className="flex items-center gap-1">
                <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Requires microphone access
              </li>
            </ul>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Both modes use the same AI prospect and scoring system
        </p>
      </div>
    </div>
  );
}
