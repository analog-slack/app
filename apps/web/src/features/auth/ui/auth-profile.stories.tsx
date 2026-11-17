import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { AuthBoundary } from './auth-boundary';
import { AuthProfile } from './auth-profile';
import { AuthStoryFixture } from './auth-story-fixture';

const meta = {
  component: AuthProfile,
  parameters: { nextjs: { appDirectory: true } },
} satisfies Meta<typeof AuthProfile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <AuthStoryFixture signedIn response="success">
      <AuthProfile />
    </AuthStoryFixture>
  ),
};

export const Loading: Story = {
  render: () => (
    <AuthStoryFixture>
      <AuthBoundary mode="protected">
        <AuthProfile />
      </AuthBoundary>
    </AuthStoryFixture>
  ),
};

export const Disabled: Story = {
  render: () => (
    <AuthStoryFixture signedIn>
      <AuthProfile />
    </AuthStoryFixture>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Выйти' }));
  },
};

export const WithError: Story = {
  render: () => (
    <AuthStoryFixture signedIn response="error">
      <AuthProfile />
    </AuthStoryFixture>
  ),
  play: Disabled.play,
};
