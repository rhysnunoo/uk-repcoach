'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Script, ScriptContent, PersonaConfig } from '@/types/database';

interface VoicePracticeProps {
  sessionId: string;
  script: Script;
  persona: PersonaConfig;
  onEnd: () => void;
}

interface Message {
  role: 'rep' | 'prospect';
  content: string;
  timestamp: Date;
  fillerWords?: FillerWordMatch[];
  wordsPerMinute?: number;
}

// Filler word detection
const FILLER_WORDS = [
  'um', 'uh', 'uhh', 'umm', 'er', 'err', 'ah', 'ahh',
  'like', 'you know', 'i mean', 'kind of', 'sort of',
  'basically', 'actually', 'literally', 'honestly',
  'right', 'so', 'well', 'anyway', 'yeah',
];

interface FillerWordMatch {
  word: string;
  count: number;
}

interface SpeechStats {
  totalWords: number;
  fillerWordCount: number;
  fillerWords: FillerWordMatch[];
  wordsPerMinute: number;
  speakingDuration: number;
}

function detectFillerWords(text: string): FillerWordMatch[] {
  const lowerText = text.toLowerCase();
  const matches: FillerWordMatch[] = [];

  for (const filler of FILLER_WORDS) {
    // Create a regex to match the filler word as a whole word
    const regex = new RegExp(`\\b${filler.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    const foundMatches = lowerText.match(regex);
    if (foundMatches && foundMatches.length > 0) {
      matches.push({ word: filler, count: foundMatches.length });
    }
  }

  return matches;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function calculateWPM(words: number, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  return Math.round((words / durationSeconds) * 60);
}

function highlightFillerWords(text: string, fillerMatches: FillerWordMatch[]): React.ReactNode {
  if (fillerMatches.length === 0) return text;

  // Create a regex pattern for all filler words
  const pattern = fillerMatches
    .map(m => m.word.replace(/\s+/g, '\\s+'))
    .join('|');
  const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');

  // Split text and create highlighted spans
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isFillerWord = fillerMatches.some(
      m => m.word.toLowerCase() === part.toLowerCase()
    );
    if (isFillerWord) {
      return (
        <span key={index} className="bg-red-300/50 px-0.5 rounded underline decoration-red-400">
          {part}
        </span>
      );
    }
    return part;
  });
}

// Check for browser speech support
const isSpeechRecognitionSupported = typeof window !== 'undefined' && (
  'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
);

const isSpeechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

// Common names for gender detection
const FEMALE_NAMES = new Set([
  'sarah', 'jennifer', 'lisa', 'emma', 'ashley', 'sophie', 'mary', 'patricia',
  'linda', 'elizabeth', 'barbara', 'susan', 'jessica', 'karen', 'nancy', 'betty',
  'margaret', 'sandra', 'ashley', 'dorothy', 'kimberly', 'emily', 'donna', 'michelle',
  'carol', 'amanda', 'melissa', 'deborah', 'stephanie', 'rebecca', 'laura', 'helen',
  'sharon', 'cynthia', 'kathleen', 'amy', 'angela', 'shirley', 'anna', 'ruth'
]);

const MALE_NAMES = new Set([
  'mike', 'david', 'james', 'john', 'robert', 'michael', 'william', 'richard',
  'joseph', 'thomas', 'charles', 'christopher', 'daniel', 'matthew', 'anthony',
  'mark', 'donald', 'steven', 'paul', 'andrew', 'joshua', 'kenneth', 'kevin',
  'brian', 'george', 'edward', 'ronald', 'timothy', 'jason', 'jeffrey', 'ryan',
  'jacob', 'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin'
]);

function detectGenderFromName(name: string): 'male' | 'female' | 'unknown' {
  const lowerName = name.toLowerCase().trim();
  if (FEMALE_NAMES.has(lowerName)) return 'female';
  if (MALE_NAMES.has(lowerName)) return 'male';
  return 'unknown';
}

function extractProspectName(systemPrompt: string): string | null {
  // Look for patterns like "roleplaying as Sarah" or "You are Sarah"
  const patterns = [
    /roleplaying as (\w+)/i,
    /You are (\w+),/i,
    /name is (\w+)/i,
  ];

  for (const pattern of patterns) {
    const match = systemPrompt.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function VoicePractice({ sessionId, script, persona, onEnd }: VoicePracticeProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [sessionStats, setSessionStats] = useState<{
    totalFillerWords: number;
    totalWords: number;
    avgWPM: number;
    fillerWordCounts: Record<string, number>;
  }>({ totalFillerWords: 0, totalWords: 0, avgWPM: 0, fillerWordCounts: {} });
  const [showStats, setShowStats] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const finalTranscriptRef = useRef<string>(''); // Track processed final transcripts
  const speechStartTimeRef = useRef<number | null>(null);

  const scriptContent = script.content as ScriptContent;

  // Detect prospect gender from persona
  const prospectName = extractProspectName(persona.system_prompt);
  const prospectGender = prospectName ? detectGenderFromName(prospectName) : 'unknown';

  // Load available voices and auto-select based on gender
  useEffect(() => {
    if (!isSpeechSynthesisSupported) return;

    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();

      // Filter to US English voices
      const usVoices = availableVoices.filter(v => v.lang === 'en-US');
      const englishVoices = usVoices.length > 0 ? usVoices : availableVoices.filter(v => v.lang.startsWith('en'));

      // Try to find a voice matching the prospect's gender
      let selectedVoiceResult: SpeechSynthesisVoice | null = null;

      if (prospectGender === 'female') {
        // Look for female US voice
        selectedVoiceResult = englishVoices.find(v =>
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('victoria') ||
          v.name.toLowerCase().includes('karen') ||
          v.name.toLowerCase().includes('susan') ||
          v.name.toLowerCase().includes('zira')
        ) || null;
      } else if (prospectGender === 'male') {
        // Look for male US voice
        selectedVoiceResult = englishVoices.find(v =>
          v.name.toLowerCase().includes('male') ||
          v.name.toLowerCase().includes('david') ||
          v.name.toLowerCase().includes('mark') ||
          v.name.toLowerCase().includes('james') ||
          v.name.toLowerCase().includes('alex')
        ) || null;
      }

      // Fallback to any US English voice
      if (!selectedVoiceResult) {
        selectedVoiceResult = englishVoices[0] || availableVoices[0];
      }

      if (selectedVoiceResult) setSelectedVoice(selectedVoiceResult);
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, [prospectGender]);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSpeechRecognitionSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Build the complete transcript from all results
      let completeFinal = '';
      let currentInterim = '';

      // Process all results (not just from resultIndex)
      // Each result can transition from interim to final
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          completeFinal += transcript;
        } else {
          currentInterim += transcript;
        }
      }

      // Store the finalized portion to prevent re-processing
      finalTranscriptRef.current = completeFinal;

      // Display: final text + interim preview (if any)
      if (currentInterim) {
        setCurrentTranscript(completeFinal + currentInterim + '...');
      } else {
        setCurrentTranscript(completeFinal);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access and try again.');
      } else if (event.error !== 'aborted') {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = useCallback((text: string) => {
    if (!isSpeechSynthesisSupported || !selectedVoice) return Promise.resolve();

    return new Promise<void>((resolve) => {
      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selectedVoice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };

      speechSynthesis.speak(utterance);
    });
  }, [selectedVoice]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening || isSpeaking) return;

    setCurrentTranscript('');
    finalTranscriptRef.current = ''; // Reset tracked transcripts
    speechStartTimeRef.current = Date.now(); // Track speech start time
    setError(null);

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setError('Failed to start speech recognition. Please try again.');
    }
  }, [isListening, isSpeaking]);

  const stopListening = useCallback(async () => {
    if (!recognitionRef.current || !isListening) return;

    recognitionRef.current.stop();
    setIsListening(false);

    // Process the transcript
    const transcript = currentTranscript.replace('...', '').trim();
    if (!transcript) return;

    // Calculate speech stats
    const speakingDuration = speechStartTimeRef.current
      ? (Date.now() - speechStartTimeRef.current) / 1000
      : 1;
    const wordCount = countWords(transcript);
    const wpm = calculateWPM(wordCount, speakingDuration);
    const fillerMatches = detectFillerWords(transcript);
    const totalFillers = fillerMatches.reduce((sum, m) => sum + m.count, 0);

    // Update session stats
    setSessionStats(prev => {
      const newFillerCounts = { ...prev.fillerWordCounts };
      for (const match of fillerMatches) {
        newFillerCounts[match.word] = (newFillerCounts[match.word] || 0) + match.count;
      }

      const newTotalWords = prev.totalWords + wordCount;
      const repMessages = messages.filter(m => m.role === 'rep').length + 1;
      const allWpms = messages
        .filter(m => m.role === 'rep' && m.wordsPerMinute)
        .map(m => m.wordsPerMinute!);
      allWpms.push(wpm);
      const avgWPM = Math.round(allWpms.reduce((a, b) => a + b, 0) / allWpms.length);

      return {
        totalFillerWords: prev.totalFillerWords + totalFillers,
        totalWords: newTotalWords,
        avgWPM,
        fillerWordCounts: newFillerCounts,
      };
    });

    // Add rep message with stats
    const repMessage: Message = {
      role: 'rep',
      content: transcript,
      timestamp: new Date(),
      fillerWords: fillerMatches,
      wordsPerMinute: wpm,
    };
    setMessages(prev => [...prev, repMessage]);
    setCurrentTranscript('');

    // Get AI response using existing practice API
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/practice/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: transcript }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      const aiMessage = data.response;

      if (aiMessage) {
        // Add prospect message
        const prospectMessage: Message = {
          role: 'prospect',
          content: aiMessage,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, prospectMessage]);

        // Speak the response
        await speak(aiMessage);
      }
    } catch (err) {
      setError('Failed to get AI response. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [isListening, currentTranscript, sessionId, speak]);

  const startPractice = async () => {
    setHasStarted(true);
    setMessages([]);
    setError(null);

    // In voice mode, the rep calls the prospect, so they speak first
    // Show a prompt to indicate this
    const instructionMessage: Message = {
      role: 'prospect',
      content: '(Phone is ringing... The prospect picks up)\n\n"Hello?"',
      timestamp: new Date(),
    };
    setMessages([instructionMessage]);

    // Speak the greeting
    await speak('Hello?');
  };

  const endPractice = async () => {
    // Stop any ongoing speech/recognition
    speechSynthesis.cancel();
    recognitionRef.current?.abort();

    // End the session using existing API
    try {
      await fetch(`/api/practice/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' }),
      });
    } catch (err) {
      console.error('Failed to end session:', err);
    }

    onEnd();
  };

  if (!isSpeechRecognitionSupported || !isSpeechSynthesisSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-6 text-center">
        <svg className="mx-auto h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-yellow-800">Voice Practice Not Supported</h3>
        <p className="mt-2 text-sm text-yellow-600">
          Your browser doesn&apos;t support voice features. Please use Chrome, Edge, or Safari for voice practice, or try the chat-based practice mode.
        </p>
        <button onClick={onEnd} className="mt-4 btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="bg-white border border-gray-200 p-8 text-center max-w-lg mx-auto">
        <div className="mb-6">
          <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Voice Practice Mode</h2>
          <p className="mt-2 text-gray-600">
            Practice your sales pitch with voice. Speak naturally and the AI prospect will respond verbally.
          </p>
        </div>

        <div className="bg-gray-50 p-4 mb-6 text-left">
          <h3 className="font-medium text-gray-900 mb-2">Script: {script.name}</h3>
          <p className="text-sm text-gray-600">{(scriptContent.overview as string) || script.course}</p>
          {prospectName && (
            <p className="text-sm text-gray-500 mt-2">Prospect: {prospectName}</p>
          )}
        </div>

        <div className="flex gap-3 justify-center">
          <button onClick={onEnd} className="btn-secondary">
            Cancel
          </button>
          <button onClick={startPractice} className="btn-primary">
            Start Voice Practice
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
          <span className="font-medium text-gray-900">
            {isSpeaking ? 'Prospect Speaking...' : isListening ? 'Listening...' : 'Ready'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className={`btn-sm ${showStats ? 'bg-primary text-white' : 'btn-secondary'}`}
          >
            Stats
          </button>
          <button onClick={endPractice} className="btn-secondary btn-sm">
            End Session
          </button>
        </div>
      </div>

      {/* Live Stats Panel */}
      {showStats && (
        <div className="px-4 py-3 border-b border-gray-200 bg-blue-50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-blue-600 font-medium">Pace (WPM)</p>
              <p className={`text-lg font-bold ${
                sessionStats.avgWPM === 0 ? 'text-gray-400' :
                sessionStats.avgWPM >= 120 && sessionStats.avgWPM <= 160 ? 'text-green-600' :
                sessionStats.avgWPM > 180 ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {sessionStats.avgWPM || '-'}
              </p>
              <p className="text-xs text-gray-500">
                {sessionStats.avgWPM === 0 ? 'Start speaking' :
                 sessionStats.avgWPM < 120 ? 'Too slow' :
                 sessionStats.avgWPM > 180 ? 'Too fast' :
                 sessionStats.avgWPM > 160 ? 'Slightly fast' : 'Good pace'}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">Filler Words</p>
              <p className={`text-lg font-bold ${
                sessionStats.totalFillerWords === 0 ? 'text-green-600' :
                sessionStats.totalFillerWords <= 3 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {sessionStats.totalFillerWords}
              </p>
              <p className="text-xs text-gray-500">
                {sessionStats.totalFillerWords === 0 ? 'Great!' :
                 sessionStats.totalFillerWords <= 3 ? 'Watch out' : 'Too many'}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">Total Words</p>
              <p className="text-lg font-bold text-gray-900">{sessionStats.totalWords}</p>
              <p className="text-xs text-gray-500">spoken</p>
            </div>
          </div>
          {Object.keys(sessionStats.fillerWordCounts).length > 0 && (
            <div className="mt-2 pt-2 border-t border-blue-200">
              <p className="text-xs text-blue-600 font-medium mb-1">Filler words detected:</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(sessionStats.fillerWordCounts).map(([word, count]) => (
                  <span key={word} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                    &quot;{word}&quot; x{count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'rep' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 ${
                msg.role === 'rep'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-medium">
                  {msg.role === 'rep' ? 'You' : 'Prospect'}
                </p>
                {msg.role === 'rep' && msg.wordsPerMinute && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    msg.wordsPerMinute >= 120 && msg.wordsPerMinute <= 160
                      ? 'bg-green-500/20'
                      : msg.wordsPerMinute > 180
                      ? 'bg-red-500/20'
                      : 'bg-yellow-500/20'
                  }`}>
                    {msg.wordsPerMinute} wpm
                  </span>
                )}
              </div>
              <p>
                {msg.role === 'rep' && msg.fillerWords && msg.fillerWords.length > 0
                  ? highlightFillerWords(msg.content, msg.fillerWords)
                  : msg.content}
              </p>
              {msg.role === 'rep' && msg.fillerWords && msg.fillerWords.length > 0 && (
                <p className="text-xs mt-1 opacity-75">
                  Filler words: {msg.fillerWords.map(f => `"${f.word}"`).join(', ')}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Current transcript (while listening) */}
        {currentTranscript && (
          <div className="flex justify-end">
            <div className="max-w-[80%] p-3 bg-primary/70 text-white">
              <p className="text-sm font-medium mb-1">You (listening...)</p>
              <p>{currentTranscript}</p>
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isSpeaking || isProcessing}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white scale-110'
                : isSpeaking || isProcessing
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-primary hover:bg-primary-600 text-white'
            }`}
          >
            {isListening ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-center text-sm text-gray-500 mt-2">
          {isListening
            ? 'Click to stop and send'
            : isSpeaking
            ? 'Wait for prospect to finish speaking'
            : isProcessing
            ? 'Processing...'
            : 'Click microphone to speak'}
        </p>
      </div>
    </div>
  );
}

// Type declarations for Web Speech API
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}
