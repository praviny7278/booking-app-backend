
const mongoose = require('mongoose');
delete mongoose.connection.models['Message'];



const MessageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // receiverId: {type: mongoose.Schema.Types.ObjectId, ref: 'User',},
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref:'Group'},
    content: { type: String, required: true},
    type: { type: String, enum: [ 'text', 'image', 'audio', 'video', 'file'], default: 'text' },
    read: { type: Boolean, default: false },
    delivered: { type: Boolean, default: false },
}, {timestamps: true});



module.exports = mongoose.models.Message || mongoose.model("Message", MessageSchema);
