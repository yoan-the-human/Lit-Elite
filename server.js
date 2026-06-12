import express from 'express';
import cors from 'cors';

const app = express();

// Standard CORS options allowing all origins and headers
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Lit Elite Multiplayer Polling Server is running!');
});

// rooms store: roomCode -> { players: { A: clientId, B: clientId }, lastPoll: { A: timestamp, B: timestamp }, state: gameState, isPrivate: boolean, startingPlayer: string }
const rooms = {};

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

// REST API Endpoints

// 1. Get public rooms (Lobby list)
app.get('/api/lobby', (req, res) => {
  res.json(getPublicRooms());
});

// 2. Create room
app.post('/api/rooms', (req, res) => {
  const { clientId, startingPlayer, isPrivate } = req.body;
  if (!clientId) {
    return res.status(400).send('clientId is required.');
  }

  const code = Math.floor(1000 + Math.random() * 9000).toString();
  rooms[code] = {
    players: { A: clientId },
    lastPoll: { A: Date.now() },
    state: null,
    startingPlayer: startingPlayer,
    isPrivate: !!isPrivate
  };

  console.log(`Room ${code} created by Player A (${clientId}) - Private: ${isPrivate}`);
  res.json({ code, isPrivate: !!isPrivate });
});

// 3. Join room
app.post('/api/rooms/:code/join', (req, res) => {
  const { code } = req.params;
  const { clientId } = req.body;
  if (!clientId) {
    return res.status(400).send('clientId is required.');
  }

  const room = rooms[code];
  if (!room) {
    return res.status(404).send('Room not found!');
  }

  if (room.players.A === clientId) {
    // Rejoining as A
    room.lastPoll.A = Date.now();
    return res.json({ code, role: 'A', startingPlayer: room.startingPlayer });
  }

  if (room.players.B === clientId) {
    // Rejoining as B
    room.lastPoll.B = Date.now();
    return res.json({ code, role: 'B', startingPlayer: room.startingPlayer });
  }

  if (!room.players.B) {
    room.players.B = clientId;
    room.lastPoll.B = Date.now();
    console.log(`Player B (${clientId}) joined Room ${code}`);
    return res.json({ code, role: 'B', startingPlayer: room.startingPlayer });
  } else {
    return res.status(400).send('Room is full!');
  }
});

// 4. Update state
app.post('/api/rooms/:code/state', (req, res) => {
  const { code } = req.params;
  const { clientId, state } = req.body;
  const room = rooms[code];
  if (room) {
    room.state = state;
    // Also track poll activity
    if (room.players.A === clientId) room.lastPoll.A = Date.now();
    if (room.players.B === clientId) room.lastPoll.B = Date.now();
    res.json({ success: true });
  } else {
    res.status(404).send('Room not found.');
  }
});

// 5. Leave room
app.post('/api/rooms/:code/leave', (req, res) => {
  const { code } = req.params;
  const { clientId } = req.body;
  const room = rooms[code];
  if (room) {
    if (room.players.A === clientId || room.players.B === clientId) {
      console.log(`Room ${code} destroyed because player ${clientId} left.`);
      delete rooms[code];
    }
  }
  res.json({ success: true });
});

// 6. State and status polling
app.get('/api/rooms/:code/poll', (req, res) => {
  const { code } = req.params;
  const { clientId } = req.query;
  const room = rooms[code];

  if (!room) {
    return res.json({ status: 'player_left' });
  }

  let role = null;
  if (room.players.A === clientId) role = 'A';
  else if (room.players.B === clientId) role = 'B';

  if (!role) {
    return res.status(403).send('Unauthorized to poll this room.');
  }

  const now = Date.now();
  room.lastPoll[role] = now;

  // Check if the other player timed out (no poll in 7 seconds)
  const otherRole = role === 'A' ? 'B' : 'A';
  const otherClientId = room.players[otherRole];
  if (otherClientId) {
    const lastOtherPoll = room.lastPoll[otherRole] || 0;
    if (now - lastOtherPoll > 7000) {
      console.log(`Room ${code} destroyed because opponent ${otherClientId} timed out.`);
      delete rooms[code];
      return res.json({ status: 'player_left' });
    }
  }

  // Determine if Player B has joined (from Player A's perspective)
  const opponentJoined = role === 'A' && room.players.B && (now - (room.lastPoll.B || 0) < 7000);

  res.json({
    status: room.players.B ? 'connected' : 'waiting',
    state: room.state,
    opponentJoined: !!opponentJoined
  });
});

// Background Garbage Collector: clean rooms inactive for > 15 seconds
setInterval(() => {
  const now = Date.now();
  for (const code in rooms) {
    const room = rooms[code];
    const ageA = now - (room.lastPoll.A || 0);
    const ageB = room.players.B ? (now - (room.lastPoll.B || 0)) : 0;
    
    if (ageA > 15000 || (room.players.B && ageB > 15000)) {
      console.log(`Garbage Collector: Room ${code} cleaned up due to timeout.`);
      delete rooms[code];
    }
  }
}, 10000);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Express REST Server listening on port ${PORT}`);
});
