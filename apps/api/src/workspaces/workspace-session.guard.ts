import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { AccessSessionService } from '../auth/access-session.service';

interface WorkspaceRequest extends Request {
  workspaceActorId?: string;
}

@Injectable()
export class WorkspaceSessionGuard implements CanActivate {
  constructor(private readonly session: AccessSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<WorkspaceRequest>();
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      this.session.assertAllowedOrigin(request.headers.origin);
    }

    const user = await this.session.requireUser(request.headers.cookie);
    request.workspaceActorId = user.id;
    return true;
  }
}

export const WorkspaceActor = createParamDecorator((_: undefined, context: ExecutionContext) => {
  const { workspaceActorId } = context.switchToHttp().getRequest<WorkspaceRequest>();
  if (!workspaceActorId) throw new UnauthorizedException();
  return workspaceActorId;
});
