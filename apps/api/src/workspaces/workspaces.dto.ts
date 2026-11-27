import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

import { workspaceRoles, type WorkspaceRole } from './workspace-access.service';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateWorkspaceDto {
  @ApiProperty({ minLength: 1, maxLength: 150 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 150)
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
