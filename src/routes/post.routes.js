import {
    addProductListing,
    deleteProductListing,
    editProductListing,
    changeListingStatus,
} from "../controller/post.controller.js";
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT);

router
    .route("/add")
    .post(upload.fields([{ name: "images", maxCount: 3 }]), addProductListing);
router
    .route("/:postId")
    .delete(deleteProductListing)
    .patch(changeListingStatus);

router
    .route("/:postId/edit")
    .patch(
        upload.fields([{ name: "images", maxCount: 3 }]),
        editProductListing
    );
export default router;
