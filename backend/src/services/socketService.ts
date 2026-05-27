import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';

type AssignmentStatus = 'queued' | 'processing' | 'completed' | 'failed';

let io: SocketServer | null = null;

export function initSocket(server: HttpServer): void {
  io = new SocketServer(server, {
    cors: { origin: process.env.FRONTEND_URL ?? '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    socket.on('join_assignment', (assignmentId: string) => {
      socket.join(`assignment:${assignmentId}`);
    });

    socket.on('disconnect', () => {});
  });
}

export function emitAssignmentProgress(
  assignmentId: string,
  status: AssignmentStatus,
  progress: number,
  message?: string
): void {
  io?.to(`assignment:${assignmentId}`).emit('progress_update', {
    assignmentId,
    status,
    progress,
    message,
  });
}
