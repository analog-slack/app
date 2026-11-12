import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useEffect } from 'react';

import { useSocketStore } from '../model/use-socket-store';
import { ConnectionStatusBanner } from './connection-status-banner';

const meta = {
  title: 'Features/WsConnection/ConnectionStatusBanner',
  component: ConnectionStatusBanner,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ConnectionStatusBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Connecting: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        useSocketStore.getState().setStatus('connecting');
      }, []);
      return <Story />;
    },
  ],
};

export const Reconnecting: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        useSocketStore.getState().setStatus('reconnecting');
      }, []);
      return <Story />;
    },
  ],
};

export const ErrorState: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        useSocketStore.getState().setStatus('error');
        useSocketStore.getState().setLastError('Сервер недоступен. Проверьте сетевое соединение.');
      }, []);
      return <Story />;
    },
  ],
};

export const Disconnected: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        useSocketStore.getState().setStatus('disconnected');
      }, []);
      return <Story />;
    },
  ],
};
