'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Crown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  email: string;
  name: string | null;
}

interface TeamManagementProps {
  projectId: string;
}

export default function TeamManagement({ projectId }: TeamManagementProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/projects/${projectId}/team`);
        if (!res.ok) throw new Error('Failed to load team');
        const data = await res.json();
        if (!cancelled) setMembers(data.members ?? []);
      } catch {
        if (!cancelled) setMembers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [projectId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await fetch(`/api/projects/${projectId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: 'MEMBER' }),
      });
      setInviteEmail('');
    } catch {
      // ignore
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(memberId: string) {
    await fetch(`/api/projects/${projectId}/team/${memberId}`, { method: 'DELETE' });
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  if (loading) {
    return <div className="text-gray-400">Loading team...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Team Members</h2>

        <form onSubmit={handleInvite} className="flex gap-2 mb-6">
          <Input
            type="email"
            placeholder="Invite by email..."
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={inviting || !inviteEmail.trim()}>
            <UserPlus className="w-4 h-4 mr-2" /> Invite
          </Button>
        </form>

        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 border border-gray-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan/20 flex items-center justify-center text-cyan text-xs font-medium">
                  {(member.name ?? member.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-white">{member.name ?? member.email}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={member.role === 'OWNER' ? 'default' : 'secondary'}>
                  {member.role === 'OWNER' && <Crown className="w-3 h-3 mr-1" />}
                  {member.role === 'OWNER' ? 'Owner' : member.role === 'MEMBER' ? 'Member' : member.role}
                </Badge>
                {member.role !== 'OWNER' && (
                  <button
                    onClick={() => handleRemove(member.id)}
                    className="p-1.5 rounded hover:bg-red-400/10 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No team members yet. Invite someone to get started.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
