const Message = require('../model/Massege');
const User = require('../model/Users');

function initSocket(io) {
  // map to track userId -> socketId (one-to-one). For multi-device, value could be set.
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    // client should emit 'register' after connect with { userId }
    socket.on('register', async ({ userId }) => {
      if (!userId) return;
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      // mark user online in DB optionally
      await User.findByIdAndUpdate(userId, { online: true, lastSeen: Date.now() });
      io.emit('presence', { userId, online: true });
    });




    socket.on('private_message', async (data) => {
      // data: { to, text, type }
      const { to, text, type } = data;
      if (!socket.userId) return;
      const msg = Message.create({
        sender: socket.userId,
        receiverId: to,
        text,
        type: type || 'text'
      });
      await msg.populate('sender', 'name avatarUrl');



      // send to receiver if online
      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('private_message', msg);
        msg.delivered = true;
        // await msg.save();
      }
      // acknowledge sender
      socket.emit('message_sent', msg);
    });


    //
    socket.on('delete_message', async ({messageId, chatId }) => {

      const msg = await Message.findByIdAndDelete(messageId);

      if (!msg) return;

      io.to(chatId).emit('messsage_deleted', {messageId});

      console.log('message deleted: ', messageId);
      
    });


    socket.on('disconnect', async () => {
      console.log('socket disconnected', socket.id);
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        await User.findByIdAndUpdate(socket.userId, { online: false, lastSeen: Date.now() });
        io.emit('presence', { userId: socket.userId, online: false, lastSeen: Date.now() });
      }
    });
  });
}

module.exports = initSocket;
