/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/modules/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { BCRYPT_TOKEN } from '../../common/imports/types';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepo: any;
  let mockJwtService: any;
  let mockBcrypt: any;

  // Test fixtures
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    passwordHash: '$2b$10$hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.REVIEWER,
    isActive: true,
    phone: null,
    avatarUrl: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRegisterDto = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '123456789',
    role: UserRole.REVIEWER,
  };

  beforeEach(async () => {
    mockUserRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn(),
    };

    mockBcrypt = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: BCRYPT_TOKEN,
          useValue: mockBcrypt,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register()', () => {
    it('should successfully register a new user', async () => {
      // ARRANGE
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue(mockUser);
      mockUserRepo.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock.jwt.token');

      // Use jest.spyOn with mockBcrypt
      const hashSpy = jest
        .spyOn(mockBcrypt, 'hash')
        .mockResolvedValue('$2b$10$hashedPassword');

      // ACT
      const result = await service.register(mockRegisterDto);

      // ASSERT
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { email: mockRegisterDto.email },
      });
      expect(mockUserRepo.findOne).toHaveBeenCalledTimes(1);

      // Assert using spy
      expect(hashSpy).toHaveBeenCalledWith(mockRegisterDto.password, 10);
      expect(hashSpy).toHaveBeenCalledTimes(1);

      expect(mockUserRepo.create).toHaveBeenCalledWith({
        email: mockRegisterDto.email,
        passwordHash: '$2b$10$hashedPassword',
        firstName: mockRegisterDto.firstName,
        lastName: mockRegisterDto.lastName,
        phone: mockRegisterDto.phone,
        role: mockRegisterDto.role,
      });

      expect(mockUserRepo.save).toHaveBeenCalledWith(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.token).toBe('mock.jwt.token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException if email already exists', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        'Email already registered',
      );

      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });

    it('should hash the password before saving', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserRepo.create.mockReturnValue(mockUser);
      mockUserRepo.save.mockResolvedValue(mockUser);

      const hashSpy = jest
        .spyOn(mockBcrypt, 'hash')
        .mockResolvedValue('$2b$10$hashedPassword');

      await service.register(mockRegisterDto);

      expect(hashSpy).toHaveBeenCalledWith(mockRegisterDto.password, 10);
      expect(mockUserRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: '$2b$10$hashedPassword',
        }),
      );
    });
  });

  describe('login()', () => {
    const mockLoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      const compareSpy = jest
        .spyOn(mockBcrypt, 'compare')
        .mockResolvedValue(true);

      mockUserRepo.save.mockResolvedValue({
        ...mockUser,
        lastLoginAt: expect.any(Date),
      });
      mockJwtService.sign.mockReturnValue('mock.jwt.token');

      const result = await service.login(mockLoginDto);

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { email: mockLoginDto.email },
      });

      expect(compareSpy).toHaveBeenCalledWith(
        mockLoginDto.password,
        mockUser.passwordHash,
      );

      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(mockLoginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      jest.spyOn(mockBcrypt, 'compare').mockResolvedValue(false);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepo.save).not.toHaveBeenCalled();
    });

    it('should update lastLoginAt timestamp', async () => {
      const beforeLogin = new Date();
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      jest.spyOn(mockBcrypt, 'compare').mockResolvedValue(true);

      let savedUser: any;
      mockUserRepo.save.mockImplementation((user: any) => {
        savedUser = user;
        return Promise.resolve(user);
      });

      mockJwtService.sign.mockReturnValue('mock.jwt.token');

      await service.login(mockLoginDto);

      expect(savedUser.lastLoginAt).toBeInstanceOf(Date);
      expect(savedUser.lastLoginAt.getTime()).toBeGreaterThanOrEqual(
        beforeLogin.getTime(),
      );
    });
  });

  describe('validateUser()', () => {
    it('should return user when valid ID is provided', async () => {
      const userWithoutPassword = { ...mockUser };
      delete (userWithoutPassword as any).passwordHash;

      mockUserRepo.findOne.mockResolvedValue(userWithoutPassword);

      const result = await service.validateUser(mockUser.id);

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: [
          'id',
          'email',
          'firstName',
          'lastName',
          'phone',
          'role',
          'avatarUrl',
          'createdAt',
          'updatedAt',
        ],
      });
      expect(result).toEqual(userWithoutPassword);
    });

    it('should return null when user does not exist', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      const result = await service.validateUser(999);

      expect(result).toBeNull();
    });
  });
});
