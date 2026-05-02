require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const availabilityRoutes = require('./routes/availability');
const matchRoutes = require('./routes/matches');
const requestRoutes = require('./routes/requests');

const app = express();
const PORT = process.env.PORT || 5000;

// allow requests from the React dev server
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', courseRoutes);
app.use('/api/users', availabilityRoutes);
app.use('/api/users', matchRoutes);
app.use('/api/users', requestRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HokieStudy backend is running! Go Hokies!' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`HokieStudy server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
