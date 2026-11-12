import { io, type Socket } from 'socket.io-client';

import type { ClientToServerEvents, ServerToClientEvents } from './types';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const getSocketUrl = (): string => {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';
  }
  return (
    process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || window.location.origin
  );
};

export const socket: TypedSocket = io(getSocketUrl(), {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
});

export const connectSocket = (token?: string, forceReconnect = false): void => {
  const currentAuth = socket.auth as { token?: string } | undefined;
  const isTokenChanged = Boolean(token && currentAuth?.token && currentAuth.token !== token);

  if (token) {
    socket.auth = { token };
  }

  if (!socket.connected) {
    socket.connect();
  } else if (forceReconnect || isTokenChanged) {
    socket.disconnect().connect();
  }
};

export const disconnectSocket = (): void => {
  if (socket.connected || socket.active) {
    socket.disconnect();
  }
};
