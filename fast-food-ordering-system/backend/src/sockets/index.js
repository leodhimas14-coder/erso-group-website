const { Server } = require('socket.io');

let io = null;

/** Rooms let each screen type subscribe only to the events it cares about. */
const ROOMS = {
  KITCHEN: 'kitchen',
  CASHIER: 'cashier',
  ADMIN: 'admin',
};

function initSockets(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN, credentials: true },
  });

  io.on('connection', (socket) => {
    socket.on('join', (room) => {
      if (Object.values(ROOMS).includes(room)) {
        socket.join(room);
      }
    });
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
function emitOrderCreated(order) {
  getIO().to(ROOMS.KITCHEN).to(ROOMS.CASHIER).emit('order:created', order);
}

function emitOrderUpdated(order) {
  getIO().to(ROOMS.KITCHEN).to(ROOMS.CASHIER).to(ROOMS.ADMIN).emit('order:updated', order);
}

function emitInventoryLow(item) {
  getIO().to(ROOMS.ADMIN).emit('inventory:low_stock', item);
}

module.exports = { initSockets, getIO, ROOMS, emitOrderCreated, emitOrderUpdated, emitInventoryLow };
