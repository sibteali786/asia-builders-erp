import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateMyProfileDto {
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
}
