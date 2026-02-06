'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { personas } from '@/lib/practice/personas';
import { getScenariosForPersona, type Scenario } from '@/lib/practice/scenarios';
import type { PersonaType } from '@/types/database';

interface StartPracticeFormProps {
  scripts: Array<{ id: string; name: string; course: string }>;
}

export function StartPracticeForm({ scripts }: StartPracticeFormProps) {
  const router = useRouter();
  const [selectedPersona, setSelectedPersona] = useState<PersonaType | ''>('');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(false);

  // Sort scripts in desired order
  const courseOrder = ['Pre-Algebra', 'Algebra 1', 'Geometry', 'Algebra 2'];
  const sortedScripts = [...scripts].sort((a, b) => {
    const aIndex = courseOrder.indexOf(a.course);
    const bIndex = courseOrder.indexOf(b.course);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  const handlePersonaChange = (persona: string) => {
    setSelectedPersona(persona as PersonaType | '');
    if (persona) {
      setScenarios(getScenariosForPersona(persona as PersonaType));
    } else {
      setScenarios([]);
    }
  };

  const startSession = async (scriptId: string, persona: string, scenarioId: string) => {
    setLoading(true);

    try {
      const response = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId,
          persona,
          scenarioId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/practice/${data.sessionId}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    await startSession(
      formData.get('scriptId') as string,
      formData.get('persona') as string,
      (formData.get('scenarioId') as string) || 'standard'
    );
  };

  const handleRandomStart = async () => {
    if (scripts.length === 0) {
      alert('No scripts available');
      return;
    }

    // Random script
    const randomScript = scripts[Math.floor(Math.random() * scripts.length)];

    // Random persona
    const personaTypes = Object.keys(personas) as PersonaType[];
    const randomPersona = personaTypes[Math.floor(Math.random() * personaTypes.length)];

    // Random scenario for the persona
    const personaScenarios = getScenariosForPersona(randomPersona);
    const randomScenario = personaScenarios.length > 0
      ? personaScenarios[Math.floor(Math.random() * personaScenarios.length)]
      : { id: 'standard' };

    await startSession(randomScript.id, randomPersona, randomScenario.id);
  };

  return (
    <div className="space-y-4">
      {/* Quick Start Button */}
      <button
        type="button"
        onClick={handleRandomStart}
        disabled={loading}
        className="w-full btn bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 font-semibold py-3"
      >
        {loading ? 'Starting...' : 'Quick Start (Random)'}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or choose options</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="scriptId" className="label">
              Course *
            </label>
            <select id="scriptId" name="scriptId" className="input" required>
              <option value="">Select a course</option>
              {sortedScripts.map((script) => (
                <option key={script.id} value={script.id}>
                  {script.course}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="persona" className="label">
              Persona *
            </label>
            <select
              id="persona"
              name="persona"
              className="input"
              required
              value={selectedPersona}
              onChange={(e) => handlePersonaChange(e.target.value)}
            >
              <option value="">Select a persona</option>
              {Object.values(personas).map((persona) => (
                <option key={persona.type} value={persona.type}>
                  {persona.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scenario Selection */}
        {scenarios.length > 0 && (
          <div>
            <label htmlFor="scenarioId" className="label">
              Scenario
            </label>
            <select id="scenarioId" name="scenarioId" className="input">
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name} - {scenario.description}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose a specific context for this practice session
            </p>
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Starting...' : 'Start Practice Session'}
        </button>
      </form>
    </div>
  );
}
