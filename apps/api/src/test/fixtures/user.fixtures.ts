import { UserRole } from '../../modules/users/entities/user.entity';

// Partial<T> means all fields are optional — lets callers override only what they need
export const createMockUser = (
  overrides: Partial<{
    id: number;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    phone: string | null;
    avatarUrl: string | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) => ({
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
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides, // spread overrides LAST so they win
});

export const createMockRegisterDto = (overrides = {}) => ({
  email: 'test@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe',
  phone: '123456789',
  role: UserRole.REVIEWER,
  ...overrides,
});

export const createMockLoginDto = (overrides = {}) => ({
  email: 'test@example.com',
  password: 'password123',
  ...overrides,
});
