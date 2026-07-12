import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// In-memory data store
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
];

let posts = [
  { id: 1, title: 'First Post', content: 'This is the first post', authorId: 1 },
  { id: 2, title: 'Second Post', content: 'This is the second post', authorId: 2 }
];

let requestCount = 0;

// GET /users - Get all users
app.get('/users', (req, res) => {
  requestCount++;
  console.log(`GET /users - Request #${requestCount}`);
  res.json(users);
});

// GET /users/:id - Get user by ID
app.get('/users/:id', (req, res) => {
  requestCount++;
  console.log(`GET /users/:id - Request #${requestCount}`);
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// POST /users - Create user
app.post('/users', (req, res) => {
  requestCount++;
  console.log(`POST /users - Request #${requestCount}`);
  const newUser = {
    id: users.length + 1,
    ...req.body
  };
  users.push(newUser);
  res.status(201).json(newUser);
});

// PUT /users/:id - Update user
app.put('/users/:id', (req, res) => {
  requestCount++;
  console.log(`PUT /users/:id - Request #${requestCount}`);
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  if (index !== -1) {
    users[index] = { ...users[index], ...req.body };
    res.json(users[index]);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// PATCH /users/:id - Partially update user
app.patch('/users/:id', (req, res) => {
  requestCount++;
  console.log(`PATCH /users/:id - Request #${requestCount}`);
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  if (index !== -1) {
    users[index] = { ...users[index], ...req.body };
    res.json(users[index]);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// DELETE /users/:id - Delete user
app.delete('/users/:id', (req, res) => {
  requestCount++;
  console.log(`DELETE /users/:id - Request #${requestCount}`);
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  if (index !== -1) {
    users.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// GET /posts - Get all posts with pagination
app.get('/posts', (req, res) => {
  requestCount++;
  const page = parseInt(req.query.page) || 0;
  const limit = 2;
  const start = page * limit;
  const paginatedPosts = posts.slice(start, start + limit);
  
  console.log(`GET /posts?page=${page} - Request #${requestCount}`);
  res.json({
    data: paginatedPosts,
    hasMore: start + limit < posts.length,
    page,
    total: posts.length
  });
});

// GET /slow - Slow endpoint for testing timeout/retry
app.get('/slow', (req, res) => {
  requestCount++;
  console.log(`GET /slow - Request #${requestCount}`);
  setTimeout(() => {
    res.json({ message: 'Slow response' });
  }, 3000);
});

// GET /error - Error endpoint for testing error handling
app.get('/error', (req, res) => {
  requestCount++;
  console.log(`GET /error - Request #${requestCount}`);
  res.status(500).json({ error: 'Internal server error' });
});

// GET /unauthorized - 401 endpoint for testing auth
app.get('/unauthorized', (req, res) => {
  requestCount++;
  console.log(`GET /unauthorized - Request #${requestCount}`);
  res.status(401).json({ error: 'Unauthorized' });
});

// POST /auth/login - Login endpoint
app.post('/auth/login', (req, res) => {
  requestCount++;
  console.log(`POST /auth/login - Request #${requestCount}`);
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password') {
    res.json({ token: 'mock-jwt-token', user: { id: 1, name: 'Admin' } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// GET /stats - Get request statistics
app.get('/stats', (req, res) => {
  res.json({ requestCount });
});

// Reset stats
app.post('/stats/reset', (req, res) => {
  requestCount = 0;
  res.json({ requestCount: 0 });
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});
