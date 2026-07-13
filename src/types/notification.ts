export type NotificationType =
  | 'WORKSPACE_INVITE'
  | 'COMMENT_ADDED'
  | 'WORKSPACE_RENAMED'
  | 'SUBSCRIPTION_EXPIRING';

export type NotificationRefType = 'WORKSPACE' | 'NOTE' | 'INVITATION' | 'SUBSCRIPTION';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  referenceType: NotificationRefType | null;
  referenceId: number | null;
  isRead: boolean;
  createdAt: string;
}
