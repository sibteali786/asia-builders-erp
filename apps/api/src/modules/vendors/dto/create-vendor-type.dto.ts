import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateVendorTypeDto {
  @ApiProperty({
    description:
      'Display label for the vendor type (slug is derived from this)',
    example: 'Labour Force',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  label: string;
}
