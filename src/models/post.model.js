import { model, Schema } from "mongoose";

const postSchema = new Schema(
    {
        productName: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        category: {
            type: String,
            enum: [
                "electronics",
                "books",
                "stationery",
                "furniture",
                "vehicles",
                "sports",
                "clothing",
                "others",
            ],
            required: true,
            index: true,
        },
        condition: {
            type: String,
            enum: ["new", "like-new", "good", "fair"],
            default: "good",
        },
        about: {
            type: String,
            maxlength: 500,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["available", "reserved", "sold"],
            default: "available",
        },
        images: {
            type: [String],
            validate: [(arr) => arr.length <= 3, "Maximum 3 images allowed"],
        },
        price: {
            type: Number,
            required: true,
            min: 0,
            index: true,
        },
        expiresAt: {
            type: Date,
            index: { expires: 0 },
        },
    },
    { timestamps: true }
);

export const Post = model("Post", postSchema);
