import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto {
  @ApiProperty({
    example: 'John',
    description: "User's first name",
    required: false,
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: "User's last name",
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    example: '+1234567890',
    description: "User's phone number",
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: "User's avatar URL",
    required: false,
  })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({
    example: UserRole.REVIEWER,
    description: 'User role (REVIEWER, OWNER, ACCOUNTANT)',
    required: false,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({
    example: true,
    description: 'Whether the user is active or not',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
