import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AUTH_ACCESS_COOKIE } from '@app/shared';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AuthErrorDto } from '../auth/auth.dto';
import { WorkspaceActor, WorkspaceSessionGuard } from './workspace-session.guard';
import { CreateWorkspaceDto, WorkspaceDto } from './workspaces.dto';
import { WorkspacesService } from './workspaces.service';

@ApiTags('workspaces')
@ApiCookieAuth(AUTH_ACCESS_COOKIE)
@ApiUnauthorizedResponse({ type: AuthErrorDto })
@Controller('workspaces')
@UseGuards(WorkspaceSessionGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Post()
  @ApiCreatedResponse({ type: WorkspaceDto })
  @ApiBadRequestResponse({ type: AuthErrorDto })
  @ApiForbiddenResponse({ type: AuthErrorDto })
  @ApiConflictResponse({ type: AuthErrorDto })
  create(@WorkspaceActor() actorId: string, @Body() dto: CreateWorkspaceDto) {
    return this.workspaces.create(actorId, dto);
  }

  @Get()
  @ApiOkResponse({ type: [WorkspaceDto] })
  list(@WorkspaceActor() actorId: string) {
    return this.workspaces.list(actorId);
  }

  @Get(':workspaceId')
  @ApiOkResponse({ type: WorkspaceDto })
  @ApiBadRequestResponse({ type: AuthErrorDto })
  @ApiNotFoundResponse({ type: AuthErrorDto })
  get(@Param('workspaceId', ParseUUIDPipe) workspaceId: string, @WorkspaceActor() actorId: string) {
    return this.workspaces.get(workspaceId, actorId);
  }
}
