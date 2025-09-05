require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

// basic health
app.get('/', (req, res) => res.send({ status: 'ok', time: new Date().toISOString() }));

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, {
  // options handled by mongoose defaults
}).then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log('Server running on port', PORT));
}).catch(err => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});
