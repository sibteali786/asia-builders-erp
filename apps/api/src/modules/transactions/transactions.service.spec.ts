import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity';
import { Project } from '../projects/entities/project.entity';
import { Vendor } from '../vendors/entities/vendor.entity';
import { TransactionCategory } from './entities/transaction-category.entity';
import { DataSource, Repository } from 'typeorm';
import { Document } from '../documents/entities/document.entity';
import { TransactionSettlement } from './entities/transaction-settlement.entity';

describe('TransactionsService', () => {
  let service: TransactionsService;

  const mockDataSource: Pick<DataSource, 'transaction'> = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Project),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Vendor),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(TransactionCategory),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Document),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(TransactionSettlement),
          useClass: Repository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource as DataSource,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
