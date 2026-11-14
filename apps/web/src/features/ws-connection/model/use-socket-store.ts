import { create } from 'zustand';

export type ConnectionStatus =
  'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface TypingUser {
  userId: string;
  username: string;
}

interface SocketState {
  status: ConnectionStatus;
  onlineUserIds: Record<string, boolean>;
  typingUsersByTarget: Record<string, TypingUser[]>;
  lastError: string | null;
}

interface SocketActions {
  setStatus: (status: ConnectionStatus) => void;
  setLastError: (error: string | null) => void;
  setPresence: (userId: string, isOnline: boolean) => void;
  setBulkPresence: (users: Record<string, boolean>) => void;
  addTypingUser: (targetId: string, user: TypingUser) => void;
  removeTypingUser: (targetId: string, userId: string) => void;
  clearTyping: (targetId?: string) => void;
  resetConnectionState: () => void;
}

export type SocketStore = SocketState & SocketActions;

const initialState: SocketState = {
  status: 'disconnected',
  onlineUserIds: {},
  typingUsersByTarget: {},
  lastError: null,
};

export const useSocketStore = create<SocketStore>((set) => ({
  ...initialState,

  setStatus: (status) => set((state) => (state.status === status ? state : { status })),

  setLastError: (error) => set({ lastError: error }),

  setPresence: (userId, isOnline) =>
    set((state) => {
      if (state.onlineUserIds[userId] === isOnline) {
        return state;
      }
      return {
        onlineUserIds: {
          ...state.onlineUserIds,
          [userId]: isOnline,
        },
      };
    }),

  setBulkPresence: (users) =>
    set((state) => ({
      onlineUserIds: {
        ...state.onlineUserIds,
        ...users,
      },
    })),

  addTypingUser: (targetId, user) =>
    set((state) => {
      const currentList = state.typingUsersByTarget[targetId] ?? [];
      if (currentList.some((item) => item.userId === user.userId)) {
        return state;
      }
      return {
        typingUsersByTarget: {
          ...state.typingUsersByTarget,
          [targetId]: [...currentList, user],
        },
      };
    }),

  removeTypingUser: (targetId, userId) =>
    set((state) => {
      const currentList = state.typingUsersByTarget[targetId];
      if (!currentList || !currentList.some((item) => item.userId === userId)) {
        return state;
      }
      const updatedList = currentList.filter((item) => item.userId !== userId);
      return {
        typingUsersByTarget: {
          ...state.typingUsersByTarget,
          [targetId]: updatedList,
        },
      };
    }),

  clearTyping: (targetId) =>
    set((state) => {
      if (targetId) {
        if (!state.typingUsersByTarget[targetId]) {
          return state;
        }
        const next = { ...state.typingUsersByTarget };
        delete next[targetId];
        return { typingUsersByTarget: next };
      }
      return { typingUsersByTarget: {} };
    }),

  resetConnectionState: () => set(initialState),
}));

// Стабильная пустая ссылка для исключения ре-рендеров
const EMPTY_TYPING_LIST: readonly TypingUser[] = [];

// Точечные селекторы (Strict Zustand Rule)
export const useSocketStatus = (): ConnectionStatus => useSocketStore((state) => state.status);

export const useIsConnected = (): boolean =>
  useSocketStore((state) => state.status === 'connected');

export const useIsUserOnline = (userId: string): boolean =>
  useSocketStore((state) => Boolean(state.onlineUserIds[userId]));

export const useTypingUsers = (targetId: string): readonly TypingUser[] =>
  useSocketStore((state) => state.typingUsersByTarget[targetId] ?? EMPTY_TYPING_LIST);

export const useSocketError = (): string | null => useSocketStore((state) => state.lastError);
