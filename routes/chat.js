// routes/chat.js

const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/chatMessage'); // Update the path based on your project structure

// Handle chat-related routes here

// POST route to handle incoming chat messages
router.post('/messages', async (req, res) => {
  const { sender, receiver, message } = req.body;

  try {
    const newMessage = new ChatMessage({ sender, receiver, message });
    await newMessage.save();
    // Broadcast the message to everyone in the room
    io.emit('chatMessage', newMessage);
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error saving message to database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET route to retrieve chat history
router.get('/messages', async (req, res) => {
  try {
    const chatHistory = await ChatMessage.find().sort({ timestamp: 1 }); // Adjust sorting based on your needs
    res.json(chatHistory);
  } catch (error) {
    console.error('Error retrieving chat history from database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
