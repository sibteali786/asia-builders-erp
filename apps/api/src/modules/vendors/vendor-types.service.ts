import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendorTypeEntity } from './entities/vendor-type.entity';
import { CreateVendorTypeDto } from './dto/create-vendor-type.dto';

@Injectable()
export class VendorTypesService {
  constructor(
    @InjectRepository(VendorTypeEntity)
    private readonly repo: Repository<VendorTypeEntity>,
  ) {}

  findAll(): Promise<VendorTypeEntity[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { isSystemDefined: 'DESC', label: 'ASC' },
    });
  }

  async create(dto: CreateVendorTypeDto): Promise<VendorTypeEntity> {
    const slug = dto.label.trim().toUpperCase().replace(/\s+/g, '_');
    const existing = await this.repo.findOne({ where: { slug } });

    if (existing) {
      if (existing.isActive) {
        throw new BadRequestException(
          `A vendor type named "${dto.label.trim()}" already exists`,
        );
      }
      // Reactivate soft-deleted type — preserves isContractor and isSystemDefined
      existing.isActive = true;
      return this.repo.save(existing);
    }

    return this.repo.save(
      this.repo.create({
        slug,
        label: dto.label.trim(),
        isContractor: false,
        isSystemDefined: false,
      }),
    );
  }

  async remove(id: number): Promise<VendorTypeEntity> {
    const type = await this.repo.findOne({ where: { id } });
    if (!type) throw new NotFoundException('Vendor type not found');
    if (type.isSystemDefined) {
      throw new BadRequestException('System-defined types cannot be deleted');
    }
    type.isActive = false;
    return this.repo.save(type);
  }
}
