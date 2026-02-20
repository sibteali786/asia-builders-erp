import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
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
  password: string;
}
