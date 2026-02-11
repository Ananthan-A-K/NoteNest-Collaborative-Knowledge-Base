import request from 'supertest';
import express from 'express';
import userRoutes from '../src/routes/users';
import { authenticateToken } from '../src/middleware/auth';

// Set test environment variables
process.env.JWT_SECRET = 'test-jwt-secret';

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('Authentication', () => {
  describe('POST /api/users/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('userId');
      expect(response.body.message).toBe('User created');
    });

    it('should not register user with existing email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User'
      };

      // Register first time
      await request(app)
        .post('/api/users/register')
        .send(userData);

      // Try to register again
      const response = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(response.status).toBe(500); // Assuming duplicate email causes error
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      // Register a user for login tests
      await request(app)
        .post('/api/users/register')
        .send({
          email: 'loginuser@example.com',
          password: 'password123',
          name: 'Login User'
        });
    });

    it('should login with correct credentials', async () => {
      const loginData = {
        email: 'loginuser@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginData.email);
    });

    it('should not login with incorrect password', async () => {
      const loginData = {
        email: 'loginuser@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('authenticateToken middleware', () => {
    it('should allow access with valid token', async () => {
      // First register and login to get token
      await request(app)
        .post('/api/users/register')
        .send({
          email: 'authtest@example.com',
          password: 'password123',
          name: 'Auth Test'
        });

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: 'authtest@example.com',
          password: 'password123'
        });

      const token = loginResponse.body.token;

      // Create a test route that requires authentication
      const testApp = express();
      testApp.use(express.json());
      testApp.get('/protected', authenticateToken, (req, res) => {
        res.json({ message: 'Access granted' });
      });

      const response = await request(testApp)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Access granted');
    });

    it('should deny access without token', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.get('/protected', authenticateToken, (req, res) => {
        res.json({ message: 'Access granted' });
      });

      const response = await request(testApp)
        .get('/protected');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });
  });
});
