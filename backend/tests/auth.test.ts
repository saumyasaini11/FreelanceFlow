jest.mock('../models/User');

const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => {
      return {
        verifyIdToken: mockVerifyIdToken,
      };
    }),
  };
});

import request from 'supertest';
import app from '../app';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import * as mailService from '../services/mailService';

describe('Auth Endpoints', () => {
  let mockUser: any;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_access_secret';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
    
    // Spy on email functions to bypass SMTP connections
    jest.spyOn(mailService, 'sendVerificationEmail').mockImplementation(() => Promise.resolve());
    jest.spyOn(mailService, 'sendPasswordResetEmail').mockImplementation(() => Promise.resolve());
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyIdToken.mockReset();
    mockUser = {
      _id: 'mockuser123',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedpassword',
      isEmailVerified: false,
      emailVerificationToken: 'mocktoken123',
      refreshTokens: [] as string[],
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
    };
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.prototype.save as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('check your email');
    });

    it('should return 400 for validation errors', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'invalid-email',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 409 if email already exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in successfully and return tokens', async () => {
      const findOneMock = {
        select: jest.fn().mockResolvedValue(mockUser),
      };
      (User.findOne as jest.Mock).mockReturnValue(findOneMock);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.email).toBe('john@example.com');
    });

    it('should reject with 401 for incorrect password', async () => {
      mockUser.comparePassword.mockResolvedValue(false);
      const findOneMock = {
        select: jest.fn().mockResolvedValue(mockUser),
      };
      (User.findOne as jest.Mock).mockReturnValue(findOneMock);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should reject requests without authorization token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return user details for valid token', async () => {
      const token = jwt.sign({ userId: 'mockuser123' }, process.env.JWT_SECRET || 'testsecret');
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('john@example.com');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should rotate access and refresh tokens', async () => {
      const token = jwt.sign({ userId: 'mockuser123' }, process.env.JWT_REFRESH_SECRET || 'testsecret');
      mockUser.refreshTokens.push(token);

      const selectMock = jest.fn().mockResolvedValue(mockUser);
      (User.findById as jest.Mock).mockReturnValue({
        select: selectMock,
      });

      const res = await request(app)
        .post('/api/auth/refresh-token')
        .set('Cookie', [`refreshToken=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('accessToken');
    });
  });

  describe('POST /api/auth/google', () => {
    it('should authenticate a Google ID token and return access tokens', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: 'john.google@example.com',
          name: 'John Google',
          sub: 'google123456',
          picture: 'https://avatar.url',
        }),
      });

      const selectMock = jest.fn().mockResolvedValue(mockUser);
      (User.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });

      const res = await request(app)
        .post('/api/auth/google')
        .send({ credential: 'mock_google_id_token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('accessToken');
      expect(mockVerifyIdToken).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if credential is not provided', async () => {
      const res = await request(app)
        .post('/api/auth/google')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Google credential ID token is required');
    });
  });
});
