import { Post } from "../models/post.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";
import { deleteFromCloudinary } from "../utils/cloudinary.js";

const addProductListing = asyncHandler(async (req, res) => {
    const { productName, category, condition, about, price } = req.body;

    if (!productName || !category || !condition || !about || !price) {
        throw new ApiError(400, "all fields are required");
    }

    const imagesLocalPath = Array.from(
        { length: 3 },
        (_, i) => req.files?.images?.[i]?.path || null
    );

    if (!imagesLocalPath[0]) {
        throw new ApiError(400, "first image is required");
    }

    const uploadedUrls = [];
    try {
        const uploadResults = await Promise.all(
            imagesLocalPath.map((localPath) =>
                localPath ? uploadOnCloudinary(localPath) : null
            )
        );

        for (let i = 0; i < uploadResults.length; i++) {
            if (imagesLocalPath[i] && !uploadResults[i]?.url) {
                throw new ApiError(500, `Failed to upload image ${i + 1}`);
            }
            if (uploadResults[i]?.url) {
                uploadedUrls.push(uploadResults[i].url);
            }
        }
    } catch (error) {
        await Promise.all(uploadedUrls.map((url) => deleteFromCloudinary(url)));
        throw new ApiError(500, "Image upload failed");
    }

    const post = await Post.create({
        productName,
        category,
        condition,
        about,
        owner: req.user?._id,
        images: uploadedUrls,
        price,
    });

    if (!post) {
        await Promise.all(uploadedUrls.map((url) => deleteFromCloudinary(url)));
        throw new ApiError(500, "failed to create post");
    }

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

const editProductListing = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
        throw new ApiError(404, "post not found");
    }

    if (!req.user?._id.equals(post.owner)) {
        throw new ApiError(401, "unauthorized request to edit post");
    }

    const updatedImages = [...post.images];

    const imagesLocalPath = Array.from(
        { length: 3 },
        (_, i) => req.files?.images?.[i]?.path || null
    );

    const replaceIndexes = req.body.replaceIndexes
        ? JSON.parse(req.body.replaceIndexes)
        : [];

    const uploadedUrls = [];
    try {
        const uploadResults = await Promise.all(
            imagesLocalPath.map((localPath) =>
                localPath ? uploadOnCloudinary(localPath) : null
            )
        );

        for (let i = 0; i < uploadResults.length; i++) {
            if (imagesLocalPath[i] && !uploadResults[i]?.url) {
                throw new ApiError(500, "failed to upload image");
            }
            if (uploadResults[i]?.url) {
                uploadedUrls.push(uploadResults[i].url);
            }
        }

        for (let i = 0; i < replaceIndexes.length; i++) {
            const idx = replaceIndexes[i];
            if (uploadedUrls[i]) {
                await deleteFromCloudinary(updatedImages[idx]);
                updatedImages[idx] = uploadedUrls[i];
            }
        }

        const deleteIndexes = req.body.deleteIndexes
            ? JSON.parse(req.body.deleteIndexes)
            : [];

        if (deleteIndexes.includes(0)) {
            throw new ApiError(400, "first image can only be replaced");
        }

        for (const idx of deleteIndexes) {
            if (updatedImages[idx] && idx !== 0) {
                await deleteFromCloudinary(updatedImages[idx]);
                updatedImages[idx] = null;
            }
        }
    } catch (error) {
        await Promise.all(uploadedUrls.map((url) => deleteFromCloudinary(url)));
        throw new ApiError(500, error?.message || "image upload failed");
    }

    const { productName, category, condition, about, price } = req.body;
    const fieldsToUpdate = Object.fromEntries(
        Object.entries({
            productName,
            category,
            condition,
            about,
            price,
            images: updatedImages,
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

export {
    addProductListing,
    deleteProductListing,
    editProductListing,
    changeListingStatus,
};
