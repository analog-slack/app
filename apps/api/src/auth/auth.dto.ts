import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Length, MaxLength } from 'class-validator';

function trim({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

export class LoginDto {
  @ApiProperty({ format: 'email', maxLength: 255 })
  @Transform(trim)
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ format: 'password', minLength: 1, maxLength: 128 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}

export class RegisterDto extends LoginDto {
  @ApiProperty({ minLength: 1, maxLength: 100 })
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  username: string;

  @ApiProperty({ format: 'password', minLength: 8, maxLength: 128 })
  @Length(8, 128)
  declare password: string;
}

export class AuthUserDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'email' })
  email: string;

  @ApiProperty()
  username: string;

  @ApiProperty({ type: String, nullable: true })
  avatarUrl: string | null;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}

export class AuthErrorDto {
  @ApiProperty()
  statusCode: number;

  @ApiPropertyOptional({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message?: string | string[];
}
