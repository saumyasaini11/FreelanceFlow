jest.mock('../models/User');

jest.mock('../models/Project', () => {
  const { ProjectStatus } = jest.requireActual('../models/Project');
  class MockProject {
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
    Project: MockProject,
    ProjectStatus,
  };
});

jest.mock('../models/Client', () => {
  class MockClient {
    static findOne = jest.fn();
  }
  return {
    Client: MockClient,
  };
});

import request from 'supertest';
import app from '../app';
import { Project } from '../models/Project';
import { Client } from '../models/Client';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';

describe('Project Endpoints', () => {
  let mockProject: any;
  let mockClient: any;
  const mockProjectId = '507f1f77bcf86cd799439012';
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
    mockClient = {
      _id: mockClientId,
      userId: 'mockuser123',
      name: 'Acme Corp Contact',
      company: 'Acme Corp',
    };
    mockProject = new Project({
      _id: mockProjectId,
      userId: 'mockuser123',
      clientId: mockClientId,
      name: 'Website Redesign',
      description: 'Redesign client corporate website',
      budget: 5000,
      hourlyRate: 75,
      deadline: new Date('2026-12-31'),
      status: 'Not Started',
      progress: 0,
      deliverables: ['Design mockup', 'Deploy homepage'],
    });
  });

  describe('POST /api/projects', () => {
    it('should create a project successfully', async () => {
      (Client.findOne as jest.Mock).mockResolvedValue(mockClient);

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          clientId: mockClientId,
          name: 'Website Redesign',
          budget: 5000,
          hourlyRate: 75,
          deadline: '2026-12-31T00:00:00.000Z',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('project');
      expect(res.body.project.name).toBe('Website Redesign');
    });

    it('should return 404 if client not found or unauthorized', async () => {
      (Client.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          clientId: mockClientId,
          name: 'Website Redesign',
          budget: 5000,
          hourlyRate: 75,
          deadline: '2026-12-31T00:00:00.000Z',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('client not found');
    });

    it('should return 400 for validation errors', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '',
          budget: -100,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/projects', () => {
    it('should return list of user projects', async () => {
      (Project.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockProject]),
            }),
          }),
        }),
      });
      (Project.countDocuments as jest.Mock).mockResolvedValue(1);

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.projects).toHaveLength(1);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return project details if owned', async () => {
      (Project.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProject),
      });

      const res = await request(app)
        .get(`/api/projects/${mockProjectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.project._id).toBe(mockProjectId);
    });

    it('should return 404 if project not found', async () => {
      (Project.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .get(`/api/projects/${mockProjectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update project successfully', async () => {
      (Project.findOne as jest.Mock).mockResolvedValue(mockProject);

      const res = await request(app)
        .put(`/api/projects/${mockProjectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Website V2 Development', progress: 50 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete project successfully', async () => {
      (Project.findOne as jest.Mock).mockResolvedValue(mockProject);
      (Project.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const res = await request(app)
        .delete(`/api/projects/${mockProjectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
