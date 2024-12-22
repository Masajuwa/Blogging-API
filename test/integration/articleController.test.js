const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const articleModel = require('../../models/blog'); // Article model
const userModel = require('../../models/user'); // User model

let mongoServer;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Article Controller Tests', () => {
  let userToken;
  let userId;

  beforeEach(async () => {
    // Clear collections before each test
    await articleModel.deleteMany({});
    await userModel.deleteMany({});

    // Create a mock user
    const user = await userModel.create({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
    });
    userId = user._id;

    // Mock JWT token
    userToken = `Bearer ${require('jsonwebtoken').sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )}`;
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('GET /blogs', () => {
    it('should fetch all published articles', async () => {
      // Seed articles
      await articleModel.create([
        { title: 'Article 1', state: 'published', author: userId },
        { title: 'Article 2', state: 'draft', author: userId },
      ]);

      const res = await request(app).get('/blogs').query({ state: 'published' });
      expect(res.status).toBe(200);
      expect(res.body.blogs).toHaveLength(1);
      expect(res.body.blogs[0].title).toBe('Article 1');
    });
  });

  describe('POST /blogs', () => {
    it('should create a new article', async () => {
      const articleData = {
        title: 'New Article',
        description: 'A short description',
        body: 'The body of the article',
        tags: ['tag1', 'tag2'],
      };

      const res = await request(app)
        .post('/blogs')
        .set('Authorization', userToken)
        .send(articleData);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Article created Successfully');
    });
  });

  describe('GET /blogs/:id', () => {
    it('should fetch a blog by ID', async () => {
      const article = await articleModel.create({
        title: 'Existing Article',
        state: 'published',
        author: userId,
      });

      const res = await request(app).get(`/blogs/${article._id}`);
      expect(res.status).toBe(200);
      expect(res.body.blog.title).toBe('Existing Article');
    });

    it('should return 404 for a non-existent blog', async () => {
      const nonExistentId = mongoose.Types.ObjectId();
      const res = await request(app).get(`/blogs/${nonExistentId}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Blog not found.');
    });
  });

  describe('PUT /blogs/:id', () => {
    it('should update an article', async () => {
      const article = await articleModel.create({
        title: 'Old Title',
        state: 'draft',
        author: userId,
      });

      const updatedData = { title: 'Updated Title', state: 'published' };

      const res = await request(app)
        .put(`/blogs/${article._id}`)
        .set('Authorization', userToken)
        .send(updatedData);

      expect(res.status).toBe(200);
      expect(res.body.blog.title).toBe('Updated Title');
      expect(res.body.blog.state).toBe('published');
    });
  });

  describe('DELETE /blogs/:id', () => {
    it('should delete an article', async () => {
      const article = await articleModel.create({
        title: 'To Be Deleted',
        state: 'draft',
        author: userId,
      });

      const res = await request(app)
        .delete(`/blogs/${article._id}`)
        .set('Authorization', userToken);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Article deleted successfully');
    });

    it('should return 404 if the article does not exist', async () => {
      const nonExistentId = mongoose.Types.ObjectId();
      const res = await request(app).delete(`/blogs/${nonExistentId}`).set('Authorization', userToken);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Article not found');
    });
  });
});
