const mongoose = require("mongoose");

const AuthAuditSchema = new mongoose.Schema({
  uid: {
    type: String,
    index: true
  },
  email: {
    type: String,
    required: true,
    index: true
  },
  event: {
    type: String,
    enum: [
      "login",
      "logout",
      "token_refresh",
      "login_failed",
      "session_expired",
      "forced_logout",
      "invalid_token"
    ],
    required: true,
    index: true
  },
  ip: {
    type: String,
    index: true
  },
  userAgent: String,
  country: String,

  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastAttemptAt: Date

}, { versionKey: false });

module.exports = mongoose.model("AuthAudit", AuthAuditSchema);