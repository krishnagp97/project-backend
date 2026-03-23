import { Message } from "../models/message.model.js";
import { Post } from "../models/post.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getSocketId, getIO } from "../utils/socket.js";
import { User } from "../models/user.model.js";

const sendMessage = asyncHandler(async (req, res) => {
    const { receiverId, postId, message } = req.body;

    if (!message || message.trim() === "") {
        throw new ApiError(400, "message is required");
    }

    if (req.user._id.equals(receiverId)) {
        throw new ApiError(400, "you can not send message to yourself");
    }

    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
        throw new ApiError(404, "receiver not found");
    }

    if (!post.owner.equals(req.user._id) && !post.owner.equals(receiverId)) {
        throw new ApiError(403, "you are not allowed to chat on this post");
    }

    const newMessage = await Message.create({
        senderId: req.user._id,
        receiverId,
        message,
        postId,
    });

    const io = getIO();

    if (io) {
        const senderSocketId = getSocketId(req.user._id.toString());
        const receiverSocketId = getSocketId(receiverId);

        [senderSocketId, receiverSocketId].forEach((socketId) => {
            if (socketId) io.to(socketId).emit("newMessage", newMessage);
        });
    }

    return res
        .status(201)
        .json(new ApiResponse(201, newMessage, "message sent successfully"));
});

const getConversation = asyncHandler(async (req, res) => {
    const { userId, postId } = req.params;

    if (!userId) {
        throw new ApiError(400, "userId is required");
    }

    const messages = await Message.find({
        postId,
        $or: [
            { senderId: req.user._id, receiverId: userId },
            { senderId: userId, receiverId: req.user._id },
        ],
    }).sort({ createdAt: 1 });

    return res
        .status(200)
        .json(new ApiResponse(200, messages, "messages fetched successfully"));
});

const deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) {
        throw new ApiError(404, "message not found while deleting");
    }
    if (!req.user._id.equals(message.senderId)) {
        throw new ApiError(403, "forbidden request to delete message");
    }
    await Message.findByIdAndDelete(messageId);

    const io = getIO();
    const senderSocketId = getSocketId(message.senderId.toString());
    const receiverSocketId = getSocketId(message.receiverId.toString());

    if (senderSocketId) {
        io.to(senderSocketId).emit("messageDeleted", messageId);
    }

    if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageDeleted", messageId);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "message deleted successfully"));
});

const markAsSeen = asyncHandler(async (req, res) => {
    const { senderId, postId } = req.params;

    await Message.updateMany(
        {
            senderId,
            receiverId: req.user._id,
            postId,
            isRead: false,
        },
        { $set: { isRead: true } }
    );

    const io = getIO();
    const senderSocketId = getSocketId(senderId);
    if (senderSocketId) {
        io.to(senderSocketId).emit("messageSeen", { postId });
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "message seen status updated successfully")
        );
});

export { sendMessage, getConversation, deleteMessage, markAsSeen };
