'use client';

import { useCallback, useEffect, useRef } from 'react';

import {
  connectSocket,
  disconnectSocket,
  type PresencePayload,
  socket,
  SOCKET_EVENTS,
  type TypingPayload,
} from '@/shared/api/socket';

import { useSocketStore } from './use-socket-store';

export interface UseSocketConnectionOptions {
  token?: string;
  autoConnect?: boolean;
}

export function useSocketConnection({
  token,
  autoConnect = true,
}: UseSocketConnectionOptions = {}) {
  const setStatus = useSocketStore((state) => state.setStatus);
  const setLastError = useSocketStore((state) => state.setLastError);
  const setPresence = useSocketStore((state) => state.setPresence);
  const addTypingUser = useSocketStore((state) => state.addTypingUser);
  const removeTypingUser = useSocketStore((state) => state.removeTypingUser);
  const clearTyping = useSocketStore((state) => state.clearTyping);

  const tokenRef = useRef<string | undefined>(token);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    // 1. Системные события сокета
    const handleConnect = () => {
      setStatus('connected');
      setLastError(null);
    };

    const handleDisconnect = (reason: string) => {
      if (reason === 'io client disconnect') {
        setStatus('disconnected');
      } else {
        setStatus('reconnecting');
      }
      clearTyping();
    };

    const handleConnectError = (error: Error) => {
      setStatus('error');
      setLastError(error.message || 'Ошибка соединения с сервером');
    };

    // 2. Системные события менеджера повторного соединения
    const handleReconnectAttempt = () => {
      setStatus('reconnecting');
    };

    const handleReconnect = () => {
      setStatus('connected');
      setLastError(null);
    };

    const handleReconnectError = (error: Error) => {
      setStatus('error');
      setLastError(error.message || 'Ошибка переподключения');
    };

    const handleReconnectFailed = () => {
      setStatus('error');
      setLastError('Не удалось восстановить соединение с сервером');
    };

    // 3. Доменные события
    const handlePresenceUpdate = (payload: PresencePayload) => {
      setPresence(payload.userId, payload.status === 'online');
    };

    const handleTypingUpdate = (payload: TypingPayload) => {
      if (payload.isTyping) {
        addTypingUser(payload.targetId, {
          userId: payload.userId,
          username: payload.username,
        });
      } else {
        removeTypingUser(payload.targetId, payload.userId);
      }
    };

    // Регистрация слушателей
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, handlePresenceUpdate);
    socket.on(SOCKET_EVENTS.TYPING_UPDATE, handleTypingUpdate);

    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.io.on('reconnect', handleReconnect);
    socket.io.on('reconnect_error', handleReconnectError);
    socket.io.on('reconnect_failed', handleReconnectFailed);

    if (socket.connected) {
      setStatus('connected');
    } else if (autoConnect) {
      setStatus('connecting');
      connectSocket(tokenRef.current);
    }

    // Защита от утечек памяти (Critical Requirement): полная отписка
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off(SOCKET_EVENTS.PRESENCE_UPDATE, handlePresenceUpdate);
      socket.off(SOCKET_EVENTS.TYPING_UPDATE, handleTypingUpdate);

      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.io.off('reconnect', handleReconnect);
      socket.io.off('reconnect_error', handleReconnectError);
      socket.io.off('reconnect_failed', handleReconnectFailed);
    };
  }, [
    autoConnect,
    setStatus,
    setLastError,
    setPresence,
    addTypingUser,
    removeTypingUser,
    clearTyping,
  ]);

  useEffect(() => {
    if (autoConnect && token !== undefined) {
      connectSocket(token);
    }
  }, [token, autoConnect]);

  const connect = useCallback(
    (customToken?: string) => connectSocket(customToken ?? tokenRef.current),
    [],
  );

  const disconnect = useCallback(() => disconnectSocket(), []);

  return {
    connect,
    disconnect,
  };
}
