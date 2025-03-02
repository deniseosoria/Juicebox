const jwt = require("jsonwebtoken");
const { getUserById } = require("../db"); 
require('dotenv').config({path:"./.env"});


async function requireUser(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No valid token provided" });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    // Verify JWT token
    const payload = jwt.verify(token, process.env.JWT_SECRET || "shhh");

    // Fetch user from database
    const user = await getUserById(payload.id);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    req.user = user; // Attach user object to the request
    next(); // Continue to the next middleware/route
  } catch (error) {
    res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
}

module.exports = { requireUser };
