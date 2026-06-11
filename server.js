const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send('Lit Elite Multiplayer Server is running!');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const rooms = {}; // roomCode -> { players: { A: socketId, B: socketId }, state: gameState }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('create_room', ({ mode, startingPlayer }) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    rooms[code] = {
      players: { A: socket.id },
      state: null,
      startingPlayer: startingPlayer
    };
    socket.join(code);
    socket.emit('room_created', { code });
    console.log(`Room ${code} created by Player A (${socket.id})`);
  });
  
  socket.on('join_room', ({ code }) => {
    const room = rooms[code];
    if (room) {
      if (!room.players.B) {
        room.players.B = socket.id;
        socket.join(code);
        socket.emit('room_joined', { code, role: 'B', startingPlayer: room.startingPlayer });
        io.to(room.players.A).emit('player_joined', { role: 'B' });
        console.log(`Player B (${socket.id}) joined Room ${code}`);
      } else {
        socket.emit('room_error', 'Room is full!');
      }
    } else {
      socket.emit('room_error', 'Room not found!');
    }
  });
  
  socket.on('update_state', ({ code, state }) => {
    const room = rooms[code];
    if (room) {
      room.state = state;
      socket.to(code).emit('state_updated', state);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const code in rooms) {
      const room = rooms[code];
      if (room.players.A === socket.id || room.players.B === socket.id) {
        io.to(code).emit('player_left');
        delete rooms[code];
        console.log(`Room ${code} destroyed because player disconnected.`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
