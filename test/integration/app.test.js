const request = require('supertest');
const app = require('../../app'); 

describe('Testing Express App Endpoints', () => {
  describe('GET /', () => {
    it('should render the welcome page', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Welcome to Our Blog Platform!');
    });
  });

  describe('GET /signup', () => {
    it('should render the signup page', async () => {
      const res = await request(app).get('/signup');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Signup to Create and publish your own Articles');
    });
  });

  describe('GET /login', () => {
    it('should render the login page', async () => {
      const res = await request(app).get('/login');
      expect(res.status).toBe(200);
      expect(res.text).toContain('Login');
    });
  });

  describe('Middleware Error Handling', () => {
    it('should handle TokenExpiredError', async () => {
      app.use((req, res, next) => {
        const err = new Error('Token has expired');
        err.name = 'TokenExpiredError';
        next(err);
      });

      const res = await request(app).get('/');
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Your token has expired. Please log in again.');
    });

    it('should handle UnauthorizedError', async () => {
      app.use((req, res, next) => {
        const err = new Error('Invalid token');
        err.name = 'UnauthorizedError';
        next(err);
      });

      const res = await request(app).get('/');
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid token');
    });

    it('should render a 500 error for server issues', async () => {
      app.use((req, res, next) => {
        next(new Error('Server issue'));
      });

      const res = await request(app).get('/');
      expect(res.status).toBe(500);
      expect(res.text).toContain('Server error');
    });
  });
});
