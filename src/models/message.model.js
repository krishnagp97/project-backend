import { model, Schema } from "mongoose";

const messageSchema = new Schema(
    {
        senderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        message: {
            type: String,
            required:true,
            trim:true,
            minlength:1
        },
        postId: {
            type: Schema.Types.ObjectId,
            ref: "Post",
            required: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

messageSchema.index({senderId:1,receiverId:1,postId:1,createdAt:1})
export const Message = model("Message", messageSchema);
