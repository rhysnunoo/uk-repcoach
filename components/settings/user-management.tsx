'use client';

import { useState } from 'react';
import type { Profile, UserRole } from '@/types/database';

interface UserManagementProps {
  profiles: Profile[];
}

export function UserManagement({ profiles: initialProfiles }: UserManagementProps) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [updating, setUpdating] = useState<string | null>(null);

  const updateRole = async (profileId: string, newRole: UserRole) => {
    setUpdating(profileId);

    try {
      const response = await fetch('/api/dashboard/manager', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateRole',
          profileId,
          role: newRole,
        }),
      });

      if (response.ok) {
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === profileId ? { ...p, role: newRole } : p
          )
        );
      }
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="card">
      <h3 className="card-header">User Management</h3>
      <p className="text-sm text-gray-600 mb-4">
        Manage user roles. Managers can view all team data and configure settings.
      </p>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Change Role</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 flex items-center justify-center rounded-full">
                      <span className="text-primary text-sm font-medium">
                        {(profile.full_name || profile.email)[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium">
                      {profile.full_name || 'No name'}
                    </span>
                  </div>
                </td>
                <td className="text-sm text-gray-600">{profile.email}</td>
                <td>
                  <RoleBadge role={profile.role} />
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

      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Roles</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li><strong>Rep:</strong> View own calls, scores, and practice</li>
          <li><strong>Manager:</strong> View all team data and manage settings</li>
          <li><strong>Admin:</strong> Full access including data management</li>
        </ul>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const classes: Record<UserRole, string> = {
    rep: 'badge bg-gray-100 text-gray-800',
    manager: 'badge bg-blue-100 text-blue-800',
    admin: 'badge bg-purple-100 text-purple-800',
  };

  return (
    <span className={classes[role]}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
}
