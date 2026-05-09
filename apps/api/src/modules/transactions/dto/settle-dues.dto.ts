import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaymentMethod } from '../entities/transaction.entity';

export class SettleDuesDto {
  @ApiProperty({ description: 'Project ID', example: 1 })
  @IsInt()
  projectId: number;

  @ApiProperty({ description: 'Vendor ID', example: 5 })
  @IsInt()
  vendorId: number;

  @ApiProperty({
    description: 'IDs of DUE/PARTIALLY_SETTLED transactions to settle',
    example: [101, 102],
  })
  @IsArray()
  @IsInt({ each: true })
  dueTransactionIds: number[];

  @ApiProperty({ description: 'Total payment amount', example: 55000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: 'Payment date', example: '2026-05-06' })
  @IsDateString()
  transactionDate: string;

  @ApiPropertyOptional({
    description: 'Description - auto-generated if omitted',
    example: 'Payment to Malik - 3 dues',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  chequeNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  physicalFileReference?: string;
}
