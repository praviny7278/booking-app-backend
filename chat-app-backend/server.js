require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const usersRoutes = require('./src/routes/userRoutes');
const messagesRoutes = require('./src/routes/messageRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const initSocket = require('./src/socket');
const auth = require("./src/middleware/authMiddleware");
const Message = require('./src/model/Massege');
const Chat = require('./src/model/Chat');
const userBookingRoutes = require('./src/routes/userBookingRoutes');


const app = express();
const server = http.createServer(app);


//
const {Server} = require('socket.io');
const io = new Server(server, {
    cors: {origin: '*', methods: ['GET', 'POST']}
});

initSocket(io);


app.use(cors());
app.use(express.json());


app.use('/api/auth/', authRoutes);
app.use('/api/user/', usersRoutes);
app.use('/api/message/', messagesRoutes);
app.use('/api/chat/', chatRoutes);
app.use('/api/', userBookingRoutes)




io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.id);

  // Join user-specific room (based on userId)
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their personal room`);
  });

  // Join chat room
  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  // Handle sending messages
  socket.on('sendMessage', async (messageData) => {
    const { chatId, senderId, receiverId,  content, type } = messageData;

    // Save to DB (optional async)
    const message = await Message.create({
      chatId,
      receiverId,
      senderId,
      content,
      type,
      createdAt: new Date()
    });

    ///
    await Chat.findByIdAndUpdate(chatId, {lastMessage: content});

    //
    io.to(receiverId).emit('receiveMessage', message);
    io.to(senderId).emit('receiveMessage', message);

    console.log('Message sent: ', message);
    

  });

  socket.on('disconnect', () => {
    console.log('🔴 User disconnected:', socket.id);
  });
});


///
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, '0.0.0.0', ()=> console.log(`Server listening on port : http://localhost:${PORT}`));
    
});


