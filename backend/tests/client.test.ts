jest.mock('../models/User');
jest.mock('../models/Project');

jest.mock('../models/Client', () => {
  class MockClient {
    static findOne = jest.fn();
    static find = jest.fn();
    static countDocuments = jest.fn();
    static deleteOne = jest.fn();

    _id?: string;
    save = jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this);
    });
    toJSON = jest.fn().mockImplementation(function (this: any) {
      const { save, toJSON, toObject, ...rest } = this;
      return rest;
    });
    toObject = jest.fn().mockImplementation(function (this: any) {
      const { save, toJSON, toObject, ...rest } = this;
      return rest;
    });

    constructor(data: any) {
      Object.assign(this, data);
    }
  }

  return {
    Client: MockClient,
  };
});

import request from 'supertest';
import app from '../app';
import { Client } from '../models/Client';
import { Project } from '../models/Project';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';

describe('Client Endpoints', () => {
  let mockClient: any;
  const mockClientId = '507f1f77bcf86cd799439011';
  let token: string;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_access_secret';
    token = jwt.sign({ userId: 'mockuser123' }, process.env.JWT_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (User.findById as jest.Mock).mockResolvedValue({
      _id: 'mockuser123',
      name: 'John Doe',
      email: 'john@example.com',
    });
    mockClient = new Client({
      _id: mockClientId,
      userId: 'mockuser123',
      name: 'Acme Corp Contact',
      company: 'Acme Corp',
      email: 'contact@acme.com',
      phone: '123456789',
      address: '123 Main St',
      notes: 'Some notes',
    });
  });

  describe('POST /api/clients', () => {
    it('should create a client successfully', async () => {
      (Client.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Acme Corp Contact',
          company: 'Acme Corp',
          email: 'contact@acme.com',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('client');
      expect(res.body.client.name).toBe('Acme Corp Contact');
    });

    it('should return 400 for validation errors', async () => {
      const res = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '',
          company: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/clients', () => {
    it('should return list of clients', async () => {
      (Client.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockClient]),
          }),
        }),
      });
      (Client.countDocuments as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.clients).toHaveLength(1);
    });
  });

  describe('GET /api/clients/:id', () => {
    it('should return client details if owned', async () => {
      (Client.findOne as jest.Mock).mockResolvedValue(mockClient);

      const res = await request(app)
        .get(`/api/clients/${mockClientId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.client._id).toBe(mockClientId);
    });

    it('should return 404 if client not found', async () => {
      (Client.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/clients/${mockClientId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/clients/:id', () => {
    it('should update client successfully', async () => {
      (Client.findOne as jest.Mock).mockResolvedValue(mockClient);

      const res = await request(app)
        .put(`/api/clients/${mockClientId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Contact Name' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/clients/:id', () => {
    it('should delete client if no active projects', async () => {
      (Client.findOne as jest.Mock).mockResolvedValue(mockClient);
      (Project.countDocuments as jest.Mock).mockResolvedValue(0);
      (Client.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const res = await request(app)
        .delete(`/api/clients/${mockClientId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Client deleted successfully.');
    });

    it('should block deletion if active projects exist', async () => {
      (Client.findOne as jest.Mock).mockResolvedValue(mockClient);
      (Project.countDocuments as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .delete(`/api/clients/${mockClientId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('active projects');
    });
  });
});
