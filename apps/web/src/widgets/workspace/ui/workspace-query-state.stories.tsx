import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { I18nProvider } from '@/shared/i18n';

import { WorkspaceQueryState } from './workspace-query-state';

const meta = {
  component: WorkspaceQueryState,
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <I18nProvider initialLocale="ru">
        <Story />
      </I18nProvider>
    ),
  ],
  args: { error: false, onRetry: () => {} },
} satisfies Meta<typeof WorkspaceQueryState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Loading: Story = Default;
export const Disabled: Story = Loading;
export const WithError: Story = { args: { error: true } };
