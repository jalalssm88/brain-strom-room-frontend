'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMe } from '@/features/auth/useAuth';
import {
  useWorkspaces,
  useUpdateWorkspace,
  useDeleteWorkspace,
  useWorkspaceMembers,
  useInviteMember,
  useRemoveMember,
} from '@/features/workspaces/useWorkspaces';
import { isLocalUserUnverified } from '@/lib/authHelpers';
import { toApiError } from '@/lib/api';
import LoadingScreen from '@/components/LoadingScreen';
import styles from './workspace.module.css';

export default function WorkspaceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = Number(params.id);
  const { data: user, isLoading: userLoading, isError } = useMe();
  const { data: ownedWorkspaces, isLoading: workspacesLoading } = useWorkspaces('owned');
  const { data: sharedWorkspaces } = useWorkspaces('shared');
  const { data: members, isLoading: membersLoading, refetch: refetchMembers } =
    useWorkspaceMembers(workspaceId);
  const updateMutation = useUpdateWorkspace();
  const deleteMutation = useDeleteWorkspace();
  const inviteMutation = useInviteMember();
  const removeMemberMutation = useRemoveMember();
  const [name, setName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const workspace = useMemo(() => {
    const all = [...(ownedWorkspaces ?? []), ...(sharedWorkspaces ?? [])];
    return all.find((item) => item.id === workspaceId) ?? null;
  }, [ownedWorkspaces, sharedWorkspaces, workspaceId]);

  useEffect(() => {
    if (isError) router.replace('/login');
  }, [isError, router]);

  useEffect(() => {
    if (user && isLocalUserUnverified(user)) router.replace('/verify-email');
  }, [user, router]);

  useEffect(() => {
    if (workspace) setName(workspace.name);
  }, [workspace]);

  const isOwner = workspace?.ownerId === user?.id;
  const isAdmin = workspace?.role === 'ADMIN';

  const handleRename = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await updateMutation.mutateAsync({ id: workspaceId, name });
      setSuccess('Workspace renamed successfully');
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await inviteMutation.mutateAsync({
        workspaceId,
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteEmail('');
      setSuccess('Invitation sent successfully');
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Remove this member from the workspace?')) return;

    setError('');
    setSuccess('');
    try {
      await removeMemberMutation.mutateAsync({ workspaceId, userId });
      await refetchMembers();
      setSuccess('Member removed successfully');
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this workspace? This cannot be undone.')) return;

    setError('');
    try {
      await deleteMutation.mutateAsync(workspaceId);
      router.push('/dashboard');
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  if (userLoading || workspacesLoading || !user || isLocalUserUnverified(user)) {
    return <LoadingScreen />;
  }

  if (!workspace) {
    return (
      <main className={styles.page}>
        <p className={styles.muted}>Workspace not found or you do not have access.</p>
        <Link href="/dashboard" className={styles.link}>
          Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link href="/dashboard" className={styles.backLink}>
            ← Back to dashboard
          </Link>
          <h1 className={styles.title}>{workspace.name}</h1>
          {workspace.description && <p className={styles.subtitle}>{workspace.description}</p>}
        </div>
        <span className={styles.roleBadge}>{workspace.role}</span>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {isAdmin && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Rename workspace</h2>
          <form className={styles.form} onSubmit={handleRename}>
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
            <button type="submit" className={styles.primaryBtn} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving…' : 'Save name'}
            </button>
          </form>
        </section>
      )}

      {isAdmin && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Invite member</h2>
          <form className={styles.inviteForm} onSubmit={handleInvite}>
            <input
              type="email"
              className={styles.input}
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <select
              className={styles.select}
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'EDITOR' | 'VIEWER')}
            >
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <button type="submit" className={styles.primaryBtn} disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? 'Sending…' : 'Send invite'}
            </button>
          </form>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Members</h2>
        {membersLoading ? (
          <p className={styles.muted}>Loading members…</p>
        ) : members && members.length > 0 ? (
          <ul className={styles.memberList}>
            {members.map((member) => (
              <li key={member.id} className={styles.memberItem}>
                <div>
                  <p className={styles.memberName}>{member.fullName}</p>
                  <p className={styles.memberEmail}>{member.email}</p>
                </div>
                <div className={styles.memberActions}>
                  <span className={styles.memberRole}>{member.role}</span>
                  {isAdmin && member.userId !== workspace.ownerId && (
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => handleRemoveMember(member.userId)}
                      disabled={removeMemberMutation.isPending}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>No members found.</p>
        )}
      </section>

      {isOwner && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Danger zone</h2>
          <button
            type="button"
            className={styles.dangerBtn}
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete workspace'}
          </button>
        </section>
      )}
    </main>
  );
}
