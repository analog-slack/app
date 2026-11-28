import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
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
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AuthErrorDto } from '../auth/auth.dto';
import { WorkspaceActor, WorkspaceSessionGuard } from './workspace-session.guard';
import {
  CreateWorkspaceDto,
  TransferWorkspaceOwnershipDto,
  UpdateWorkspaceMemberRoleDto,
  WorkspaceDto,
  WorkspaceMemberDto,
} from './workspaces.dto';
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
  @ApiParam({ name: 'workspaceId', schema: { type: 'string', format: 'uuid' } })
  @ApiOkResponse({ type: WorkspaceDto })
  @ApiBadRequestResponse({ type: AuthErrorDto })
  @ApiNotFoundResponse({ type: AuthErrorDto })
  get(@Param('workspaceId', ParseUUIDPipe) workspaceId: string, @WorkspaceActor() actorId: string) {
    return this.workspaces.get(workspaceId, actorId);
  }

  @Get(':workspaceId/members')
  @ApiParam({ name: 'workspaceId', schema: { type: 'string', format: 'uuid' } })
  @ApiOkResponse({ type: [WorkspaceMemberDto] })
  @ApiBadRequestResponse({ type: AuthErrorDto })
  @ApiNotFoundResponse({ type: AuthErrorDto })
  listMembers(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @WorkspaceActor() actorId: string,
  ) {
    return this.workspaces.listMembers(workspaceId, actorId);
  }

  @Patch(':workspaceId/members/:userId')
  @ApiParam({ name: 'workspaceId', schema: { type: 'string', format: 'uuid' } })
  @ApiParam({ name: 'userId', schema: { type: 'string', format: 'uuid' } })
  @ApiOkResponse({ type: WorkspaceMemberDto })
  @ApiBadRequestResponse({ type: AuthErrorDto })
  @ApiNotFoundResponse({ type: AuthErrorDto })
  @ApiForbiddenResponse({ type: AuthErrorDto })
  @ApiConflictResponse({ type: AuthErrorDto })
  updateMemberRole(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @WorkspaceActor() actorId: string,
    @Body() dto: UpdateWorkspaceMemberRoleDto,
  ) {
    return this.workspaces.updateMemberRole(workspaceId, actorId, userId, dto.role);
  }

  @Delete(':workspaceId/members/:userId')
  @HttpCode(204)
  @ApiParam({ name: 'workspaceId', schema: { type: 'string', format: 'uuid' } })
  @ApiParam({ name: 'userId', schema: { type: 'string', format: 'uuid' } })
  @ApiNoContentResponse()
  @ApiBadRequestResponse({ type: AuthErrorDto })
  @ApiNotFoundResponse({ type: AuthErrorDto })
  @ApiForbiddenResponse({ type: AuthErrorDto })
  @ApiConflictResponse({ type: AuthErrorDto })
  removeMember(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @WorkspaceActor() actorId: string,
  ) {
    return this.workspaces.removeMember(workspaceId, actorId, userId);
  }

  @Post(':workspaceId/ownership/transfer')
  @HttpCode(200)
  @ApiParam({ name: 'workspaceId', schema: { type: 'string', format: 'uuid' } })
  @ApiOkResponse({ type: WorkspaceDto })
  @ApiBadRequestResponse({ type: AuthErrorDto })
  @ApiNotFoundResponse({ type: AuthErrorDto })
  @ApiForbiddenResponse({ type: AuthErrorDto })
  @ApiConflictResponse({ type: AuthErrorDto })
  transferOwnership(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @WorkspaceActor() actorId: string,
    @Body() dto: TransferWorkspaceOwnershipDto,
  ) {
    return this.workspaces.transferOwnership(workspaceId, actorId, dto.userId);
  }
}
