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
app.use(express.static('public'));

let waitingUsers = [];

io.on('connection', socket => {
  console.log('🔌 New user connected:', socket.id);

  socket.on('join', userPrefs => {
    socket.meta = userPrefs; // store user preferences

    // Try to find a match
    const matchIndex = waitingUsers.findIndex(s => {
      if (!s.meta) return false;
      const regionMatch = s.meta.region === 'any' || userPrefs.region === 'any' || s.meta.region === userPrefs.region;
      const genderMatch =
        (s.meta.lookingFor === 'any' || s.meta.lookingFor === userPrefs.gender) &&
        (userPrefs.lookingFor === 'any' || userPrefs.lookingFor === s.meta.gender);
      return regionMatch && genderMatch;
    });

    if (matchIndex !== -1) {
      const partner = waitingUsers.splice(matchIndex, 1)[0];

      socket.partner = partner;
      partner.partner = socket;

      socket.emit('ready');
      partner.emit('ready');
    } else {
      waitingUsers.push(socket);
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

    waitingUsers = waitingUsers.filter(s => s !== socket);

    if (socket.partner) {
      socket.partner.emit('partner-disconnected');
      socket.partner.partner = null;
    }
  });
});

server.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
