/**
 * Результат выполнения запроса через Socket.io Acknowledgment callback
 */
export type AckResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

/**
 * Доменная модель полезной нагрузки сообщения через сокет
 */
export interface SocketMessagePayload {
  id: string;
  channelId: string | null;
  conversationId: string | null;
  senderId: string;
  parentMessageId: string | null;
  content: string;
  clientGeneratedId: string;
  clientMessageId?: string;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  sender?: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
}

/**
 * Доменная модель полезной нагрузки реакции на сообщение
 */
export interface SocketReactionPayload {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  action: 'added' | 'removed';
}

/**
 * Полезная нагрузка индикатора набора текста
 */
export interface TypingPayload {
  targetId: string; // channelId или conversationId
  targetType: 'channel' | 'conversation';
  userId: string;
  username: string;
  isTyping: boolean;
}

/**
 * Полезная нагрузка статуса присутствия пользователя (Presence)
 */
export interface PresencePayload {
  userId: string;
  status: 'online' | 'offline';
  lastSeenAt?: string;
}
