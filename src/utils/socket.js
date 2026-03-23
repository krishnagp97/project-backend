import { Server } from "socket.io";
import dotenv from "dotenv";
dotenv.config();

let io;
const userSocketMap = {};

export const getSocketId = (userId) => userSocketMap[userId];

export const getIO = () => {
    if (!io) throw new Error("socket not initialized");
    return io;
};

export const initSocket = (server) => {
    io = new Server(server, {
        cors: { origin: process.env.CORS_ORIGIN },
    });

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;

        if (userId) userSocketMap[userId] = socket.id;

        io.emit("onlineUsers", Object.keys(userSocketMap));

        socket.on("typing", ({ senderId, receiverId }) => {
            const receiverSocketId = userSocketMap[receiverId];

            if (receiverSocketId) {
                io.to(receiverSocketId).emit("typing", senderId);
            }
        });

        socket.on("disconnect", () => {
            if (userId) {
                delete userSocketMap[userId];
                io.emit("onlineUsers", Object.keys(userSocketMap));
            }
        });
    });

    return io;
};
