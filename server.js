const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());

let waitingSocket = null;

io.on('connection', socket => {
  console.log('🔌 New user connected:', socket.id);

  socket.on('join', () => {
    if (waitingSocket) {
      // Pair them
      socket.partner = waitingSocket;
      waitingSocket.partner = socket;

      socket.emit('ready');
      waitingSocket.emit('ready');

      waitingSocket = null;
    } else {
      waitingSocket = socket;
    }
  });

  socket.on('offer', offer => {
    if (socket.partner) {
      socket.partner.emit('offer', offer);
    }
  });

  socket.on('answer', answer => {
    if (socket.partner) {
      socket.partner.emit('answer', answer);
    }
  });

  socket.on('ice-candidate', candidate => {
    if (socket.partner) {
      socket.partner.emit('ice-candidate', candidate);
    }
  });

  socket.on('chat-message', msg => {
    if (socket.partner) {
      socket.partner.emit('chat-message', msg);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);

    if (waitingSocket === socket) {
      waitingSocket = null;
    }

    if (socket.partner) {
      socket.partner.emit('partner-disconnected');
      socket.partner.partner = null;
    }
  });
});

server.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
