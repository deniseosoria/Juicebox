// api/index.js
const express = require('express');
const apiRouter = express.Router();
const jwt = require('jsonwebtoken');
const { getUserById } = require('../db');
require('dotenv').config({path:"./.env"});

const JWT_SECRET = process.env.JWT_SECRET || "shhh";

// Middleware to set `req.user` if possible
apiRouter.use(async (req, res, next) => {
  const prefix = 'Bearer ';
  const auth = req.header('Authorization');

  if (!auth) {
    return next(); // Ensure no further execution
  }

  if (!auth.startsWith(prefix)) {
    return res.status(401).json({
      name: 'AuthorizationHeaderError',
      message: `Authorization token must start with ${prefix}`,
    });
  }

  const token = auth.slice(prefix.length);

  try {
    const { id } = jwt.verify(token, JWT_SECRET);
    if (id) {
      const user = await getUserById(id);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    return res.status(401).json({
      name: "UnauthorizedError",
      message: "Invalid or expired token",
    });
  }
});

apiRouter.use((req, res, next) => {
  if (req.user) {
    console.log('User is set:', req.user);
  }
  next();
});

const usersRouter = require('./users');
apiRouter.use('/users', usersRouter);

const postsRouter = require('./posts');
apiRouter.use('/posts', postsRouter);

const tagsRouter = require('./tags');
apiRouter.use('/tags', tagsRouter);

// Proper error handling middleware
apiRouter.use((error, req, res, next) => {
  res.status(500).json({
    name: error.name,
    message: error.message,
  });
});

module.exports = apiRouter;
