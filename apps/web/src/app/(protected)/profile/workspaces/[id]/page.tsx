import { WorkspaceDetails } from '@/widgets/workspace';

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkspaceDetails id={id} />;
}
