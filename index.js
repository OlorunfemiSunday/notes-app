require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

// Security middleware with updated CSP configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'"],
      "script-src-attr": ["'unsafe-inline'"], // This fixes the onclick error
    },
  },
}));

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Rate limiting for login - MOVED BEFORE ROUTES
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many login attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// MongoDB connection with improved timeout settings and error handling
console.log('MongoDB URI:', process.env.MONGODB_URI);
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000, // 30 seconds
    socketTimeoutMS: 45000, // 45 seconds
    bufferMaxEntries: 0,
    maxPoolSize: 10, // Maintain up to 10 socket connections
    minPoolSize: 5, // Maintain minimum 5 socket connections
    maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  })
  .then(async () => {
    console.log("Connected to MongoDB");
    
    // DROP THE OLD USERNAME INDEX
    try {
      await mongoose.connection.db.collection('users').dropIndex('username_1');
      console.log('Dropped old username index successfully');
    } catch (error) {
      console.log('Index drop error (this is OK if index doesn\'t exist):', error.message);
    }

    // Create email index for better performance
    try {
      await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
      console.log('Created email index successfully');
    } catch (error) {
      console.log('Email index creation error:', error.message);
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit if database connection fails
  });

// Handle mongoose connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
});

// Apply rate limiting to login route BEFORE defining routes
app.use("/api/auth/login", loginLimiter);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/notes", require("./routes/notes"));

// Basic route for testing
app.get('/api', (req, res) => {
  res.json({ message: 'Notes API Server is running!' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
