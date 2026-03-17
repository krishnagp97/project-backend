import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
    registerUser,
    loginUser,
    completeUserProfile,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateAccountDetails,
} from "../controller/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/refresh-access-token").post(refreshAccessToken);

router.use(verifyJWT);

router.route("/logout").post(logoutUser);
router.route("/me")
    .get(getCurrentUser)
    .patch(updateAccountDetails);
router.route("/me/complete-profile")
    .post(
        upload.fields([{ name: "avatar", maxCount: 1 }]),
        completeUserProfile
    );
router.route("/me/password").post(changeCurrentPassword);

export default router;
