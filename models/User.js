const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please provide a valid email",
    ],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compare password method - UPDATED
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    // Convert candidatePassword to string to handle numbers
    const passwordString = String(candidatePassword);
    return await bcrypt.compare(passwordString, this.password);
  } catch (error) {
    console.error("Password comparison error:", error);
    throw error;
  }
};

// Compare password method - UPDATED
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    // Convert candidatePassword to string to handle numbers
    const passwordString = String(candidatePassword);
    return await bcrypt.compare(passwordString, this.password);
  } catch (error) {
    console.error("Password comparison error:", error);
    throw error;
  }
};

module.exports = mongoose.model("User", userSchema);
