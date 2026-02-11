import request from 'supertest';
import express from 'express';
import userRoutes from '../src/routes/users';
import noteRoutes from '../src/routes/notes';
import workspaceRoutes from '../src/routes/workspaces';
import { authenticateToken } from '../src/middleware/auth';

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/notes', authenticateToken, noteRoutes);
app.use('/api/workspaces', authenticateToken, workspaceRoutes);

describe('Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let workspaceId: string;
  let noteId: string;

  it('should complete full user flow: register, login, create workspace, add note', async () => {
    // Register user
    const registerResponse = await request(app)
      .post('/api/users/register')
      .send({
        email: 'integration@example.com',
        password: 'password123',
        name: 'Integration User'
      });

    expect(registerResponse.status).toBe(201);
    userId = registerResponse.body.userId;

    // Login user
    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({
        email: 'integration@example.com',
        password: 'password123'
      });

    expect(loginResponse.status).toBe(200);
    authToken = loginResponse.body.token;

    // Create workspace
    const workspaceResponse = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Integration Workspace',
        description: 'Test workspace for integration',
        ownerId: userId
      });

    expect(workspaceResponse.status).toBe(201);
    workspaceId = workspaceResponse.body._id;

    // Create note in workspace
    const noteResponse = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Integration Note',
        content: 'This is a test note for integration',
        workspaceId: workspaceId,
        authorId: userId
      });

    expect(noteResponse.status).toBe(201);
    noteId = noteResponse.body._id;

    // Get notes for workspace
    const getNotesResponse = await request(app)
      .get(`/api/notes/workspace/${workspaceId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getNotesResponse.status).toBe(200);
    expect(getNotesResponse.body.length).toBe(1);
    expect(getNotesResponse.body[0].title).toBe('Integration Note');

    // Update note
    const updateResponse = await request(app)
      .put(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Updated Integration Note',
        content: 'Updated content',
        authorId: userId
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.title).toBe('Updated Integration Note');

    // Delete note
    const deleteResponse = await request(app)
      .delete(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ authorId: userId });

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.message).toBe('Note deleted');
  });
});
