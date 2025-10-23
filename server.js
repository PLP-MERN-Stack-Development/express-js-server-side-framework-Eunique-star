// server.js - Starter Express server for Week 2 assignment


// Task 1
// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.json());

// Sample in-memory products database
let products = [
  {
    id: '1',
    name: 'Laptop',
    description: 'High-performance laptop with 16GB RAM',
    price: 1200,
    category: 'electronics',
    inStock: true
  },
  {
    id: '2',
    name: 'Smartphone',
    description: 'Latest model with 128GB storage',
    price: 800,
    category: 'electronics',
    inStock: true
  },
  {
    id: '3',
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with timer',
    price: 50,
    category: 'kitchen',
    inStock: false
  }
];

// Root route
app.get('/', (req, res) => {
  res.send('Hello World.');
});

// TASK 2

const router = express.Router();

router.get('/products', (req, res) => {
  res.json(`List all products ${products}`);
});

router.get('/products/:id', (req, res) => {
  const productId = req.params.id;
  res.json(productId);
});

router.post('/products', (req, res) => {
  const { id, name, description, price, category, inStock } = req.body;
  try{
    const newProduct = new products({ id, name, description, price, category, inStock});
    const saved = newProduct.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message});
  }
});

router.put('/products/:id', (req, res) => {
  try{
    const updateProduct = products.findByIdAndUpdate(
    req.params.id,
    req.body,
      { new: true }
  )
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


router.delete('/products/:id', (req, res) => {
  try{
    products.findByIdAndDelete(
      req.params.id
    );
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
     res.status(500).json({message: error.message});
  }
})


// Task 3: Middleware Implementation

// custom logger middleware that logs the request method, URL, and timestamp
function logger(req, res, next){
  console.log(`Request Received: ${req.method} ${req.path} at ${new Date().toISOString()}`);
  next();
}
app.use(logger);

// Middleware for JSON request
app.use(express.json());

// Create an authentication middleware that checks for an API key in the request headers
function authenticate(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === 'mysecretkey') {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
app.use(authenticate);

// Add validation middleware for the product creation and update routes
function validateProduct(req, res, next) {
  const { name, description, price, category, inStock } = req.body;
  if (!name || !description || !price || !category === undefined || inStock === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  next();
}
app.use(validateProduct);

// Task 4 - Error Handling
// Global error handling middleware
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Something went wrong';

  // Log error details
  console.error({
    status,
    message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });

  // Send response based on error type
  if (err instanceof ValidationError) {
    return res.status(status).json({
      status: 'error',
      message,
      details: err.details
    });
  }

  if (err instanceof NotFoundError || err instanceof AuthenticationError) {
    return res.status(status).json({
      status: 'error',
      message
    });
  }

  // Default error response
  res.status(status).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message
  });
});

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    if (details) this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = null) {
    super(message, 400, errors);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}


// Task 5 - Query params for filtering products by category
// Example: GET /products?category=electronics
app.get('/products', (req, res) => {
  try {
    const { category } = req.query;
    let result = products;

    if (category) {
      // support comma-separated categories, case-insensitive
      const categories = category.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
      result = products.filter(p => categories.includes(String(p.category).toLowerCase()));
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Pagination, filtering (by category) and simple search for product listing
// Supports query params: ?category=electronics,kitchen&page=1&limit=10&q=searchTerm
app.get('/products', (req, res) => {
  try {
    let { category, page = 1, limit = 10, q } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    let result = products;

    // Category filtering (comma-separated, case-insensitive)
    if (category) {
      const categories = category
        .split(',')
        .map(c => c.trim().toLowerCase())
        .filter(Boolean);
      result = result.filter(p => categories.includes(String(p.category).toLowerCase()));
    }

    // Simple name search (case-insensitive)
    if (q) {
      const qLower = String(q).toLowerCase();
      result = result.filter(p => String(p.name).toLowerCase().includes(qLower));
    }

    const total = result.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = result.slice(start, end);

    res.json({
      metadata: {
        total,
        totalPages,
        page,
        limit,
      },
      data: paginated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search endpoint for products by name
app.get('/products/search', (req, res) => {
  try {
    const searchTerm = req.query.name;
    if (!searchTerm) {
      return res.status(400).json({ message: 'Search term is required' });
    }
    const searchResults = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    res.json(searchResults);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get product statistics
app.get('/products/stats', (req, res) => {
  try {
    const stats = {
      totalProducts: products.length,
      byCategoryCount: products.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {}),
      inStockCount: products.filter(p => p.inStock).length,
      outOfStockCount: products.filter(p => !p.inStock).length,
      averagePrice: products.reduce((sum, p) => sum + p.price, 0) / products.length
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for testing purposes
module.exports = app; 