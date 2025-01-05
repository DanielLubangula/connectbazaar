// models/User.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  role: {
    type: String,
    default: "acheteur",
  },
  profileImagePath: {
    type: String,
  },
  numberPhone: {
    type: String,
  },
  address: {
    type: String,
  },
  bio: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  lastSeen: {
    type: String,
  },
  role: {
    type: String,
    default: "buyer ",
  },
  listNoir: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId },
    },
  ],
  status: {
    type: String,
    default: "active",
  },
  googleId: { type: String }, // ID Google pour lier les comptes
  resetPasswordToken: { type: String },
  resetPasswordExpiry: { type: Date },
});

module.exports = mongoose.model("User1", UserSchema);
