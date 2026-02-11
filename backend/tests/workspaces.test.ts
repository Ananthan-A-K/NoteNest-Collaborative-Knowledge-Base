import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import workspaceRoutes from '../src/routes/workspaces';
import User from '../src/models/User';
import Workspace from '../src/models/Workspace';
import { authenticateToken } from '../src/middleware/auth';

// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret';

const app = express();
app.use(express.json());
app.use('/api/workspaces', authenticateToken, workspaceRoutes);

describe('Workspace API', () => {
  let testUser: any;
  let testWorkspace: any;
  let authToken: string;
  let anotherUser: any;
  let anotherToken: string;

  beforeEach(async () => {
    // Create test user
    testUser = new User({
      email: 'test@example.com',
      password: 'hashedpassword',
      name: 'Test User',
      role: 'viewer'
    });
    await testUser.save();

    // Create another user for member tests
    anotherUser = new User({
      email: 'another@example.com',
      password: 'hashedpassword',
      name: 'Another User',
      role: 'viewer'
    });
    await anotherUser.save();

    // Create test workspace
    testWorkspace = new Workspace({
      name: 'Test Workspace',
      description: 'A test workspace',
      owner: testUser._id.toString(),
      members: [{ userId: testUser._id.toString(), role: 'admin' }]
    });
    await testWorkspace.save();

    // Generate auth tokens
    authToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET || 'secret');
    anotherToken = jwt.sign({ userId: anotherUser._id }, process.env.JWT_SECRET || 'secret');
  });

  describe('GET /api/workspaces/user/:userId', () => {
    it('should get workspaces for a user', async () => {
      const response = await request(app)
        .get(`/api/workspaces/user/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].name).toBe('Test Workspace');
    });
  });

  describe('POST /api/workspaces', () => {
    it('should create a new workspace', async () => {
      const workspaceData = {
        name: 'New Workspace',
        description: 'A new test workspace',
        ownerId: testUser._id.toString()
      };

      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workspaceData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(workspaceData.name);
      expect(response.body.owner).toBe(workspaceData.ownerId);
    });
  });

  describe('POST /api/workspaces/:id/members', () => {
    it('should add a member to workspace', async () => {
      const memberData = {
        userId: anotherUser._id.toString(),
        role: 'editor',
        addedBy: testUser._id.toString()
      };

      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(memberData);

      expect(response.status).toBe(200);
      expect(response.body.members).toContainEqual(
        expect.objectContaining({ userId: memberData.userId, role: memberData.role })
      );
    });

    it('should not add existing member', async () => {
      const memberData = {
        userId: testUser._id.toString(),
        role: 'viewer',
        addedBy: testUser._id.toString()
      };

      const response = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(memberData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User is already a member');
    });
  });

  describe('PUT /api/workspaces/:id/members/:userId', () => {
    beforeEach(async () => {
      // Add another user as member
      testWorkspace.members.push({ userId: anotherUser._id.toString(), role: 'viewer' });
      await testWorkspace.save();
    });

    it('should update member role', async () => {
      const updateData = { role: 'editor' };

      const response = await request(app)
        .put(`/api/workspaces/${testWorkspace._id}/members/${anotherUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      const updatedMember = response.body.members.find((m: any) => m.userId === anotherUser._id.toString());
      expect(updatedMember.role).toBe('editor');
    });

    it('should deny access to non-admin', async () => {
      const response = await request(app)
        .put(`/api/workspaces/${testWorkspace._id}/members/${testUser._id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ role: 'admin' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });
  });

  describe('DELETE /api/workspaces/:id/members/:userId', () => {
    beforeEach(async () => {
      // Add another user as member
      testWorkspace.members.push({ userId: anotherUser._id.toString(), role: 'viewer' });
      await testWorkspace.save();
    });

    it('should remove member from workspace', async () => {
      const response = await request(app)
        .delete(`/api/workspaces/${testWorkspace._id}/members/${anotherUser._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.members).not.toContainEqual(
        expect.objectContaining({ userId: anotherUser._id.toString() })
      );
    });

    it('should deny access to non-admin', async () => {
      const response = await request(app)
        .delete(`/api/workspaces/${testWorkspace._id}/members/${testUser._id}`)
        .set('Authorization', `Bearer ${anotherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });
  });

  describe('GET /api/workspaces/:id/audit-logs', () => {
    it('should get audit logs for workspace as admin', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/audit-logs`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should deny access to non-member', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/audit-logs`)
        .set('Authorization', `Bearer ${anotherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
    });
  });
});
