// public/chat.js

$(document).ready(() => {
    const socket = io();
  
    $('#form').submit(() => {
      const sender = 'John'; // You can replace this with user authentication
      const receiver = 'Jane'; // Replace with the actual receiver
      const message = $('#message-input').val();
      socket.emit('chatMessage', { sender, receiver, message });
      $('#message-input').val('');
      return false;
    });
  
    socket.on('chatMessage', (data) => {
      $('#messages').append($('<li>').text(`${data.sender}: ${data.message}`));
    });
  });
  