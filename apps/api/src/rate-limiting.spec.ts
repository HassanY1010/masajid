import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { ContributionsPublicController } from './contributions/contributions.controller';
import { ContributionsService } from './contributions/contributions.service';
import { CloudStorageService } from './uploads/cloud-storage.service';

describe('SEC-001 Rate Limiting Runtime Verification', () => {
  let app: INestApplication;

  const mockAuthService = {
    login: jest.fn().mockImplementation((dto) => {
      if (dto.email === 'admin@masajid.app' && dto.password === 'validPassword123') {
        return { accessToken: 'valid_jwt_token', admin: { id: 'admin-1', email: dto.email } };
      }
      throw new Error('Invalid credentials');
    }),
  };

  const mockContributionsService = {
    createContribution: jest.fn().mockResolvedValue({
      id: 'contrib-123',
      amount: 100,
      shares: 10,
      status: 'PENDING',
    }),
  };

  const mockCloudStorage = {
    uploadFile: jest.fn().mockResolvedValue({ url: 'https://test.com/receipt.jpg', storageKey: 'receipts/test.jpg' }),
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: 60000,
            limit: 5, // 5 requests per minute
          },
        ]),
      ],
      controllers: [AuthController, ContributionsPublicController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ContributionsService, useValue: mockContributionsService },
        { provide: CloudStorageService, useValue: mockCloudStorage },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Allows normal requests within rate limit', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@masajid.app', password: 'validPassword123' });

    expect(res.status).toBe(200);
  });

  it('2. Throttles requests exceeding rate limit with HTTP 429 Too Many Requests', async () => {
    // Send 5 rapid requests to reach the limit
    for (let i = 0; i < 4; i++) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@masajid.app', password: 'validPassword123' });
    }

    // The 6th request must be blocked with HTTP 429
    const blockedRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@masajid.app', password: 'validPassword123' });

    expect(blockedRes.status).toBe(429);
  });
});
