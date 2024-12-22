const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

describe('Article Router Endpoints', () => {
  
  let token;
  let articleId;

  // Before all tests, generate a JWT token for authentication
  beforeAll(async () => {
    // Create a user and login to get the token (mock if needed)
    const user = {
      _id: mongoose.Types.ObjectId(),
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com"
    };

    // Mock JWT Token
    token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  // Test the "/published" endpoint
  it('should get all published articles', async () => {
    const res = await request(app)
      .get('/blogs/published')
      .query({ page: 1, sort: 'timestamp', order: 'desc', search: '' });

    expect(res.status).toBe(200);
    expect(res.text).toContain('publishedArticles'); // Ensure the page is rendered
  });

  // Test the "/blogger" endpoint
  it('should get logged-on user welcome page', async () => {
    const res = await request(app)
      .get('/blogs/blogger')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain('Login Successful');
  });

  // Test "/my-articles" endpoint
  it('should get list of articles for an author', async () => {
    const res = await request(app)
      .get('/blogs/my-articles')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, state: 'published' });

    expect(res.status).toBe(200);
    expect(res.text).toContain('my-articles');
  });

  // Test the "/createArticle" endpoint
  it('should render create article page', async () => {
    const res = await request(app)
      .get('/blogs/createArticle')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain('createArticle');
  });

  // Test the "/:id" endpoint to get a specific blog by ID
  it('should get a blog by ID', async () => {
    articleId = mongoose.Types.ObjectId(); // Generate a dummy article ID

    const res = await request(app)
      .get(`/blogs/${articleId}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain('blog');
  });

  // Test "/:id/updateArticle" endpoint
  it('should render edit article page if user is the author', async () => {
    const res = await request(app)
      .get(`/blogs/${articleId}/updateArticle`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.text).toContain('updateArticle');
  });

  // Test the POST "/create" endpoint to create a new article
  it('should create a new article', async () => {
    const newArticle = {
      title: 'New Article',
      description: 'Article description',
      body: 'Article body',
      tags: ['tag1', 'tag2'],
      state: 'published'
    };

    const res = await request(app)
      .post('/blogs/create')
      .set('Authorization', `Bearer ${token}`)
      .send(newArticle);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Article created Successfully');
  });

  // Test the PUT "/:id/update" endpoint to update an article
  it('should update an existing article', async () => {
    const updates = { title: 'Updated Title' };

    const res = await request(app)
      .put(`/blogs/${articleId}/update`)
      .send(updates);

    expect(res.status).toBe(200);
    expect(res.text).toContain('Article updated successfully');
  });

  // Test the DELETE "/:id" endpoint to delete an article
  it('should delete an article', async () => {
    const res = await request(app)
      .delete(`/blogs/${articleId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Article deleted successfully');
  });
});
