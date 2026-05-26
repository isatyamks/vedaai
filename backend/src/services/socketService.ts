import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketServer | null = null;

export const initSocket = (server: HTTPServer): SocketServer => {
  io = new SocketServer(server, {
    cors: {
      origin: '*', // In production, replace with specific frontend URL
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Client joins room for their specific assignment to receive target updates
    socket.on('join_assignment', (assignmentId: string) => {
      console.log(`[WebSocket] Client ${socket.id} joined room for assignment: ${assignmentId}`);
      socket.join(`assignment_${assignmentId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Emit a real-time progress update for an assignment
 */
export const emitAssignmentProgress = (
  assignmentId: string,
  status: 'queued' | 'processing' | 'completed' | 'failed',
  progress: number,
  message?: string
) => {
  if (io) {
    console.log(`[WebSocket] Emitting update for ${assignmentId}: ${status} (${progress}%) - ${message || ''}`);
    io.to(`assignment_${assignmentId}`).emit('progress_update', {
      assignmentId,
      status,
      progress,
      message,
    });
  } else {
    console.warn('[WebSocket] Attempted to emit progress, but Socket.io is not initialized.');
  }
};
