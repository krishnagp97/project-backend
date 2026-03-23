import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    deleteMessage,
    getConversation,
    markAsSeen,
    sendMessage,
} from "../controller/message.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/send").post(sendMessage);
router.route("/:userId/:postId").get(getConversation);
router.route("/:messageId").delete(deleteMessage);
router.route("/seen/:senderId/:postId").patch(markAsSeen);

export default router;
