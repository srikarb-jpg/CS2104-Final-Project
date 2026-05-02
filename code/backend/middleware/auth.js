// auth.js - Middleware that checks if the user is logged in
//
// In our app, when a user logs in, we give them a "token" (a long string of characters).
// They send this token with every request to prove who they are.
// This middleware checks that token before allowing access to protected routes.
//
// Think of it like a bouncer at a club: they check your ID before letting you in.
// The "ID" here is the JWT (JSON Web Token).

const jwt = require('jsonwebtoken');

// This function runs BEFORE any protected route handler
// req = the request coming in, res = the response we'll send back, next = go to the actual route
function verifyToken(req, res, next) {
  // Look for the token in the request headers
  // The frontend sends it like: Authorization: Bearer eyJhbGci...
  const authHeader = req.headers['authorization'];

  // If there's no Authorization header at all, deny access
  if (!authHeader) {
    return res.status(401).json({ error: 'You need to be logged in to do that. No token was provided.' });
  }

  // The header looks like "Bearer TOKEN_HERE", so we split by space and take the second part
  const token = authHeader.split(' ')[1];

  // If the format is wrong (no space, no token after Bearer), deny access
  if (!token) {
    return res.status(401).json({ error: 'Token format is wrong. It should look like: Bearer <your_token>' });
  }

  // Try to verify the token using our secret key
  // If the token was tampered with or expired, jwt.verify() will throw an error
  try {
    // jwt.verify() decodes the token and checks that it was signed with our secret
    // It returns the original data we put in the token (like user ID and email)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded user info to the request
    // Now any route that uses this middleware can access req.user.id, req.user.email, etc.
    req.user = decoded;

    // Call next() to move on to the actual route handler
    next();
  } catch (err) {
    // The token was invalid (wrong signature) or expired
    console.log('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}

module.exports = verifyToken;
