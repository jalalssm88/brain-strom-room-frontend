'use client';

import { PointerEvent, WheelEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  useCreateNote,
  useDeleteNote,
  useNotes,
  useUpdateNote,
} from '@/features/notes/useNotes';
import { useToggleVote } from '@/features/votes/useVotes';
import { toApiError } from '@/lib/api';
import { getDisplayHtml } from '@/lib/richText';
import { Note } from '@/types/note';
import { MemberRole } from '@/types/workspace';
import NoteCommentsPanel from './NoteCommentsPanel';
import NoteEditorModal, { NoteEditorSavePayload } from './NoteEditorModal';
import VoteButton from './VoteButton';
import styles from './NotesBoard.module.css';

const MIN_NOTE_SIZE = 80;
const MAX_NOTE_SIZE = 800;
const BASE_NOTE_WIDTH = 200;
const BASE_NOTE_HEIGHT = 150;

const RESIZE_HANDLES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const;
type ResizeHandle = (typeof RESIZE_HANDLES)[number];

interface NotesBoardProps {
  workspaceId: number;
  currentUserId: number;
  role: MemberRole;
  fullScreen?: boolean;
}

type Interaction =
  | { type: 'pan'; startX: number; startY: number; originX: number; originY: number }
  | {
      type: 'note';
      noteId: number;
      startX: number;
      startY: number;
      originNoteX: number;
      originNoteY: number;
    }
  | {
      type: 'resize';
      noteId: number;
      handle: ResizeHandle;
      startX: number;
      startY: number;
      originX: number;
      originY: number;
      originWidth: number;
      originHeight: number;
    }
  | null;

type EditorState =
  | { mode: 'create' }
  | { mode: 'edit'; noteId: number }
  | null;

function clampSize(value: number): number {
  return Math.min(MAX_NOTE_SIZE, Math.max(MIN_NOTE_SIZE, value));
}

function getTextScale(width: number, height: number): number {
  const scale = (width / BASE_NOTE_WIDTH + height / BASE_NOTE_HEIGHT) / 2;
  return Math.min(2.25, Math.max(0.65, scale));
}

function applyResize(
  handle: ResizeHandle,
  origin: { x: number; y: number; width: number; height: number },
  dx: number,
  dy: number,
): { x: number; y: number; width: number; height: number } {
  let { x, y, width, height } = origin;

  if (handle.includes('e')) {
    width = clampSize(origin.width + dx);
  }
  if (handle.includes('s')) {
    height = clampSize(origin.height + dy);
  }
  if (handle.includes('w')) {
    width = clampSize(origin.width - dx);
    x = origin.x + (origin.width - width);
  }
  if (handle.includes('n')) {
    height = clampSize(origin.height - dy);
    y = origin.y + (origin.height - height);
  }

  return { x, y, width, height };
}

