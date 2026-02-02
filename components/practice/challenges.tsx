'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';
import { personas } from '@/lib/practice/personas';
import type { PersonaType } from '@/types/database';

interface Challenge {
  id: string;
  title: string;
  description: string;
  creator_name: string;
  challenge_type: 'practice' | 'objection_drill';
  persona?: PersonaType;
  scenario_id?: string;
  target_score: number;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed';
  participant_count: number;
  user_participation?: {
    best_score: number | null;
    attempts: number;
    completed_at: string | null;
  } | null;
}

interface LeaderboardEntry {
  rep_id: string;
  rep_name: string;
  best_score: number | null;
  attempts: number;
  completed_at: string | null;
  rank: number;
}

// Challenge List Component
export function ChallengeList() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  useEffect(() => {
    fetchChallenges();
  }, [filter]);

  const fetchChallenges = async () => {
    try {
      const status = filter === 'all' ? '' : filter;
      const res = await fetch(`/api/challenges${status ? `?status=${status}` : ''}`);
      const data = await res.json();
      setChallenges(data.challenges || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChallengeStatus = (challenge: Challenge) => {
    if (challenge.user_participation?.completed_at) {
      return { label: 'Completed', color: 'bg-green-100 text-green-800' };
    }
    if (challenge.user_participation) {
      return { label: 'In Progress', color: 'bg-blue-100 text-blue-800' };
    }
    if (isPast(new Date(challenge.end_date))) {
      return { label: 'Ended', color: 'bg-gray-100 text-gray-800' };
    }
    if (isFuture(new Date(challenge.start_date))) {
      return { label: 'Starting Soon', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { label: 'Open', color: 'bg-primary-100 text-primary-800' };
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading challenges...</div>;
  }

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['active', 'all', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded text-sm font-medium ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {challenges.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No {filter !== 'all' ? filter : ''} challenges found.
        </div>
      ) : (
        <div className="space-y-4">
          {challenges.map(challenge => {
            const status = getChallengeStatus(challenge);
            return (
              <div
                key={challenge.id}
                className="card hover:border-primary cursor-pointer transition-colors"
                onClick={() => router.push(`/practice/challenges/${challenge.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                      <span className={`badge ${status.color}`}>{status.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Target: {challenge.target_score}%</span>
                      <span>{challenge.participant_count} participants</span>
                      <span>
                        {isPast(new Date(challenge.end_date))
                          ? `Ended ${formatDistanceToNow(new Date(challenge.end_date))} ago`
                          : `Ends ${formatDistanceToNow(new Date(challenge.end_date))}`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {challenge.user_participation && (
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {challenge.user_participation.best_score ?? '-'}%
                        </p>
                        <p className="text-xs text-gray-500">
                          {challenge.user_participation.attempts} attempts
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Challenge Detail Component
interface ChallengeDetailProps {
  challengeId: string;
}

export function ChallengeDetail({ challengeId }: ChallengeDetailProps) {
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userParticipation, setUserParticipation] = useState<Challenge['user_participation']>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchChallenge();
  }, [challengeId]);

  const fetchChallenge = async () => {
    try {
      const res = await fetch(`/api/challenges/${challengeId}`);
      const data = await res.json();
      setChallenge(data.challenge);
      setLeaderboard(data.leaderboard || []);
      setUserParticipation(data.userParticipation);
    } catch (error) {
      console.error('Error fetching challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinChallenge = async () => {
    setJoining(true);
    try {
      await fetch(`/api/challenges/${challengeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join' }),
      });
      await fetchChallenge();
    } catch (error) {
      console.error('Error joining challenge:', error);
    } finally {
      setJoining(false);
    }
  };

  const startPractice = () => {
    // Navigate to practice with challenge context
    const params = new URLSearchParams();
    params.set('challenge_id', challengeId);
    if (challenge?.persona) {
      params.set('persona', challenge.persona);
    }
    if (challenge?.scenario_id) {
      params.set('scenario_id', challenge.scenario_id);
    }
    router.push(`/practice?${params.toString()}`);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  if (!challenge) {
    return <div className="text-center py-8 text-gray-500">Challenge not found</div>;
  }

  const isActive = challenge.status === 'active' && !isPast(new Date(challenge.end_date));
  const hasCompleted = userParticipation?.completed_at !== null;
  const personaInfo = challenge.persona ? personas[challenge.persona] : null;

  return (
    <div className="space-y-6">
      {/* Challenge Header */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{challenge.title}</h1>
            <p className="text-gray-600 mt-1">{challenge.description}</p>
          </div>
          <div className={`badge ${
            hasCompleted ? 'bg-green-100 text-green-800' :
            isActive ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {hasCompleted ? 'Completed' : isActive ? 'Active' : 'Ended'}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-500">Target Score</p>
            <p className="text-xl font-bold text-primary">{challenge.target_score}%</p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-500">Your Best</p>
            <p className="text-xl font-bold text-gray-900">
              {userParticipation?.best_score ?? '-'}%
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-500">Your Attempts</p>
            <p className="text-xl font-bold text-gray-900">
              {userParticipation?.attempts ?? 0}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-500">End Date</p>
            <p className="text-sm font-medium text-gray-900">
              {format(new Date(challenge.end_date), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        {personaInfo && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-4">
            <p className="text-sm font-medium text-blue-800">Challenge Persona: {personaInfo.name}</p>
            <p className="text-sm text-blue-700">{personaInfo.description}</p>
          </div>
        )}

        {isActive && (
          <div className="flex gap-3">
            {!userParticipation ? (
              <button
                onClick={joinChallenge}
                disabled={joining}
                className="btn-primary"
              >
                {joining ? 'Joining...' : 'Join Challenge'}
              </button>
            ) : (
              <button onClick={startPractice} className="btn-primary">
                {hasCompleted ? 'Practice Again' : 'Start Practice'}
              </button>
            )}
            <button
              onClick={() => router.push('/practice/challenges')}
              className="btn-secondary"
            >
              Back to Challenges
            </button>
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="card">
        <h2 className="card-header">Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No participants yet. Be the first!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Best Score</th>
                  <th>Attempts</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr key={entry.rep_id} className={entry.rank <= 3 ? 'bg-yellow-50' : ''}>
                    <td>
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                    </td>
                    <td className="font-medium">{entry.rep_name}</td>
                    <td className={entry.best_score !== null && entry.best_score >= challenge.target_score ? 'text-green-600 font-bold' : ''}>
                      {entry.best_score ?? '-'}%
                    </td>
                    <td>{entry.attempts}</td>
                    <td>
                      {entry.completed_at ? (
                        <span className="badge bg-green-100 text-green-800">Completed</span>
                      ) : (
                        <span className="badge bg-blue-100 text-blue-800">In Progress</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Create Challenge Form (for managers)
interface CreateChallengeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateChallengeForm({ onSuccess, onCancel }: CreateChallengeFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    challenge_type: 'practice' as 'practice' | 'objection_drill',
    persona: '' as PersonaType | '',
    target_score: 70,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          persona: formData.persona || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create challenge');
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating challenge:', error);
      alert('Failed to create challenge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Title *</label>
        <input
          type="text"
          className="input"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          placeholder="e.g., Weekly Objection Challenge"
        />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe what this challenge is about..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Challenge Type *</label>
          <select
            className="input"
            value={formData.challenge_type}
            onChange={(e) => setFormData({ ...formData, challenge_type: e.target.value as 'practice' | 'objection_drill' })}
          >
            <option value="practice">Practice Session</option>
            <option value="objection_drill">Objection Drill</option>
          </select>
        </div>

        <div>
          <label className="label">Target Score *</label>
          <input
            type="number"
            className="input"
            value={formData.target_score}
            onChange={(e) => setFormData({ ...formData, target_score: parseInt(e.target.value) })}
            min={50}
            max={100}
            required
          />
        </div>
      </div>

      {formData.challenge_type === 'practice' && (
        <div>
          <label className="label">Persona (optional)</label>
          <select
            className="input"
            value={formData.persona}
            onChange={(e) => setFormData({ ...formData, persona: e.target.value as PersonaType | '' })}
          >
            <option value="">Any persona</option>
            {Object.values(personas).map((p) => (
              <option key={p.type} value={p.type}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Start Date *</label>
          <input
            type="date"
            className="input"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">End Date *</label>
          <input
            type="date"
            className="input"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Challenge'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
