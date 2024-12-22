const request = require('supertest');
const app = require('../../app');
const userModel = require('../../models/user');
const jwt = require('jsonwebtoken');

jest.mock('../models/user');
jest.mock('jsonwebtoken'); 

describe('Auth Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /signup', () => {
    it('should return 400 if email is already in use', async () => {
      userModel.findOne.mockResolvedValue({ email: 'test@example.com' });

      const res = await request(app)
        .post('/auth/signup')
        .send({ email: 'test@example.com', password: 'password', first_name: 'John', last_name: 'Doe' });

      expect(res.status).toBe(400);
      expect(res.text).toContain('Email is already in use.');
    });

    it('should return success if user is created', async () => {
      userModel.findOne.mockResolvedValue(null);
      userModel.create.mockResolvedValue({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
      });

      const res = await request(app)
        .post('/auth/signup')
        .send({ email: 'test@example.com', password: 'password', first_name: 'John', last_name: 'Doe' });

      expect(res.status).toBe(200);
      expect(res.text).toContain('Signup successful');
    });
  });

  describe('POST /login', () => {
    it('should return 400 if credentials are missing', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: '', password: '' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Missing credentials' });
    });

    it('should return 401 if user is not found', async () => {
      userModel.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'notfound@example.com', password: 'password' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'User not found' });
    });

    it('should return 401 if password is invalid', async () => {
      userModel.findOne.mockResolvedValue({
        email: 'test@example.com',
        isValidPassword: jest.fn().mockResolvedValue(false),
      });

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Invalid credentials' });
    });

    it('should return success and set cookie on valid login', async () => {
      userModel.findOne.mockResolvedValue({
        _id: '123',
        email: 'test@example.com',
        isValidPassword: jest.fn().mockResolvedValue(true),
      });
      jwt.sign.mockReturnValue('fakeToken');

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password' });

      expect(res.status).toBe(302); // Redirect status
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('token=fakeToken');
    });
  });
});
