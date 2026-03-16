import { Post } from "../models/post.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

const addProductListing = asyncHandler(async (req, res) => {
    const { productName, category, condition, about, price } = req.body;

    if (!productName || !category || !condition || !about || !price) {
        throw new ApiError(400, "all fields are required");
    }

    const image1LocalPath = req.files?.images?.[0]?.path;
    const image2LocalPath = req.files?.images?.[1]?.path;
    const image3LocalPath = req.files?.images?.[2]?.path;

    if (!image1LocalPath) {
        throw new ApiError(400, "atleast one image is required");
    }

    const image1 = await uploadOnCloudinary(image1LocalPath);
    if (!image1) {
        throw new ApiError(
            500,
            "something went wrong while uploading image1 on cloudinary"
        );
    }
    const imagesUrl = [image1.url];

    if (image2LocalPath) {
        const image2 = await uploadOnCloudinary(image2LocalPath);
        imagesUrl.push(image2.url);
    }
    if (image3LocalPath) {
        const image3 = await uploadOnCloudinary(image3LocalPath);
        imagesUrl.push(image3.url);
    }
    const userId = req.user?._id;
    const post = await Post.create({
        productName,
        category,
        condition,
        about,
        owner: userId,
        images: imagesUrl,
        price,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, post, "post created successfully"));
});

const deleteProductListing = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    if (!req.user._id.equals(post.owner)) {
        throw new ApiError(401, "unathoried request to delete post");
    }
    await Post.findByIdAndDelete(postId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "listing delete successfully"));
});

const editProductListing = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const image1LocalPath = req.files?.image[0]?.path;
    const image2LocalPath = req.files?.image[1]?.path;
    const image3LocalPath = req.files?.image[2]?.path;

    const post = await Post.findById(postId);

    if (!post) {
        throw new ApiError(404, "post not found");
    }

    if (!req.user?._id.equals(post.owner)) {
        throw new ApiError(401, "unauthorized request to edit post");
    }
    const imagesLocalPath = [image1LocalPath, image2LocalPath, image3LocalPath];
    for (let i = 0; i < 3; i++) {
        if (imagesLocalPath[i]) {
            const image = await uploadOnCloudinary(imagesLocalPath[i]);
            post.image[i] = image.url;
            await post.save();
            fs.unlinkSync(imagesLocalPath[i]);
        }
    }
    const { productName, category, condition, about, price } = req.body;
    const fieldsToUpdate = Object.fromEnteries(
        Object.entries({
            productName,
            category,
            condition,
            about,
            price,
        }).filter(([_, val]) => val !== undefined)
    );

    const updatedfields = await Post.findByIdAndUpdate(
        postId,
        {
            $set: fieldsToUpdate,
        },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedfields, "post updated successfully"));
});

const changeListingStatus = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { status } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
        throw new ApiError(
            404,
            "post not found while changing the status of posting"
        );
    }

    if (!req.user?._id.equals(post.owner)) {
        throw new ApiError(401, "unauthorized request to update post status");
    }

    post.status = status;
    await post.save();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "post status updated successfully"));
});

export {
    addProductListing,
    deleteProductListing,
    editProductListing,
    changeListingStatus,
};
