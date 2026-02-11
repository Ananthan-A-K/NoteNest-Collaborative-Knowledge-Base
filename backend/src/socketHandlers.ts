import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from 'jsonwebtoken';
import Note from "./models/Note";
import NoteVersion from "./models/NoteVersion";
import Workspace from "./models/Workspace";
import User from "./models/User";
import { AuditService } from "./services/auditService";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  workspaceId?: string;
}

const activeUsers: Map<string, Set<string>> = new Map(); // noteId -> Set of userIds

export default function setupSocketHandlers(io: SocketIOServer) {
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      // TODO: Verify JWT token and extract userId
      // For now, assume token is userId
      socket.userId = token;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected`);

    socket.on("join-note", async (data: { noteId: string; workspaceId: string }) => {
      const { noteId, workspaceId } = data;

      // Validate workspace access
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace || !workspace.members.some(m => m.userId === socket.userId!)) {
        socket.emit("error", { message: "Access denied" });
        return;
      }

      // Validate note exists in workspace
      const note = await Note.findOne({ _id: noteId, workspaceId });
      if (!note) {
        socket.emit("error", { message: "Note not found" });
        return;
      }

      socket.workspaceId = workspaceId;
      socket.join(`note-${noteId}`);

      // Track active users
      if (!activeUsers.has(noteId)) {
        activeUsers.set(noteId, new Set());
      }
      activeUsers.get(noteId)!.add(socket.userId!);

      // Send current active users
      const activeUserIds = Array.from(activeUsers.get(noteId)!);
      const users = await User.find({ _id: { $in: activeUserIds } }).select("_id name");
      socket.emit("active-users", users);

      // Broadcast to others in the room
      const user = await User.findById(socket.userId);
      socket.to(`note-${noteId}`).emit("user-joined", { userId: socket.userId, name: user?.name });

      console.log(`User ${socket.userId} joined note ${noteId}`);
    });

    socket.on("leave-note", (noteId: string) => {
      socket.leave(`note-${noteId}`);

      if (activeUsers.has(noteId)) {
        activeUsers.get(noteId)!.delete(socket.userId!);
        if (activeUsers.get(noteId)!.size === 0) {
          activeUsers.delete(noteId);
        }
      }

      socket.to(`note-${noteId}`).emit("user-left", { userId: socket.userId });
    });

    socket.on("update-note", async (data: { noteId: string; title: string; content: string }) => {
      const { noteId, title, content } = data;

      // Validate note and permissions
      const note = await Note.findOne({ _id: noteId, workspaceId: socket.workspaceId });
      if (!note) {
        socket.emit("error", { message: "Note not found" });
        return;
      }

      // Check permissions (assume canEditNote logic)
      const workspace = await Workspace.findById(socket.workspaceId);
      const userRole = workspace?.members.find((m: any) => m.userId === socket.userId)?.role;
      if (userRole === "viewer") {
        socket.emit("error", { message: "Permission denied" });
        return;
      }

      // Update note (last-write-wins)
      note.title = title;
      note.content = content;
      note.updatedAt = new Date();
      await note.save();

      // Create version
      const latestVersion = await NoteVersion.findOne({ noteId }).sort({ versionNumber: -1 });
      const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
      const version = new NoteVersion({
        noteId,
        versionNumber: nextVersionNumber,
        contentSnapshot: { title, content },
        author: socket.userId,
        workspaceId: socket.workspaceId,
        metadata: { reason: "Real-time edit" },
      });
      await version.save();

      // Log audit
      await AuditService.logEvent(
        "note_updated",
        socket.userId!,
        socket.workspaceId!,
        noteId,
        "note",
        { title, version: nextVersionNumber }
      );

      // Broadcast update to room
      socket.to(`note-${noteId}`).emit("note-updated", { noteId, title, content, updatedBy: socket.userId });

      console.log(`Note ${noteId} updated by ${socket.userId}`);
    });

    socket.on("disconnect", () => {
      console.log(`User ${socket.userId} disconnected`);
      // Clean up active users
      activeUsers.forEach((users, noteId) => {
        users.delete(socket.userId!);
        if (users.size === 0) {
          activeUsers.delete(noteId);
        }
      });
    });
  });
}
