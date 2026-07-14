'use client';

import { FormEvent, useEffect, useState } from 'react';
import RichTextEditor from '@/components/RichTextEditor';
import { Note } from '@/types/note';
import styles from './NoteEditorModal.module.css';

const NOTE_COLORS = ['#FDE68A', '#BFDBFE', '#BBF7D0', '#FBCFE8', '#E9D5FF'];

export interface NoteEditorSavePayload {
  title: string;
  content: string;
  color: string;
}

interface NoteEditorModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialNote?: Note | null;
  isSaving?: boolean;
  isDeleting?: boolean;
  error?: string;
  onClose: () => void;
  onSave: (payload: NoteEditorSavePayload) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}

export default function NoteEditorModal({
  isOpen,
  mode,
  initialNote,
  isSaving = false,
  isDeleting = false,
  error = '',
  onClose,
  onSave,
  onDelete,
}: NoteEditorModalProps) {
  const [title, setTitle] = useState('New note');
  const [content, setContent] = useState('');
  const [color, setColor] = useState(NOTE_COLORS[0]);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && initialNote) {
      setTitle(initialNote.title);
      setContent(initialNote.content);
      setColor(initialNote.color);
    } else {
      setTitle('New note');
      setContent('');
      setColor(NOTE_COLORS[0]);
    }
    setLocalError('');
  }, [isOpen, mode, initialNote]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');

    const trimmed = title.trim();
    if (!trimmed) {
      setLocalError('Title is required');
      return;
    }

    await onSave({ title: trimmed, content, color });
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm('Delete this note?')) return;
    await onDelete();
  };

  if (!isOpen) return null;

  const displayError = localError || error;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-editor-title"
      >
        <div className={styles.header}>
          <h2 id="note-editor-title" className={styles.title}>
            {mode === 'create' ? 'Add note' : 'Edit note'}
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {displayError && <div className={styles.error}>{displayError}</div>}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="note-title">
              Title
            </label>
            <input
              id="note-title"
              type="text"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Content</label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Write note content…"
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Color</span>
            <div className={styles.colorRow}>
              {NOTE_COLORS.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  className={`${styles.swatch} ${color === swatch ? styles.swatchActive : ''}`}
                  style={{ backgroundColor: swatch }}
                  onClick={() => setColor(swatch)}
                  aria-label={`Color ${swatch}`}
                />
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            {mode === 'edit' && onDelete && (
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
            <div className={styles.actionsRight}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className={styles.saveBtn} disabled={isSaving || isDeleting}>
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
