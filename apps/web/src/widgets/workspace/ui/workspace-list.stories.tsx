import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { WorkspaceList } from './workspace-list';
import { WorkspaceStoryFixture } from './workspace-story-fixture';

const meta = {
  component: WorkspaceList,
  parameters: { nextjs: { appDirectory: true } },
} satisfies Meta<typeof WorkspaceList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <WorkspaceStoryFixture>{() => <WorkspaceList />}</WorkspaceStoryFixture>,
};

export const Loading: Story = {
  render: () => (
    <WorkspaceStoryFixture mode="loading">{() => <WorkspaceList />}</WorkspaceStoryFixture>
  ),
};

export const Disabled: Story = {
  render: () => (
    <WorkspaceStoryFixture mode="empty">{() => <WorkspaceList />}</WorkspaceStoryFixture>
  ),
};

export const WithError: Story = {
  render: () => (
    <WorkspaceStoryFixture mode="error">{() => <WorkspaceList />}</WorkspaceStoryFixture>
  ),
};
