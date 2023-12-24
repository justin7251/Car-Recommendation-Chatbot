// app.js

const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const ChatMessage = require('./models/chatMessage');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 3000;

Mongoose.connect(${process.env.DATABASE_URL}, { useNewUrlParser: true });

// ... (previous code)
const chatRoutes = require('./routes/chat');
app.use('/chat', chatRoutes);

// Socket.io logic
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle chat messages
  socket.on('chatMessage', async (data) => {
    const { sender, receiver, message } = data;
    const newMessage = new ChatMessage({ sender, receiver, message });
    await newMessage.save();

    // Broadcast the message to everyone in the room
    io.emit('chatMessage', newMessage);
  });

  // Disconnect event
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// ... (previous code)

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
