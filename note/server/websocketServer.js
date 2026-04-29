const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: '*' }
});

const notesNs = io.of('/notes');

notesNs.on('connection', (socket) => {
  console.log('WS connected:', socket.id);

  socket.on('client_connected', (data) => {
    console.log('User joined:', data.username);
    socket.broadcast.emit('user_joined', {
      username: data.username,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('note_created', (data) => {
    socket.broadcast.emit('note_sync', { action: 'created', note: data });
  });

  socket.on('note_updated', (data) => {
    socket.broadcast.emit('note_sync', { action: 'updated', note: data });
  });

  socket.on('note_deleted', (data) => {
    socket.broadcast.emit('note_sync', { action: 'deleted', note: data });
  });

  socket.on('disconnect', () => {
    console.log('WS disconnected:', socket.id);
  });
});

server.listen(5001, '0.0.0.0', () => {
  console.log('WebSocket server: http://0.0.0.0:5001');
});