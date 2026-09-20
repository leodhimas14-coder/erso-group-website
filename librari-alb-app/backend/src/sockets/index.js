const { Server } = require('socket.io');

let io = null;

/** Everyone connected joins the public room; it's how the daily-topic "ping" reaches all clients at once. */
const ROOMS = {
  PUBLIC: 'public',
};

function initSockets(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN, credentials: true },
  });

  io.on('connection', (socket) => {
    socket.join(ROOMS.PUBLIC);
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Sockets not initialized - call initSockets(httpServer) first');
  }
  return io;
}

/** Broadcast helpers used by controllers so real-time fan-out logic lives in one place. */
function emitPostCreated(post) {
  getIO().to(ROOMS.PUBLIC).emit('post:created', post);
}

function emitTopicUpdated(topic) {
  getIO().to(ROOMS.PUBLIC).emit('topic:updated', topic);
}

function emitWordOfDayUpdated(word) {
  getIO().to(ROOMS.PUBLIC).emit('word:updated', word);
}

function emitWordSuggestionUpdated(suggestion) {
  getIO().to(ROOMS.PUBLIC).emit('word:suggestion_updated', suggestion);
}

module.exports = {
  initSockets,
  getIO,
  ROOMS,
  emitPostCreated,
  emitTopicUpdated,
  emitWordOfDayUpdated,
  emitWordSuggestionUpdated,
};
