import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "something went wrong while generating access and refresh token"
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { email, userName, password } = req.body;

    if ([email, userName, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "all fields are  required");
    }

    const existedUser = User.findOne({
        $or: [{ userName }, { email }],
    });

    if (existedUser) {
        throw new ApiError(400, "user with email or username already existed");
    }

    const user = await User.create({
        email,
        password,
        userName: userName.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    if (!createdUser) {
        throw new ApiError(500, "user is not registered");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, createdUser, "user registered successfully")
        );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, userName, password } = req.body;

    if (!email && !userName) {
        throw new ApiError(400, "email or username is required");
    }

    const user = await User.findOne({
        $or: [{ userName }, { email }],
    });
    if (!user) {
        throw new ApiError(404, "user not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "username or password is incorrect");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "user logged in successfully"
            )
        );
});

const completeUserProfile = asyncHandler(async (req, res) => {
    const { fullName, department, course, year, phone } = req.body;

    if (
        [fullName, department, course, year, phone].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "all fields are required");
    }

    const existedUserId = req.user._id;

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) {
        throw new ApiError(400, "failed to upload avatar on cloundinary");
    }
    const user = await User.findByIdAndUpdate(
        existedUserId,
        {
            fullName,
            avatar: avatar.url,
            department,
            course,
            year,
            phone,
        },
        { new: true }
    );

    if (!user) {
        throw new ApiError(
            400,
            "something went wrong while profile completion"
        );
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "profile completed successfully"));
});

export { registerUser, loginUser, completeUserProfile };
