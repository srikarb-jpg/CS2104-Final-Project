const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const { readDB, writeDB } = require('../database/db');

// POST /api/users/:id/requests  — send a study request
router.post('/:id/requests', verifyToken, (req, res) => {
  const fromUserId = parseInt(req.params.id);

  if (req.user.id !== fromUserId) {
    return res.status(403).json({ error: 'You can only send requests as yourself.' });
  }

  const { to_user_id, message } = req.body;

  if (!to_user_id) {
    return res.status(400).json({ error: 'to_user_id is required.' });
  }

  const toUserId = parseInt(to_user_id);

  if (fromUserId === toUserId) {
    return res.status(400).json({ error: "You can't send a request to yourself." });
  }

  const data = readDB();

  const targetUser = data.users.find(u => u.id === toUserId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  // don't allow duplicate pending requests
  const existingRequest = data.study_requests.find(r =>
    r.from_user_id === fromUserId && r.to_user_id === toUserId && r.status === 'pending'
  );

  if (existingRequest) {
    return res.status(400).json({ error: 'You already sent a request to this student.' });
  }

  const newRequest = {
    id: data.nextIds.study_requests,
    from_user_id: fromUserId,
    to_user_id: toUserId,
    message: message || '',
    status: 'pending',
    created_at: new Date().toISOString()
  };

  data.study_requests.push(newRequest);
  data.nextIds.study_requests += 1;
  writeDB(data);

  console.log(`Study request from ${fromUserId} to ${toUserId}`);
  res.status(201).json({ message: `Request sent to ${targetUser.name}!`, request: newRequest });
});

// GET /api/users/:id/requests  — incoming requests
router.get('/:id/requests', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);

  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'You can only view your own requests.' });
  }

  const data = readDB();
  const incoming = data.study_requests.filter(r => r.to_user_id === userId);

  const incomingWithDetails = incoming.map(r => {
    const sender = data.users.find(u => u.id === r.from_user_id);
    return {
      ...r,
      from_user: sender
        ? { id: sender.id, name: sender.name, year: sender.year }
        : { id: r.from_user_id, name: 'Unknown Student', year: '' }
    };
  });

  incomingWithDetails.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(incomingWithDetails);
});

// GET /api/users/:id/requests/sent  — requests this user sent
router.get('/:id/requests/sent', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);

  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'You can only view your own sent requests.' });
  }

  const data = readDB();
  const sent = data.study_requests.filter(r => r.from_user_id === userId);

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

// PUT /api/users/:id/requests/:reqId  — accept or decline
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
  const requestIndex = data.study_requests.findIndex(r => r.id === reqId && r.to_user_id === userId);

  if (requestIndex === -1) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  if (data.study_requests[requestIndex].status !== 'pending') {
    return res.status(400).json({ error: 'This request has already been responded to.' });
  }

  data.study_requests[requestIndex].status = action === 'accept' ? 'accepted' : 'declined';
  data.study_requests[requestIndex].responded_at = new Date().toISOString();
  writeDB(data);

  const statusWord = action === 'accept' ? 'accepted' : 'declined';
  console.log(`User ${userId} ${statusWord} request ${reqId}`);
  res.json({ message: `Request ${statusWord}!` });
});

module.exports = router;
