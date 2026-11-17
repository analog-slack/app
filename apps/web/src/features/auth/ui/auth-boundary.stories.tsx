import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Button } from '@/components/ui/button';

import { AuthBoundary } from './auth-boundary';
import { AuthStoryFixture } from './auth-story-fixture';

const meta = {
  component: AuthBoundary,
  args: { mode: 'protected', children: <Button>Открыть профиль</Button> },
  parameters: { nextjs: { appDirectory: true } },
} satisfies Meta<typeof AuthBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <AuthStoryFixture signedIn>
      <AuthBoundary {...args} />
    </AuthStoryFixture>
  ),
};

export const Loading: Story = {
  render: (args) => (
    <AuthStoryFixture>
      <AuthBoundary {...args} />
    </AuthStoryFixture>
  ),
};

export const Disabled: Story = {
  ...Default,
  args: { children: <Button disabled>Открыть профиль</Button> },
};

export const WithError: Story = {
  render: (args) => (
    <AuthStoryFixture response="error">
      <AuthBoundary {...args} />
    </AuthStoryFixture>
  ),
};
