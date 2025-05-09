// Backend (server.js)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(express.static(path.join(__dirname)));

let waitingUser = null;

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  if (waitingUser) {
    socket.partner = waitingUser;
    waitingUser.partner = socket;

    socket.emit('partner-found');
    waitingUser.emit('partner-found');

    waitingUser = null;
  } else {
    waitingUser = socket;
  }
  socket.on('chat-message', (msg) => {
  if (socket.partner) {
    socket.partner.emit('chat-message', msg);
  }
});


  socket.on('signal', (data) => {
    if (socket.partner) {
      socket.partner.emit('signal', data);
    }
  });

  socket.on('next', () => {
    if (socket.partner) {
      socket.partner.emit('partner-disconnected');
      socket.partner.partner = null;
    }
    socket.partner = null;
    if (waitingUser) {
      socket.partner = waitingUser;
      waitingUser.partner = socket;

      socket.emit('partner-found');
      waitingUser.emit('partner-found');

      waitingUser = null;
    } else {
      waitingUser = socket;
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (waitingUser === socket) {
      waitingUser = null;
    }
    if (socket.partner) {
      socket.partner.emit('partner-disconnected');
      socket.partner.partner = null;
    }
  });
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});

