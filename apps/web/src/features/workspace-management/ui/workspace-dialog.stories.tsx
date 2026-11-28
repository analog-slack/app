import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { I18nProvider } from '@/shared/i18n';

import { WorkspaceDialog } from './workspace-dialog';

const meta = {
  component: WorkspaceDialog,
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <I18nProvider initialLocale="ru">
        <Story />
      </I18nProvider>
    ),
  ],
  args: {
    action: { kind: 'createWorkspace' },
    onClose: () => {},
    onSaved: () => {},
    onSubmit: async () => {},
  },
} satisfies Meta<typeof WorkspaceDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const submit: Story['play'] = async ({ canvas, userEvent }) => {
  await userEvent.type(canvas.getByRole('textbox', { name: 'Название' }), 'Design');
  await userEvent.type(canvas.getByRole('textbox', { name: 'Slug' }), 'design');
  await userEvent.click(canvas.getByRole('button', { name: 'Сохранить' }));
};

export const Loading: Story = {
  args: { onSubmit: () => new Promise<void>(() => {}) },
  play: submit,
};

export const Disabled: Story = {
  args: {
    action: { kind: 'inviteMember', workspaceId: 'workspace' },
    onSubmit: () => new Promise<void>(() => {}),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole('textbox', { name: 'Почта' }), 'member@example.com');
    await userEvent.click(canvas.getByRole('button', { name: 'Пригласить' }));
  },
};

export const WithError: Story = {
  args: {
    onSubmit: async () => {
      throw new Error('Unavailable');
    },
  },
  play: submit,
};
