import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Investment } from './entities/investment.entity';
import { InvestmentValueUpdate } from './entities/investment-value-update.entity';
import { Project } from '../projects/entities/project.entity';
import { InvestmentsController } from './investments.controller';
import { InvestmentsService } from './investments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Investment, InvestmentValueUpdate, Project]),
  ],
  controllers: [InvestmentsController],
  providers: [InvestmentsService],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}
