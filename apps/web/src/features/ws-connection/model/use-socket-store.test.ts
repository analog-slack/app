import { beforeEach, describe, expect, it } from 'vitest';

import { useSocketStore } from './use-socket-store';

describe('useSocketStore', () => {
  beforeEach(() => {
    useSocketStore.getState().resetConnectionState();
  });

  it('инициализируется с корректным начальным состоянием', () => {
    const state = useSocketStore.getState();
    expect(state.status).toBe('disconnected');
    expect(state.onlineUserIds).toEqual({});
    expect(state.typingUsersByTarget).toEqual({});
    expect(state.lastError).toBeNull();
  });

  it('обновляет статус соединения и сбрасывает ошибку', () => {
    useSocketStore.getState().setLastError('Сетевой сбой');
    useSocketStore.getState().setStatus('connected');

    const state = useSocketStore.getState();
    expect(state.status).toBe('connected');
    expect(state.lastError).toBe('Сетевой сбой');
  });

  it('корректно управляет присутствием пользователей (Presence)', () => {
    useSocketStore.getState().setPresence('user-1', true);
    expect(useSocketStore.getState().onlineUserIds['user-1']).toBe(true);

    useSocketStore.getState().setPresence('user-1', false);
    expect(useSocketStore.getState().onlineUserIds['user-1']).toBe(false);

    useSocketStore.getState().setBulkPresence({
      'user-2': true,
      'user-3': true,
    });
    expect(useSocketStore.getState().onlineUserIds).toEqual({
      'user-1': false,
      'user-2': true,
      'user-3': true,
    });
  });

  it('добавляет и удаляет печатающих пользователей с дедупликацией', () => {
    const targetId = 'channel-123';
    const user1 = { userId: 'u-1', username: 'alice' };
    const user2 = { userId: 'u-2', username: 'bob' };

    useSocketStore.getState().addTypingUser(targetId, user1);
    expect(useSocketStore.getState().typingUsersByTarget[targetId]).toEqual([user1]);

    // Повторное добавление того же пользователя не дублирует запись
    useSocketStore.getState().addTypingUser(targetId, user1);
    expect(useSocketStore.getState().typingUsersByTarget[targetId]).toHaveLength(1);

    // Добавление второго пользователя
    useSocketStore.getState().addTypingUser(targetId, user2);
    expect(useSocketStore.getState().typingUsersByTarget[targetId]).toEqual([user1, user2]);

    // Удаление первого пользователя
    useSocketStore.getState().removeTypingUser(targetId, 'u-1');
    expect(useSocketStore.getState().typingUsersByTarget[targetId]).toEqual([user2]);

    // Очистка индикаторов для конкретной цели
    useSocketStore.getState().clearTyping(targetId);
    expect(useSocketStore.getState().typingUsersByTarget[targetId]).toBeUndefined();
  });
});
