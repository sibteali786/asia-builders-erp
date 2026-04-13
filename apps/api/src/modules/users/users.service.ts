import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { StorageService } from '../../common/storage/storage.service';

const AVATAR_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private readonly storageService: StorageService,
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

    return this.withAvatarSignedUrl(user);
  }

  async getMe(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
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
        'updatedAt',
      ],
    });
    if (!user) throw new NotFoundException('User not found');
    return this.withAvatarSignedUrl(user);
  }

  async updateMe(userId: number, dto: UpdateMyProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    Object.assign(user, dto);
    await this.userRepo.save(user);
    return this.withAvatarSignedUrl(user);
  }

  async uploadAvatar(userId: number, file: Express.Multer.File) {
    if (!AVATAR_ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'File type not allowed. Allowed: JPG, PNG, WEBP',
      );
    }
    if (file.size > AVATAR_MAX_FILE_SIZE) {
      throw new BadRequestException('File too large. Max size is 5MB');
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const oldAvatarPath = user.avatarUrl;
    const uploaded = await this.storageService.upload(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    try {
      user.avatarUrl = uploaded.filePath;
      await this.userRepo.save(user);
    } catch (error) {
      await this.storageService.delete(uploaded.filePath);
      throw new InternalServerErrorException(
        'Profile picture save failed, upload has been rolled back' +
          (error instanceof Error ? error.message : 'Unknown error'),
      );
    }

    if (oldAvatarPath && oldAvatarPath !== uploaded.filePath) {
      await this.storageService.delete(oldAvatarPath);
    }

    return this.withAvatarSignedUrl(user);
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update fields
    Object.assign(user, dto);

    await this.userRepo.save(user);

    return this.withAvatarSignedUrl(user);
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

  private async withAvatarSignedUrl(user: User) {
    if (!user.avatarUrl) return user;
    if (
      user.avatarUrl.startsWith('http://') ||
      user.avatarUrl.startsWith('https://')
    ) {
      return user;
    }

    try {
      const signedUrl = await this.storageService.getSignedUrl(user.avatarUrl);
      return { ...user, avatarUrl: signedUrl };
    } catch {
      return user;
    }
  }
}
