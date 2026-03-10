import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
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
import {
  PaymentMethod,
  TransactionStatus,
  TransactionType,
} from '../entities/transaction.entity';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'ID of the project associated with the transaction',
    example: 123,
  })
  @IsInt()
  projectId: number;

  @ApiProperty({
    description: 'Type of the transaction',
    example: 'INCOME',
    enum: TransactionType,
  })
  @IsEnum(TransactionType)
  transactionType: TransactionType;
  @ApiProperty({
    description: 'Status of the transaction',
    example: 'PAID',
    enum: TransactionStatus,
  })
  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @ApiProperty({
    description: 'Date of the transaction in ISO format',
    example: '2024-06-01T12:00:00Z',
  })
  @IsDateString()
  transactionDate: string;

  @ApiProperty({
    description: 'Description of the transaction',
    example: 'Payment for invoice #456',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiProperty({
    description: 'Amount of the transaction',
    example: 1500.75,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({
    description: 'ID of the vendor associated with the transaction (optional)',
    example: 789,
  })
  @IsOptional()
  @IsInt()
  vendorId?: number;

  @ApiPropertyOptional({
    description:
      'ID of the category associated with the transaction (optional)',
    example: 456,
  })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Payment method used for the transaction (optional)',
    example: 'Cash',
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  @MaxLength(100)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Cheque number associated with the transaction (optional)',
    example: 'CHK123456',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  chequeNumber?: string;

  @ApiPropertyOptional({
    description:
      'Reference to the physical file associated with the transaction (optional)',
    example: 'file_123456.pdf',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  physicalFileReference?: string;

  @ApiPropertyOptional({
    description: 'Additional notes for the transaction (optional)',
    example: 'This transaction is related to project X',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
