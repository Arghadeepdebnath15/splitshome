let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Flat-level room
    socket.on('join_flat', (flatId) => {
      if (flatId) {
        socket.join(`flat_${flatId}`);
      }
    });

    // User-level room for private notifications
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    socket.on('leave_flat', (flatId) => {
      if (flatId) {
        socket.leave(`flat_${flatId}`);
      }
    });

    socket.on('disconnect', () => {
      // Disconnected
    });
  });

  return ioInstance;
};

const getIO = () => {
  return ioInstance;
};

const emitToFlat = (flatId, event, data) => {
  if (ioInstance && flatId) {
    ioInstance.to(`flat_${flatId}`).emit(event, data);
  }
};

const emitToUser = (userId, event, data) => {
  if (ioInstance && userId) {
    ioInstance.to(`user_${userId}`).emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToFlat,
  emitToUser
};

