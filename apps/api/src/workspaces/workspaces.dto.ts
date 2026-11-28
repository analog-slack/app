import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { WorkspaceMemberRole } from '@prisma/client';
import { IsEnum, IsString, IsUUID, Length, Matches } from 'class-validator';

import { workspaceRoles, type WorkspaceRole } from './workspace-access.service';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// PostgreSQL counts Unicode code points and rejects NUL and invalid UTF-8.
// eslint-disable-next-line no-control-regex
const NAME = /^[^\u0000\uD800-\uDFFF]{1,150}$/u;

export class CreateWorkspaceDto {
  @ApiProperty({ minLength: 1, maxLength: 150 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(NAME, { message: 'name must contain 1 to 150 valid Unicode characters without NUL' })
  name: string;

  @ApiProperty({ minLength: 1, maxLength: 150, pattern: SLUG.source })
  @IsString()
  @Length(1, 150)
  @Matches(SLUG)
  slug: string;
}

export class WorkspaceDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ format: 'uuid' })
  ownerId: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  createdAt: string | null;

  @ApiProperty({ enum: workspaceRoles })
  role: WorkspaceRole;
}

export class WorkspaceMemberDto {
  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty({ type: String, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  joinedAt: string | null;

  @ApiProperty({ enum: workspaceRoles })
  role: WorkspaceRole;
}

export class UpdateWorkspaceMemberRoleDto {
  @ApiProperty({ enum: WorkspaceMemberRole })
  @IsEnum(WorkspaceMemberRole)
  role: WorkspaceMemberRole;
}

export class TransferWorkspaceOwnershipDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId: string;
}
