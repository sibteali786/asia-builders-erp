import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findAll(query: QueryUsersDto) {
    const skip =
      query?.page && query?.limit ? (query.page - 1) * query.limit : 0;

    const where: FindOptionsWhere<User> = {};

    if (query.role) where.role = query.role;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    // Build typeorm where conditions based on query parameters
    if (query.search) {
      // Search across multiple fields (requires OR condition)
      const [users, total] = await this.userRepo.findAndCount({
        where: [
          { ...where, firstName: ILike(`%${query.search}%`) },
          { ...where, lastName: ILike(`%${query.search}%`) },
          { ...where, email: ILike(`%${query.search}%`) },
        ],
        skip,
        take: query.limit,
        select: [
          'id',
          'email',
          'firstName',
          'lastName',
          'phone',
          'role',
          'isActive',
          'createdAt',
        ],
        order: { createdAt: 'DESC' },
      });
      return {
        data: users,
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / (query?.limit ?? 1)),
      };
    }

    // Normal query without search
    const [users, total] = await this.userRepo.findAndCount({
      where,
      skip,
      take: query.limit,
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'phone',
        'role',
        'isActive',
        'createdAt',
      ],
      order: { createdAt: 'DESC' },
    });

    return {
      data: users,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / (query?.limit ?? 1)),
    };
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'phone',
        'role',
        'isActive',
        'avatarUrl',
        'createdAt',
      ],
      order: { createdAt: 'DESC' },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update fields
    Object.assign(user, dto);

    await this.userRepo.save(user);

    return user;
  }

  async remove(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isActive = false;
    await this.userRepo.save(user);

    return { message: 'User deleted successfully' };
  }
}
