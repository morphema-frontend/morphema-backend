import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import request from 'supertest';

import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('AuthController (http)', () => {
  let app: INestApplication;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    logoutAll: jest.fn(),
    me: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('login missing fields => 400', async () => {
    authService.login.mockImplementationOnce(() => {
      throw new BadRequestException({
        message: 'Email and password are required',
        code: 'BAD_REQUEST',
      });
    });

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: '', password: '' })
      .expect(400);
  });

  it('login wrong credentials => 401', async () => {
    authService.login.mockImplementationOnce(() => {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        code: 'AUTH_INVALID',
      });
    });

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'wrong' })
      .expect(401);
  });

  it('login passwordHash null => 401', async () => {
    authService.login.mockImplementationOnce(() => {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        code: 'AUTH_INVALID',
      });
    });

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'Password123!' })
      .expect(401);
  });

  it('register nuovo => 201', async () => {
    authService.register.mockResolvedValueOnce({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: 1, email: 'new@example.com', role: 'worker' },
    });

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'new@example.com', password: 'Password123!', role: 'worker' })
      .expect(201);
  });

  it('register email già esistente => 409', async () => {
    authService.register.mockImplementationOnce(() => {
      throw new ConflictException({
        message: 'Account already exists',
        code: 'AUTH_EXISTS',
      });
    });

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'existing@example.com', password: 'Password123!', role: 'worker' })
      .expect(409);
  });
});
