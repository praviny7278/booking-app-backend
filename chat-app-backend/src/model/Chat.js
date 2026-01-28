// models/Chat.js
const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isGroup: { type: Boolean, default: false },
  name: { type: String },
  lastMessage: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Chat', ChatSchema);
