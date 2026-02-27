'use client';

import { useState } from 'react';
import type { Profile, UserRole } from '@/types/database';

interface UserManagementProps {
  profiles: Profile[];
}

export function UserManagement({ profiles: initialProfiles }: UserManagementProps) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [editingBitrixId, setEditingBitrixId] = useState<string | null>(null);
  const [bitrixIdInput, setBitrixIdInput] = useState('');

  const updateRole = async (profileId: string, newRole: UserRole) => {
    setUpdating(profileId);

    try {
      const response = await fetch('/api/profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          role: newRole,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === profileId ? { ...p, role: newRole } : p
          )
        );
      } else {
        alert(data.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  const startEditingName = (profile: Profile) => {
    setEditingName(profile.id);
    setNameInput(profile.full_name || '');
  };

  const saveName = async (profileId: string) => {
    if (!nameInput.trim()) {
      setEditingName(null);
      return;
    }

    setUpdating(profileId);

    try {
      const response = await fetch('/api/profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          full_name: nameInput.trim(),
        }),
      });

      if (response.ok) {
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === profileId ? { ...p, full_name: nameInput.trim() } : p
          )
        );
      } else {
        alert('Failed to update name');
      }
    } catch (error) {
      console.error('Failed to update name:', error);
      alert('Failed to update name');
    } finally {
      setUpdating(null);
      setEditingName(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, profileId: string) => {
    if (e.key === 'Enter') {
      saveName(profileId);
    } else if (e.key === 'Escape') {
      setEditingName(null);
    }
  };

  const startEditingBitrixId = (profile: Profile) => {
    setEditingBitrixId(profile.id);
    setBitrixIdInput(profile.bitrix_user_id || '');
  };

  const saveBitrixId = async (profileId: string) => {
    setUpdating(profileId);

    try {
      const response = await fetch('/api/profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          bitrix_user_id: bitrixIdInput.trim(),
        }),
      });

      if (response.ok) {
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === profileId ? { ...p, bitrix_user_id: bitrixIdInput.trim() || null } : p
          )
        );
      } else {
        alert('Failed to update Bitrix ID');
      }
    } catch (error) {
      console.error('Failed to update Bitrix ID:', error);
      alert('Failed to update Bitrix ID');
    } finally {
      setUpdating(null);
      setEditingBitrixId(null);
    }
  };

  const handleBitrixKeyDown = (e: React.KeyboardEvent, profileId: string) => {
    if (e.key === 'Enter') {
      saveBitrixId(profileId);
    } else if (e.key === 'Escape') {
      setEditingBitrixId(null);
    }
  };

  return (
    <div className="card">
      <h3 className="card-header">Team Members</h3>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Bitrix ID</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 flex items-center justify-center rounded-full shrink-0">
                      <span className="text-primary text-sm font-medium">
                        {(profile.full_name || profile.email)[0].toUpperCase()}
                      </span>
                    </div>
                    {editingName === profile.id ? (
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onBlur={() => saveName(profile.id)}
                        onKeyDown={(e) => handleKeyDown(e, profile.id)}
                        className="input py-1 px-2 text-sm w-40"
                        autoFocus
                        placeholder="Enter name"
                      />
                    ) : (
                      <button
                        onClick={() => startEditingName(profile)}
                        className="font-medium text-left hover:text-primary"
                        title="Click to edit name"
                      >
                        {profile.full_name || <span className="text-gray-400 italic">Click to add name</span>}
                      </button>
                    )}
                  </div>
                </td>
                <td className="text-sm text-gray-600">{profile.email}</td>
                <td>
                  {editingBitrixId === profile.id ? (
                    <input
                      type="text"
                      value={bitrixIdInput}
                      onChange={(e) => setBitrixIdInput(e.target.value)}
                      onBlur={() => saveBitrixId(profile.id)}
                      onKeyDown={(e) => handleBitrixKeyDown(e, profile.id)}
                      className="input py-1 px-2 text-sm w-28"
                      autoFocus
                      placeholder="Bitrix ID"
                    />
                  ) : (
                    <button
                      onClick={() => startEditingBitrixId(profile)}
                      className="text-sm text-left hover:text-primary"
                      title="Click to edit Bitrix ID"
                    >
                      {profile.bitrix_user_id || <span className="text-gray-400 italic">—</span>}
                    </button>
                  )}
                </td>
                <td>
                  <select
                    value={profile.role}
                    onChange={(e) => updateRole(profile.id, e.target.value as UserRole)}
                    disabled={updating === profile.id}
                    className="input py-1 px-2 text-sm w-auto"
                  >
                    <option value="rep">Rep</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
