import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

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

const rooms = {}; // roomCode -> { players: { A: socketId, B: socketId }, state: gameState, isPrivate: boolean }

function getPublicRooms() {
  const list = [];
  for (const code in rooms) {
    const room = rooms[code];
    if (!room.isPrivate && !room.players.B) {
      list.push({
        code: code,
        playersCount: room.players.B ? 2 : 1
      });
    }
  }
  return list;
}

function broadcastPublicRooms() {
  io.to('lobby').emit('public_rooms_list', getPublicRooms());
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_lobby', () => {
    socket.join('lobby');
    socket.emit('public_rooms_list', getPublicRooms());
    console.log(`Socket ${socket.id} joined lobby.`);
  });
  
  socket.on('leave_lobby', () => {
    socket.leave('lobby');
    console.log(`Socket ${socket.id} left lobby.`);
  });
  
  socket.on('get_public_rooms', () => {
    socket.emit('public_rooms_list', getPublicRooms());
  });

  socket.on('create_room', ({ mode, startingPlayer, isPrivate }) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    rooms[code] = {
      players: { A: socket.id },
      state: null,
      startingPlayer: startingPlayer,
      isPrivate: !!isPrivate
    };
    socket.join(code);
    socket.leave('lobby'); // Leave lobby when entering room
    socket.emit('room_created', { code, isPrivate: !!isPrivate });
    console.log(`Room ${code} created by Player A (${socket.id}) - Private: ${isPrivate}`);
    broadcastPublicRooms();
  });
  
  socket.on('join_room', ({ code }) => {
    const room = rooms[code];
    if (room) {
      if (!room.players.B) {
        room.players.B = socket.id;
        socket.join(code);
        socket.leave('lobby'); // Leave lobby when entering room
        socket.emit('room_joined', { code, role: 'B', startingPlayer: room.startingPlayer });
        io.to(room.players.A).emit('player_joined', { role: 'B' });
        console.log(`Player B (${socket.id}) joined Room ${code}`);
        broadcastPublicRooms();
      } else {
        socket.emit('room_error', 'Room is full!');
      }
    } else {
      socket.emit('room_error', 'Room not found!');
    }
  });
  
  socket.on('leave_room', ({ code }) => {
    const room = rooms[code];
    if (room) {
      if (room.players.A === socket.id || room.players.B === socket.id) {
        socket.leave(code);
        io.to(code).emit('player_left');
        delete rooms[code];
        console.log(`Room ${code} destroyed because player left.`);
        broadcastPublicRooms();
      }
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
        broadcastPublicRooms();
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
