// requests.js - Routes for study partner requests
//
// Routes in this file:
//   POST /api/users/:id/requests          - Send a study request to another student
//   GET  /api/users/:id/requests          - Get all incoming requests for a user
//   GET  /api/users/:id/requests/sent     - Get all requests this user has sent
//   PUT  /api/users/:id/requests/:reqId   - Accept or decline an incoming request

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { readDB, writeDB } = require('../database/db');

// =====================================================
// POST /api/users/:id/requests
// Send a study request to another student
// :id here is the SENDER's ID
// The target student's ID is in req.body.to_user_id
// =====================================================
router.post('/:id/requests', verifyToken, (req, res) => {
  const fromUserId = parseInt(req.params.id);

  // Security: you can only send requests as yourself
  if (req.user.id !== fromUserId) {
    return res.status(403).json({ error: 'You can only send requests as yourself.' });
  }

  const { to_user_id, message } = req.body;

  if (!to_user_id) {
    return res.status(400).json({ error: 'to_user_id is required.' });
  }

  const toUserId = parseInt(to_user_id);

  // Can't send a request to yourself
  if (fromUserId === toUserId) {
    return res.status(400).json({ error: "You can't send a study request to yourself." });
  }

  const data = readDB();

  // Check that the target user actually exists
  const targetUser = data.users.find(u => u.id === toUserId);
  if (!targetUser) {
    return res.status(404).json({ error: 'That student was not found.' });
  }

  // Check if a pending request already exists between these two users
  // We don't want duplicate requests
  const existingRequest = data.study_requests.find(r =>
    r.from_user_id === fromUserId &&
    r.to_user_id === toUserId &&
    r.status === 'pending'
  );

  if (existingRequest) {
    return res.status(400).json({ error: 'You already sent a request to this student.' });
  }

  // Create the new request object
  const newRequest = {
    id: data.nextIds.study_requests,
    from_user_id: fromUserId,
    to_user_id: toUserId,
    message: message || '',         // Optional message from the sender
    status: 'pending',              // pending → accepted or declined
    created_at: new Date().toISOString()
  };

  data.study_requests.push(newRequest);
  data.nextIds.study_requests += 1;
  writeDB(data);

  console.log(`Study request sent from user ${fromUserId} to user ${toUserId}`);
  res.status(201).json({ message: `Study request sent to ${targetUser.name}!`, request: newRequest });
});

// =====================================================
// GET /api/users/:id/requests
// Get all INCOMING study requests for a user (requests sent TO them)
// =====================================================
router.get('/:id/requests', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);

  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'You can only view your own requests.' });
  }

  const data = readDB();

  // Find all requests where this user is the recipient
  const incoming = data.study_requests.filter(r => r.to_user_id === userId);

  // Add the sender's name and info to each request so the frontend can display it
  const incomingWithDetails = incoming.map(r => {
    const sender = data.users.find(u => u.id === r.from_user_id);
    return {
      ...r,
      from_user: sender
        ? { id: sender.id, name: sender.name, year: sender.year }
        : { id: r.from_user_id, name: 'Unknown Student', year: '' }
    };
  });

  // Sort so newest requests appear first
  incomingWithDetails.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json(incomingWithDetails);
});

// =====================================================
// GET /api/users/:id/requests/sent
// Get all requests this user has SENT (so they can see status)
// =====================================================
router.get('/:id/requests/sent', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);

  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'You can only view your own sent requests.' });
  }

  const data = readDB();

  const sent = data.study_requests.filter(r => r.from_user_id === userId);

  // Add the recipient's name to each request
  const sentWithDetails = sent.map(r => {
    const recipient = data.users.find(u => u.id === r.to_user_id);
    return {
      ...r,
      to_user: recipient
        ? { id: recipient.id, name: recipient.name, year: recipient.year }
        : { id: r.to_user_id, name: 'Unknown Student', year: '' }
    };
  });

  sentWithDetails.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  res.json(sentWithDetails);
});

// =====================================================
// PUT /api/users/:id/requests/:reqId
// Accept or decline an incoming request
// Send { action: "accept" } or { action: "decline" } in the body
// =====================================================
router.put('/:id/requests/:reqId', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);
  const reqId = parseInt(req.params.reqId);

  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'You can only respond to your own requests.' });
  }

  const { action } = req.body;

  if (!action || !['accept', 'decline'].includes(action)) {
    return res.status(400).json({ error: 'action must be "accept" or "decline".' });
  }

  const data = readDB();

  // Find the request - it must be addressed TO this user
  const requestIndex = data.study_requests.findIndex(
    r => r.id === reqId && r.to_user_id === userId
  );

  if (requestIndex === -1) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  if (data.study_requests[requestIndex].status !== 'pending') {
    return res.status(400).json({ error: 'This request has already been responded to.' });
  }

  // Update the status based on the action
  data.study_requests[requestIndex].status = action === 'accept' ? 'accepted' : 'declined';
  data.study_requests[requestIndex].responded_at = new Date().toISOString();

  writeDB(data);

  const statusWord = action === 'accept' ? 'accepted' : 'declined';
  console.log(`User ${userId} ${statusWord} request ${reqId}`);
  res.json({ message: `Request ${statusWord}!` });
});

module.exports = router;
