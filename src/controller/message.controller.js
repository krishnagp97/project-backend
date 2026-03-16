import { Message } from "../models/message.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { getSocketId } from "../utils/socket";
import { getIO as io } from "../utils/socket";

const sendMessage = asyncHandler(async (req, res) => {
    const { receiverId, postId, message } = req.body;

    if (!message || message.trim() === "") {
        throw new ApiError(400, "message is required");
    }

    if (req.user._id.equals(receiverId)) {
        throw new ApiError(400, "you can not send message to yourself");
    }

    const newMessage = await Message.create({
        senderId: req.user._id,
        receiverId,
        message,
        postId,
    });

    const receiverSocketId = getSocketId(receiverId);
    if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res
        .status(201)
        .json(new ApiResponse(201, newMessage, "message sended successfully"));
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
