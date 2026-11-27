import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma.module';
import { WorkspaceAccessService } from './workspace-access.service';
import { WorkspaceSessionGuard } from './workspace-session.guard';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [WorkspacesController],
  providers: [WorkspaceAccessService, WorkspaceSessionGuard, WorkspacesService],
  exports: [WorkspaceAccessService],
})
export class WorkspacesModule {}
