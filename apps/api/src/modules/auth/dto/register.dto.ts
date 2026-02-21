import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'abc@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'P@ssw0rd!',
    description: 'User password (min 8 characters)',
  })
  @IsString()
  @MinLength(8)
  password: string;
  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsString()
  firstName: string;
  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  @IsString()
  lastName: string;
  @ApiProperty({
    example: '+1234567890',
    description: 'User phone number (optional)',
  })
  @IsString()
  phone?: string;
  @ApiProperty({
    example: UserRole.REVIEWER,
    description: 'User role (REVIEWER, OWNER, ACCOUNTANT)',
  })
  @IsEnum(UserRole)
  role: UserRole;
}