export default function NotesBoard({
  workspaceId,
  currentUserId,
  role,
  fullScreen = false,
}: NotesBoardProps) {
  const canWrite = role === 'ADMIN' || role === 'EDITOR';
  const { data: notes = [], isLoading } = useNotes(workspaceId);
  const createMutation = useCreateNote(workspaceId);
  const updateMutation = useUpdateNote(workspaceId);
  const deleteMutation = useDeleteNote(workspaceId);
  const toggleVoteMutation = useToggleVote(workspaceId);

  const viewportRef = useRef<HTMLDivElement>(null);
  const [localNotes, setLocalNotes] = useState<Note[]>([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [interaction, setInteraction] = useState<Interaction>(null);
  const interactionRef = useRef<Interaction>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [commentsNoteId, setCommentsNoteId] = useState<number | null>(null);
  const [editor, setEditor] = useState<EditorState>(null);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const movedRef = useRef(false);
  const lastTapRef = useRef<{ noteId: number; time: number } | null>(null);

  const beginInteraction = (next: NonNullable<Interaction>) => {
    interactionRef.current = next;
    setInteraction(next);
  };

  const clearInteraction = () => {
    interactionRef.current = null;
    setInteraction(null);
  };

  useEffect(() => {
    if (!interaction) {
      setLocalNotes(notes);
    }
  }, [notes, interaction]);

  const editingNote =
    editor?.mode === 'edit'
      ? (localNotes.find((note) => note.id === editor.noteId) ?? null)
      : null;

  const capturePointer = (pointerId: number) => {
    viewportRef.current?.setPointerCapture(pointerId);
  };

  const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setScale((prev) => Math.min(2, Math.max(0.4, prev + delta)));
  }, []);

  const handleViewportPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-note-id]')) return;
    if ((e.target as HTMLElement).closest('[data-comments-panel]')) return;

    setSelectedId(null);
    setCommentsNoteId(null);
    beginInteraction({
      type: 'pan',
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    });
    capturePointer(e.pointerId);
  };

  const handleNotePointerDown = (e: PointerEvent<HTMLDivElement>, note: Note) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('[data-resize-handle]')) return;
    if ((e.target as HTMLElement).closest('[data-note-action]')) return;
    e.stopPropagation();
    setSelectedId(note.id);
    movedRef.current = false;

    const isOwner = note.createdById === currentUserId;
    if (!canWrite || !isOwner) return;

    beginInteraction({
      type: 'note',
      noteId: note.id,
      startX: e.clientX,
      startY: e.clientY,
      originNoteX: note.x,
      originNoteY: note.y,
    });
    capturePointer(e.pointerId);
  };

  const openEditModal = (noteId: number) => {
    if (!canWrite) return;
    const note = localNotes.find((item) => item.id === noteId);
    if (!note || note.createdById !== currentUserId) return;
    setSelectedId(noteId);
    setModalError('');
    setEditor({ mode: 'edit', noteId });
  };

  const handleResizePointerDown = (
    e: PointerEvent<HTMLSpanElement>,
    note: Note,
    handle: ResizeHandle,
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setSelectedId(note.id);
    movedRef.current = false;

    beginInteraction({
      type: 'resize',
      noteId: note.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      originX: note.x,
      originY: note.y,
      originWidth: note.width,
      originHeight: note.height,
    });
    capturePointer(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const current = interactionRef.current;
    if (!current) return;

    if (current.type === 'pan') {
      setOffset({
        x: current.originX + (e.clientX - current.startX),
        y: current.originY + (e.clientY - current.startY),
      });
      return;
    }

    const dx = (e.clientX - current.startX) / scale;
    const dy = (e.clientY - current.startY) / scale;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      movedRef.current = true;
    }

    if (current.type === 'note') {
      setLocalNotes((prev) =>
        prev.map((note) =>
          note.id === current.noteId
            ? { ...note, x: current.originNoteX + dx, y: current.originNoteY + dy }
            : note,
        ),
      );
      return;
    }

    const next = applyResize(
      current.handle,
      {
        x: current.originX,
        y: current.originY,
        width: current.originWidth,
        height: current.originHeight,
      },
      dx,
      dy,
    );

    setLocalNotes((prev) =>
      prev.map((note) => (note.id === current.noteId ? { ...note, ...next } : note)),
    );
  };

  const handlePointerUp = async (e: PointerEvent<HTMLDivElement>) => {
    const current = interactionRef.current;
    if (current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    }
    clearInteraction();

    if (!current || current.type === 'pan') return;

    // Pointer capture blocks native dblclick — detect a second tap instead.
    if (current.type === 'note' && !movedRef.current) {
      const now = Date.now();
      const previous = lastTapRef.current;
      if (previous && previous.noteId === current.noteId && now - previous.time < 500) {
        lastTapRef.current = null;
        openEditModal(current.noteId);
      } else {
        lastTapRef.current = { noteId: current.noteId, time: now };
      }
      return;
    }

    if (!movedRef.current) return;

    lastTapRef.current = null;
    setError('');
    try {
      if (current.type === 'note') {
        const x = current.originNoteX + (e.clientX - current.startX) / scale;
        const y = current.originNoteY + (e.clientY - current.startY) / scale;
        await updateMutation.mutateAsync({
          noteId: current.noteId,
          payload: { x, y },
        });
        return;
      }

      const dx = (e.clientX - current.startX) / scale;
      const dy = (e.clientY - current.startY) / scale;
      const next = applyResize(
        current.handle,
        {
          x: current.originX,
          y: current.originY,
          width: current.originWidth,
          height: current.originHeight,
        },
        dx,
        dy,
      );

      await updateMutation.mutateAsync({
        noteId: current.noteId,
        payload: next,
      });
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  const openCreateModal = () => {
    if (!canWrite) return;
    setModalError('');
    setEditor({ mode: 'create' });
  };

  const closeEditor = () => {
    setEditor(null);
    setModalError('');
  };

  const handleSaveNote = async (payload: NoteEditorSavePayload) => {
    setModalError('');
    try {
      if (editor?.mode === 'create') {
        const note = await createMutation.mutateAsync({
          title: payload.title,
          content: payload.content,
          color: payload.color,
          x: 120 - offset.x / scale,
          y: 120 - offset.y / scale,
        });
        setSelectedId(note.id);
        closeEditor();
        return;
      }

      if (editor?.mode === 'edit') {
        await updateMutation.mutateAsync({
          noteId: editor.noteId,
          payload: {
            title: payload.title,
            content: payload.content,
            color: payload.color,
          },
        });
        closeEditor();
      }
    } catch (err) {
      setModalError(toApiError(err).message);
    }
  };

  const handleDeleteNote = async () => {
    if (editor?.mode !== 'edit') return;
    setModalError('');
    try {
      await deleteMutation.mutateAsync(editor.noteId);
      setSelectedId(null);
      closeEditor();
    } catch (err) {
      setModalError(toApiError(err).message);
    }
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleToggleVote = async (noteId: number) => {
    if (!canWrite) return;
    setError('');
    try {
      await toggleVoteMutation.mutateAsync(noteId);
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  const commentsNote = commentsNoteId
    ? (localNotes.find((note) => note.id === commentsNoteId) ?? null)
    : null;

  return (
    <section className={`${styles.wrap} ${fullScreen ? styles.wrapFull : ''}`}>
      <div className={styles.toolbar}>
        <div>
          <h2 className={styles.title}>Notes board</h2>
          <p className={styles.hint}>
            {canWrite
              ? 'Add note · Double-click to edit · Vote · Comment icon · Drag · Pan · Zoom'
              : 'View only · Comment icon · Pan · Wheel zoom'}
          </p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryBtn} onClick={resetView}>
            Reset view
          </button>
          {canWrite && (
            <button type="button" className={styles.primaryBtn} onClick={openCreateModal}>
              Add note
            </button>
          )}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div
        ref={viewportRef}
        className={`${styles.viewport} ${fullScreen ? styles.viewportFull : ''} ${interaction?.type === 'pan' ? styles.panning : ''} ${interaction?.type === 'note' || interaction?.type === 'resize' ? styles.draggingNote : ''}`}
        onWheel={handleWheel}
        onPointerDown={handleViewportPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {isLoading ? (
          <div className={styles.loading}>Loading notes…</div>
        ) : (
          <div
            className={styles.world}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            }}
          >
            <div className={styles.grid} aria-hidden="true" />

            {localNotes.map((note) => {
              const isOwner = note.createdById === currentUserId;
              const canResize = canWrite && isOwner;
              const textScale = getTextScale(note.width, note.height);

              return (
                <div
                  key={note.id}
                  data-note-id={note.id}
                  className={`${styles.note} ${selectedId === note.id ? styles.noteActive : ''} ${canResize ? styles.noteDraggable : ''}`}
                  style={{
                    left: note.x,
                    top: note.y,
                    width: note.width,
                    height: note.height,
                    backgroundColor: note.color,
                    ['--note-scale' as string]: String(textScale),
                  }}
                  onPointerDown={(e) => handleNotePointerDown(e, note)}
                >
                  <div className={styles.noteHeader}>
                    <span className={styles.noteTitle}>{note.title}</span>
                    <span className={styles.noteAuthor}>{note.authorName}</span>
                  </div>
                  <div
                    className={styles.noteContent}
                    dangerouslySetInnerHTML={{ __html: getDisplayHtml(note.content) || '&nbsp;' }}
                  />

                  <div className={styles.noteFooter} data-note-action>
                    <VoteButton
                      workspaceId={workspaceId}
                      noteId={note.id}
                      voteCount={note.voteCount ?? 0}
                      hasVoted={Boolean(note.hasVoted)}
                      canVote={canWrite}
                      isToggling={toggleVoteMutation.isPending}
                      onToggle={() => {
                        void handleToggleVote(note.id);
                      }}
                    />
                    <button
                      type="button"
                      className={styles.commentBtn}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(note.id);
                        setCommentsNoteId(note.id);
                      }}
                      title="Open comments"
                    >
                      💬 {note.commentCount ?? 0}
                    </button>
                  </div>

                  {canResize &&
                    RESIZE_HANDLES.map((handle) => (
                      <span
                        key={handle}
                        data-resize-handle={handle}
                        className={`${styles.resizeHandle} ${styles[`handle_${handle}`]}`}
                        onPointerDown={(e) => handleResizePointerDown(e, note, handle)}
                      />
                    ))}
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && localNotes.length === 0 && (
          <div className={styles.empty}>
            {canWrite ? 'No notes yet — click Add note to start.' : 'No notes in this workspace.'}
          </div>
        )}

        <div className={styles.hud}>
          <span>{Math.round(scale * 100)}%</span>
          <span>
            {localNotes.length} note{localNotes.length === 1 ? '' : 's'}
          </span>
        </div>

        {commentsNote && (
          <NoteCommentsPanel
            workspaceId={workspaceId}
            noteId={commentsNote.id}
            noteTitle={commentsNote.title}
            currentUserId={currentUserId}
            role={role}
            onClose={() => setCommentsNoteId(null)}
          />
        )}
      </div>

      <NoteEditorModal
        isOpen={editor !== null}
        mode={editor?.mode ?? 'create'}
        initialNote={editingNote}
        isSaving={createMutation.isPending || updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
        error={modalError}
        onClose={closeEditor}
        onSave={handleSaveNote}
        onDelete={editor?.mode === 'edit' ? handleDeleteNote : undefined}
      />
    </section>
  );
}
