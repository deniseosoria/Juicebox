// Import required modules
const express = require('express');  // Express framework for creating APIs
const apiRouter = express.Router();  // Create an Express Router instance
const jwt = require('jsonwebtoken'); // Library for working with JSON Web Tokens (JWT)
const { getUserById } = require('../db'); // Import function to fetch user by ID from the database

// Load environment variables from .env file
require('dotenv').config({ path: "./.env" });

// Use JWT_SECRET from environment variables, defaulting to "shhh" if not provided
const JWT_SECRET = process.env.JWT_SECRET || "shhh";

const app = express();
app.use(express.json());

//for deployment only
const path = require('path');
app.get('/', (req, res)=> res.sendFile(path.join(__dirname, '../client/dist/index.html')));
app.use('/assets', express.static(path.join(__dirname, '../client/dist/assets'))); 

// ================================
// Middleware: Authenticate User
// ================================

// This middleware attempts to set `req.user` if a valid JWT token is provided
apiRouter.use(async (req, res, next) => {
  const prefix = 'Bearer '; // Expected format of the token in Authorization header
  const auth = req.header('Authorization'); // Retrieve the Authorization header

  if (!auth) {
    return next(); // If no Authorization header is present, move to the next middleware
  }

  if (!auth.startsWith(prefix)) {
    // If the Authorization header does not start with "Bearer ", return an error
    return res.status(401).json({
      name: 'AuthorizationHeaderError',
      message: `Authorization token must start with ${prefix}`,
    });
  }

  // Extract the actual token (remove "Bearer " prefix)
  const token = auth.slice(prefix.length);

  try {
    // Verify and decode the JWT using the secret key
    const { id } = jwt.verify(token, JWT_SECRET);

    if (id) {
      // Fetch user details from the database using the user ID from the token
      const user = await getUserById(id);
      if (user) {
        req.user = user; // Attach user information to the `req` object
      }
    }
    next(); // Move to the next middleware or route handler
  } catch (error) {
    // If token verification fails (e.g., expired or invalid), return an error
    return res.status(401).json({
      name: "UnauthorizedError",
      message: "Invalid or expired token",
    });
  }
});

// ================================
// Debugging Middleware
// ================================
// Logs the user information if they are authenticated
apiRouter.use((req, res, next) => {
  if (req.user) {
    console.log('User is set:', req.user);
  }
  next(); // Move to the next middleware or route
});

// ================================
// Mount Other Routers
// ================================

// Import and use the users router for handling `/users` related routes
const usersRouter = require('./users');
apiRouter.use('/users', usersRouter);

// Import and use the posts router for handling `/posts` related routes
const postsRouter = require('./posts');
apiRouter.use('/posts', postsRouter);

// Import and use the tags router for handling `/tags` related routes
const tagsRouter = require('./tags');
apiRouter.use('/tags', tagsRouter);

// ================================
// Global Error Handling Middleware
// ================================

// Catches and formats errors that occur in any route
apiRouter.use((error, req, res, next) => {
  res.status(500).json({
    name: error.name, // Name of the error (e.g., ValidationError)
    message: error.message, // Descriptive error message
  });
});

// Export the API router for use in other parts of the application
module.exports = apiRouter;
