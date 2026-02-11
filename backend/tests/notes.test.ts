import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import noteRoutes from '../src/routes/notes';
import User from '../src/models/User';
import Workspace from '../src/models/Workspace';
import { authenticateToken } from '../src/middleware/auth';

// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret';

const app = express();
app.use(express.json());
app.use('/api/notes', authenticateToken, noteRoutes);

describe('Notes API', () => {
  let testUser: any;
  let testWorkspace: any;
  let authToken: string;

  beforeEach(async () => {
    // Create test user
    testUser = new User({
      email: 'test@example.com',
      password: 'hashedpassword',
      name: 'Test User',
      role: 'viewer'
    });
    await testUser.save();

    // Create test workspace
    testWorkspace = new Workspace({
      name: 'Test Workspace',
      description: 'A test workspace',
      owner: testUser._id.toString(),
      members: [{ userId: testUser._id.toString(), role: 'viewer' }]
    });
    await testWorkspace.save();

    // Generate auth token
    authToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET || 'secret');
  });

  describe('POST /api/notes', () => {
    it('should create a new note', async () => {
      const noteData = {
        title: 'Test Note',
        content: 'This is a test note',
        workspaceId: testWorkspace._id.toString(),
        authorId: testUser._id.toString()
      };

      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(noteData.title);
      expect(response.body.content).toBe(noteData.content);
      expect(response.body.workspaceId).toBe(noteData.workspaceId);
    });
  });

  describe('GET /api/notes/workspace/:workspaceId', () => {
    it('should get notes for a workspace', async () => {
      // First create a note
      const noteData = {
        title: 'Test Note',
        content: 'This is a test note',
        workspaceId: testWorkspace._id.toString(),
        authorId: testUser._id.toString()
      };
      const note = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData);

      const response = await request(app)
        .get(`/api/notes/workspace/${testWorkspace._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('should update a note', async () => {
      // Create a note first
      const noteData = {
        title: 'Original Title',
        content: 'Original content',
        workspaceId: testWorkspace._id.toString(),
        authorId: testUser._id.toString()
      };
      const createResponse = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData);

      const noteId = createResponse.body._id;
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
        authorId: testUser._id.toString()
      };

      const response = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.content).toBe(updateData.content);
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('should delete a note', async () => {
      // Create a note first
      const noteData = {
        title: 'Note to Delete',
        content: 'This will be deleted',
        workspaceId: testWorkspace._id.toString(),
        authorId: testUser._id.toString()
      };
      const createResponse = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData);

      const noteId = createResponse.body._id;

      const response = await request(app)
        .delete(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ authorId: testUser._id.toString() });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Note deleted');
    });
  });
});
