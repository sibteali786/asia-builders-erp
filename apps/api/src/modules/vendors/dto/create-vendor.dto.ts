import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVendorDto {
  @ApiProperty({
    description: 'The name of the vendor',
    example: 'Acme Corporation',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Vendor type slug (must exist in vendor_types)',
    example: 'CONTRACTOR',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  vendorType: string;

  @ApiProperty({
    description: 'The contact phone number of the vendor',
    example: '123-456-7890',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @ApiProperty({
    description:
      'The contract amount / total amount for the vendor (if applicable)',
    example: 100000.0,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  contractAmount?: number;

  @ApiProperty({
    description: 'The contact person at the vendor',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactPerson?: string;

  @ApiProperty({
    description: 'The CNIC number of the vendor (if applicable)',
    example: '12345-6789012-3',
  })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  cnic?: string;

  @ApiProperty({
    description: 'The address of the vendor',
    example: '123 Main St, City, Country',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'The name of the bank where the vendor has an account',
    example: 'Bank of Example',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bankName?: string;

  @ApiProperty({
    description: 'The title of the bank account',
    example: 'Acme Corporation Account',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bankAccountTitle?: string;

  @ApiProperty({
    description: 'The number of the bank account',
    example: '1234567890',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankAccountNumber?: string;

  @ApiProperty({
    description: 'The IBAN of the bank account',
    example: 'PK36SCBL0000001123456702',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankIban?: string;

  @ApiProperty({
    description: 'Additional notes about the vendor',
    example: 'Preferred vendor for office supplies',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
