export class PolledSocket {
  constructor(url) {
    this.url = url;
    this.clientId = 'client_' + Math.random().toString(36).substr(2, 9);
    this.callbacks = {};
    this.roomCode = null;
    this.pollInterval = null;
    this.lobbyPollInterval = null;
    this.opponentJoinedTriggered = false;
    this.isConnected = false;
    
    console.log(`[PolledSocket] Initializing with client ID: ${this.clientId} to server: ${url}`);
    
    // Mimic async connection delay
    setTimeout(() => {
      this.isConnected = true;
      this.trigger('connect');
    }, 100);
  }

  on(event, callback) {
    this.callbacks[event] = callback;
  }

  trigger(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event](data);
    }
  }

  disconnect() {
    this.isConnected = false;
    this.stopPolling();
    this.stopLobbyPolling();
    if (this.roomCode) {
      const code = this.roomCode;
      this.roomCode = null;
      // Fire and forget leave room request
      fetch(`${this.url}/api/rooms/${code}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: this.clientId })
      }).catch(() => {});
    }
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  stopLobbyPolling() {
    if (this.lobbyPollInterval) {
      clearInterval(this.lobbyPollInterval);
      this.lobbyPollInterval = null;
    }
  }

  emit(event, data) {
    console.log(`[PolledSocket] Emit: ${event}`, data);
    if (event === 'join_lobby') {
      this.startLobbyPolling();
    } else if (event === 'leave_lobby') {
      this.stopLobbyPolling();
    } else if (event === 'get_public_rooms') {
      this.fetchPublicRooms();
    } else if (event === 'create_room') {
      this.createRoom(data);
    } else if (event === 'join_room') {
      this.joinRoom(data.code);
    } else if (event === 'leave_room') {
      this.leaveRoom(data.code);
    } else if (event === 'update_state') {
      this.updateState(data.code, data.state);
    }
  }

  async fetchPublicRooms() {
    try {
      const res = await fetch(`${this.url}/api/lobby`);
      if (res.ok) {
        const list = await res.json();
        this.trigger('public_rooms_list', list);
      }
    } catch (err) {
      console.error('[PolledSocket] Error fetching public rooms:', err);
    }
  }

  startLobbyPolling() {
    this.stopLobbyPolling();
    this.fetchPublicRooms();
    this.lobbyPollInterval = setInterval(() => this.fetchPublicRooms(), 2000);
  }

  async createRoom(data) {
    try {
      const res = await fetch(`${this.url}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: this.clientId,
          startingPlayer: data.startingPlayer,
          isPrivate: data.isPrivate
        })
      });
      if (res.ok) {
        const result = await res.json();
        this.roomCode = result.code;
        this.opponentJoinedTriggered = false;
        this.trigger('room_created', { code: result.code, isPrivate: result.isPrivate });
        this.startStatePolling(result.code, 'A');
      } else {
        this.trigger('room_error', 'Failed to create room.');
      }
    } catch (err) {
      this.trigger('connect_error');
    }
  }

  async joinRoom(code) {
    try {
      const res = await fetch(`${this.url}/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: this.clientId })
      });
      if (res.status === 404) {
        this.trigger('room_error', 'Room not found!');
        return;
      }
      if (res.status === 400) {
        const errText = await res.text();
        this.trigger('room_error', errText || 'Room is full!');
        return;
      }
      if (res.ok) {
        const result = await res.json();
        this.roomCode = result.code;
        this.trigger('room_joined', { code: result.code, role: result.role, startingPlayer: result.startingPlayer });
        this.startStatePolling(result.code, 'B');
      } else {
        this.trigger('room_error', 'Error joining room.');
      }
    } catch (err) {
      this.trigger('room_error', 'Failed to connect to room.');
    }
  }

  async leaveRoom(code) {
    this.stopPolling();
    this.roomCode = null;
    try {
      await fetch(`${this.url}/api/rooms/${code}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: this.clientId })
      });
    } catch (err) {
      // Ignore
    }
  }

  async updateState(code, state) {
    try {
      await fetch(`${this.url}/api/rooms/${code}/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: this.clientId, state })
      });
    } catch (err) {
      console.error('[PolledSocket] Error updating state:', err);
    }
  }

  startStatePolling(code, role) {
    this.stopPolling();
    this.opponentJoinedTriggered = false;
    let lastFetchedStateJson = null;

    this.pollInterval = setInterval(async () => {
      if (!this.isConnected || this.roomCode !== code) {
        this.stopPolling();
        return;
      }

      try {
        const res = await fetch(`${this.url}/api/rooms/${code}/poll?clientId=${this.clientId}`);
        if (res.status === 404) {
          this.trigger('player_left');
          this.stopPolling();
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (data.status === 'player_left') {
            this.trigger('player_left');
            this.stopPolling();
            return;
          }

          if (role === 'A' && data.opponentJoined && !this.opponentJoinedTriggered) {
            this.opponentJoinedTriggered = true;
            this.trigger('player_joined', { role: 'B' });
          }

          if (data.state) {
            const stateStr = JSON.stringify(data.state);
            if (stateStr !== lastFetchedStateJson) {
              lastFetchedStateJson = stateStr;
              this.trigger('state_updated', data.state);
            }
          }
        }
      } catch (err) {
        console.warn('[PolledSocket] State poll network error:', err);
      }
    }, 1000);
  }
}
