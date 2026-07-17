'use client';

import { FormEvent, useState } from 'react';
import {
  useComments,
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
} from '@/features/comments/useComments';
import { toApiError } from '@/lib/api';
import { Comment } from '@/types/comment';
import { MemberRole } from '@/types/workspace';
import styles from './NoteCommentsPanel.module.css';

interface NoteCommentsPanelProps {
  workspaceId: number;
  noteId: number;
  noteTitle: string;
  currentUserId: number;
  role: MemberRole;
  onClose: () => void;
}

export default function NoteCommentsPanel({
  workspaceId,
  noteId,
  noteTitle,
  currentUserId,
  role,
  onClose,
}: NoteCommentsPanelProps) {
  const canWrite = role === 'ADMIN' || role === 'EDITOR';
  const { data: comments = [], isLoading } = useComments(workspaceId, noteId);
  const createMutation = useCreateComment(workspaceId, noteId);
  const updateMutation = useUpdateComment(workspaceId, noteId);
  const deleteMutation = useDeleteComment(workspaceId, noteId);

  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    const trimmed = message.trim();
    if (!trimmed) return;

    setError('');
    try {
      await createMutation.mutateAsync({ message: trimmed });
      setMessage('');
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditMessage(comment.message);
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditMessage('');
  };

  const saveEdit = async () => {
    if (editingId === null) return;
    const trimmed = editMessage.trim();
    if (!trimmed) return;

    setError('');
    try {
      await updateMutation.mutateAsync({
        commentId: editingId,
        payload: { message: trimmed },
      });
      cancelEdit();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  const handleDelete = async (commentId: number) => {
    setError('');
    try {
      await deleteMutation.mutateAsync(commentId);
      if (editingId === commentId) cancelEdit();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  return (
    <aside className={styles.panel} data-comments-panel>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Comments</h3>
          <p className={styles.subtitle}>{noteTitle}</p>
        </div>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.list}>
        {isLoading ? (
          <p className={styles.empty}>Loading comments…</p>
        ) : comments.length === 0 ? (
          <p className={styles.empty}>No comments yet.</p>
        ) : (
          comments.map((comment) => {
            const isOwner = comment.userId === currentUserId;
            const isEditing = editingId === comment.id;

            return (
              <article key={comment.id} className={styles.item}>
                <div className={styles.itemMeta}>
                  <strong>{comment.authorName}</strong>
                  <time dateTime={comment.createdAt}>
                    {new Date(comment.createdAt).toLocaleString()}
                  </time>
                </div>

                {isEditing ? (
                  <div className={styles.editBlock}>
                    <textarea
                      className={styles.textarea}
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      rows={3}
                      maxLength={2000}
                    />
                    <div className={styles.itemActions}>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={saveEdit}
                        disabled={updateMutation.isPending}
                      >
                        Save
                      </button>
                      <button type="button" className={styles.secondaryBtn} onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className={styles.message}>{comment.message}</p>
                    {canWrite && isOwner && (
                      <div className={styles.itemActions}>
                        <button
                          type="button"
                          className={styles.linkBtn}
                          onClick={() => startEdit(comment)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={styles.linkDanger}
                          onClick={() => handleDelete(comment.id)}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </article>
            );
          })
        )}
      </div>

      {canWrite ? (
        <form className={styles.composer} onSubmit={handleSubmit}>
          <textarea
            className={styles.textarea}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a comment…"
            rows={3}
            maxLength={2000}
          />
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={createMutation.isPending || !message.trim()}
          >
            {createMutation.isPending ? 'Posting…' : 'Post comment'}
          </button>
        </form>
      ) : (
        <p className={styles.viewerHint}>Viewers can read comments but not post.</p>
      )}
    </aside>
  );
}
