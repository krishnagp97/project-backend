import { model, Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        userName: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        password: {
            type: String,
            required: [true, "password is reqired"],
        },
        avatar: {
            type: String,
            required: true,
        },

        fullName: {
            type: String,
            required: true,
            index: true,
        },
        department: {
            type: String,
            required: true,
        },
        course: {
            type: String,
            required: true,
        },
        year: {
            type: number,
            required: true,
        },
    },
    { timestamps: true }
);

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName,
            userName: this.userName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const User = model("User", userSchema);
