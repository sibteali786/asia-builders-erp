import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendorTypeEntity } from './entities/vendor-type.entity';
import { CreateVendorTypeDto } from './dto/create-vendor-type.dto';
import { User, UserRole } from '../users/entities/user.entity';

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

  async create(
    dto: CreateVendorTypeDto,
    user: User,
  ): Promise<VendorTypeEntity> {
    if (user.role === UserRole.REVIEWER) {
      throw new ForbiddenException(
        'You do not have permission to create vendor types',
      );
    }

    const slug = dto.label.trim().toUpperCase().replace(/\s+/g, '_');
    const existing = await this.repo.findOne({ where: { slug } });
    if (existing) {
      throw new BadRequestException(
        `A vendor type named "${dto.label.trim()}" already exists`,
      );
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

  async remove(id: number, user: User): Promise<VendorTypeEntity> {
    if (user.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only owners can delete vendor types');
    }
    const type = await this.repo.findOne({ where: { id } });
    if (!type) throw new NotFoundException('Vendor type not found');
    if (type.isSystemDefined) {
      throw new BadRequestException('System-defined types cannot be deleted');
    }
    type.isActive = false;
    return this.repo.save(type);
  }
}
