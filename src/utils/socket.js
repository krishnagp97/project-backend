import { Server } from "socket.io";

let io;
const userSocketMap = {}; 

export const getSocketId = (userId) => userSocketMap[userId];

export const getIO = () => {
    if (!io) throw new Error("socket.io not initialized");
    return io;
};

export const initSocket = (server) => {
    io = new Server(server, {
        cors: { origin: process.env.CLIENT_URL }
    });

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;

        if (userId) userSocketMap[userId] = socket.id;

        io.emit("onlineUsers", Object.keys(userSocketMap));

        socket.on("disconnect", () => {
            delete userSocketMap[userId];
            io.emit("onlineUsers", Object.keys(userSocketMap));
        });
    });

    return io;
};