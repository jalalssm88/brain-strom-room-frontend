'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useUpdateProfile } from '@/features/auth/useAuth';
import { toApiError } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/media';
import { AuthUser } from '@/types/auth';
import styles from './EditProfileModal.module.css';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function initialsFromName(fullName: string): string {
  return fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function EditProfileModal({ isOpen, onClose, user }: EditProfileModalProps) {
  const updateProfileMutation = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewObjectUrlRef = useRef<string | null>(null);

  const [fullName, setFullName] = useState(user.fullName);
  const [previewUrl, setPreviewUrl] = useState<string | null>(resolveMediaUrl(user.avatar));
  /** `File` = new upload, `null` = cleared, `undefined` = unchanged */
  const [avatar, setAvatar] = useState<File | null | undefined>(undefined);
  const [error, setError] = useState('');

  const clearPreviewObjectUrl = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    clearPreviewObjectUrl();
    setFullName(user.fullName);
    setPreviewUrl(resolveMediaUrl(user.avatar));
    setAvatar(undefined);
    setError('');
  }, [isOpen, user.avatar, user.fullName]);

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

  useEffect(() => {
    return () => clearPreviewObjectUrl();
  }, []);

  const handleAvatarFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setError('Avatar image is too large (max 2MB)');
      return;
    }

    clearPreviewObjectUrl();
    const objectUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    setAvatar(file);
    setError('');
  };

  const handleRemoveAvatar = () => {
    clearPreviewObjectUrl();
    setPreviewUrl(null);
    setAvatar(null);
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await updateProfileMutation.mutateAsync({
        fullName: fullName.trim(),
        ...(avatar !== undefined ? { avatar } : {}),
      });
      onClose();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  if (!isOpen) return null;

  const previewInitials = initialsFromName(fullName.trim() || user.fullName);

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
      >
        <div className={styles.header}>
          <h2 id="edit-profile-title" className={styles.title}>
            Edit profile
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.avatarSection}>
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className={styles.avatarPreview} />
            ) : (
              <div className={styles.avatarPreview}>{previewInitials}</div>
            )}
            <div className={styles.avatarActions}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className={styles.fileInput}
                onChange={handleAvatarFile}
              />
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => fileInputRef.current?.click()}
              >
                Change photo
              </button>
              {previewUrl && (
                <button type="button" className={styles.secondaryBtn} onClick={handleRemoveAvatar}>
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="profile-full-name">
              Full name
            </label>
            <input
              id="profile-full-name"
              type="text"
              className={styles.input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              maxLength={100}
              autoFocus
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
