import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { WorkspaceDetails } from './workspace-details';
import { WorkspaceStoryFixture } from './workspace-story-fixture';

const meta = {
  component: WorkspaceDetails,
  parameters: { nextjs: { appDirectory: true } },
  args: { id: 'workspace' },
} satisfies Meta<typeof WorkspaceDetails>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <WorkspaceStoryFixture access="owner">
      {(id) => <WorkspaceDetails id={id} />}
    </WorkspaceStoryFixture>
  ),
};

export const Loading: Story = {
  render: () => (
    <WorkspaceStoryFixture mode="loading">
      {(id) => <WorkspaceDetails id={id} />}
    </WorkspaceStoryFixture>
  ),
};

export const Disabled: Story = {
  render: () => (
    <WorkspaceStoryFixture access="member">
      {(id) => <WorkspaceDetails id={id} />}
    </WorkspaceStoryFixture>
  ),
};

export const WithError: Story = {
  render: () => (
    <WorkspaceStoryFixture mode="error">
      {(id) => <WorkspaceDetails id={id} />}
    </WorkspaceStoryFixture>
  ),
};
