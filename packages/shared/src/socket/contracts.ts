import { SOCKET_EVENTS } from './events';
import type {
  AckResponse,
  PresencePayload,
  SocketMessagePayload,
  SocketReactionPayload,
  TypingPayload,
} from './payloads';

/**
 * Строгие контракты событий от Сервера к Клиенту (ServerToClientEvents)
 */
export interface ServerToClientEvents {
  [SOCKET_EVENTS.MESSAGE_NEW]: (payload: SocketMessagePayload) => void;
  [SOCKET_EVENTS.MESSAGE_UPDATED]: (payload: SocketMessagePayload) => void;
  [SOCKET_EVENTS.MESSAGE_DELETED]: (payload: {
    messageId: string;
    channelId?: string | null;
    conversationId?: string | null;
  }) => void;
  [SOCKET_EVENTS.REACTION_TOGGLED]: (payload: SocketReactionPayload) => void;
  [SOCKET_EVENTS.TYPING_UPDATE]: (payload: TypingPayload) => void;
  [SOCKET_EVENTS.PRESENCE_UPDATE]: (payload: PresencePayload) => void;
  [SOCKET_EVENTS.ACCESS_REVOKED]: (payload: {
    targetId: string;
    targetType: 'channel' | 'conversation';
    reason?: string;
  }) => void;
}

/**
 * Строгие контракты событий от Клиента к Серверу (ClientToServerEvents)
 */
export interface ClientToServerEvents {
  [SOCKET_EVENTS.CHANNEL_JOIN]: (
    payload: { channelId: string },
    callback?: (ack: AckResponse) => void,
  ) => void;
  [SOCKET_EVENTS.CHANNEL_LEAVE]: (
    payload: { channelId: string },
    callback?: (ack: AckResponse) => void,
  ) => void;
  [SOCKET_EVENTS.CONVERSATION_JOIN]: (
    payload: { conversationId: string },
    callback?: (ack: AckResponse) => void,
  ) => void;
  [SOCKET_EVENTS.CONVERSATION_LEAVE]: (
    payload: { conversationId: string },
    callback?: (ack: AckResponse) => void,
  ) => void;
  [SOCKET_EVENTS.MESSAGE_SEND]: (
    payload: {
      content: string;
      channelId?: string | null;
      conversationId?: string | null;
      parentMessageId?: string | null;
      clientGeneratedId: string;
      clientMessageId?: string;
    },
    callback?: (ack: AckResponse<SocketMessagePayload>) => void,
  ) => void;
  [SOCKET_EVENTS.TYPING_START]: (payload: {
    targetId: string;
    targetType: 'channel' | 'conversation';
  }) => void;
  [SOCKET_EVENTS.TYPING_STOP]: (payload: {
    targetId: string;
    targetType: 'channel' | 'conversation';
  }) => void;
  [SOCKET_EVENTS.MESSAGE_READ]: (
    payload: {
      messageId: string;
      channelId?: string | null;
      conversationId?: string | null;
    },
    callback?: (ack: AckResponse) => void,
  ) => void;
}
