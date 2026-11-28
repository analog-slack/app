import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, Matches, Max, Min, ValidateIf } from 'class-validator';

const tokenPattern = /^[A-Za-z0-9_-]{43}$/;
const maxExpirationDays = 365;
const invitationStatuses = ['active', 'expired', 'revoked'] as const;
export type WorkspaceInvitationStatus = (typeof invitationStatuses)[number];

export class CreateWorkspaceInvitationDto {
  @ApiPropertyOptional({ type: 'integer', minimum: 1, maximum: maxExpirationDays })
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(maxExpirationDays)
  expiresInDays?: number;
}

export class AcceptWorkspaceInvitationDto {
  @ApiProperty({ pattern: tokenPattern.source, minLength: 43, maxLength: 43 })
  @IsString()
  @Matches(tokenPattern)
  token: string;
}

const previewStatuses = ['alreadyMember', ...invitationStatuses] as const;

export class WorkspaceInvitationPreviewDto {
  @ApiProperty({ enum: previewStatuses })
  status: (typeof previewStatuses)[number];

  @ApiPropertyOptional({ format: 'uuid' })
  workspaceId?: string;

  @ApiPropertyOptional()
  workspaceName?: string;
}

export class WorkspaceInvitationDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  workspaceId: string;

  @ApiProperty({ format: 'uuid' })
  invitedBy: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  expiresAt: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  revokedAt: string | null;

  @ApiProperty({ enum: invitationStatuses })
  status: WorkspaceInvitationStatus;
}

export class CreatedWorkspaceInvitationDto extends WorkspaceInvitationDto {
  @ApiProperty({ pattern: tokenPattern.source, minLength: 43, maxLength: 43 })
  token: string;
}
