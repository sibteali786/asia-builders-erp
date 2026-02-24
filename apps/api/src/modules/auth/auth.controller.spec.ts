import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  createMockLoginDto,
  createMockRegisterDto,
  createMockUser,
} from '../../test/fixtures/user.fixtures';
import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: jest.Mocked<Pick<AuthService, 'register' | 'login'>>;
  beforeEach(async () => {
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register()', () => {
    it('should call authService.register with the dto and return its result', async () => {
      const dto = Object.assign(new RegisterDto(), createMockRegisterDto());
      const mockUser = createMockUser();
      const expected = {
        user: { ...mockUser, projects: [], transactions: [] },
        token: 'mock.jwt.token',
      };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });
  describe('login()', () => {
    it('should call authService.login with the dto and return its result', async () => {
      const dto = Object.assign(new LoginDto(), createMockLoginDto());
      const mockUser = createMockUser();
      const expected = {
        user: { ...mockUser, projects: [], transactions: [] },
        token: 'mock.jwt.token',
      };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });

    it('should propagate UnauthorizedException from service', async () => {
      const dto = Object.assign(new LoginDto(), createMockLoginDto());
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
