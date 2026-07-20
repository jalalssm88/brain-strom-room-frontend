'use client';

import { useState } from 'react';
import { resolveMediaUrl } from '@/lib/media';

interface UserAvatarProps {
  fullName: string;
  avatar?: string | null;
  className?: string;
  fallbackClassName?: string;
  title?: string;
}

function initialsFromName(fullName: string): string {
  return fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Renders a user avatar with media URL resolution and graceful fallback.
 * Uses referrerPolicy=no-referrer so Google profile photos load reliably.
 */
export default function UserAvatar({
  fullName,
  avatar,
  className,
  fallbackClassName,
  title,
}: UserAvatarProps) {
  const resolved = resolveMediaUrl(avatar);
  const [failed, setFailed] = useState(false);
  const initials = initialsFromName(fullName || '?');

  if (!resolved || failed) {
    return (
      <span className={fallbackClassName ?? className} title={title ?? fullName}>
        {initials}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={fullName}
      title={title ?? fullName}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
