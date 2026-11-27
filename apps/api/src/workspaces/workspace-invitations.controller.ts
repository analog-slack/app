import { AUTH_ACCESS_COOKIE } from '@app/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiGoneResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AuthErrorDto } from '../auth/auth.dto';
import {
  AcceptWorkspaceInvitationDto,
  CreateWorkspaceInvitationDto,
  CreatedWorkspaceInvitationDto,
  WorkspaceInvitationDto,
} from './workspace-invitations.dto';
import { WorkspaceInvitationsService } from './workspace-invitations.service';
import { WorkspaceActor, WorkspaceSessionGuard } from './workspace-session.guard';
import { WorkspaceDto } from './workspaces.dto';

@ApiTags('workspaces')
@ApiCookieAuth(AUTH_ACCESS_COOKIE)
@ApiUnauthorizedResponse({ type: AuthErrorDto })
@Controller('workspaces')
@UseGuards(WorkspaceSessionGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class WorkspaceInvitationsController {
  constructor(private readonly invitations: WorkspaceInvitationsService) {}

  @Post(':workspaceId/invitations')
  @Header('Cache-Control', 'no-store')
  @ApiParam({ name: 'workspaceId', schema: { type: 'string', format: 'uuid' } })
  @ApiCreatedResponse({ type: CreatedWorkspaceInvitationDto })
  @ApiBadRequestResponse({ type: AuthErrorDto })
  @ApiForbiddenResponse({ type: AuthErrorDto })
  @ApiNotFoundResponse({ type: AuthErrorDto })
  createInvitation(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @WorkspaceActor() actorId: string,
    @Body() dto: CreateWorkspaceInvitationDto,
  ) {
    return this.invitations.create(workspaceId, actorId, dto);
  }

  @Get(':workspaceId/invitations')
  @ApiParam({ name: 'workspaceId', schema: { type: 'string', format: 'uuid' } })
  @ApiOkResponse({ type: [WorkspaceInvitationDto] })
  @ApiBadRequestResponse({ type: AuthErrorDto })
  @ApiForbiddenResponse({ type: AuthErrorDto })
  @ApiNotFoundResponse({ type: AuthErrorDto })
  listInvitations(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @WorkspaceActor() actorId: string,
  ) {
    return this.invitations.list(workspaceId, actorId);
  }

  @Delete(':workspaceId/invitations/:invitationId')
  @HttpCode(204)
  @ApiParam({ name: 'workspaceId', schema: { type: 'string', format: 'uuid' } })
  @ApiParam({ name: 'invitationId', schema: { type: 'string', format: 'uuid' } })
  @ApiNoContentResponse()
  @ApiBadRequestResponse({ type: AuthErrorDto })
  @ApiForbiddenResponse({ type: AuthErrorDto })
  @ApiNotFoundResponse({ type: AuthErrorDto })
  revokeInvitation(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
    @WorkspaceActor() actorId: string,
  ) {
    return this.invitations.revoke(workspaceId, actorId, invitationId);
  }

  @Post('invitations/accept')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: WorkspaceDto })
  @ApiBadRequestResponse({ type: AuthErrorDto })
  @ApiForbiddenResponse({ type: AuthErrorDto })
  @ApiNotFoundResponse({ type: AuthErrorDto })
  @ApiGoneResponse({ type: AuthErrorDto })
  acceptInvitation(@WorkspaceActor() actorId: string, @Body() dto: AcceptWorkspaceInvitationDto) {
    return this.invitations.accept(actorId, dto.token);
  }
}
