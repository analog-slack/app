import { AuthProfile } from '@/features/auth';
import { WorkspaceList } from '@/widgets/workspace';

export default function ProfilePage() {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <AuthProfile />
      <WorkspaceList />
    </div>
  );
}
