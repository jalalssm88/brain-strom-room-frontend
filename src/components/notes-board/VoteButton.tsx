'use client';

import { PointerEvent, useState } from 'react';
import { useNoteVotes } from '@/features/votes/useVotes';
import styles from './VoteButton.module.css';

interface VoteButtonProps {
  workspaceId: number;
  noteId: number;
  voteCount: number;
  hasVoted: boolean;
  canVote: boolean;
  isToggling?: boolean;
  onToggle: () => void;
}

export default function VoteButton({
  workspaceId,
  noteId,
  voteCount,
  hasVoted,
  canVote,
  isToggling = false,
  onToggle,
}: VoteButtonProps) {
  const [hovered, setHovered] = useState(false);
  const { data, isFetching } = useNoteVotes(workspaceId, noteId, hovered && voteCount > 0);

  const voterNames = data?.votes.map((vote) => vote.userName) ?? [];
  const showTooltip = hovered && voteCount > 0;

  let tooltipText = 'No votes yet';
  if (voteCount > 0) {
    if (isFetching && voterNames.length === 0) {
      tooltipText = 'Loading…';
    } else if (voterNames.length > 0) {
      tooltipText = voterNames.join(', ');
    } else {
      tooltipText = `${voteCount} vote${voteCount === 1 ? '' : 's'}`;
    }
  }

  return (
    <span
      className={styles.wrap}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <button
        type="button"
        className={`${styles.voteBtn} ${hasVoted ? styles.voteBtnActive : ''}`}
        disabled={!canVote || isToggling}
        onPointerDown={(e: PointerEvent<HTMLButtonElement>) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        title={canVote ? 'Toggle vote' : 'Viewers cannot vote'}
      >
        ▲ {voteCount}
      </button>

      {showTooltip && (
        <span className={styles.tooltip} role="tooltip">
          {tooltipText}
        </span>
      )}
    </span>
  );
}
